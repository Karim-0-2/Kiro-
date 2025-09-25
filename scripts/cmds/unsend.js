module.exports = {
    config: {
        name: "unsend",
        aliases: ["u", "unsend", "unsent", "uns"], // Multiple shortcuts
        version: "1.5",
        author: "Hasib",
        countDown: 5,
        role: 0,
        description: {
            vi: "Gỡ tin nhắn của bot",
            en: "Unsend bot's message"
        },
        category: "box chat",
        guide: {
            vi: "Reply tin nhắn muốn gỡ của bot và gọi lệnh {pn} hoặc react 😡",
            en: "Reply the message you want to unsend and call the command {pn} or react 😡"
        }
    },

    langs: {
        vi: {
            syntaxError: "Vui lòng reply tin nhắn muốn gỡ của bot",
            unsendFail: "Gỡ tin nhắn thất bại."
        },
        en: {
            syntaxError: "Please reply the message you want to unsend",
            unsendFail: "Failed to unsend the message."
        }
    },

    onStart: async function ({ message, event, api, getLang }) {
        // Check if the command is used or reaction 😡
        const isReactUnsend = event.type === "message_reaction" && event.reaction === "😡";

        if (!isReactUnsend && (!event.messageReply || event.messageReply.senderID != api.getCurrentUserID()))
            return message.reply(getLang("syntaxError"));

        try {
            const targetMessageID = isReactUnsend ? event.messageID : event.messageReply.messageID;
            await message.unsend(targetMessageID);
            // Silent success (no confirmation message)
        } catch (err) {
            message.reply(getLang("unsendFail"));
        }
    }
};
