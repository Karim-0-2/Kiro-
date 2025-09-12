const axios = require("axios");
const fs = require("fs");
const path = require("path");

const vipPath = path.join(__dirname, "cache", "vip.json");
const OWNER_UID = "61557991443492"; // Hasib UID (owner bypass)

const mahmud = async () => {
  const response = await axios.get("https://raw.githubusercontent.com/mahmudx7/exe/main/baseApiUrl.json");
  return response.data.mahmud;
};

module.exports = {
  config: {
    name: "catvideo",
    aliases: ["catvid"],
    version: "2.1",
    role: 0,
    author: "Hasib",
    category: "vip",
    guide: {
      en: "Use {pn} to get a random cat video. (VIP Only, Owner bypass)"
    }
  },

  onStart: async function ({ api, event, message }) {
    try {
      // --- VIP CHECK ---
      if (event.senderID !== OWNER_UID) { // Skip check if Owner
        if (!fs.existsSync(vipPath)) fs.writeFileSync(vipPath, JSON.stringify([]));
        let vipData = [];
        try {
          vipData = JSON.parse(fs.readFileSync(vipPath));
        } catch {
          vipData = [];
        }

        const now = Date.now();
        const userVIP = vipData.find(u => u.uid === event.senderID && u.expire > now);

        if (!userVIP) {
          return message.reply("⚠️ | Sorry, this command is **VIP only**.\n⏰ Contact Hasib to get VIP access!");
        }
      }

      // --- LOADING MESSAGE ---
      const loadingMessage = await message.reply("🐱 | 𝗟𝗼𝗮𝗱𝗶𝗻𝗴 𝗿𝗮𝗻𝗱𝗼𝗺 𝗖𝗮𝘁 𝘃𝗶𝗱𝗲𝗼...𝗣𝗹𝗲𝗮𝘀𝗲 𝘄𝗮𝗶𝘁..!!");
      setTimeout(() => {
        api.unsendMessage(loadingMessage.messageID);
      }, 5000);

      // --- FETCH CAT VIDEO ---
      const apiUrl = await mahmud();
      const res = await axios.get(`${apiUrl}/api/album/videos/cat?userID=${event.senderID}`);

      if (!res.data.success || !res.data.videos || !res.data.videos.length)
        return api.sendMessage("❌ | No videos found.", event.threadID, event.messageID);

      const url = res.data.videos[Math.floor(Math.random() * res.data.videos.length)];
      const filePath = path.join(__dirname, `temp_${Date.now()}.mp4`);

      const video = await axios({
        url,
        method: "GET",
        responseType: "stream",
        headers: { 'User-Agent': 'Mozilla/5.0' }
      });

      const writer = fs.createWriteStream(filePath);
      video.data.pipe(writer);

      writer.on("finish", () => {
        api.sendMessage({
          body: `✨ | 𝐇𝐞𝐫𝐞'𝐬 𝐲𝐨𝐮𝐫 𝐂𝐚𝐭 𝐯𝐢𝐝𝐞𝐨 ${event.senderID === OWNER_UID ? "(👑 Owner)" : "(🏅 VIP)"}`,
          attachment: fs.createReadStream(filePath)
        }, event.threadID, () => {
          fs.unlinkSync(filePath); // cleanup
        }, event.messageID);
      });

      writer.on("error", () => {
        api.sendMessage("❌ | Download error.", event.threadID, event.messageID);
      });
    } catch (e) {
      console.error("ERROR:", e);
      api.sendMessage("❌ | Failed to fetch or send video.", event.threadID, event.messageID);
    }
  }
};
