require("dotenv").config({ path: process.env.NODE_ENV === "production" ? ".env.production" : ".env" });

const { Telegraf } = require("telegraf");
const bot = new Telegraf(process.env.BOT_TOKEN);

const { start } = require("./src/start");
const { newPost } = require("./src/admin.js");
const { newManga } = require("./src/admin.js");
const { addManga } = require("./src/admin.js");
const { addChapter } = require("./src/admin.js");
const { deleteMessage } = require("./src/admin.js");
const { chapterPage } = require("./src/methods.js");
const { selectChapter } = require("./src/methods.js");
const { backToManga } = require("./src/methods.js");
const { changePage } = require("./src/methods.js");
const { selectManga } = require("./src/methods.js");
const { mangaList } = require("./src/methods.js");
const { chapterList } = require("./src/methods.js");
const { sendDataToAdmin } = require("./src/scheduler.js");
const { selectAllChapter } = require("./src/methods.js");

bot.start(start);

bot.on("channel_post", newPost);
bot.command("new_manga", newManga);
bot.action(/^add_manga_(\d+)$/, addManga);
bot.action(/^add_chapter_(\d+)$/, addChapter);
bot.action(/^delete_message_(\d+)$/, deleteMessage);

bot.action(/^manga_(\d+)$/, selectManga);
bot.action(/^manga_list_(\d+)$/, changePage);
bot.action(/^back_manga_list$/, backToManga);
bot.action(/^chapter_(\d+)$/, selectChapter);
bot.action(/^all_chapter_(\d+)_(\d+)$/, selectAllChapter);
bot.action(/^elist_(\d+)_(\d+)$/, chapterPage);
bot.action(/^chapter_list$/, chapterList);
bot.action(/^manga_list$/, mangaList);

sendDataToAdmin(bot);

bot.launch();
