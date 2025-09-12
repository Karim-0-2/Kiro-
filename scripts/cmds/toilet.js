const axios = require("axios");
const fs = require("fs-extra");
const path = require("path");
const Canvas = require("canvas");

const OWNER_UIDS = ["61557991443492", "61578418080601"]; // Owner + wife UIDs
const CACHE_DIR = path.join(__dirname, "cache");
const BG_PATH = path.join(CACHE_DIR, "toilet_bg.png");

module.exports = {
  config: {
    name: "toilet",
    version: "2.1",
    author: "TOHI-BOT-HUB | Modified by ChatGPT",
    countDown: 5,
    role: 0,
    shortDescription: "Send someone to toilet 💩",
    longDescription: "Send someone to toilet with a funny edited image",
    category: "fun",
    guide: {
      en: "{pn} @mention | reply"
    }
  },

  onLoad: async function () {
    if (!fs.existsSync(CACHE_DIR)) fs.mkdirSync(CACHE_DIR, { recursive: true });
    if (!fs.existsSync(BG_PATH)) {
      try {
        const url = "https://i.imgur.com/Kn7KpAr.jpg";
        const response = await axios.get(url, { responseType: "arraybuffer" });
        fs.writeFileSync(BG_PATH, Buffer.from(response.data));
      } catch (err) {
        console.warn("Failed to download background image:", err.message);
      }
    }
  },

  onStart: async function ({ event, api, usersData }) {
    const senderID = event.senderID;

    // Determine target ID
    let targetID = senderID;
    if (event.type === "message_reply") {
      targetID = event.messageReply.senderID;
    } else if (event.mentions && Object.keys(event.mentions).length > 0) {
      targetID = Object.keys(event.mentions)[0];
    }

    // Prevent targeting owner/wife
    if (OWNER_UIDS.includes(targetID) && !OWNER_UIDS.includes(senderID)) {
      return api.sendMessage(
        "😹👑😎 Boss বা Wife কে toilet এ পাঠানো যায় না! 💪",
        event.threadID,
        event.messageID
      );
    }

    const targetName = await usersData.getName(targetID);
    const preparingMsg = await api.sendMessage(
      "🚽 Toilet preparation in progress... 💩",
      event.threadID
    );

    try {
      // Canvas setup
      const canvas = Canvas.createCanvas(500, 670);
      const ctx = canvas.getContext("2d");

      // Load background
      if (fs.existsSync(BG_PATH)) {
        const bg = await Canvas.loadImage(BG_PATH);
        ctx.drawImage(bg, 0, 0, 500, 670);
      } else {
        ctx.fillStyle = "#87CEEB";
        ctx.fillRect(0, 0, 500, 670);
        ctx.fillStyle = "#FFFFFF";
        ctx.fillRect(150, 400, 200, 150);
        ctx.fillRect(180, 350, 140, 50);
        ctx.fillStyle = "#000";
        ctx.font = "bold 20px Arial";
        ctx.textAlign = "center";
        ctx.fillText("TOILET", 250, 475);
      }

      // Avatar download
      let avatarBuffer = null;
      const avatarUrls = [
        `https://graph.facebook.com/${targetID}/picture?width=512&height=512&access_token=6628568379|c1e620fa708a1d5696fb991c1bde5662`,
        `https://graph.facebook.com/${targetID}/picture?width=512&height=512`,
        `https://graph.facebook.com/${targetID}/picture?type=large`
      ];

      for (let url of avatarUrls) {
        try {
          const res = await axios.get(url, { responseType: "arraybuffer", timeout: 8000 });
          avatarBuffer = res.data;
          break;
        } catch {}
      }

      if (avatarBuffer) {
        const avatar = await Canvas.loadImage(avatarBuffer);
        const avCanvas = Canvas.createCanvas(205, 205);
        const avCtx = avCanvas.getContext("2d");

        avCtx.beginPath();
        avCtx.arc(102.5, 102.5, 102.5, 0, Math.PI * 2);
        avCtx.closePath();
        avCtx.clip();
        avCtx.drawImage(avatar, 0, 0, 205, 205);

        ctx.drawImage(avCanvas, 135, 350);
      } else {
        // Fallback with first letter
        ctx.fillStyle = "#4A90E2";
        ctx.beginPath();
        ctx.arc(237.5, 452.5, 102.5, 0, Math.PI * 2);
        ctx.fill();

        ctx.strokeStyle = "#FFF";
        ctx.lineWidth = 4;
        ctx.stroke();

        ctx.fillStyle = "#FFF";
        ctx.font = "bold 60px Arial";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText((targetName[0] || "?").toUpperCase(), 237.5, 452.5);
      }

      const imgPath = path.join(CACHE_DIR, `toilet_${Date.now()}.png`);
      fs.writeFileSync(imgPath, canvas.toBuffer());

      const messages = [
        `🚽💩 ${targetName} এখন toilet এ বসে আছে! 😂`,
        `🚽 ${targetName} কে toilet এ পাঠিয়ে দেওয়া হয়েছে! 💩😹`,
        `💩 ${targetName} এর toilet break time! 🚽😂`,
        `🚽 ${targetName} এখন busy toilet এ! 💩🤣`
      ];

      api.unsendMessage(preparingMsg.messageID);

      api.sendMessage(
        {
          body: messages[Math.floor(Math.random() * messages.length)],
          attachment: fs.createReadStream(imgPath)
        },
        event.threadID,
        () => fs.unlink(imgPath, () => {}),
        event.messageID
      );

    } catch (err) {
      api.unsendMessage(preparingMsg.messageID);
      api.sendMessage(
        `❌ Toilet command failed:\n${err.message}`,
        event.threadID,
        event.messageID
      );
    }
  }
};
