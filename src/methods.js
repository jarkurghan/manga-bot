const { Markup } = require("telegraf");
const { renderChapterPage } = require("./render-page");
const { renderMangaPage } = require("./render-page");
const { logError } = require("../logs");
const knex = require("../db/db");

const search = async (ctx) => {
    try {
        if (ctx.message.chat.type === "private") {
            const message = ctx.message.text;
            const user = await knex("user").where("user_id", ctx.from.id).first();
            if (!user) return ctx.reply("❌ Foydalanuvchi ma'lumotlari topilmadi. Iltimos, /start buyrug'ini bosing.");
            await knex("user_page").where("user_id", user.id).update({ manga_page: 0, chapter_page: 0, searching: message });
            const { textList, buttons } = await renderMangaPage(0, message);
            await ctx.reply(textList, { parse_mode: "HTML", ...Markup.inlineKeyboard(buttons) });
        }
    } catch (error) {
        console.error(error.message);
        logError("search", error);
        ctx.reply("❌ Xatolik yuz berdi. Iltimos, keyinroq urinib ko'ring.");
    }
};

const reserFilter = async (ctx) => {
    try {
        const user = await knex("user").where("user_id", ctx.from.id).first();
        if (!user) return ctx.reply("❌ Foydalanuvchi ma'lumotlari topilmadi. Iltimos, /start buyrug'ini bosing.");
        await knex("user_page").where("user_id", user.id).update({ manga_page: 0, chapter_page: 0, searching: "" });
        const { textList, buttons } = await renderMangaPage(0, "");
        await ctx.editMessageText(textList, { parse_mode: "HTML", ...Markup.inlineKeyboard(buttons) });
    } catch (error) {
        console.error(error.message);
        logError("change_page", error);
        ctx.reply("❌ Xatolik yuz berdi. Iltimos, keyinroq urinib ko'ring.");
    }
};

const changePage = async (ctx) => {
    try {
        const page = parseInt(ctx.match[1]);
        const user = await knex("user").where("user_id", ctx.from.id).first();
        if (!user) return ctx.reply("❌ Foydalanuvchi ma'lumotlari topilmadi. Iltimos, /start buyrug'ini bosing.");
        const userPage = await knex("user_page").where("user_id", user.id).update({ manga_page: page }).returning("*");

        const { textList, buttons } = await renderMangaPage(page, userPage[0].searching);
        await ctx.editMessageText(textList, { parse_mode: "HTML", ...Markup.inlineKeyboard(buttons) });
    } catch (error) {
        console.error(error.message);
        logError("change_page", error);
        ctx.reply("❌ Xatolik yuz berdi. Iltimos, keyinroq urinib ko'ring.");
    }
};

const selectManga = async (ctx) => {
    try {
        const mangaID = parseInt(ctx.match[1]);
        const user = await knex("user").where("user_id", ctx.from.id).first();
        if (!user) return ctx.reply("❌ Foydalanuvchi ma'lumotlari topilmadi. Iltimos, /start buyrug'ini bosing.");
        await knex("user_page").where("user_id", user.id).update({ manga_id: mangaID, chapter_page: 0 });

        const manga = await knex("manga").where("id", mangaID).first();
        if (manga.status === "one-shot") {
            const channel = process.env.DATA_CHANNEL_ID;
            const chapter = await knex("chapter").where("manga_id", mangaID).first();

            const posts = chapter.posts.split(",");
            for (let i = 0; i < posts.length; i++) await ctx.telegram.copyMessage(ctx.chat.id, channel, posts[i], { protect_content: true });

            const buttons = [[Markup.button.callback("📂 Mangalar ro'yxati", "manga_list")]];
            await ctx.reply("Quyidagi menulardan birini tanlang 👇", { parse_mode: "HTML", ...Markup.inlineKeyboard(buttons) });
        } else {
            const { textList, buttons } = await renderChapterPage(mangaID, 0);
            const keyboard = Markup.inlineKeyboard(buttons);
            await ctx.reply(textList, { parse_mode: "HTML", ...keyboard });
        }

        ctx.deleteMessage();
    } catch (error) {
        console.error(error.message);
        logError("manga_select", error);
        ctx.reply("❌ Xatolik yuz berdi. Iltimos, keyinroq urinib ko'ring.");
    }
};

const chapterPage = async (ctx) => {
    try {
        const manga = parseInt(ctx.match[1]);
        const page = parseInt(ctx.match[2]);
        const user = await knex("user").where("user_id", ctx.from.id).first();
        if (!user) return ctx.reply("❌ Foydalanuvchi ma'lumotlari topilmadi. Iltimos, /start buyrug'ini bosing.");
        await knex("user_page").where("user_id", user.id).update({ chapter_page: page });

        const { textList, buttons } = await renderChapterPage(manga, page);
        const keyboard = Markup.inlineKeyboard(buttons);
        await ctx.editMessageText(textList, { parse_mode: "HTML", ...keyboard });
    } catch (error) {
        console.error(error.message);
        logError("chapter_page", error);
        ctx.reply("❌ Xatolik yuz berdi. Iltimos, keyinroq urinib ko'ring.");
    }
};

const selectChapter = async (ctx) => {
    try {
        const id = Number(ctx.match[1]);
        const channel = process.env.DATA_CHANNEL_ID;

        const userId = ctx.from.id;
        const user = await knex("user").where({ user_id: userId }).first();
        if (!user) return ctx.reply("❌ Foydalanuvchi ma'lumotlari topilmadi. Iltimos, /start buyrug'ini bosing.");

        const chapter = await knex("chapter").where({ id }).first();
        if (!chapter) return ctx.reply("❌ Topilmadi!");

        const posts = chapter.posts.split(",");
        for (let i = 0; i < posts.length; i++) await ctx.telegram.copyMessage(ctx.chat.id, channel, posts[i], { protect_content: true });

        const buttons = [[Markup.button.callback("📄 Boblar ro'yxati", "chapter_list")], [Markup.button.callback("📂 Mangalar ro'yxati", "manga_list")]];
        await ctx.reply("Quyidagi menulardan birini tanlang 👇", { parse_mode: "HTML", ...Markup.inlineKeyboard(buttons) });

        await ctx.deleteMessage();
    } catch (error) {
        console.error(error.message);
        logError("chapter_select", error);
        ctx.reply("❌ Xatolik yuz berdi. Iltimos, keyinroq urinib ko'ring.");
    }
};

const selectAllChapter = async (ctx) => {
    try {
        const id1 = Number(ctx.match[1]);
        const id2 = Number(ctx.match[2]);
        const channel = process.env.DATA_CHANNEL_ID;

        const userId = ctx.from.id;
        const user = await knex("user").where({ user_id: userId }).first();
        if (!user) return ctx.reply("❌ Foydalanuvchi ma'lumotlari topilmadi. Iltimos, /start buyrug'ini bosing.");

        const chapters = await knex("chapter").where("id", ">=", id1).andWhere("id", "<=", id2);
        if (chapters.length === 0) return ctx.reply("❌ Topilmadi!");

        for (let i = 0; i < chapters.length; i++) {
            const chapter = await knex("chapter").where({ manga_id: chapters[i].manga_id, chapter: chapters[i].chapter }).first();
            const posts = chapter.posts.split(",");
            for (let k = 0; k < posts.length; k++) await ctx.telegram.copyMessage(ctx.chat.id, channel, posts[k], { protect_content: true });
        }

        const buttons = [[Markup.button.callback("📄 Boblar ro'yxati", "chapter_list")], [Markup.button.callback("📂 Mangalar ro'yxati", "manga_list")]];
        await ctx.reply("Quyidagi menulardan birini tanlang 👇", { parse_mode: "HTML", ...Markup.inlineKeyboard(buttons) });
        await ctx.deleteMessage();
    } catch (error) {
        console.error(error.message);
        logError("chapter_select_all", error);
        ctx.reply("❌ Xatolik yuz berdi. Iltimos, keyinroq urinib ko'ring.");
    }
};

const backToManga = async (ctx) => {
    try {
        const user = await knex("user").where("user_id", ctx.from.id).first();
        if (!user) return ctx.reply("❌ Foydalanuvchi ma'lumotlari topilmadi. Iltimos, /start buyrug'ini bosing.");
        const page = await knex("user_page").where("user_id", user.id);

        const { textList, buttons } = await renderMangaPage(page.manga_page, page.searching);
        const keyboard = Markup.inlineKeyboard(buttons);
        await ctx.reply(textList, { parse_mode: "HTML", ...keyboard });

        ctx.deleteMessage();
    } catch (error) {
        console.error(error.message);
        logError("manga_back_to_list", error);
        ctx.reply("❌ Xatolik yuz berdi. Iltimos, keyinroq urinib ko'ring.");
    }
};

const mangaList = async (ctx) => {
    try {
        const user = await knex("user").where("user_id", ctx.from.id).first();
        if (!user) return ctx.reply("❌ Foydalanuvchi ma'lumotlari topilmadi. Iltimos, /start buyrug'ini bosing.");
        const page = await knex("user_page").where("user_id", user.id).first();
        const { textList, buttons } = await renderMangaPage(page.manga_page, page.searching);
        const keyboard = Markup.inlineKeyboard(buttons);
        await ctx.reply(textList, { parse_mode: "HTML", ...keyboard });
        await ctx.deleteMessage();
    } catch (error) {
        console.error(error.message);
        logError("manga_list", error);
        ctx.reply("❌ Xatolik yuz berdi. Iltimos, keyinroq urinib ko'ring.");
    }
};

const chapterList = async (ctx) => {
    try {
        const user = await knex("user").where("user_id", ctx.from.id).first();
        if (!user) return ctx.reply("❌ Foydalanuvchi ma'lumotlari topilmadi. Iltimos, /start buyrug'ini bosing.");
        const page = await knex("user_page").where("user_id", user.id).first();
        const { textList, buttons } = await renderChapterPage(page.manga_id, page.chapter_page);
        const keyboard = Markup.inlineKeyboard(buttons);
        await ctx.reply(textList, { parse_mode: "HTML", ...keyboard });
        await ctx.deleteMessage();
    } catch (error) {
        console.error(error.message);
        logError("chapter_list", error);
        ctx.reply("❌ Xatolik yuz berdi. Iltimos, keyinroq urinib ko'ring.");
    }
};

module.exports = { changePage, selectManga, selectChapter, selectAllChapter, chapterPage, backToManga, mangaList, chapterList, search, reserFilter };
