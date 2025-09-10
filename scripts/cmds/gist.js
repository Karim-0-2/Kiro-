const axios = require("axios");

// Define owners
const OWNERS = ["61557991443492", "61578418080601"]; // <-- your owner UIDs here

module.exports = {
  config: {
    name: "gist",
    aliases: ["goat", "gistgoat"],
    version: "1.0",
    author: "Blankid018 + Modified by Hasib",
    role: 0,
    countDown: 5,
    shortDescription: "Generate images using Gist-Goat",
    longDescription: "Use the Gist-Goat API to generate images with your prompt.",
    category: "tools",
    guide: {
      en: "{pn} <prompt>"
    }
  },

  onStart: async function ({ api, event, args }) {
    try {
      // Only owners can use
      if (!OWNERS.includes(event.senderID)) {
        return api.sendMessage("❌ You are not authorized to use this command!", event.threadID, event.messageID);
      }

      const prompt = args.join(" ");
      if (!prompt) {
        return api.sendMessage("⚠️ Please provide a prompt.\nExample: gist a cat wearing sunglasses", event.threadID, event.messageID);
      }

      api.sendMessage(`⏳ Generating image for prompt:\n"${prompt}"`, event.threadID, event.messageID);

      // Call the API
      const res = await axios.get(`https://raw.githubusercontent.com/Blankid018/D1PT0/main/gist-goat.js?prompt=${encodeURIComponent(prompt)}`, {
        responseType: "arraybuffer"
      });

      const buffer = Buffer.from(res.data, "binary");

      // Send result
      return api.sendMessage(
        {
          body: `✅ Here is your generated image for:\n"${prompt}"`,
          attachment: buffer
        },
        event.threadID,
        event.messageID
      );

    } catch (err) {
      console.error(err);
      return api.sendMessage("❌ Failed to generate image.", event.threadID, event.messageID);
    }
  }
};
