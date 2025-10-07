const axios = require("axios");
const { createCanvas, loadImage } = require("canvas");
const fs = require("fs");
const path = require("path");

const baseUrl = "https://raw.githubusercontent.com/Saim12678/Saim69/1a8068d7d28396dbecff28f422cb8bc9bf62d85f/font";

module.exports = {
  name: "pair2",
  aliases: ["lovepair2", "match2"],
  category: "love",
  description: "💞 Generate a love match with avatars",
  
  async execute({ api, event, usersData }) {
    try {
      // Get sender data
      const senderData = await usersData.get(event.senderID);
      let senderName = senderData.name;

      // Get thread members
      const threadData = await api.getThreadInfo(event.threadID);
      const users = threadData.userInfo;

      const myData = users.find(user => user.id === event.senderID);
      if (!myData || !myData.gender) {
        return api.sendMessage("⚠️ Could not determine your gender.", event.threadID);
      }

      const myGender = myData.gender.toUpperCase();
      let matchCandidates = [];

      if (myGender === "MALE") {
        matchCandidates = users.filter(user => user.gender === "FEMALE" && user.id !== event.senderID);
      } else if (myGender === "FEMALE") {
        matchCandidates = users.filter(user => user.gender === "MALE" && user.id !== event.senderID);
      } else {
        return api.sendMessage("⚠️ Your gender is undefined. Cannot find a match.", event.threadID);
      }

      if (matchCandidates.length === 0) {
        return api.sendMessage("❌ No suitable match found in the group.", event.threadID);
      }

      const selectedMatch = matchCandidates[Math.floor(Math.random() * matchCandidates.length)];
      let matchName = selectedMatch.name;

      // Load font map
      let fontMap = {};
      try {
        const { data } = await axios.get(`${baseUrl}/21.json`);
        fontMap = data;
      } catch (e) {
        console.error("Font load error:", e.message);
      }

      const convertFont = (text) =>
        text.split("").map(ch => fontMap[ch] || ch).join("");

      senderName = convertFont(senderName);
      matchName = convertFont(matchName);

      // Canvas setup
      const width = 735, height = 411;
      const canvas = createCanvas(width, height);
      const ctx = canvas.getContext("2d");

      const background = await loadImage("https://files.catbox.moe/4l3pgh.jpg");
      ctx.drawImage(background, 0, 0, width, height);

      // Load avatars
      const sIdImage = await loadImage(
        `https://graph.facebook.com/${event.senderID}/picture?width=720&height=720&access_token=6628568379%7Cc1e620fa708a1d5696fb991c1bde5662`
      );
      const pairPersonImage = await loadImage(
        `https://graph.facebook.com/${selectedMatch.id}/picture?width=720&height=720&access_token=6628568379%7Cc1e620fa708a1d5696fb991c1bde5662`
      );

      const avatarPositions = {
        sender: { x: 64, y: 111, size: 123 },
        partner: { x: width - 499, y: 111, size: 123 },
      };

      function drawCircle(ctx, img, x, y, size) {
        ctx.save();
        ctx.beginPath();
        ctx.arc(x + size / 2, y + size / 2, size / 2, 0, Math.PI * 2);
        ctx.closePath();
        ctx.clip();
        ctx.drawImage(img, x, y, size, size);
        ctx.restore();
      }

      drawCircle(ctx, sIdImage, avatarPositions.sender.x, avatarPositions.sender.y, avatarPositions.sender.size);
      drawCircle(ctx, pairPersonImage, avatarPositions.partner.x, avatarPositions.partner.y, avatarPositions.partner.size);

      // Save image
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
          () => fs.unlinkSync(outputPath)
        );
      });

    } catch (error) {
      api.sendMessage("❌ An error occurred: " + error.message, event.threadID);
    }
  }
};
