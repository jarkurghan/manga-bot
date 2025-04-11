const { Markup } = require("telegraf");
const { renderEpisodePage } = require("./render-page");
const { renderMangaPage } = require("./render-page");
const db = require("../db/db");

const changePage = async (ctx) => {
    try {
        const page = parseInt(ctx.match[1]);
        const user = await db("user").where("user_id", ctx.from.id).first();
        if (!user) return ctx.reply("❌ Foydalanuvchi ma'lumotlari topilmadi. Iltimos, /start buyrug'ini bosing.");
        await db("user_page").where("user_id", user.id).update({ manga_page: page });

        const { textList, buttons } = await renderMangaPage(page);
        const keyboard = Markup.inlineKeyboard(buttons);
        await ctx.editMessageText(textList, { parse_mode: "HTML", ...keyboard });
    } catch (err) {
        console.error(err);
        ctx.reply("❌ Xatolik yuz berdi. Iltimos, keyinroq urinib ko'ring.");
    }
};

const selectManga = async (ctx) => {
    try {
        const mangaID = parseInt(ctx.match[1]);
        const user = await db("user").where("user_id", ctx.from.id).first();
        if (!user) return ctx.reply("❌ Foydalanuvchi ma'lumotlari topilmadi. Iltimos, /start buyrug'ini bosing.");
        await db("user_page").where("user_id", user.id).update({ manga_id: mangaID, episode_page: 0 });

        const manga = await db("manga").where("id", mangaID).first();
        if (manga.number_of_episode === 1) {
            const channel = process.env.CHANNEL_ID;
            const post = await db("episode").where("manga_id", mangaID).first();

            const allDub = await db("episode").where({ manga_id: post.manga_id, episode: post.episode });
            if (allDub.length === 1) {
                const posts = await db("channel_post").where({ episode_id: allDub[0].id });
                for (let i = 0; i < posts.length; i++) await ctx.telegram.copyMessage(ctx.chat.id, channel, posts[i].post_id);

                const buttons = [[Markup.button.callback("📂 Mangalar ro'yxati", "manga_list")]];
                await ctx.reply("Quyidagi menulardan birini tanlang 👇", { parse_mode: "HTML", ...Markup.inlineKeyboard(buttons) });
            } else {
                const buttons = allDub.map((dub) => [Markup.button.callback(`🎙 ${dub.dub}`, `watch_${dub.id}`)]);
                const buttonOptions = { parse_mode: "HTML", ...Markup.inlineKeyboard(buttons) };
                const text = `🎥 <b>${episode.episode}. ${episode.name}</b>\n\nUshbu qism bir nechta dublyaj studiyasi tomonidan dublyaj qilingan:`;
                await ctx.reply(text, buttonOptions);
            }
        } else {
            // ------ send dub list ---
            // const dub = await db("episode").leftJoin("dub", "dub.id", "episode.dub").select("dub.name", "episode").where({ manga_id: mangaID });
            // const groupedDub = dub.reduce((acc, item) => {
            //     item.episode = item.episode.replace("-qism", "").replace("-fasl ", "-").replace("-mavsum ", "-");
            //     if (!acc[item.name]) acc[item.name] = [];
            //     acc[item.name].push(item.episode);
            //     return acc;
            // }, {});

            // let message = "<b>" + manga.name + "</b>. Dublaj studiyalari va tarjima qilingan qismlar:\n\n";
            // const sortedDub = Object.entries(groupedDub).sort((a, b) => Math.min(...a[1]) - Math.min(...b[1]));

            // for (const [dub, qismlar] of sortedDub) {
            //     const sortedQismlar = qismlar.sort((a, b) => a - b);
            //     message += `🎙 <b>${dub}</b>: ${sortedQismlar.join(", ")}\n`;
            // }
            // await ctx.replyWithHTML(message);

            // ------ send episode list ---
            const { textList, buttons } = await renderEpisodePage(mangaID, 0);
            const keyboard = Markup.inlineKeyboard(buttons);
            await ctx.reply(textList, { parse_mode: "HTML", ...keyboard });
        }

        ctx.deleteMessage();
    } catch (err) {
        console.error(err);
        ctx.reply("❌ Xatolik yuz berdi. Iltimos, keyinroq urinib ko'ring.");
    }
};

const episodePage = async (ctx) => {
    try {
        const manga = parseInt(ctx.match[1]);
        const page = parseInt(ctx.match[2]);
        const user = await db("user").where("user_id", ctx.from.id).first();
        if (!user) return ctx.reply("❌ Foydalanuvchi ma'lumotlari topilmadi. Iltimos, /start buyrug'ini bosing.");
        await db("user_page").where("user_id", user.id).update({ episode_page: page });

        const { textList, buttons } = await renderEpisodePage(manga, page);
        const keyboard = Markup.inlineKeyboard(buttons);
        await ctx.editMessageText(textList, { parse_mode: "HTML", ...keyboard });
    } catch (err) {
        console.error(err);
        ctx.reply("❌ Xatolik yuz berdi. Iltimos, keyinroq urinib ko'ring.");
    }
};

const selectEpisode = async (ctx) => {
    try {
        const id = Number(ctx.match[1]);
        const channel = process.env.CHANNEL_ID;

        const userId = ctx.from.id;
        const user = await db("user").where({ user_id: userId }).first();
        if (!user) return ctx.reply("❌ Foydalanuvchi ma'lumotlari topilmadi. Iltimos, /start buyrug'ini bosing.");

        const episode = await db("episode").where({ id }).first();
        if (!episode) return ctx.reply("❌ Topilmadi!");

        const allDub = await db("episode").where({ manga_id: episode.manga_id, episode: episode.episode });
        if (allDub.length === 1) {
            const posts = await db("channel_post").where({ episode_id: allDub[0].id });
            for (let i = 0; i < posts.length; i++) await ctx.telegram.copyMessage(ctx.chat.id, channel, posts[i].post_id);

            const buttons = [[Markup.button.callback("📄 Qismlar ro'yxati", "episode_list")], [Markup.button.callback("📂 Mangalar ro'yxati", "manga_list")]];
            await ctx.reply("Quyidagi menulardan birini tanlang 👇", { parse_mode: "HTML", ...Markup.inlineKeyboard(buttons) });
            await ctx.deleteMessage();
        } else {
            const buttons = allDub.map((dub) => [Markup.button.callback(`🎙 ${dub.dub}`, `watch_${dub.id}`)]);
            const buttonOptions = { parse_mode: "HTML", ...Markup.inlineKeyboard(buttons) };
            const text = `🎥 <b>${episode.episode}. ${episode.name}</b>\n\nUshbu qism bir nechta dublyaj studiyasi tomonidan dublyaj qilingan:`;
            await ctx.reply(text, buttonOptions);
            await ctx.deleteMessage();
        }
    } catch (err) {
        console.error(err);
        ctx.reply("❌ Xatolik yuz berdi. Iltimos, keyinroq urinib ko'ring.");
    }
};

const selectAllEpisode = async (ctx) => {
    try {
        const id1 = Number(ctx.match[1]);
        const id2 = Number(ctx.match[2]);
        const channel = process.env.CHANNEL_ID;

        const userId = ctx.from.id;
        const user = await db("user").where({ user_id: userId }).first();
        if (!user) return ctx.reply("❌ Foydalanuvchi ma'lumotlari topilmadi. Iltimos, /start buyrug'ini bosing.");

        const episodes = await db("episode").where("id", ">=", id1).andWhere("id", "<=", id2);
        if (episodes.length === 0) return ctx.reply("❌ Topilmadi!");

        for (let i = 0; i < episodes.length; i++) {
            const episode = episodes[i];
            const allDub = await db("episode").where({ manga_id: episode.manga_id, episode: episode.episode });
            for (let j = 0; j < allDub.length; j++) {
                const posts = await db("channel_post").where({ episode_id: allDub[j].id });
                for (let k = 0; k < posts.length; k++) {
                    await ctx.telegram.copyMessage(ctx.chat.id, channel, posts[k].post_id);
                }
            }
        }

        const buttons = [[Markup.button.callback("📄 Qismlar ro'yxati", "episode_list")], [Markup.button.callback("📂 Mangalar ro'yxati", "manga_list")]];
        await ctx.reply("Quyidagi menulardan birini tanlang 👇", { parse_mode: "HTML", ...Markup.inlineKeyboard(buttons) });
        await ctx.deleteMessage();
    } catch (err) {
        console.error(err);
        ctx.reply("❌ Xatolik yuz berdi. Iltimos, keyinroq urinib ko'ring.");
    }
};

const backToManga = async (ctx) => {
    try {
        const user = await db("user").where("user_id", ctx.from.id).first();
        if (!user) return ctx.reply("❌ Foydalanuvchi ma'lumotlari topilmadi. Iltimos, /start buyrug'ini bosing.");
        const page = await db("user_page").where("user_id", user.id);

        const { textList, buttons } = await renderMangaPage(page.manga_page);
        const keyboard = Markup.inlineKeyboard(buttons);
        await ctx.reply(textList, { parse_mode: "HTML", ...keyboard });

        ctx.deleteMessage();
    } catch (err) {
        console.error(err);
        ctx.reply("❌ Xatolik yuz berdi. Iltimos, keyinroq urinib ko'ring.");
    }
};

const mangaList = async (ctx) => {
    try {
        const user = await db("user").where("user_id", ctx.from.id).first();
        if (!user) return ctx.reply("❌ Foydalanuvchi ma'lumotlari topilmadi. Iltimos, /start buyrug'ini bosing.");
        const page = await db("user_page").where("user_id", user.id).first();
        const { textList, buttons } = await renderMangaPage(page.manga_page);
        const keyboard = Markup.inlineKeyboard(buttons);
        await ctx.reply(textList, { parse_mode: "HTML", ...keyboard });
        await ctx.deleteMessage();
    } catch (err) {
        console.error(err);
        ctx.reply("❌ Xatolik yuz berdi. Iltimos, keyinroq urinib ko'ring.");
    }
};

const episodeList = async (ctx) => {
    try {
        const user = await db("user").where("user_id", ctx.from.id).first();
        if (!user) return ctx.reply("❌ Foydalanuvchi ma'lumotlari topilmadi. Iltimos, /start buyrug'ini bosing.");
        const page = await db("user_page").where("user_id", user.id).first();
        const { textList, buttons } = await renderEpisodePage(page.manga_id, page.episode_page);
        const keyboard = Markup.inlineKeyboard(buttons);
        await ctx.reply(textList, { parse_mode: "HTML", ...keyboard });
        await ctx.deleteMessage();
    } catch (err) {
        console.error(err);
        ctx.reply("❌ Xatolik yuz berdi. Iltimos, keyinroq urinib ko'ring.");
    }
};

async function watch(ctx) {
    try {
        const id = Number(ctx.match[1]);
        const channel = process.env.CHANNEL_ID;

        await ctx.deleteMessage();

        const userId = ctx.from.id;
        const user = await db("user").where({ user_id: userId }).first();
        if (!user) return ctx.reply("❌ Foydalanuvchi ma'lumotlari topilmadi. Iltimos, /start buyrug'ini bosing.");

        const episode = await db("episode").where({ id }).first();
        if (episode) {
            const posts = await db("channel_post").where({ episode_id: episode.id });
            for (let i = 0; i < posts.length; i++) await ctx.telegram.copyMessage(ctx.chat.id, channel, posts[i].post_id);
        } else ctx.reply("❌ Topilmadi!");

        const buttons = [[Markup.button.callback("📄 Qismlar ro'yxati", "episode_list")], [Markup.button.callback("📂 Mangalar ro'yxati", "manga_list")]];
        await ctx.reply("Quyidagi menulardan birini tanlang 👇", { parse_mode: "HTML", ...Markup.inlineKeyboard(buttons) });
    } catch (err) {
        console.error(err);
        ctx.reply("❌ Xatolik yuz berdi. Iltimos, keyinroq urinib ko'ring.");
    }
}

module.exports = { renderMangaPage, changePage, selectManga, selectEpisode, selectAllEpisode, episodePage, backToManga, mangaList, episodeList, watch };
