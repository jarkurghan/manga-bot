const { Telegraf, Markup } = require("telegraf");
const db = require("../db/db");
const { checkSubscription } = require("./check-subscription");
const { renderMangaPage } = require("./methods");
const { sendManga } = require("./manga");
const { createManga } = require("./createManga");

const bot = new Telegraf(process.env.BOT_TOKEN);

const requiredChannels = [{ username: process.env.MY_CHANNEL_USERNAME, name: process.env.MY_CHANNEL_NAME }];

async function createUserDB(ctx) {
    const { id: user_id, username, first_name, last_name } = ctx.from;
    const user = { user_id, username, first_name, last_name };

    const existingUser = await db("user").where({ user_id }).first();
    try {
        if (!existingUser) {
            await ctx.reply("Botga xush kelibsiz! 🎉\n\n", Markup.removeKeyboard());
            const dbUser = await db("user").insert(user).returning("*");
            await db("user_page").insert({ user_id: dbUser[0].id });
            const ADMIN_CHAT_ID = process.env.ADMIN_CHAT_ID;
            await bot.telegram.sendMessage(
                ADMIN_CHAT_ID,
                `🆕 Yangi foydalanuvchi:\n\n` +
                    `👤 Ism: ${first_name || "Noma'lum"} ${last_name || ""}\n` +
                    `🔗 Username: ${username ? `@${username}` : "Noma'lum"}\n` +
                    `🆔 ID: ${user_id}`
            );
        }
    } catch (err) {
        console.error("❌ Foydalanuvchini saqlashda xatolik:", err);
    }
}

async function start(ctx) {
    //------------------------------- insert db ---------------------------------
    await createUserDB(ctx);
    const existingUser = await db("user").where({ user_id: ctx.from.id }).first();

    //------------------------------- check subscription ---------------------------------
    const notSubscribed = await checkSubscription(ctx);

    if (notSubscribed.length > 0) {
        return ctx.reply(
            "❌ Botdan foydalanish uchun quyidagi kanal" + (requiredChannels.length > 1 ? "lar" : "") + "ga a'zo bo'ling:",
            Markup.inlineKeyboard(notSubscribed.map((channel) => [{ text: channel.name, url: `https://t.me/${channel.username.slice(1)}` }]))
        );
    }

    //------------------------------- response ---------------------------------
    // if (ctx.startPayload && ctx.startPayload.slice(0, 10) === "new_manga_") {
    //     const manga = await createManga(ctx);
    //     if (manga) return;
    // }

    const page = existingUser ? await db("user_page").where({ user_id: existingUser.id }).first().page : 0;
    const { textList, buttons } = await renderMangaPage(page);
    await ctx.reply(textList, { parse_mode: "HTML", ...Markup.inlineKeyboard(buttons) });
}

module.exports = { start };
