const schedule = require("node-schedule");
const fs = require("fs");
const path = require("path");
const knex = require("../db/db");
const { logError } = require("../logs");

const CHANNEL_ID = process.env.STATS_CHANNEL_ID;

function countFilesInDirectory(directoryPath) {
    return new Promise((resolve, reject) => {
        fs.readdir(directoryPath, (err, files) => {
            if (err) reject(err);
            else {
                const fileCount = files.filter((file) => fs.statSync(path.join(directoryPath, file)).isFile()).length;
                resolve(fileCount);
            }
        });
    });
}

const sendDataToAdmin = (bot) => {
    schedule.scheduleJob("0 0 * * *", async () => {
        try {
            const tables = await knex("information_schema.tables").select("table_name").where({ table_schema: "public", table_type: "BASE TABLE" });

            const data = {};
            for (const table of tables) {
                const tableName = table.table_name;
                const rows = await knex.select("*").from(tableName);
                data[tableName] = rows;
            }

            const papka = "drafts";
            const JSONFilePath = path.join(__dirname, `../${papka}/dump.json`);
            await fs.promises.writeFile(JSONFilePath, JSON.stringify(data, null, 2));
            await bot.telegram.sendDocument(CHANNEL_ID, { source: JSONFilePath }, { caption: "Ma'lumotlar bazasi json fayli." });
            await fs.promises.unlink(JSONFilePath);

            console.log("✅ Ma'lumotlar yuborildi");
        } catch (error) {
            console.error("❌ scheduler error:", error.message);
            logError("scheduler_db", error);
        }

        try {
            const users = await knex("user").select("*");
            const manga = await knex("manga").select("*");
            const chapters = await knex("chapter").select("*");
            const errorDir = path.join(__dirname, "../logs/logs");
            const errors = await countFilesInDirectory(errorDir);

            const message =
                `🤖 <i>Bot: <b>@${process.env.BOT_USERNAME}</b></i>\n` +
                `📌 <i>Foydalanuvchilar soni: <b>${users.length} ta</b></i>\n` +
                `🔢 <i>Mangalar soni: <b>${manga.length} ta</b></i>\n` +
                `🎞 <i>Barcha boblar soni: <b>${chapters.length} ta</b></i>\n` +
                `🔢 <i>Xatoliklar soni: <b>${errors} ta</b></i>\n`;
            await bot.telegram.sendMessage(CHANNEL_ID, message, { parse_mode: "HTML" });

            console.log("✅ scheduler");
        } catch (error) {
            console.error("❌ scheduler error:", error.message);
            logError("scheduler_stats", error);
        }
    });
};

module.exports = { sendDataToAdmin };
