const axios = require("axios");
const { createCanvas, loadImage } = require("canvas");
const fs = require("fs");
const path = require("path");

const baseUrl = "https://raw.githubusercontent.com/Saim12678/Saim69/1a8068d7d28396dbecff28f422cb8bc9bf62d85f/font";

const backgrounds = [
  "https://files.catbox.moe/4l3pgh.jpg",
  "https://i.ibb.co/RBRLmRt/Pics-Art-05-14-10-47-00.jpg",
  "https://i.postimg.cc/wjJ29HRB/background1.png",
  "https://i.postimg.cc/zf4Pnshv/background2.png"
];

module.exports = {
  config: {
    name: "pair6",
    aliases: ["lovepair6", "match2"],
    author: "Hasib",
    version: "1.1",
    role: 0,
    category: "love",
    shortDescription: { en: "💞 Generate a love match with avatars" },
    longDescription: { en: "Calculates a love match between you and a group member with avatars, background, stylish font, and love percentage." },
    guide: { en: "{p}{n} — Use this command in a group to find a love match" }
  },

  onStart: async function ({ api, event, usersData }) {
    try {
      const senderData = await usersData.get(event.senderID);
      let senderName = senderData.name;

      // Get thread users
      const threadData = await api.getThreadInfo(event.threadID);
      const users = threadData.userInfo;

      const myData = users.find(user => user.id === event.senderID);
      if (!myData || !myData.gender) {
        return api.sendMessage("⚠️ Could not determine your gender.", event.threadID, event.messageID);
      }

      const myGender = myData.gender.toUpperCase();
      let matchCandidates = [];

      if (myGender === "MALE") {
        matchCandidates = users.filter(u => u.gender === "FEMALE" && u.id !== event.senderID);
      } else if (myGender === "FEMALE") {
        matchCandidates = users.filter(u => u.gender === "MALE" && u.id !== event.senderID);
      } else {
        return api.sendMessage("⚠️ Your gender is undefined. Cannot find a match.", event.threadID, event.messageID);
      }

      if (!matchCandidates.length) {
        return api.sendMessage("❌ No suitable match found in the group.", event.threadID, event.messageID);
      }

      const selectedMatch = matchCandidates[Math.floor(Math.random() * matchCandidates.length)];
      let matchName = selectedMatch.name;

      // Load font mapping
      let fontMap = {};
      try {
        const { data } = await axios.get(`${baseUrl}/21.json`);
        fontMap = data;
      } catch (err) {
        console.error("Font load error:", err.message);
      }

      const convertFont = text => text.split("").map(ch => fontMap[ch] || ch).join("");
      senderName = convertFont(senderName);
      matchName = convertFont(matchName);

      // Create canvas
      const width = 735, height = 411;
      const canvas = createCanvas(width, height);
      const ctx = canvas.getContext("2d");

      // Random background
      const bgUrl = backgrounds[Math.floor(Math.random() * backgrounds.length)];
      const background = await loadImage(bgUrl);
      ctx.drawImage(background, 0, 0, width, height);

      // Load avatars
      const sIdImage = await loadImage(`https://graph.facebook.com/${event.senderID}/picture?width=720&height=720&access_token=6628568379%7Cc1e620fa708a1d5696fb991c1bde5662`);
      const pairPersonImage = await loadImage(`https://graph.facebook.com/${selectedMatch.id}/picture?width=720&height=720&access_token=6628568379%7Cc1e620fa708a1d5696fb991c1bde5662`);

      // Draw circular avatars
      const drawCircle = (ctx, img, x, y, size) => {
        ctx.save();
        ctx.beginPath();
        ctx.arc(x + size/2, y + size/2, size/2, 0, Math.PI * 2);
        ctx.closePath();
        ctx.clip();
        ctx.drawImage(img, x, y, size, size);
        ctx.restore();
      };

      drawCircle(ctx, sIdImage, 64, 111, 123);
      drawCircle(ctx, pairPersonImage, width - 499, 111, 123);

      // Save output
      const outputPath = path.join(__dirname, "pair_output.png");
      const out = fs.createWriteStream(outputPath);
      const stream = canvas.createPNGStream();
      stream.pipe(out);

      out.on("finish", () => {
        const lovePercent = Math.floor(Math.random() * 31) + 70;
        const message = `💞 𝗠𝗮𝘁𝗰𝗵𝗺𝗮𝗸𝗶𝗻𝗴 𝗖𝗼𝗺𝗽𝗹𝗲𝘁𝗲 💞

🎀  ${senderName} ✨️
🎀  ${matchName} ✨️

🕊️ Destiny has written your names together 🌹 May your bond last forever ✨️  

💘 Compatibility: ${lovePercent}% 💘`;

        api.sendMessage(
          { body: message, attachment: fs.createReadStream(outputPath) },
          event.threadID,
          () => fs.unlinkSync(outputPath),
          event.messageID
        );
      });

    } catch (error) {
      api.sendMessage("❌ An error occurred: " + error.message, event.threadID, event.messageID);
    }
  }
};
