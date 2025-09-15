const { loadImage, createCanvas } = require("canvas");
const axios = require("axios");
const fs = require("fs-extra");
const path = require("path");

// === VIP CONFIG ===
const vipPath = path.join(__dirname, "/cache/vip.json"); // store VIP data
const OWNERS = ["61557991443492", "61578418080601"]; // Owner + Wife
const BOT_ADMINS = []; // optional admins

function loadVIP() {
  if (!fs.existsSync(vipPath)) return { vips: {}, admins: [] };
  return JSON.parse(fs.readFileSync(vipPath, "utf8"));
}

function isAllowed(uid) {
  const data = loadVIP();
  const now = Date.now();

  if (OWNERS.includes(uid)) return true; // owners bypass VIP
  if (BOT_ADMINS.includes(uid)) {
    return data.vips[uid] && data.vips[uid].expire > now; // Admins need VIP
  }
  return data.vips[uid] && data.vips[uid].expire > now; // others need VIP
}

module.exports = {
  config: {
    name: "pair9",
    aurthor: "BaYjid",
    role: 0,
    shortDescription: "Pair with someone",
    longDescription: "",
    category: "love",
    guide: "{pn}"
  },

  onStart: async function ({ api, event, args, usersData, threadsData }) {
    const senderID = event.senderID;

    // VIP check
    if (!isAllowed(senderID)) {
      return api.sendMessage("❌ This command is VIP-only.", event.threadID, event.messageID);
    }

    let pathImg = __dirname + "/tmp/background.png";
    let pathAvt1 = __dirname + "/tmp/Avtmot.png";
    let pathAvt2 = __dirname + "/tmp/Avthai.png";

    var id1 = event.senderID;
    var name1 = await usersData.getName(id1);

    var ThreadInfo = await api.getThreadInfo(event.threadID);
    var all = ThreadInfo.userInfo;

    var gender1 = all.find(u => u.id === id1)?.gender;
    const botID = api.getCurrentUserID();
    let candidates = [];

    if (gender1 === "FEMALE") {
      candidates = all.filter(u => u.gender === "MALE" && u.id !== id1 && u.id !== botID).map(u => u.id);
    } else if (gender1 === "MALE") {
      candidates = all.filter(u => u.gender === "FEMALE" && u.id !== id1 && u.id !== botID).map(u => u.id);
    } else {
      candidates = all.filter(u => u.id !== id1 && u.id !== botID).map(u => u.id);
    }

    if (!candidates.length) return api.sendMessage("❌ No matching user found to pair with.", event.threadID, event.messageID);

    var id2 = candidates[Math.floor(Math.random() * candidates.length)];
    var name2 = await usersData.getName(id2);

    var rd1 = Math.floor(Math.random() * 100) + 1;
    var cc = ["0", "-1", "99,99", "-99", "-100", "101", "0,01"];
    var rd2 = cc[Math.floor(Math.random() * cc.length)];
    var djtme = [rd1, rd1, rd1, rd1, rd1, rd2, rd1, rd1, rd1, rd1];
    var tile = djtme[Math.floor(Math.random() * djtme.length)];

    var background = ["https://i.postimg.cc/5tXRQ46D/background3.png"];

    // Fetch avatars
    const getImage = async (id, filePath) => {
      const res = await axios.get(
        `https://graph.facebook.com/${id}/picture?width=720&height=720&access_token=6628568379%7Cc1e620fa708a1d5696fb991c1bde5662`,
        { responseType: "arraybuffer" }
      );
      fs.writeFileSync(filePath, Buffer.from(res.data, "utf-8"));
    };

    await getImage(id1, pathAvt1);
    await getImage(id2, pathAvt2);

    // Fetch background
    const bgData = await axios.get(background[0], { responseType: "arraybuffer" });
    fs.writeFileSync(pathImg, Buffer.from(bgData.data, "utf-8"));

    // Create canvas
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

    return api.sendMessage(
      {
        body: `『💗』Congratulations ${name1}『💗』
『❤️』Looks like your destiny brought you together with ${name2}『❤️』
『🔗』Your link percentage is ${tile}%『🔗』`,
        mentions: [
          { tag: `${name2}`, id: id2 },
          { tag: `${name1}`, id: id1 }
        ],
        attachment: fs.createReadStream(pathImg)
      },
      event.threadID,
      () => fs.unlinkSync(pathImg),
      event.messageID
    );
  }
};
