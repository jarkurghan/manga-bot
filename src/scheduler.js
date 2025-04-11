const schedule = require("node-schedule");
const fs = require("fs");
const path = require("path");
const db = require("../db/db");

const ADMIN_CHAT_ID = process.env.ADMIN_CHAT_ID;

const sendDataToAdmin = (bot) => {
    schedule.scheduleJob("0 0 * * *", async () => {
        try {
            const users = await db("user").select("*");
            const manga = await db("manga").select("*");
            const episodes = await db("episode").select("*");
            const data = { users, manga, episodes };

            const papka = process.env.NODE_ENV === "production" ? "db" : "drafts";
            const JSONFilePath = path.join(__dirname, `../${papka}/dump.json`);
            const DBFilePath = path.join(__dirname, process.env.DATABASE);

            await fs.promises.writeFile(JSONFilePath, JSON.stringify(data, null, 2));
            await bot.telegram.sendDocument(ADMIN_CHAT_ID, { source: DBFilePath }, { caption: "Ma'lumotlar bazasi" });
            await bot.telegram.sendDocument(ADMIN_CHAT_ID, { source: JSONFilePath }, { caption: "Ma'lumotlar bazasi json fayli." });
            await fs.promises.unlink(JSONFilePath);

            const message =
                "<b><i>Ma'lumotlar bazasida:</i></b>\n" +
                `📌 <i>Foydalanuvchilar soni: ${users.length}</i>\n` +
                `🔢 <i>Mangalar soni: ${manga.length}</i>\n` +
                `🎞 <i>Barcha qismlar soni: ${episodes.length}</i>`;
            `🎙 <i>Dublyaj studiyalari soni: ${episodes.length}</i>`;
            await bot.telegram.sendMessage(ADMIN_CHAT_ID, message, { parse_mode: "HTML" });

            console.log("✅ scheduler");
        } catch (error) {
            console.error("❌ scheduler error:");
            console.error(error);
        }
    });
};

module.exports = { sendDataToAdmin };
