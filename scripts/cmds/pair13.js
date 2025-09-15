const { loadImage, createCanvas } = require("canvas");
const axios = require("axios");
const fs = require("fs-extra");
const path = require("path");

const vipPath = path.join(__dirname, "cache", "vip.json");
const OWNER_UIDS = ["61557991443492", "61578418080601"]; // Fixed owners

// --- Helper: VIP check ---
function isVip(userID) {
  if (OWNER_UIDS.includes(userID)) return true;
  if (!fs.existsSync(vipPath)) return false;
  const data = JSON.parse(fs.readFileSync(vipPath, "utf8"));
  const now = Date.now();
  return data.some(u => u.uid === userID && u.expire > now);
}

module.exports.config = {
    name: "pair13",
    version: "1.0.1",
    hasPermssion: 0,
    credits: "RKO BRO",
    description: "Randomly pairs users and generates a cute image! (VIP Only)",
    commandCategory: "make jodi",
    usages: "",
    dependencies: { "axios": "", "fs-extra": "", "canvas": "" },
    cooldowns: 4
};

module.exports.run = async function ({ Users, api, event }) {
    const senderID = event.senderID;

    // VIP check
    if (!isVip(senderID)) {
        const msg = await api.sendMessage("⛔ This command is VIP-only!", event.threadID, event.messageID);
        setTimeout(() => api.unsendMessage(msg.messageID).catch(() => {}), 10000);
        return;
    }

    const pathImg = __dirname + "/cache/background.png";
    const pathAvt1 = __dirname + "/cache/Avtmot.png";
    const pathAvt2 = __dirname + "/cache/Avthai.png";

    const id1 = senderID;
    const name1 = await Users.getNameUser(id1);

    const threadInfo = await api.getThreadInfo(event.threadID);
    const allUsers = threadInfo.userInfo;
    const botID = api.getCurrentUserID();

    // Determine partner: mention > reply > random
    let id2 = Object.keys(event.mentions || {})[0];
    if (!id2 && event.type === "message_reply" && event.messageReply.senderID !== id1) id2 = event.messageReply.senderID;
    if (!id2) {
        let gender1 = allUsers.find(u => u.id === id1)?.gender;
        let candidates = allUsers.filter(u => u.id !== id1 && u.id !== botID);
        if (gender1 === "MALE") candidates = candidates.filter(u => u.gender === "FEMALE");
        else if (gender1 === "FEMALE") candidates = candidates.filter(u => u.gender === "MALE");
        if (!candidates.length) return api.sendMessage("❌ No suitable partner found in this group!", event.threadID, event.messageID);
        id2 = candidates[Math.floor(Math.random() * candidates.length)].id;
    }

    const name2 = await Users.getNameUser(id2);

    // Generate random odds
    const oddsArray = ["0", "-1", "99,99", "-99", "-100", "101", "0,01"];
    const rd1 = Math.floor(Math.random() * 100) + 1;
    const rd2 = oddsArray[Math.floor(Math.random() * oddsArray.length)];
    const oddsPool = Array(10).fill(rd1);
    oddsPool[5] = rd2;
    const tile = oddsPool[Math.floor(Math.random() * oddsPool.length)];

    // Random background image
    const backgrounds = [
        "https://i.postimg.cc/dVDJCCJk/20240216-214548.png",
        "https://i.postimg.cc/ZKSc0PFH/20240216-214735.png",
        "https://i.postimg.cc/jSzXjY06/Picsart-23-06-10-08-25-38-156.jpg"
    ];
    const bgUrl = backgrounds[Math.floor(Math.random() * backgrounds.length)];

    // Fetch images
    const getImageBuffer = async (url) => (await axios.get(url, { responseType: "arraybuffer" })).data;
    fs.writeFileSync(pathAvt1, Buffer.from(await getImageBuffer(`https://graph.facebook.com/${id1}/picture?width=720&height=720&access_token=6628568379%7Cc1e620fa708a1d5696fb991c1bde5662`)));
    fs.writeFileSync(pathAvt2, Buffer.from(await getImageBuffer(`https://graph.facebook.com/${id2}/picture?width=720&height=720&access_token=6628568379%7Cc1e620fa708a1d5696fb991c1bde5662`)));
    fs.writeFileSync(pathImg, Buffer.from(await getImageBuffer(bgUrl)));

    // Canvas
    const baseImage = await loadImage(pathImg);
    const baseAvt1 = await loadImage(pathAvt1);
    const baseAvt2 = await loadImage(pathAvt2);
    const canvas = createCanvas(baseImage.width, baseImage.height);
    const ctx = canvas.getContext("2d");

    ctx.drawImage(baseImage, 0, 0, canvas.width, canvas.height);
    ctx.drawImage(baseAvt1, 100, 150, 300, 300);
    ctx.drawImage(baseAvt2, 900, 150, 300, 300);

    fs.writeFileSync(pathImg, canvas.toBuffer());
    fs.removeSync(pathAvt1);
    fs.removeSync(pathAvt2);

    return api.sendMessage({
        body: `💞 Congratulations ${name1} is paired with ${name2}!\n❤️ Odds: ${tile}%`,
        mentions: [{ tag: name2, id: id2 }],
        attachment: fs.createReadStream(pathImg)
    }, event.threadID, () => fs.unlinkSync(pathImg), event.messageID);
};
