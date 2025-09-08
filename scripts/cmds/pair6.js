const { loadImage, createCanvas } = require("canvas");
const axios = require("axios");
const fs = require("fs-extra");
const path = require("path");

const VIP_PATH = path.join(__dirname, "cache", "vip.json");
const OWNER_UID = "61557991443492";

module.exports = {
  config: {
    name: "pair6",
    author: "Hasib",
    role: 0,
    shortDescription: "Generate love card with avatars",
    category: "love",
    guide: "{pn} | reply to someone's message"
  },

  onStart: async function({ api, event, usersData }) {
    if (!fs.existsSync(VIP_PATH)) fs.writeFileSync(VIP_PATH, JSON.stringify([]));
    let vipData = JSON.parse(fs.readFileSync(VIP_PATH));
    const now = Date.now();
    vipData = vipData.filter(u => u.expire > now);

    const sender = String(event.senderID);
    const isOwner = sender === OWNER_UID;
    const isVIP = vipData.some(u => u.uid === sender && u.expire > now);
    if (!isVIP && !isOwner) return api.sendMessage("❌ VIP only!", event.threadID);

    let id2;
    if (event.messageReply) id2 = event.messageReply.senderID;
    else {
      const ThreadInfo = await api.getThreadInfo(event.threadID);
      const botID = api.getCurrentUserID();
      const members = ThreadInfo.userInfo.filter(u => u.id !== sender && u.id !== botID);
      if (!members.length) return api.sendMessage("❌ No partner found!", event.threadID);
      id2 = members[Math.floor(Math.random() * members.length)].id;
    }

    const name1 = await usersData.getName(sender);
    const name2 = await usersData.getName(id2);
    const tile = Math.floor(Math.random() * 101);

    const pathImg = path.join(__dirname, "tmp", `${Date.now()}_pair.png`);
    const pathAvt1 = path.join(__dirname, "tmp", "Avt1.png");
    const pathAvt2 = path.join(__dirname, "tmp", "Avt2.png");
    const bgURL = "https://i.postimg.cc/wjJ29HRB/background1.png";

    try {
      const avt1 = (await axios.get(`https://graph.facebook.com/${sender}/picture?width=720&height=720&access_token=6628568379|c1e620fa708a1d5696fb991c1bde5662`, { responseType: "arraybuffer" })).data;
      fs.writeFileSync(pathAvt1, Buffer.from(avt1, "binary"));
      const avt2 = (await axios.get(`https://graph.facebook.com/${id2}/picture?width=720&height=720&access_token=6628568379|c1e620fa708a1d5696fb991c1bde5662`, { responseType: "arraybuffer" })).data;
      fs.writeFileSync(pathAvt2, Buffer.from(avt2, "binary"));
      const bg = (await axios.get(bgURL, { responseType: "arraybuffer" })).data;
      fs.writeFileSync(pathImg, Buffer.from(bg, "binary"));

      const baseImage = await loadImage(pathImg);
      const baseAvt1 = await loadImage(pathAvt1);
      const baseAvt2 = await loadImage(pathAvt2);
      const canvas = createCanvas(baseImage.width, baseImage.height);
      const ctx = canvas.getContext("2d");

      ctx.drawImage(baseImage, 0, 0, canvas.width, canvas.height);

      // Draw circle avatars
      [ {avt: baseAvt1, x:100,y:150}, {avt: baseAvt2, x:900,y:150} ].forEach(({avt,x,y}) => {
        ctx.save();
        ctx.beginPath();
        ctx.arc(x+150, y+150, 150, 0, Math.PI*2);
        ctx.closePath();
        ctx.clip();
        ctx.drawImage(avt, x, y, 300, 300);
        ctx.restore();
      });

      fs.writeFileSync(pathImg, canvas.toBuffer());

      const messageBody = isOwner
        ? `👑 My Lord, ${name2} is paired with you 💌 — Love chance: ${tile}%`
        : `🥰 ${name1} 💕 ${name2} — Love chance: ${tile}%`;

      return api.sendMessage({
        body: messageBody,
        mentions: [ {id: sender, tag: name1}, {id: id2, tag: name2} ],
        attachment: fs.createReadStream(pathImg)
      }, event.threadID, () => fs.unlinkSync(pathImg));

    } catch(e) {
      console.error(e);
      return api.sendMessage("❌ Error generating pair card!", event.threadID);
    } finally {
      fs.removeSync(pathAvt1);
      fs.removeSync(pathAvt2);
    }
  }
};
