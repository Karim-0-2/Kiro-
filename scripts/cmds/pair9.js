const axios = require("axios");
const fs = require("fs-extra");
const path = require("path");
const { loadImage, createCanvas } = require("canvas");

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
  // Other users need VIP
  return data.vips[uid] && data.vips[uid].expire > now;
}

module.exports = {
  config: {
    name: "pair9",
    countDown: 10,
    role: 0,
    shortDescription: {
      en: "Get to know your partner",
    },
    longDescription : {
      en: "Know your destiny and know who you will complete your life with",
    },
    category: "love",
    guide: {
      en: "{pn}"
    }
  },

  onStart: async function ({ api, args, message, event, usersData }) {
    const senderID = event.senderID;

    // VIP / Owner check
    if (!isAllowed(senderID)) {
      return api.sendMessage("❌ You need VIP access to use this command.", event.threadID, event.messageID);
    }

    let pathImg = __dirname + "/assets/background.png";
    let pathAvt1 = __dirname + "/assets/any.png";
    let pathAvt2 = __dirname + "/assets/avatar.png";

    let id1 = senderID;
    let name1 = await usersData.getName(id1);
    let ThreadInfo = await api.getThreadInfo(event.threadID);
    let all = ThreadInfo.userInfo;

    let gender1;
    for (let c of all) {
      if (c.id == id1) gender1 = c.gender;
    }

    const botID = api.getCurrentUserID();
    let candidates = [];

    if(gender1 === "FEMALE"){
      candidates = all.filter(u => u.gender === "MALE" && u.id !== id1 && u.id !== botID).map(u => u.id);
    } else if(gender1 === "MALE"){
      candidates = all.filter(u => u.gender === "FEMALE" && u.id !== id1 && u.id !== botID).map(u => u.id);
    } else {
      candidates = all.filter(u => u.id !== id1 && u.id !== botID).map(u => u.id);
    }

    if (!candidates.length) return api.sendMessage("❌ No matching user found to pair with.", event.threadID, event.messageID);

    let id2 = candidates[Math.floor(Math.random() * candidates.length)];
    let name2 = await usersData.getName(id2);

    let rd1 = Math.floor(Math.random() * 100) + 1;
    let cc = ["0", "-1", "99,99", "-99", "-100", "101", "0,01"];
    let rd2 = cc[Math.floor(Math.random() * cc.length)];
    let djtme = [rd1, rd1, rd1, rd1, rd1, rd2, rd1, rd1, rd1, rd1];
    let tile = djtme[Math.floor(Math.random() * djtme.length)];

    let background = ["https://i.ibb.co/RBRLmRt/Pics-Art-05-14-10-47-00.jpg"];

    // Fetch avatars
    const getImage = async (id, filePath) => {
      let res = await axios.get(`https://graph.facebook.com/${id}/picture?width=720&height=720&access_token=6628568379%7Cc1e620fa708a1d5696fb991c1bde5662`, { responseType: "arraybuffer" });
      fs.writeFileSync(filePath, Buffer.from(res.data, "utf-8"));
    };

    await getImage(id1, pathAvt1);
    await getImage(id2, pathAvt2);

    // Fetch background
    const bgData = await axios.get(background[0], { responseType: "arraybuffer" });
    fs.writeFileSync(pathImg, Buffer.from(bgData.data, "utf-8"));

    let baseImage = await loadImage(pathImg);
    let baseAvt1 = await loadImage(pathAvt1);
    let baseAvt2 = await loadImage(pathAvt2);

    let canvas = createCanvas(baseImage.width, baseImage.height);
    let ctx = canvas.getContext("2d");
    ctx.drawImage(baseImage, 0, 0, canvas.width, canvas.height);
    ctx.drawImage(baseAvt1, 111, 175, 330, 330);
    ctx.drawImage(baseAvt2, 1018, 173, 330, 330);

    const imageBuffer = canvas.toBuffer();
    fs.writeFileSync(pathImg, imageBuffer);
    fs.removeSync(pathAvt1);
    fs.removeSync(pathAvt2);

    return api.sendMessage({
      body: `『💗』Congratulations ${name1}『💗』\n『❤️』Looks like your destiny brought you together with ${name2}『❤️』\n『🔗』Your link percentage is ${tile}%『🔗』`,
      mentions: [
        { tag: `${name2}`, id: id2 },
        { tag: `${name1}`, id: id1 }
      ],
      attachment: fs.createReadStream(pathImg)
    }, event.threadID, () => fs.unlinkSync(pathImg), event.messageID);
  }
};
