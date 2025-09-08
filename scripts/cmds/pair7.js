const axios = require("axios");
const fs = require("fs-extra");
const { loadImage, createCanvas } = require("canvas");
const path = require("path");

const OWNER_UID = "61557991443492"; // Owner UID
const ADMINS = ["100060606189407", "61576296543095", "61554678316179", "100091527859576"];
const VIP_PATH = path.join(__dirname, "/cache/vip.json");

module.exports = {
  config: {
    name: "pair7",
    countDown: 10,
    role: 0,
    shortDescription: { en: "Get to know your partner" },
    longDescription: { en: "Know your destiny and see who completes your life" },
    category: "love",
    guide: { en: "{pn}" }
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

    if (!isOwner && !isVIP) {
      return api.sendMessage("❌ You must be a VIP to use this command!", event.threadID, event.messageID);
    }

    // --- Paths ---
    const pathImg = path.join(__dirname, "cache", "background.png");
    const pathAvt1 = path.join(__dirname, "cache", "any.png");
    const pathAvt2 = path.join(__dirname, "cache", "avatar.png");

    const id1 = sender;
    const name1 = await usersData.getName(id1);

    // get thread users
    const ThreadInfo = await api.getThreadInfo(event.threadID);
    const all = ThreadInfo.userInfo;
    const botID = api.getCurrentUserID();

    // detect gender
    let gender1 = all.find(u => u.id === id1)?.gender || "UNKNOWN";

    // pick candidates based on gender
    let candidates = [];
    if (gender1 === "FEMALE") candidates = all.filter(u => u.gender === "MALE" && u.id !== id1 && u.id !== botID);
    else if (gender1 === "MALE") candidates = all.filter(u => u.gender === "FEMALE" && u.id !== id1 && u.id !== botID);
    else candidates = all.filter(u => u.id !== id1 && u.id !== botID);

    if (candidates.length === 0) return api.sendMessage("❌ No partner found in this group.", event.threadID, event.messageID);

    const partner = candidates[Math.floor(Math.random() * candidates.length)];
    const id2 = partner.id;
    const name2 = await usersData.getName(id2);

    // percentage
    const randomPercent = Math.floor(Math.random() * 101);
    const specialCases = ["-100", "-99", "-1", "0", "99.99", "101", "0.01"];
    const tile = Math.random() < 0.1 ? specialCases[Math.floor(Math.random() * specialCases.length)] : randomPercent;

    const backgrounds = ["https://i.ibb.co/RBRLmRt/Pics-Art-05-14-10-47-00.jpg"];
    const backgroundUrl = backgrounds[Math.floor(Math.random() * backgrounds.length)];

    try {
      // download avatars
      const avt1 = (await axios.get(`https://graph.facebook.com/${id1}/picture?width=720&height=720&access_token=6628568379|c1e620fa708a1d5696fb991c1bde5662`, { responseType: "arraybuffer" })).data;
      fs.writeFileSync(pathAvt1, Buffer.from(avt1, "utf-8"));

      const avt2 = (await axios.get(`https://graph.facebook.com/${id2}/picture?width=720&height=720&access_token=6628568379|c1e620fa708a1d5696fb991c1bde5662`, { response
