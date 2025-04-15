const { logError } = require("../logs");

const sendManga = async (ctx) => {
    try {
        const manga = ctx.startPayload.slice(6, 12);
        const channel = process.env.DATA_CHANNEL_ID;

        if (manga === "boruto") {
            const post_id = ctx.startPayload.slice(13);
            switch (post_id) {
                case "986":
                    await ctx.telegram.copyMessage(ctx.chat.id, channel, post_id, { protect_content: true });
                    return true;
                case "987":
                    await ctx.telegram.copyMessage(ctx.chat.id, channel, post_id, { protect_content: true });
                    return true;
                case "988":
                    await ctx.telegram.copyMessage(ctx.chat.id, channel, post_id, { protect_content: true });
                    return true;
                case "989":
                    await ctx.telegram.copyMessage(ctx.chat.id, channel, post_id, { protect_content: true });
                    return true;
                case "990":
                    await ctx.telegram.copyMessage(ctx.chat.id, channel, post_id, { protect_content: true });
                    return true;
                case "991":
                    await ctx.telegram.copyMessage(ctx.chat.id, channel, post_id, { protect_content: true });
                    return true;
                case "992":
                    await ctx.telegram.copyMessage(ctx.chat.id, channel, post_id, { protect_content: true });
                    return true;
                case "993":
                    await ctx.telegram.copyMessage(ctx.chat.id, channel, post_id, { protect_content: true });
                    return true;
                case "994":
                    await ctx.telegram.copyMessage(ctx.chat.id, channel, post_id, { protect_content: true });
                    return true;
                case "995":
                    await ctx.telegram.copyMessage(ctx.chat.id, channel, post_id, { protect_content: true });
                    return true;
                case "996":
                    await ctx.telegram.copyMessage(ctx.chat.id, channel, post_id, { protect_content: true });
                    return true;
                case "997":
                    await ctx.telegram.copyMessage(ctx.chat.id, channel, post_id, { protect_content: true });
                    return true;
                // case "991":
                //     await ctx.telegram.copyMessage(ctx.chat.id, channel, post_id, { protect_content: true });
                //     return true;
                // case "991":
                //     await ctx.telegram.copyMessage(ctx.chat.id, channel, post_id, { protect_content: true });
                //     return true;

                default:
                    return false;
            }
        }
    } catch (error) {
        console.error(error.message);
        logError("new_post", error);
        ctx.reply("❌ Xatolik yuz berdi. Iltimos, dasturchiga xabar bering.");
    }
};

module.exports = { sendManga };
