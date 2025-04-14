const { Markup } = require("telegraf");
const db = require("../db/db");

const renderMangaPage = async (page = 0) => {
    const pageSize = 10;
    const mangaList = await db("manga");
    // .leftJoin("chapter", "manga.id", "chapter.manga_id")
    // .select("manga.id", "manga.name", "manga.number_of_chapter")
    // .count("chapter.chapter as chapter_count")
    // .groupBy("manga.id")
    // .orderBy("manga.id");

    const totalPages = Math.ceil(mangaList.length / pageSize);

    const getPage = (page) => {
        const start = page * pageSize;
        const end = start + pageSize;
        return mangaList.slice(start, end);
    };

    const currentPage = getPage(page);
    // const listMaker = (manga, index) =>
    //     `<i>${index + 1 + page * pageSize}. ${manga.name} - ${manga.number_of_chapter == manga.chapter_count ? "to'liq" : "tugatilmagan"} - ${
    //         manga.chapter_count
    //     } qism</i>`;
    const listMaker = (manga, index) => `<i>${index + 1 + page * pageSize}. ${manga.name}</i>`;
    const textList = `<b>Mangalar ro'yxati: ${page * pageSize + 1}-${page * pageSize + currentPage.length}</b>\n\n` + currentPage.map(listMaker).join("\n");

    const buttons = [];
    currentPage.forEach((manga, index) => {
        const button = Markup.button.callback(`${index + 1 + page * pageSize}`, `manga_${manga.id}`);
        const rowIndex = Math.floor(index / 5);
        if (!buttons[rowIndex]) buttons[rowIndex] = [];
        buttons[rowIndex].push(button);
    });

    const navigationButtons = [];
    if (page > 0) {
        navigationButtons.push(Markup.button.callback("⬅️ Oldingi", `manga_list_${page - 1}`));
    }
    if (page < totalPages - 1) {
        navigationButtons.push(Markup.button.callback("Keyingi ➡️", `manga_list_${page + 1}`));
    }
    if (navigationButtons.length > 0) {
        buttons.push(navigationButtons);
    }

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
