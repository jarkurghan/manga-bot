const { Markup } = require("telegraf");
const db = require("../db/db");

const renderMangaPage = async (page = 0, search) => {
    const pageSize = 10;
    const mangaList = await db("manga")
        .leftJoin("chapter", "manga.id", "chapter.manga_id")
        .count("chapter.chapter as chapter_count")
        .where((qb) => {
            if (search) {
                qb.where("manga.name", "ILIKE", `%${search}%`);
                qb.orWhere("manga.keys", "ILIKE", `%${search}%`);
            }
        })
        .groupBy("manga.id")
        .orderBy("manga.id")
        .select("manga.*");

    const totalPages = Math.ceil(mangaList.length / pageSize);

    const getPage = (page) => {
        const start = page * pageSize;
        const end = start + pageSize;
        return mangaList.slice(start, end);
    };

    const currentPage = getPage(page);
    const listMaker = (manga, index) =>
        `<i>${index + 1 + page * pageSize}. ${manga.name} - ${manga.status} - ${manga.chapter_count}/${manga.number_of_chapters}</i>`;
    const textList = `<b>Mangalar ro'yxati: ${page * pageSize + 1}-${page * pageSize + currentPage.length}</b>\n\n` + currentPage.map(listMaker).join("\n");

    const buttons = [];
    currentPage.forEach((manga, index) => {
        const button = Markup.button.callback(`${index + 1 + page * pageSize}`, `manga_${manga.id}`);
        const rowIndex = Math.floor(index / 5);
        if (!buttons[rowIndex]) buttons[rowIndex] = [];
        buttons[rowIndex].push(button);
    });

    const navigationButtons = [];
    if (page > 0) navigationButtons.push(Markup.button.callback("⬅️", `manga_list_${page - 1}`));
    if (search) navigationButtons.push(Markup.button.callback("❌", "remove_searching"));
    if (page < totalPages - 1) navigationButtons.push(Markup.button.callback("➡️", `manga_list_${page + 1}`));
    if (navigationButtons.length > 0) buttons.push(navigationButtons);

    if (mangaList.length === 0) return { textList: "<b>Manga topilmadi!</b>", buttons };
    return { textList, buttons };
};

const renderChapterPage = async (mangaId, page) => {
    const pageSize = 10;
    const chapterList = await db("chapter").select("*").where("manga_id", mangaId).orderBy("order");
    const manga = await db("manga").select("id", "name").where("id", mangaId).first();

    const totalPages = Math.ceil(chapterList.length / pageSize);

    const getPage = (page) => {
        const start = page * pageSize;
        const end = start + pageSize;
        return chapterList.slice(start, end);
    };

    const currentPage = getPage(page);
    const textList =
        `<b>${manga.name}: ${page * pageSize + 1}-${page * pageSize + currentPage.length}</b> \nUmumiy ${chapterList.length} qism\n\n` +
        currentPage.map((chapter, i) => `<i>${page * pageSize + 1 + i}. <b>${chapter.chapter}</b></i>`).join("\n");

    const buttons = [];
    currentPage.forEach((chapter, index) => {
        const button = Markup.button.callback(`${index + 1 + page * pageSize}`, `chapter_${chapter.id}`);
        const rowIndex = Math.floor(index / 5);
        if (!buttons[rowIndex]) buttons[rowIndex] = [];
        buttons[rowIndex].push(button);
    });

    if (page * pageSize + 1 !== page * pageSize + currentPage.length) {
        const text = `${page * pageSize + 1}-${page * pageSize + currentPage.length}` + "   barchasini tanlash";
        const query = "all_chapter_" + currentPage[0].id + "_" + currentPage[currentPage.length - 1].id;
        buttons.push([Markup.button.callback(text, query)]);
    }

    const navigationButtons = [];
    if (page > 0) {
        navigationButtons.push(Markup.button.callback("⬅️ Oldingi", `elist_${mangaId}_${page - 1}`));
    }
    if (page < totalPages - 1) {
        navigationButtons.push(Markup.button.callback("Keyingi ➡️", `elist_${mangaId}_${page + 1}`));
    }
    if (navigationButtons.length > 0) {
        buttons.push(navigationButtons);
    }

    buttons.push([Markup.button.callback("📂 Mangalar ro'yxati", "back_manga_list")]);

    return { textList, buttons };
};

module.exports = { renderMangaPage, renderChapterPage };
