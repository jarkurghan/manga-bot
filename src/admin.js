const { Telegraf } = require("telegraf");
const { Markup } = require("telegraf");
const knex = require("../db/db");
const redis = require("../db/redis/index.js");
const { logError } = require("../logs");

const bot = new Telegraf(process.env.BOT_TOKEN);

(async () => {
    await redis.connect();
    console.log("redis client has connected");
})();

function generate10DigitRandom() {
    const digits = "0123456789";
    let result = "";
    for (let i = 0; i < 10; i++) {
        result += digits.charAt(Math.floor(Math.random() * digits.length));
    }
    return result;
}

const newPost = async (ctx) => {
    try {
        const sender = ctx.channelPost.sender_chat.id;
        if (sender == process.env.DATA_CHANNEL_ID) {
            const msgID = ctx.channelPost.message_id;
            const messageText = ctx.channelPost.text || ctx.channelPost.caption || "";
            const content = messageText.split("\n");
            const manga = await knex("manga").where("name", content[0]).first();
            if (!manga) {
                const message =
                    `Bunday manga hali botga qo'shilmagan. "${content[0]}"ni qo'shmoqchimisiz?` +
                    `\n\nBuning uchun quyidagi buyruqni botga yuboring:\n<code>/new_manga\n` +
                    `Nom: [manga nomi]\nJanr: [janrlari]\nBoblari soni: [son]\n` +
                    `Holati: [ongoing | one-shot | tugatilgan | tarjima qilinmoqda | ...]\n` +
                    `Kalit so'zlar: [keys]</code>`;

                const cancelButton = [Markup.button.callback("❌ Bekor qilish", "delete_message_" + msgID)];
                const options = { parse_mode: "HTML", ...Markup.inlineKeyboard([cancelButton]) };
                bot.telegram.sendMessage(sender, message, options);
            } else {
                const chapter = content[1].trim();
                const chapters = await knex("chapter").orderBy("order", "desc").first().select("*");
                const order = (chapters || { order: 0 }).order + 1;
                const data = { chapter, posts: msgID, order, manga_id: manga.id };
                const message = `Yangi bob qo'shishni tasdiqlang\n\nManga: <b>${manga.name}</b>\nBob: <b>${chapter}</b>\nBob tartibi: ${order}`;

                const id = generate10DigitRandom();
                await redis.set("create_chapter_" + id, JSON.stringify(data));
                const verifyButton = [Markup.button.callback("✅ Tasdiqlash", "add_chapter_" + id)];
                const cancelButton = [Markup.button.callback("❌ Bekor qilish", "delete_message_" + msgID)];
                const options = { parse_mode: "HTML", ...Markup.inlineKeyboard([verifyButton, cancelButton]) };
                bot.telegram.sendMessage(sender, message, options);
            }
        }
    } catch (error) {
        console.error(error.message);
        logError("new_post", error);
        ctx.reply("❌ Xatolik yuz berdi. Iltimos, dasturchiga xabar bering.");
    }
};

const newManga = async (ctx) => {
    try {
        if (!process.env.ADMIN_IDS.includes(String(ctx.from.id))) return ctx.reply("❌ Siz bu buyruqni bajarishga ruxsatga ega emassiz.");

        const parts = ctx.message.text.split("\n").slice(1);
        const manga = parts.reduce((obj, item) => {
            if (item.includes(":")) {
                const index = item.indexOf(":");
                const key = item.substring(0, index).trim().toLowerCase();
                const val = item.substring(index + 1).trim();
                if (key === "nom") obj.name = val;
                else if (key === "holati") obj.status = val;
                else if (key === "kalit so'zlar") obj.keys = val;
                else if (key === "boblari soni") obj.number_of_chapters = Number(val);
            }
            return obj;
        }, {});

        if (!manga.name) return ctx.reply("❌ Manga nomi yuborilmadi!");

        let message = `Yangi manga qo'shish:\n\n<i>Nomi: <b>${manga.name}</b></i>`;
        if (manga.number_of_chapters) message += `\n<i>Boblari soni: <b>${manga.number_of_chapters}</b></i>`;
        if (manga.status) message += `\n<i>Holati: <b>${manga.status}</b></i>`;
        if (manga.keys) message += `\n<i>Kalit so'zlar: <b>${manga.keys}</b></i>`;

        const id = generate10DigitRandom();
        await redis.set("create_manga_" + id, JSON.stringify(manga));
        const buttons = [[Markup.button.callback("Tayyor", "add_manga_" + id)]];
        await ctx.reply(message, { parse_mode: "HTML", ...Markup.inlineKeyboard(buttons) });
    } catch (error) {
        console.error(error.message);
        logError("new_manga", error);
        ctx.reply("❌ Xatolik yuz berdi. Iltimos, dasturchiga xabar bering.");
    }
};

const addManga = async (ctx) => {
    try {
        if (!process.env.ADMIN_IDS.includes(String(ctx.from.id))) return ctx.reply("❌ Siz bu buyruqni bajarishga ruxsatga ega emassiz.");

        const mangaID = parseInt(ctx.match[1]);
        const resultJSON = await redis.get("create_manga_" + mangaID);
        const data = JSON.parse(resultJSON);

        ctx.deleteMessage();

        const isFound = await knex("manga").where("name", data.name).first();
        if (isFound) return ctx.reply("❌ Manga avvaldan mavjud!");

        await knex("manga").insert(data);
        return ctx.reply("✅ " + data.name + " mangasi qo'shildi!");
    } catch (error) {
        console.error(error.message);
        logError("add_manga", error);
        ctx.reply("❌ Xatolik yuz berdi. Iltimos, dasturchiga xabar bering.");
    }
};

const addChapter = async (ctx) => {
    try {
        const chapterID = parseInt(ctx.match[1]);
        const resultJSON = await redis.get("create_chapter_" + chapterID);
        const data = JSON.parse(resultJSON);

        ctx.deleteMessage();

        const isFound = await knex("chapter").where("chapter", data.chapter).first();
        if (isFound) return ctx.reply("❌ Ushbu bob avvaldan mavjud!");

        await knex("chapter").insert(data);
        const succesMessage = await ctx.reply('✅ "' + data.chapter + "\" qo'shildi!");
        setTimeout(() => {
            ctx.deleteMessage(succesMessage.message_id);
        }, 20000);
    } catch (error) {
        console.error(error.message);
        logError("add_chapter", error);
        ctx.reply("❌ Xatolik yuz berdi. Iltimos, dasturchiga xabar bering.");
    }
};

const deleteMessage = async (ctx) => {
    try {
        const postID = parseInt(ctx.match[1]);
        ctx.deleteMessage();
        ctx.deleteMessage(postID);
    } catch (error) {
        console.error(error.message);
        logError("delete_message", error);
        ctx.reply("❌ Xatolik yuz berdi. Iltimos, dasturchiga xabar bering.");
    }
};

module.exports = { newPost, newManga, addManga, addChapter, deleteMessage, generate10DigitRandom };
