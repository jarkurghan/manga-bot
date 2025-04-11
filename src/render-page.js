const { Markup } = require("telegraf");
const db = require("../db/db");

const renderMangaPage = async (page = 0) => {
    const pageSize = 10;
    const mangaList = await db("manga");
    // .leftJoin("episode", "manga.id", "episode.manga_id")
    // .select("manga.id", "manga.name", "manga.number_of_episode")
    // .count("episode.episode as episode_count")
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
    //     `<i>${index + 1 + page * pageSize}. ${manga.name} - ${manga.number_of_episode == manga.episode_count ? "to'liq" : "tugatilmagan"} - ${
    //         manga.episode_count
    //     } qism</i>`;
    const listMaker = (manga, index) => `<i>${index + 1 + page * pageSize}. ${manga.name}</i>`;
    const textList = `<b>Mangalar ro'yxati: ${page * pageSize + 1}-${page * pageSize + currentPage.length}</b>\n\n` + currentPage.map(listMaker).join("\n")+
        "\n\n<blockquote>Bot yangiliklaridan xabardor bo'lish uchun @ani_uz_news kanaliga a'zo bo'ling!</blockquote>";
    // "\n\nBu yerda sizning reklamangiz bo'lishi mumkin edi!";

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

const renderEpisodePage = async (mangaId, page) => {
    const pageSize = 10;
    const episodeList = await db("episode").select("id", "episode", "name").where("manga_id", mangaId).groupBy("episode").orderBy("id");
    const manga = await db("manga").select("id", "name").where("id", mangaId).first();

    const totalPages = Math.ceil(episodeList.length / pageSize);

    const getPage = (page) => {
        const start = page * pageSize;
        const end = start + pageSize;
        return episodeList.slice(start, end);
    };

    const currentPage = getPage(page);
    const textList =
        `<b>${manga.name}: ${page * pageSize + 1}-${page * pageSize + currentPage.length}</b> \nUmumiy ${episodeList.length} qism\n\n` +
        currentPage.map((episode, i) => `<i>${page * pageSize + 1 + i}. <b>${episode.episode}</b>. ${episode.name}</i>`).join("\n") +
        "\n\n<blockquote>Bot yangiliklaridan xabardor bo'lish uchun @ani_uz_news kanaliga a'zo bo'ling!</blockquote>";
    // "\n\nBu yerda sizning reklamangiz bo'lishi mumkin edi!";

    const buttons = [];
    currentPage.forEach((episode, index) => {
        const button = Markup.button.callback(`${index + 1 + page * pageSize}`, `episode_${episode.id}`);
        const rowIndex = Math.floor(index / 5);
        if (!buttons[rowIndex]) buttons[rowIndex] = [];
        buttons[rowIndex].push(button);
    });

    const text = `${page * pageSize + 1}-${page * pageSize + currentPage.length}` + "   barchasini tanlash";
    const query = "all_episode_" + currentPage[0].id + "_" + currentPage[currentPage.length - 1].id;
    buttons.push([Markup.button.callback(text, query)]);

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

module.exports = { renderMangaPage, renderEpisodePage };
