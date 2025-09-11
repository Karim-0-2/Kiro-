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

// === BASE API URL ===
const baseApiUrl = async () => {
  const base = await axios.get(
    `https://raw.githubusercontent.com/Blankid018/D1PT0/main/baseApiUrl.json`
  );
  return base.data.mostakim;
};

module.exports.config = {
  name: "4k",
  aliases: ["4k", "remini"],
  category: "enhanced",
  author: "Romim"
};

module.exports.onStart = async ({ api, event, args }) => {
  const senderID = event.senderID;

  // VIP / Owner check
  if (!isAllowed(senderID)) {
    return api.sendMessage("❌ You need VIP access to use this command.", event.threadID, event.messageID);
  }

  try {
    if (!event.messageReply || !event.messageReply.attachments || !event.messageReply.attachments[0]) {
      return api.sendMessage("𝐏𝐥𝐞𝐚𝐬𝐞 𝐫𝐞𝐩𝐥𝐲 𝐭𝐨 𝐚𝐧 𝐢𝐦𝐚𝐠𝐞 𝐰𝐢𝐭𝐡 𝐭𝐡𝐞 𝐜𝐨𝐦𝐦𝐚𝐧𝐝.", event.threadID, event.messageID);
    }

    const Romim = event.messageReply.attachments[0].url;
    const apiUrl = `${await baseApiUrl()}/remini?input=${encodeURIComponent(Romim)}`;

    const imageStream = await axios.get(apiUrl, {
      responseType: "stream"
    });

    api.sendMessage({
      body: "𝐇𝐞𝐫𝐞 𝐢𝐬 𝐲𝐨𝐮𝐫 𝐞𝐧𝐡𝐚𝐧𝐜𝐞𝐝 𝐩𝐡𝐨𝐭𝐨",
      attachment: imageStream.data
    }, event.threadID, event.messageID);

  } catch (e) {
    api.sendMessage(`Error: ${e.message}`, event.threadID, event.messageID);
  }
};
