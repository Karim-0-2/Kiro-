const fs = require("fs-extra");
const path = require("path");
const axios = require("axios");
const jimp = require("jimp");

const CACHE_DIR = path.join(__dirname, "cache");
const TEMPLATE_IMG = path.join(CACHE_DIR, "kiss2.jpeg");

// On load → download template if not exists
module.exports.onLoad = async () => {
  fs.ensureDirSync(CACHE_DIR);
  if (!fs.existsSync(TEMPLATE_IMG)) {
    const { data } = await axios.get("https://i.imgur.com/OBB7v7V.jpeg", { responseType: "arraybuffer" }); 
    fs.writeFileSync(TEMPLATE_IMG, Buffer.from(data));
  }
};

async function circle(image) {
  const img = await jimp.read(image);
  img.circle();
  return await img.getBufferAsync("image/png");
}

async function makeImage({ one, two }) {
  const baseImg = await jimp.read(TEMPLATE_IMG);
  const pathImg = path.join(CACHE_DIR, `kiss2_${one}_${two}.png`);
  const avatarOne = path.join(CACHE_DIR, `avt2_${one}.png`);
  const avatarTwo = path.join(CACHE_DIR, `avt2_${two}.png`);

  const url1 = `https://graph.facebook.com/${one}/picture?width=512&height=512&access_token=6628568379%7Cc1e620fa708a1d5696fb991c1bde5662`;
  const url2 = `https://graph.facebook.com/${two}/picture?width=512&height=512&access_token=6628568379%7Cc1e620fa708a1d5696fb991c1bde5662`;

  fs.writeFileSync(avatarOne, Buffer.from((await axios.get(url1, { responseType: "arraybuffer" })).data));
  fs.writeFileSync(avatarTwo, Buffer.from((await axios.get(url2, { responseType: "arraybuffer" })).data));

  const circleOne = await jimp.read(await circle(avatarOne));
  const circleTwo = await jimp.read(await circle(avatarTwo));

  baseImg
    .resize(700, 440)
    .composite(circleOne.resize(160, 160), 350, 30)
    .composite(circleTwo.resize(160, 160), 120, 160);

  const raw = await baseImg.getBufferAsync("image/png");
  fs.writeFileSync(pathImg, raw);

  fs.unlinkSync(avatarOne);
  fs.unlinkSync(avatarTwo);

  return pathImg;
}

module.exports = {
  config: {
    name: "kiss2",
    version: "1.0.0",
    author: "Hasib",
    countDown: 5,
    role: 0,
    shortDescription: "Kiss someone",
    longDescription: "Send a kiss image with the person you tag or reply to",
    category: "love",
    guide: "{pn} @tag | reply to someone's message"
  },

  onStart: async function ({ event, api }) {
    const { threadID, messageID, senderID } = event;
    const mention = Object.keys(event.mentions);
    const one = senderID;
    const two = mention[0] || (event.messageReply && event.messageReply.senderID);

    if (!two) return api.sendMessage("⚠️ Please tag or reply to someone to kiss.", threadID, messageID);

    try {
      const pathImg = await makeImage({ one, two });
      return api.sendMessage(
        { body: "💋 Sending you a sweet kiss!", attachment: fs.createReadStream(pathImg) },
        threadID,
        () => fs.unlinkSync(pathImg),
        messageID
      );
    } catch (err) {
      console.error(err);
      return api.sendMessage("❌ Error generating kiss2 image.", threadID, messageID);
    }
  }
};
