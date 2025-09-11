const axios = require("axios");
const fs = require("fs");
const path = require("path");

// === VIP CONFIG ===
const vipPath = path.join(__dirname, "/cache/vip.json");
const OWNERS = ["61557991443492", "61578418080601"]; // Hasib + Wife
const BOT_ADMINS = []; // Dynamic admins

function loadVIP() {
  if (!fs.existsSync(vipPath)) return { vips: {}, admins: [] };
  return JSON.parse(fs.readFileSync(vipPath, "utf8"));
}

function isAllowed(uid) {
  const data = loadVIP();
  const now = Date.now();

  if (OWNERS.includes(uid)) return true; // Owners bypass everything
  if (BOT_ADMINS.includes(uid)) {
    // Admins must have VIP
    return data.vips[uid] && data.vips[uid].expire > now;
  }
  // Other users need VIP
  return data.vips[uid] && data.vips[uid].expire > now;
}

module.exports = {
  config: {
    name: "art",
    role: 1, // VIP only
    author: "OtinXSandip",
    countDown: 5,
    longDescription: "Art images",
    category: "AI",
    guide: {
      en: "${pn} reply to an image with a prompt and choose model 1 - 52"
    }
  },

  onStart: async function ({ message, api, args, event }) {
    const senderID = event.senderID;

    // VIP / Owner check
    if (!isAllowed(senderID)) {
      return message.reply("❌ This command is VIP-only.");
    }

    const text = args.join(' ');

    if (!event.messageReply || !event.messageReply.attachments || !event.messageReply.attachments[0]) {
      return message.reply("❌ You must reply to an image.");
    }

    const imgurl = encodeURIComponent(event.messageReply.attachments[0].url);

    const [prompt, model] = text.split('|').map((t) => t.trim());
    const puti = model || "37";

    api.setMessageReaction("⏰", event.messageID, () => {}, true);

    const lado = `https://sandipapi.onrender.com/art?imgurl=${imgurl}&prompt=${encodeURIComponent(prompt)}&model=${puti}`;

    message.reply("✅ Generating, please wait...", async (err, info) => {
      const attachment = await global.utils.getStreamFromURL(lado);
      message.reply({ attachment });
      message.unsend(info.messageID);
      api.setMessageReaction("✅", event.messageID, () => {}, true);
    });
  }
};
