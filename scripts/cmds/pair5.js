const axios = require("axios");
const { createCanvas, loadImage } = require("canvas");
const fs = require("fs");
const path = require("path");

// --- VIP system paths ---
const vipPath = path.join(__dirname, "cache", "vip.json");

// --- Owners (fixed) ---
const OWNER_UIDS = ["61557991443492", "61578418080601"];

// --- Helper: get VIP data ---
function getVipData() {
  if (!fs.existsSync(vipPath)) return [];
  try {
    return JSON.parse(fs.readFileSync(vipPath, "utf8"));
  } catch {
    return [];
  }
}

module.exports = {
  config: {
    name: "pair5",
    description: "Find your match in the group chat (VIP only)",
    usage: "pair",
    category: "love",
    author: "Hasib",
  },

  run: async ({ api, event, args, Users }) => {
    try {
      const senderID = event.senderID;

      // --- VIP / Owner check ---
      let allowed = false;
      if (OWNER_UIDS.includes(senderID)) allowed = true; // Owners always allowed
      else {
        const data = getVipData();
        const now = Date.now();
        const userVip = data.find(u => u.uid === senderID && u.expire > now);
        if (userVip) allowed = true;
      }

      if (!allowed) {
        const msg = await api.sendMessage("⛔ This command is only for VIP users (or Owners).", event.threadID);
        setTimeout(() => api.unsendMessage(msg.messageID).catch(() => {}), 10000);
        return;
      }

      // --- Original pairing logic ---
      const senderData = await Users.getData(event.senderID);
      const senderName = senderData.name || "Someone";

      const threadInfo = await api.getThreadInfo(event.threadID);
      const users = threadInfo.userInfo;

      const myData = users.find((u) => u.id === event.senderID);
      if (!myData || !myData.gender) {
        return api.sendMessage("⚠️ Could not determine your gender.", event.threadID);
      }

      const myGender = myData.gender.toUpperCase();
      let matchCandidates = [];

      if (myGender === "MALE") matchCandidates = users.filter(u => u.gender === "FEMALE" && u.id !== event.senderID);
      else if (myGender === "FEMALE") matchCandidates = users.filter(u => u.gender === "MALE" && u.id !== event.senderID);
      else return api.sendMessage("⚠️ Your gender is undefined. Cannot find a match.", event.threadID);

      if (matchCandidates.length === 0) return api.sendMessage("❌ No suitable match found in the group.", event.threadID);

      const selectedMatch = matchCandidates[Math.floor(Math.random() * matchCandidates.length)];
      const matchName = selectedMatch.name;

      // --- Canvas ---
      const width = 800;
      const height = 400;
      const canvas = createCanvas(width, height);
      const ctx = canvas.getContext("2d");

      const background = await loadImage("https://files.catbox.moe/29jl5s.jpg");
      ctx.drawImage(background, 0, 0, width, height);

      const sIdImage = await loadImage(`https://graph.facebook.com/${event.senderID}/picture?width=720&height=720&access_token=6628568379%7Cc1e620fa708a1d5696fb991c1bde5662`);
      const pairImage = await loadImage(`https://graph.facebook.com/${selectedMatch.id}/picture?width=720&height=720&access_token=6628568379%7Cc1e620fa708a1d5696fb991c1bde5662`);

      function drawCircle(ctx, img, x, y, size) {
        ctx.save();
        ctx.beginPath();
        ctx.arc(x + size / 2, y + size / 2, size / 2, 0, Math.PI * 2);
        ctx.closePath();
        ctx.clip();
        ctx.drawImage(img, x, y, size, size);
        ctx.restore();
      }

      drawCircle(ctx, sIdImage, 385, 40, 170);
      drawCircle(ctx, pairImage, width - 213, 190, 170);

      // --- Save image and send ---
      const outputPath = path.join(__dirname, `pair_${event.senderID}.png`);
      const out = fs.createWriteStream(outputPath);
      const stream = canvas.createPNGStream();
      stream.pipe(out);

      out.on("finish", () => {
        const lovePercent = Math.floor(Math.random() * 31) + 70;
        const message = `🥰𝗦𝘂𝗰𝗰𝗲𝘀𝘀𝗳𝘂𝗹 𝗽𝗮𝗶𝗿𝗶𝗻𝗴
・${senderName} 🎀
・${matchName} 🎀
💌 𝗪𝗶𝘀𝗵 𝘆𝗼𝘂 𝘁𝘄𝗼 𝗵𝘂𝗻𝗱𝗿𝗲𝗱 𝘆𝗲𝗮𝗿𝘀 𝗼𝗳 𝗵𝗮𝗽𝗽𝗶𝗻𝗲𝘀𝘀 ❤️❤️
𝗟𝗼𝘃𝗲 𝗣𝗲𝗿𝗰𝗲𝗻𝘁𝗮𝗴𝗲: ${lovePercent}% 💙`;

        api.sendMessage({ body: message, attachment: fs.createReadStream(outputPath) }, event.threadID, () => fs.unlinkSync(outputPath));
      });
    } catch (err) {
      api.sendMessage(`❌ An error occurred: ${err.message}`, event.threadID);
    }
  },
};
