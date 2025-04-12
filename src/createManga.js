const { default: axios } = require("axios");
const { Telegraf } = require("telegraf");

const bot = new Telegraf(process.env.BOT_TOKEN);

const createManga = async (ctx) => {
    try {
        const messages = await ctx.telegram.getUpdates({
            offset: -10,
            limit: 10,
            allowed_updates: ['channel_post']
          });
          
          messages.forEach(msg => {
            console.log(msg);
            
            if (msg.document?.mime_type === 'application/pdf') {
              console.log('PDF topildi:', msg.caption);
            }
          });
      
    } catch (err) {
        console.error(err);
        ctx.reply("❌ Xatolik yuz berdi. Iltimos, keyinroq urinib ko'ring.");
    }
};

module.exports = { createManga };
