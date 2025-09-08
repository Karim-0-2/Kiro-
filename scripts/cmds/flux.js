const axios = require("axios");
const fs = require("fs");
const path = require("path");

const VIP_PATH = path.join(__dirname, "cache", "vip.json");
const OWNERS = ["61578418080601", "61557991443492"]; // Owner UIDs
const ADMINS = ["100060606189407", "61576296543095", "61554678316179", "100091527859576"]; // Admin UIDs

module.exports = {
  config: {
    name: "flux",
    version: "1.1.0",
    author: "Rasin",
    countDown: 5,
    role: 0,
    description: { en: "Flux" },
    category: "FLUX",
    guide: { en: "{pn}flux [prompt]" }
  },

  onStart: async function ({ event, args, message, api }) {
    // --- Load VIP data ---
    if (!fs.existsSync(VIP_PATH)) fs.writeFileSync(VIP_PATH, JSON.stringify([]));
    const vipData = JSON.parse(fs.readFileSync(VIP_PATH));
    const sender = String(event.senderID);

    // --- Access check ---
    const senderIsOwner = OWNERS.includes(sender);
    const senderIsAdmin = ADMINS.includes(sender);
    const senderIsVIP = vipData.some(u => u.uid === sender);

    if (!senderIsOwner && !senderIsVIP) {
      if (senderIsAdmin) {
        return message.reply("⚠️ Admins must be VIP to use this command!");
      } else {
        return message.reply("❌ You must be a VIP to use this command!");
      }
    }

    // --- Prompt check ---
    const prompt = args.join(" ");
    if (!prompt) return message.reply("❌ Please provide a prompt!");

    try {
      const startTime = Date.now();
      const waitMessage = await message.reply(
        senderIsOwner
          ? "👑 My Lord, generating your Flux image..."
          : "⌛ Generating image..."
      );
      api.setMessageReaction("⌛", event.messageID, () => {}, true);

      const rasinAPI = "https://rasin-x-apis.onrender.com/api/rasin/flux";
      const apiurl = `${rasinAPI}?prompt=${encodeURIComponent(prompt)}&apikey=rs_5or55iwr-h6no-z7d7-ifsd-o5`;

      const response = await axios.get(apiurl, { responseType: "stream" });

      const time = ((Date.now() - startTime) / 1000).toFixed(2);
      api.setMessageReaction("✅", event.messageID, () => {}, true);
      message.unsend(waitMessage.messageID);

      return message.reply({
        body: `✅ Here's your generated image (${time}s)`,
        attachment: response.data
      });

    } catch (e) {
      console.error(e);
      return message.reply(`❌ Error: ${e.message || "Failed to generate image. Please try again later."}`);
    }
  }
};
