const { Telegraf, Markup } = require("telegraf");
const db = require("../db/db");
const { checkSubscription } = require("./check-subscription");
const { sendManga } = require("./manga");
const { logError } = require("../logs");
const { renderMangaPage } = require("./render-page");

const bot = new Telegraf(process.env.BOT_TOKEN);

const requiredChannels = [{ username: process.env.MY_CHANNEL_USERNAME, name: process.env.MY_CHANNEL_NAME }];

async function createUserDB(ctx) {
    try {
        const { id: user_id, username, first_name, last_name } = ctx.from;
        const user = { user_id, username, first_name, last_name };

        const existingUser = await db("user").where({ user_id }).first();
        if (!existingUser) {
            await ctx.reply("Botga xush kelibsiz! 🎉\n\n", Markup.removeKeyboard());
            const dbUser = await db("user").insert(user).returning("*");
            await db("user_page").insert({ user_id: dbUser[0].id });
            const STATS_CHANNEL_ID = process.env.STATS_CHANNEL_ID;
            await bot.telegram.sendMessage(
                STATS_CHANNEL_ID,
                `🆕 Yangi foydalanuvchi:\n\n` +
                    `👤 Ism: ${first_name || "Noma'lum"} ${last_name || ""}\n` +
                    `🔗 Username: ${username ? `@${username}` : "Noma'lum"}\n` +
                    `🆔 ID: ${user_id}`
            );
        }
    } catch (err) {
        console.error(err.message);
        logError("start_create_user", err);
    }
}

async function start(ctx) {
    try {
        //------------------------------- insert db ---------------------------------
        await createUserDB(ctx);
        const existingUser = await db("user").where({ user_id: ctx.from.id }).first();

        //------------------------------- check subscription ---------------------------------
        const notSubscribed = await checkSubscription(ctx);

        if (notSubscribed.length > 0) {
            const message = "❌ Botdan foydalanish uchun quyidagi kanal" + (requiredChannels.length > 1 ? "lar" : "") + "ga a'zo bo'ling:";
            const buttons = notSubscribed.map((channel) => [{ text: channel.name, url: channel.username }]);
            return ctx.reply(message, Markup.inlineKeyboard(buttons));
        }

        //------------------------------- response ---------------------------------
        // if (ctx.startPayload && ctx.startPayload.slice(0, 10) === "new_manga_") {
        //     const manga = await sendManga(ctx);
        //     if (manga) return;
        // }

        const page = existingUser ? await db("user_page").where({ user_id: existingUser.id }).first() : { page: 0, searching: "" };
        const { textList, buttons } = await renderMangaPage(page.page, page.searching);
        await ctx.reply(textList, { parse_mode: "HTML", ...Markup.inlineKeyboard(buttons) });
    } catch (err) {
        console.error(err.message);
        logError("start", err);
    }
}

module.exports = { start };
