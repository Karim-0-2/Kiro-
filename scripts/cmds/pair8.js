const { loadImage, createCanvas } = require("canvas");
const axios = require("axios");
const fs = require("fs-extra");
const path = require("path");

module.exports = {
  config: {
    name: "pair8",
    version: "3.0",
    author: "Hasib",
    countDown: 5,
    role: 0,
    shortDescription: "Make a sweet couple pair",
    longDescription: "Create a pair image of two users (tagged or random).",
    category: "fun",
    guide: {
      en: "{p}pair @tag1 @tag2\n{p}pair @tag\n{p}pair"
    }
  },

  onStart: async function ({ message, event, usersData, api }) {
    try {
      let { threadID, senderID, mentions } = event;
      let mentionIDs = Object.keys(mentions);

      let id1 = senderID, id2;

      if (mentionIDs.length >= 2) {
        id1 = mentionIDs[0];
        id2 = mentionIDs[1];
      } else if (mentionIDs.length === 1) {
        id2 = mentionIDs[0];
      } else {
        // Random partner if no mention
        const threadInfo = await api.getThreadInfo(threadID);
        const members = threadInfo.participantIDs.filter(id => id !== senderID);
        if (members.length === 0) return message.reply("⚠️ No partner found!");
        id2 = members[Math.floor(Math.random() * members.length)];
      }

      // === Template image ===
      const bgPath = path.join(__dirname, "cache", "pair_template.png");
      if (!fs.existsSync(bgPath)) {
        const url = "https://i.ibb.co/fXZPfPc/IMG-20230924-161320.jpg"; // template you gave
        const bgRes = await axios.get(url, { responseType: "arraybuffer" });
        fs.writeFileSync(bgPath, Buffer.from(bgRes.data, "binary"));
      }

      const bg = await loadImage(bgPath);

      // === Fetch avatars ===
      const getAvatar = async (id) => {
        const url = `https://graph.facebook.com/${id}/picture?width=512&height=512&access_token=6628568379%7Cc1e620fa708a1d5696fb991c1bde5662`;
        const res = await axios.get(url, { responseType: "arraybuffer" });
        return await loadImage(res.data);
      };

      const av1 = await getAvatar(id1);
      const av2 = await getAvatar(id2);

      // === Canvas ===
      const canvas = createCanvas(bg.width, bg.height);
      const ctx = canvas.getContext("2d");
      ctx.drawImage(bg, 0, 0, canvas.width, canvas.height);

      // === Circle function ===
      const drawCircleImage = (ctx, img, x, y, size) => {
        ctx.save();
        ctx.beginPath();
        ctx.arc(x + size / 2, y + size / 2, size / 2, 0, Math.PI * 2, true);
        ctx.closePath();
        ctx.clip();
        ctx.drawImage(img, x, y, size, size);
        ctx.restore();
      };

      // === Avatar positions (adjusted for your template) ===
      drawCircleImage(ctx, av1, 85, 95, 220);   // left circle
      drawCircleImage(ctx, av2, 835, 300, 220); // right circle

      // === Save output ===
      const outPath = path.join(__dirname, "cache", `pair_${Date.now()}.png`);
      fs.writeFileSync(outPath, canvas.toBuffer());

      // === Names for caption ===
      const name1 = await usersData.getName(id1);
      const name2 = await usersData.getName(id2);

      message.reply({
        body: `💞 Sweet Couple 💞\n❤️ ${name1} + ${name2} ❤️`,
        attachment: fs.createReadStream(outPath)
      }, () => fs.unlinkSync(outPath));

    } catch (e) {
      console.error(e);
      message.reply("❌ Error while creating pair image.");
    }
  }
};
