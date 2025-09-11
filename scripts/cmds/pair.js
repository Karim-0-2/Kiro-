const { loadImage, createCanvas } = require("canvas");
const axios = require("axios");
const fs = require("fs-extra");
const path = require("path");

// === VIP CONFIG ===
const vipPath = path.join(__dirname, "/cache/vip.json");
const OWNERS = ["61557991443492", "61578418080601"]; // Hasib + Wife
const BOT_ADMINS = []; // Dynamic admins

function loadVIP() {
  if (!fs.existsSync(vipPath)) return { vips: {}, admins: [] };
  return JSON.parse(fs.readFileSync(vipPath, "utf8"));
}

function isAllowed(uid) {
  const data = loadVIP();
  const now = Date.now();

  if (OWNERS.includes(uid)) return true; // Owners bypass everything
  if (BOT_ADMINS.includes(uid)) {
    // Admins must have VIP
    return data.vips[uid] && data.vips[uid].expire > now;
  }
  // Other users need VIP (optional: only VIP users can use)
  return data.vips[uid] && data.vips[uid].expire > now;
}

// === COMMAND ===
module.exports = {
  config: {
    name: "pair",
    author: "xemon",
    role: 0,
    shortDescription: "Pair two people in thread",
    longDescription: "Generates a cute pairing image between users",
    category: "love",
    guide: "{pn}"
  },

  onStart: async function ({ api, event, args }) {
    const senderID = event.senderID;

    // VIP / Owner check
    if (!isAllowed(senderID)) {
      return api.sendMessage("❌ You need VIP access to use this command.", event.threadID, event.messageID);
    }

    let tmpDir = __dirname + "/tmp";
    if (!fs.existsSync(tmpDir)) fs.mkdirSync(tmpDir);

    let pathImg = tmpDir + "/background.png";
    let pathAvt1 = tmpDir + "/Avtmot.png";
    let pathAvt2 = tmpDir + "/Avthai.png";

    let id1 = senderID;
    let ThreadInfo = await api.getThreadInfo(event.threadID);
    let all = ThreadInfo.userInfo;

    // Get gender of sender
    let gender1;
    for (let c of all) {
      if (c.id == id1) gender1 = c.gender;
    }

    const botID = api.getCurrentUserID();
    let candidates = [];

    if (gender1 === "FEMALE") {
      candidates = all.filter(u => u.gender === "MALE" && u.id !== id1 && u.id !== botID).map(u => u.id);
    } else if (gender1 === "MALE") {
      candidates = all.filter(u => u.gender === "FEMALE" && u.id !== id1 && u.id !== botID).map(u => u.id);
    } else {
      candidates = all.filter(u => u.id !== id1 && u.id !== botID).map(u => u.id);
    }

    if (!candidates.length) {
      return api.sendMessage("❌ No matching user found to pair with.", event.threadID, event.messageID);
    }

    let id2 = candidates[Math.floor(Math.random() * candidates.length)];
    let rd1 = Math.floor(Math.random() * 100) + 1;
    let cc = ["0", "-1", "99,99", "-99", "-100", "101", "0,01"];
    let rd2 = cc[Math.floor(Math.random() * cc.length)];
    let tile = [rd1, rd1, rd1, rd1, rd1, rd2, rd1, rd1, rd1, rd1][Math.floor(Math.random() * 10)];

    let background = [
      "https://i.postimg.cc/wjJ29HRB/background1.png",
      "https://i.postimg.cc/zf4Pnshv/background2.png",
      "https://i.postimg.cc/5tXRQ46D/background3.png"
    ];
    let rd = background[Math.floor(Math.random() * background.length)];

    // Fetch avatars and background
    const getImage = async (id, path) => {
      let res = await axios.get(`https://graph.facebook.com/${id}/picture?width=720&height=720&access_token=6628568379%7Cc1e620fa708a1d5696fb991c1bde5662`, { responseType: "arraybuffer" });
      fs.writeFileSync(path, Buffer.from(res.data, "utf-8"));
    };

    await getImage(id1, pathAvt1);
    await getImage(id2, pathAvt2);

    const bgData = await axios.get(rd, { responseType: "arraybuffer" });
    fs.writeFileSync(pathImg, Buffer.from(bgData.data, "utf-8"));

    let baseImage = await loadImage(pathImg);
    let baseAvt1 = await loadImage(pathAvt1);
    let baseAvt2 = await loadImage(pathAvt2);

    let canvas = createCanvas(baseImage.width, baseImage.height);
    let ctx = canvas.getContext("2d");
    ctx.drawImage(baseImage, 0, 0, canvas.width, canvas.height);
    ctx.drawImage(baseAvt1, 100, 150, 300, 300);
    ctx.drawImage(baseAvt2, 900, 150, 300, 300);

    const imageBuffer = canvas.toBuffer();
    fs.writeFileSync(pathImg, imageBuffer);
    fs.removeSync(pathAvt1);
    fs.removeSync(pathAvt2);

    return api.sendMessage({
      body: `🥰 Successful pairing!\n💌 Wish you two a hundred years of happiness 💕\n—The odds are ${tile}%`,
      attachment: fs.createReadStream(pathImg)
    }, event.threadID, () => fs.unlinkSync(pathImg), event.messageID);
  }
};
