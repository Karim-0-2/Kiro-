const { loadImage, createCanvas } = require("canvas");
const axios = require("axios");
const fs = require("fs-extra");
const path = require("path");

const VIP_PATH = path.join(__dirname, "cache", "vip.json");
const OWNER_UID = "61557991443492";

module.exports = {
  config: {
    name: "pair2",
    author: "Hasib",
    role: 0,
    shortDescription: "Love pairing (VIP only, Owner exempt)",
    longDescription: "",
    category: "love",
    guide: "{pn} | reply to someone's message"
  },

  onStart: async function ({ api, event, usersData }) {
    // --- Load VIPs ---
    if (!fs.existsSync(VIP_PATH)) fs.writeFileSync(VIP_PATH, JSON.stringify([]));
    let vipData = JSON.parse(fs.readFileSync(VIP_PATH));
    const now = Date.now();
    vipData = vipData.filter(u => u.expire > now);
    fs.writeFileSync(VIP_PATH, JSON.stringify(vipData, null, 2));

    const sender = String(event.senderID);
    const isOwner = sender === OWNER_UID;
    const isVIP = vipData.some(u => u.uid === sender && u.expire > now);

    if (!isVIP && !isOwner) {
      return api.sendMessage("❌ You are not a VIP! Ask an Owner/Admin to add you.", event.threadID);
    }

    let id1 = sender;
    let id2;

    // --- Reply handling ---
    if (event.messageReply) {
      id2 = event.messageReply.senderID;
    } else {
      // Get thread info to select random partner
      const ThreadInfo = await api.getThreadInfo(event.threadID);
      const botID = api.getCurrentUserID();
      const all = ThreadInfo.userInfo.filter(u => u.id !== id1 && u.id !== botID);
      if (all.length === 0) return api.sendMessage("❌ No partner found.", event.threadID);
      const partner = all[Math.floor(Math.random() * all.length)];
      id2 = partner.id;
    }

    const name1 = await usersData.getName(id1);
    const name2 = await usersData.getName(id2);

    // --- Percentage calculation ---
    const rd1 = Math.floor(Math.random() * 100) + 1;
    const specialCases = ["0", "-1", "99.99", "-99", "-100", "101", "0.01"];
    const tileArray = [rd1, rd1, rd1, rd1, rd1, specialCases[Math.floor(Math.random() * specialCases.length)], rd1, rd1, rd1, rd1];
    const tile = tileArray[Math.floor(Math.random() * tileArray.length)];

    // --- Background ---
    const backgrounds = [
      "https://i.postimg.cc/wjJ29HRB/background1.png",
      "https://i.postimg.cc/zf4Pnshv/background2.png",
      "https://i.postimg.cc/5tXRQ46D/background3.png",
    ];
    const backgroundURL = backgrounds[Math.floor(Math.random() * backgrounds.length)];

    const pathImg = path.join(__dirname, "tmp", `${Date.now()}_pair.png`);
    const pathAvt1 = path.join(__dirname, "tmp", "Avt1.png");
    const pathAvt2 = path.join(__dirname, "tmp", "Avt2.png");

    try {
      // Download avatars
      const avt1 = (await axios.get(`https://graph.facebook.com/${id1}/picture?width=720&height=720&access_token=6628568379|c1e620fa708a1d5696fb991c1bde5662`, { responseType: "arraybuffer" })).data;
      fs.writeFileSync(pathAvt1, Buffer.from(avt1, "binary"));

      const avt2 = (await axios.get(`https://graph.facebook.com/${id2}/picture?width=720&height=720&access_token=6628568379|c1e620fa708a1d5696fb991c1bde5662`, { responseType: "arraybuffer" })).data;
      fs.writeFileSync(pathAvt2, Buffer.from(avt2, "binary"));

      // Download background
      const bg = (await axios.get(backgroundURL, { responseType: "arraybuffer" })).data;
      fs.writeFileSync(pathImg, Buffer.from(bg, "binary"));

      // Draw canvas
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

      // --- Special Owner Replies ---
      const ownerReplies = [
        `${name2}, you are so lucky! My Lord paired with you 💌`,
        `Wow ${name2}! My Lord chose you as their partner 😍`,
        `Blessed day! ${name2}, My Lord paired with you 💖`,
        `${name2}, feel honored! My Lord is with you today 💘`,
        `Lucky you ${name2}! My Lord paired with you 💞`
      ];

      const messageBody = isOwner ? ownerReplies[Math.floor(Math.random() * ownerReplies.length)] : `🥰 Successful pairing! ${name1} 💕${name2} — The odds are ${tile}%`;

      return api.sendMessage({
        body: messageBody,
        mentions: [
          { id: id1, tag: name1 },
          { id: id2, tag: name2 }
        ],
        attachment: fs.createReadStream(pathImg)
      }, event.threadID, () => fs.unlinkSync(pathImg));

    } catch (err) {
      console.error(err);
      return api.sendMessage("❌ Error generating pair image.", event.threadID);
    } finally {
      fs.removeSync(pathAvt1);
      fs.removeSync(pathAvt2);
    }
  }
};
