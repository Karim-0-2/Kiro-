const { loadImage, createCanvas } = require("canvas");
const axios = require("axios");
const fs = require("fs-extra");
const path = require("path");

const vipPath = path.join(__dirname, "cache", "vip.json");
const OWNER_UIDS = ["61557991443492", "61578418080601"];

// --- Helper: VIP check ---
function isVip(userID) {
  if (OWNER_UIDS.includes(userID)) return true;
  if (!fs.existsSync(vipPath)) return false;
  const data = JSON.parse(fs.readFileSync(vipPath, "utf8"));
  const now = Date.now();
  return data.some(u => u.uid === userID && u.expire > now);
}

module.exports = {
  config: {
    name: "pair14",
    author: "xemon + ChatGPT",
    role: 0,
    shortDescription: "Random pairing with love percentage (VIP Only)",
    category: "fun",
    guide: "{pn}"
  },

  onStart: async function ({ api, event, usersData }) {
    const senderID = event.senderID;

    // VIP check
    if (!isVip(senderID)) {
      const msg = await api.sendMessage("⛔ This command is only for VIP users (or Owners).", event.threadID, event.messageID);
      setTimeout(() => api.unsendMessage(msg.messageID).catch(() => {}), 10000);
      return;
    }

    try {
      const tmpDir = path.join(__dirname, "tmp");
      await fs.ensureDir(tmpDir);

      const pathImg = path.join(tmpDir, "background.png");
      const pathAvt1 = path.join(tmpDir, "avt1.png");
      const pathAvt2 = path.join(tmpDir, "avt2.png");

      // User 1 info
      const id1 = senderID;
      const name1 = await usersData.getName(id1);

      // Thread info
      const threadInfo = await api.getThreadInfo(event.threadID);
      const allUsers = threadInfo.userInfo;
      const botID = api.getCurrentUserID();

      // Determine partner: reply > mention > random
      let id2 = Object.keys(event.mentions || {})[0];
      if (!id2 && event.type === "message_reply" && event.messageReply.senderID !== senderID) {
        id2 = event.messageReply.senderID;
      }
      if (!id2) {
        let gender1 = allUsers.find(u => u.id === id1)?.gender;
        let candidates = allUsers.filter(u => u.id !== id1 && u.id !== botID);
        if (gender1 === "MALE") candidates = candidates.filter(u => u.gender === "FEMALE");
        else if (gender1 === "FEMALE") candidates = candidates.filter(u => u.gender === "MALE");

        if (!candidates.length) return api.sendMessage("❌ No suitable partner found in this group!", event.threadID, event.messageID);
        id2 = candidates[Math.floor(Math.random() * candidates.length)].id;
      }

      const name2 = await usersData.getName(id2);

      // Random love percentage
      const randomPercent = Math.floor(Math.random() * 100) + 1;
      const specialPercents = ["0", "-1", "99.99", "-99", "-100", "101", "0.01"];
      const chance = [randomPercent, randomPercent, randomPercent, randomPercent, randomPercent, specialPercents[Math.floor(Math.random() * specialPercents.length)]];
      const finalPercent = chance[Math.floor(Math.random() * chance.length)];

      // Download avatars
      const avt1 = (await axios.get(`https://graph.facebook.com/${id1}/picture?width=720&height=720&access_token=6628568379%7Cc1e620fa708a1d5696fb991c1bde5662`, { responseType: "arraybuffer" })).data;
      fs.writeFileSync(pathAvt1, Buffer.from(avt1, "utf-8"));
      const avt2 = (await axios.get(`https://graph.facebook.com/${id2}/picture?width=720&height=720&access_token=6628568379%7Cc1e620fa708a1d5696fb991c1bde5662`, { responseType: "arraybuffer" })).data;
      fs.writeFileSync(pathAvt2, Buffer.from(avt2, "utf-8"));

      // Download background
      const backgroundUrl = "https://i.postimg.cc/5tXRQ46D/background3.png";
      const bg = (await axios.get(backgroundUrl, { responseType: "arraybuffer" })).data;
      fs.writeFileSync(pathImg, Buffer.from(bg, "utf-8"));

      // Draw
      const baseImage = await loadImage(pathImg);
      const baseAvt1 = await loadImage(pathAvt1);
      const baseAvt2 = await loadImage(pathAvt2);
      const canvas = createCanvas(baseImage.width, baseImage.height);
      const ctx = canvas.getContext("2d");

      ctx.drawImage(baseImage, 0, 0, canvas.width, canvas.height);
      ctx.drawImage(baseAvt1, 100, 150, 300, 300);
      ctx.drawImage(baseAvt2, 900, 150, 300, 300);

      const imageBuffer = canvas.toBuffer();
      fs.writeFileSync(pathImg, imageBuffer);
      fs.removeSync(pathAvt1);
      fs.removeSync(pathAvt2);

      return api.sendMessage(
        {
          body: `『💗』Congratulations ${name1} 💗\n『❤️』Looks like destiny brought you together with ${name2} ❤️\n『🔗』Your love percentage is ${finalPercent}% 🔗`,
          mentions: [{ tag: name2, id: id2 }],
          attachment: fs.createReadStream(pathImg),
        },
        event.threadID,
        () => fs.unlinkSync(pathImg),
        event.messageID
      );

    } catch (err) {
      console.error(err);
      return api.sendMessage("❌ An error occurred, please try again!", event.threadID, event.messageID);
    }
  }
};
