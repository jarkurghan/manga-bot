const { actions } = require("..");
const db = require("../db/db");
const { checkSubscription } = require("./check-subscription");
const { Markup } = require("telegraf");

const requiredChannels = [{ username: process.env.MY_CHANNEL_USERNAME, name: process.env.MY_CHANNEL_NAME }];
const ADMIN_ID = process.env.ADMIN_ID;

async function handleMessage(ctx, next) {
    // //------------------------------- insert db ---------------------------------
    // const { id: user_id, username, first_name, last_name } = ctx.from;
    // const user = { user_id, username, first_name, last_name };

    // const existingUser = await db("user").where({ user_id }).first();
    // try {
    //     if (!existingUser) {
    //         const dbUser = await db("user").insert(user).returning("*");
    //         await db("user_page").insert({ user_id: dbUser[0].id });
    //         const ADMIN_CHAT_ID = process.env.ADMIN_CHAT_ID;
    //         await bot.telegram.sendMessage(
    //             ADMIN_CHAT_ID,
    //             `🆕 Yangi foydalanuvchi:\n\n` +
    //                 `👤 Ism: ${first_name || "Noma'lum"} ${last_name || ""}\n` +
    //                 `🔗 Username: ${username ? `@${username}` : "Noma'lum"}\n` +
    //                 `🆔 ID: ${user_id}`
    //         );
    //     }
    // } catch (err) {
    //     console.error("❌ Foydalanuvchini saqlashda xatolik:", err);
    // }

    //------------------------------- insert db ---------------------------------
    if (ctx.from.id.toString() === ADMIN_ID) {
        const isSending = actions.sendToAll.flag;
        if (isSending && new Date() - actions.sendToAll.time < 60000) {
            //  to-do: send message to all users
            actions.sendToAll.flag = false;
        } else if (isSending) {
            actions.sendToAll.flag = false;
            return ctx.reply("❌ Oyna yopilgan!");
        }

        // return next(); // Agar admin bo'lsa, tekshirishni o'tkazib yuborish
    }

    const notSubscribed = await checkSubscription(ctx);

    if (notSubscribed.length > 0) {
        return ctx.reply(
            "❌ Botdan foydalanish uchun quyidagi kanal" + (requiredChannels.length > 1 ? "lar" : "") + "ga a'zo bo'ling:",
            Markup.inlineKeyboard(notSubscribed.map((channel) => [{ text: channel.name, url: `https://t.me/${channel.username.slice(1)}` }]))
        );
    }

    next();
}

module.exports = { handleMessage };
