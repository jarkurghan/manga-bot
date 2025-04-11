require("dotenv").config({ path: process.env.NODE_ENV === "production" ? ".env.production" : ".env" });

const { Telegraf } = require("telegraf");
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

bot.start(start);
bot.on("channel_post", async (ctx) => {
    // const post = ctx.channelPost;
    if (ctx.channelPost.sender_chat.id == process.env.ADMIN_POST_CHANNEL_ID) {
        const messageText = ctx.channelPost.text || ctx.channelPost.caption || "";
        content = messageText.split("\n");
        const manga = await knex("manga").where("name", content[0]).first();
        if(!manga) {
            
        }
        console.log(manga);
    }

    try {
        const messageId = ctx.channelPost.message_id;
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
