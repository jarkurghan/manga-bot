require("dotenv").config({ path: process.env.NODE_ENV === "production" ? ".env.production" : ".env" });

const { Telegraf, Markup } = require("telegraf");
const bot = new Telegraf(process.env.BOT_TOKEN);

const { start } = require("./src/start");
const { watch } = require("./src/methods.js");
const { handleMessage } = require("./src/auth.js");
const { episodePage } = require("./src/methods.js");
const { selectEpisode } = require("./src/methods.js");
const { backToManga } = require("./src/methods.js");
const { changePage } = require("./src/methods.js");
const { selectManga } = require("./src/methods.js");
const { mangaList } = require("./src/methods.js");
const { episodeList } = require("./src/methods.js");
const { sendDataToAdmin } = require("./src/scheduler.js");
const { selectAllEpisode } = require("./src/methods.js");
const knex = require("./db/db.js");

const redis = require("./db/redis/index.js");
const db = require("./db/db.js");

(async () => {
    await redis.connect();
    console.log("redis client has connected");
})();

bot.start(start);
bot.on("channel_post", async (ctx) => {
    try {
        if (ctx.channelPost.sender_chat.id == process.env.ADMIN_POST_CHANNEL_ID) {
            const messageText = ctx.channelPost.text || ctx.channelPost.caption || "";
            content = messageText.split("\n");
            const manga = await knex("manga").where("name", content[0]).first();
            if (!manga) {
                // const messageId = ctx.channelPost.message_id;
                // const message = `Bunday manga hali botga qo'shilmagan. "${content[0]}"ni qo'shmoqchimisiz?`;
                // const url = `https://t.me/${process.env.BOT_USERNAME}?start=new_manga_${messageId}`;
                // const button = { inline_keyboard: [[{ text: "Qo'shish", url }]] };
                // const options = { parse_mode: "HTML", reply_markup: button };
                // bot.telegram.sendMessage(process.env.ADMIN_POST_CHANNEL_ID, message, options);

                const message =
                    `Bunday manga hali botga qo'shilmagan. "${content[0]}"ni qo'shmoqchimisiz?` +
                    `\n\nBuning uchun quyidagi buyruqni botga yuboring:\n<code>/new_manga\n` +
                    `Nom: [manga nomi]\nJanr: [janrlari]\nBoblari soni: [son]\n` +
                    `Holati: [ongoing | tugatilgan | tarjima qilinmoqda | ...]\n` +
                    `Kalit so'zlar: [keys]</code>`;
                console.log(message);

                const options = { parse_mode: "HTML" };
                bot.telegram.sendMessage(process.env.ADMIN_POST_CHANNEL_ID, message, options);
            }

            console.log(manga);
        }

        // console.log(originalText);

        // console.log(`Kanalda yangi post: ${messageId}`);

        // await bot.telegram.editMessageText("-1002198562196", messageId, null, originalText, {
        //     reply_markup: { inline_keyboard: [[{ text: "Botga o'tish", url: `https://t.me/aniuz_bot?start=channel` }]] },
        //     parse_mode: "HTML",
        // });

        // console.log(`Post muvaffaqiyatli tahrirlandi: ${messageId}`);
    } catch (error) {
        console.error(error);
    }
});

function generate10DigitRandom() {
    const digits = "0123456789";
    let result = "";
    for (let i = 0; i < 10; i++) {
        result += digits.charAt(Math.floor(Math.random() * digits.length));
    }
    return result;
}

bot.command("new_manga", async (ctx) => {
    try {
        if (String(ctx.from.id) !== "6320204709") return ctx.reply("❌ Siz bu buyruqni bajarishga ruxsatga ega emassiz.");

        const parts = ctx.message.text.split("\n").slice(1);
        const manga = parts.reduce((obj, item) => {
            if (item.includes(":")) {
                const index = item.indexOf(":");
                const key = item.substring(0, index).trim().toLowerCase();
                const val = item.substring(index + 1).trim();
                if (key === "nom") obj.name = val;
                // else if (key === "janr") obj.genres = val;
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
        // if (manga.genres) message += `\n<i>Janrlari: <b>${manga.genres}</b></i>`;
        if (manga.keys) message += `\n<i>Kalit so'zlar: <b>${manga.keys}</b></i>`;

        // if (manga.genres) manga.genres = manga.genres.split(",").map((e) => e.trim());

        const id = generate10DigitRandom();
        await redis.set("create_manga_" + id, JSON.stringify(manga));
        const buttons = [[Markup.button.callback("Tayyor", "add_manga_" + id)]];
        await ctx.reply(message, { parse_mode: "HTML", ...Markup.inlineKeyboard(buttons) });
    } catch (error) {
        console.error("❌ Xatolik yuz berdi:", error.message);
        ctx.reply("❌ Xatolik yuz berdi. Iltimos, keyinroq urinib ko'ring.");
    }
});

bot.command("changemanga", async (ctx) => {
    try {
        const adminChatId = process.env.ADMIN_CHAT_ID;
        const senderId = ctx.from.id;

        if (String(senderId) !== "6389479517") return ctx.reply("❌ Siz bu buyruqni bajarishga ruxsatga ega emassiz.");

        const commandParts = ctx.message.text.split(" ");
        if (commandParts.length < 4) return ctx.reply("❌ Noto'g'ri format. To'g'ri format: /changemanga <post1ID> <post2ID> <name>");

        const post1ID = parseInt(commandParts[1], 10);
        const post2ID = parseInt(commandParts[2], 10);
        const name = commandParts.slice(3).join(" ");

        if (isNaN(post1ID) || isNaN(post2ID)) return ctx.reply("❌ post1ID va post2ID raqam bo'lishi kerak.");
        const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
        for (let postId = post1ID; postId <= post2ID; postId++) {
            try {
                const message =
                    `<i>${name}\n<b>${postId - 1160}-qism</b>\n🎙 ${postId - 1160 > 195 ? "Lego" : "Anibla"}</i>\n\n@aniuz_bot\n` +
                    `<blockquote>Bot yangiliklaridan xabardor bo\'lish uchun @ani_uz_news kanaliga a\'zo bo\'ling!</blockquote>`;
                await bot.telegram.editMessageCaption(process.env.CHANNEL_ID, postId, null, message, { parse_mode: "HTML" });
                console.log(`✅ Post ${postId} muvaffaqiyatli o'zgartirildi.`);
            } catch (error) {
                console.error(`❌ Post ${postId} o'zgartirilayotganda xato yuz berdi:`, error.message);
            }
            if ((postId - post1ID + 1) % 20 === 0) await delay(43000);
        }

        // Javob qaytarish
        ctx.reply(`✅ Postlar ${post1ID} dan ${post2ID} gacha "${name}" matniga o'zgartirildi.`);
    } catch (error) {
        console.error("❌ Xatolik yuz berdi:", error.message);
        ctx.reply("❌ Xatolik yuz berdi. Iltimos, keyinroq urinib ko'ring.");
    }
});

bot.action(/^add_manga_(\d+)$/, handleMessage, async (ctx) => {
    try {
        if (String(ctx.from.id) !== "6320204709") return ctx.reply("❌ Siz bu buyruqni bajarishga ruxsatga ega emassiz.");

        const mangaID = parseInt(ctx.match[1]);
        const resultJSON = await redis.get("create_manga_" + mangaID);
        const data = JSON.parse(resultJSON);

        ctx.deleteMessage();

        const isFound = await db("manga").where("name", data.name).first();
        if (isFound) return ctx.reply("❌ Manga avvaldan mavjud!");

        await db("manga").insert(data);
        return ctx.reply("✅ " + data.name + " mangasi qo'shildi!");
    } catch (err) {
        console.error(err);
        ctx.reply("❌ Xatolik yuz berdi. Iltimos, keyinroq urinib ko'ring.");
    }
});

bot.action(/^manga_(\d+)$/, handleMessage, selectManga);
bot.action(/^manga_list_(\d+)$/, handleMessage, changePage);
bot.action(/^back_manga_list$/, handleMessage, backToManga);
bot.action(/^episode_(\d+)$/, handleMessage, selectEpisode);
bot.action(/^all_episode_(\d+)_(\d+)$/, handleMessage, selectAllEpisode);
bot.action(/^elist_(\d+)_(\d+)$/, handleMessage, episodePage);
bot.action(/^episode_list$/, handleMessage, episodeList);
bot.action(/^manga_list$/, handleMessage, mangaList);
bot.action(/^watch_(.+)$/, handleMessage, watch);

sendDataToAdmin(bot);

bot.launch();
