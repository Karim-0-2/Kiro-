const { loadImage, createCanvas } = require("canvas");
const axios = require("axios");
const fs = require("fs-extra");
const path = require("path");

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

    let tmpDir = path.join(__dirname, "tmp");
    if (!fs.existsSync(tmpDir)) fs.mkdirSync(tmpDir);

    let pathImg = path.join(tmpDir, "background.png");
    let pathAvt1 = path.join(tmpDir, "Avtmot.png");
    let pathAvt2 = path.join(tmpDir, "Avthai.png");

    let id1 = senderID;
    const ThreadInfo = await api.getThreadInfo(event.threadID);
    const all = ThreadInfo.userInfo;

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
      const res = await axios.get(`https://graph.facebook.com/${id}/picture?width=720&height=720&access_token=6628568379%7Cc1e620fa708a1d5696fb991c1bde5662`, { responseType: "arraybuffer" });
      fs.writeFileSync(path, Buffer.from(res.data));
    };

    await getImage(id1, pathAvt1);
    await getImage(id2, pathAvt2);

    const bgData = await axios.get(rd, { responseType: "arraybuffer" });
    fs.writeFileSync(pathImg, Buffer.from(bgData.data));

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

    return api.sendMessage({
      body: `🥰 Successful pairing!\n💌 Wish you two a hundred years of happiness 💕\n—The odds are ${tile}%`,
      attachment: fs.createReadStream(pathImg)
    }, event.threadID, () => fs.unlinkSync(pathImg), event.messageID);
  }
};
