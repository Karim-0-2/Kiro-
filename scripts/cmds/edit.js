const axios = require("axios");

const xApi = 'https://rasin-x-apis-main.onrender.com/api/rasin/edit';

module.exports = {
  config: {
    name: "edit",
    aliases: ['editz'],
    version: "3.0.0",
    author: "Rasin",
    countDown: 2,
    role: 2,
    shortDescription: { en: "Edit images with AI" },
    longDescription: { en: "Edit images with AI" },
    category: "image",
    guide: {
      en: "Usage:\n" +
          "• {pn} <prompt> - reply to an image\n" +
          "• nothing"
    }
  },

  onStart: async ({ message, event, args, api }) => {
    const prompt = args.join(" ");

    if (!prompt) {
      const sentMsg = await message.reply("𝙿𝚕𝚎𝚊𝚜𝚎 𝚙𝚛𝚘𝚟𝚒𝚍𝚎 𝚊 𝚙𝚛𝚘𝚖𝚙𝚝 or reply with a prompt");
      global.GoatBot.onReply.set(sentMsg.messageID, {
        messageID: sentMsg.messageID,
        commandName: module.exports.config.name,
        type: "prompt",
        author: event.senderID
      });
      return;
    }

    if (!event.messageReply || !event.messageReply.attachments?.length) {
      const sentMsg = await message.reply("𝙿𝚕𝚎𝚊𝚜𝚎 reply with an image");
      global.GoatBot.onReply.set(sentMsg.messageID, {
        messageID: sentMsg.messageID,
        commandName: module.exports.config.name,
        type: "image",
        prompt,
        author: event.senderID
      });
      return;
    }

    const attachment = event.messageReply.attachments[0];
    if (attachment.type !== "photo") {
      return message.reply("𝙿𝚕𝚎𝚊𝚜𝚎 reply with an image");
    }

    await module.exports.processEdit(message, event, api, prompt, attachment.url); //ADD by ST | SHEIKH TAMIM
  },

  onReply: async ({ message, event, api, Reply }) => {
    const { type, prompt, author } = Reply;

    if (event.senderID !== author) {
      return message.reply("Only the user who initiated this command can reply");
    }

    const attachment = event.messageReply?.attachments?.[0];

    if (type === "continue_edit" || type === "image") {
      if (!attachment || attachment.type !== "photo") {
        return message.reply("Please reply with an image");
      }
      await module.exports.processEdit(message, event, api, prompt, attachment.url);
      Reply.delete();
      return;
    }

    if (type === "prompt") {
      const userPrompt = event.body.trim();
      if (!userPrompt) return message.reply("Please provide a valid prompt");

      const sentMsg = await message.reply("Now reply with an image");
      global.GoatBot.onReply.set(sentMsg.messageID, {
        messageID: sentMsg.messageID,
        commandName: module.exports.config.name,//Fixed by ST | SHEIKH TAMIM
        type: "image",
        prompt: userPrompt,
        author: event.senderID
      });

      Reply.delete();
      return;
    }
  },

  processEdit: async (message, event, api, prompt, imageUrl) => { //Fixed by ST | SHEIKH TAMIM
    api.setMessageReaction("⏳", event.messageID, () => {}, true);

    try {
      const res = await axios.get(`${xApi}?prompt=${encodeURIComponent(prompt)}&url=${encodeURIComponent(imageUrl)}`);
      const resultImageUrl = res.data.imageUrl;

      if (!resultImageUrl) return message.reply("No image returned 😐");

      const sentMsg = await message.reply({
        attachment: await global.utils.getStreamFromURL(resultImageUrl)
      });

      global.GoatBot.onReply.set(sentMsg.messageID, {
        messageID: sentMsg.messageID,
        commandName: module.exports.config.name,
        type: "continue_edit",
        author: event.senderID
      });

      api.setMessageReaction("👹", event.messageID, () => {}, true);
    } catch (err) {
      console.error(err);
      message.reply("𝐒𝐨𝐫𝐫𝐲 💔");
      api.setMessageReaction("❌", event.messageID, () => {}, true);
    }
  }
};
