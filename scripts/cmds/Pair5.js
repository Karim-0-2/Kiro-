const fs = require("fs");
const { createCanvas, loadImage } = require("canvas");

// --- Owners (always VIP) ---
const OWNER_UIDS = ["61557991443492", "61578418080601"];

const vipPath = __dirname + "/cache/vip.json";
if (!fs.existsSync(vipPath)) fs.writeFileSync(vipPath, JSON.stringify([]));

module.exports = {
  config: {
    name: "Pair5",
    aliases: ["love5"],
    version: "1.1",
    author: "Hasib",
    countDown: 5,
    role: 0,
    shortDescription: "Pair with BG5 (VIP only)",
    longDescription: "Finds a random partner in the group and pairs you with background 5. VIP/Owner only.",
    category: "vip-fun",
    guide: "{pn}"
  },

  onStart: async function ({ api, event, usersData }) {
    try {
      // --- Load VIP list ---
      const now = Date.now();
      let vipData = JSON.parse(fs.readFileSync(vipPath));

      // Clean expired VIPs
      vipData = vipData.filter(v => v.expire > now);
      fs.writeFileSync(vipPath, JSON.stringify(vipData, null, 2));

      const isOwner = OWNER_UIDS.includes(event.senderID);
      const isVip = vipData.some(v => v.uid === event.senderID);

      if (!isOwner && !isVip) {
        return api.sendMessage(
          "⛔ This command is VIP only.\nAsk an Owner/Admin to add you as VIP!",
          event.threadID,
          event.messageID
        );
      }

      // --- Pairing Logic ---
      const senderData = await usersData.get(event.senderID);
      const senderName = senderData.name;

      const threadData = await api.getThreadInfo(event.threadID);
      const users = threadData.userInfo;

      const myData = users.find(u => u.id === event.senderID);
      if (!myData || !myData.gender) {
        return api.sendMessage("⚠️ Could not determine your gender.", event.threadID, event.messageID);
      }

      const myGender = (myData.gender || "").toUpperCase();
      let matchCandidates = [];

      if (myGender === "MALE") {
        matchCandidates = users.filter(u => (u.gender || "").toUpperCase() === "FEMALE" && u.id !== event.senderID);
      } else if (myGender === "FEMALE") {
        matchCandidates = users.filter(u => (u.gender || "").toUpperCase() === "MALE" && u.id !== event.senderID);
      } else {
        return api.sendMessage("⚠️ Your gender is undefined. Cannot find a match.", event.threadID, event.messageID);
      }

      if (matchCandidates.length === 0) {
        return api.sendMessage("❌ No suitable match found in the group.", event.threadID, event.messageID);
      }

      const selectedMatch = matchCandidates[Math.floor(Math.random() * matchCandidates.length)];
      const matchName = selectedMatch.name;

      const width = 800, height = 400;
      const canvas = createCanvas(width, height);
      const ctx = canvas.getContext("2d");

      // Background 5
      const background = await loadImage("https://i.imgur.com/JfH6cAq.jpeg");
      ctx.drawImage(background, 0, 0, width, height);

      const senderPic = await loadImage(`https://graph.facebook.com/${event.senderID}/picture?width=720&height=720`);
      const matchPic = await loadImage(`https://graph.facebook.com/${selectedMatch.id}/picture?width=720&height=720`);

      function drawCircleImage(image, x, y, size) {
        ctx.save();
        ctx.beginPath();
        ctx.arc(x + size / 2, y + size / 2, size / 2, 0, Math.PI * 2, true);
        ctx.closePath();
        ctx.clip();
        ctx.drawImage(image, x, y, size, size);
        ctx.restore();
      }

      drawCircleImage(senderPic, 200, 100, 170);
      drawCircleImage(matchPic, 450, 100, 170);

      const lovePercent = Math.floor(Math.random() * 31) + 70;

      ctx.font = "30px Arial";
      ctx.fillStyle = "#fff";
      ctx.textAlign = "center";
      ctx.fillText(`${senderName} ❤️ ${matchName}`, width / 2, 320);
      ctx.fillText(`Love: ${lovePercent}%`, width / 2, 360);

      const buffer = canvas.toBuffer("image/png");
      const message = `🥰 Successful Pairing (BG5)
・${senderName} 🎀
・${matchName} 🎀
💌 Wish you happiness ❤️❤️
Love percentage: ${lovePercent}% 💙`;

      api.sendMessage({ body: message, attachment: buffer }, event.threadID, event.messageID);

    } catch (err) {
      console.error(err);
      api.sendMessage("❌ Error: " + err.message, event.threadID, event.messageID);
    }
  }
};
