const axios = require("axios");
const fs = require("fs-extra");
const { loadImage, createCanvas } = require("canvas");
const path = require("path");

const VIP_PATH = path.join(__dirname, "cache", "vip.json");
const OWNERS = ["61578418080601", "61557991443492"];
const ADMINS = ["100060606189407", "61576296543095", "61554678316179", "100091527859576"];

module.exports = {
  config: {
    name: "pair",
    countDown: 10,
    role: 2,
    shortDescription: { en: "Get to know your partner" },
    longDescription: { en: "Know your destiny and see who completes your life" },
    category: "love",
    guide: { en: "{pn}" },
  },

  onStart: async function ({ api, event, usersData, threadsData, message }) {
    // --- Load VIP data ---
    if (!fs.existsSync(VIP_PATH)) fs.writeFileSync(VIP_PATH, JSON.stringify([]));
    const vipData = JSON.parse(fs.readFileSync(VIP_PATH));
    const sender = String(event.senderID);

    const senderIsOwner = OWNERS.includes(sender);
    const senderIsAdmin = ADMINS.includes(sender);
    const senderIsVIP = vipData.some(u => u.uid === sender);

    // --- VIP access check ---
    if (!senderIsOwner && !senderIsVIP) {
      if (senderIsAdmin) {
        return message.reply("⚠️ Admins must be VIP to use this command!");
      } else {
        return message.reply("❌ Sorry, you need to be a VIP to use this feature!");
      }
    }

    const ThreadInfo = await api.getThreadInfo(event.threadID);
    const all = ThreadInfo.userInfo;
    const botID = api.getCurrentUserID();

    // --- Determine sender gender ---
    const senderInfo = all.find(u => u.id === sender);
    const gender1 = senderInfo?.gender;

    // --- Filter potential partners ---
    let partners = all.filter(u => u.id !== sender && u.id !== botID);
    if (gender1 === "FEMALE") partners = partners.filter(u => u.gender === "MALE");
    else if (gender1 === "MALE") partners = partners.filter(u => u.gender === "FEMALE");

    if (!partners.length) return message.reply("❌ No suitable partner found in this thread!");

    const partner = partners[Math.floor(Math.random() * partners.length)];
    const name1 = await usersData.getName(sender);
    const name2 = await usersData.getName(partner.id);

    // --- Generate love percentage ---
    const rd1 = Math.floor(Math.random() * 100) + 1;
    const cc = ["0", "-1", "99,99", "-99", "-100", "101", "0,01"];
    const rd2 = cc[Math.floor(Math.random() * cc.length)];
    const djtme = [rd1, rd1, rd1, rd1, rd1, rd2, rd1, rd1, rd1, rd1];
    const tile = djtme[Math.floor(Math.random() * djtme.length)];

    // --- Load avatars and background ---
    const pathImg = path.join(__dirname, "assets/background.png");
    const pathAvt1 = path.join(__dirname, "assets/avatar1.png");
    const pathAvt2 = path.join(__dirname, "assets/avatar2.png");

    const getAvt1 = (await axios.get(
      `https://graph.facebook.com/${sender}/picture?width=720&height=720&access_token=6628568379%7Cc1e620fa708a1d5696fb991c1bde5662`,
      { responseType: "arraybuffer" }
    )).data;
    fs.writeFileSync(pathAvt1, Buffer.from(getAvt1));

    const getAvt2 = (await axios.get(
      `https://graph.facebook.com/${partner.id}/picture?width=720&height=720&access_token=6628568379%7Cc1e620fa708a1d5696fb991c1bde5662`,
      { responseType: "arraybuffer" }
    )).data;
    fs.writeFileSync(pathAvt2, Buffer.from(getAvt2));

    const baseImage = await loadImage(pathImg);
    const baseAvt1 = await loadImage(pathAvt1);
    const baseAvt2 = await loadImage(pathAvt2);

    const canvas = createCanvas(baseImage.width, baseImage.height);
    const ctx = canvas.getContext("2d");

    ctx.drawImage(baseImage, 0, 0, canvas.width, canvas.height);
    ctx.drawImage(baseAvt1, 111, 175, 330, 330);
    ctx.drawImage(baseAvt2, 1018, 173, 330, 330);

    const imageBuffer = canvas.toBuffer();
    fs.writeFileSync(pathImg, imageBuffer);
    fs.removeSync(pathAvt1);
    fs.removeSync(pathAvt2);

    // --- Send final message ---
    return api.sendMessage({
      body: senderIsOwner
        ? `👑 My Lord, congratulations ${name1}! ❤️ You are matched with ${name2}. 💖 Your love percentage is ${tile}%`
        : `💗 Congratulations ${name1}! ❤️ You are matched with ${name2}. 🔗 Your love percentage is ${tile}%`,
      mentions: [
        { tag: name1, id: sender },
        { tag: name2, id: partner.id },
      ],
      attachment: fs.createReadStream(pathImg),
    }, event.threadID, () => fs.unlinkSync(pathImg), event.messageID);
  },
};
