const fs = require("fs");
const path = require("path");
const axios = require('axios');
const request = require('request');

const VIP_PATH = path.join(__dirname, "/cache/vip.json");
const OWNERS = ["61578418080601", "61557991443492"];
const ADMINS = ["100060606189407", "61576296543095", "61554678316179", "100091527859576"];

module.exports = {
  config: {
    name: "love",
    role: 0,
    author: "Romim",
    countDown: 5,
    longDescription: "Random love video",
    category: "randomvideo",
    guide: { en: "{pn} <video>" }
  },

  onStart: async function({ api, event }) {
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
        return api.sendMessage("⚠️ Admins must be VIP to use this command!", event.threadID, event.messageID);
      } else {
        return api.sendMessage("❌ You must be a VIP to use this command!", event.threadID, event.messageID);
      }
    }

    try {
      const romimVideos = ["https://a6-video-api.onrender.com/video/love"];
      const videoURL = romimVideos[Math.floor(Math.random() * romimVideos.length)];

      axios.get(videoURL).then(res => {
        const videoLink = res.data.data;
        const filePath = path.join(__dirname, "/cache/Romim.mp4");

        const callback = function () {
          api.sendMessage({
            body: "✅ Successfully sent LOVE video 🎬\n\n｢ NI S AN ｣",
            attachment: fs.createReadStream(filePath)
          }, event.threadID, () => fs.unlinkSync(filePath), event.messageID);
        };

        request(videoLink).pipe(fs.createWriteStream(filePath)).on("close", callback);
      });

    } catch (error) {
      console.error(error);
      api.sendMessage("❌ Error: " + (error.message || "Something went wrong!"), event.threadID, event.messageID);
    }
  }
};
