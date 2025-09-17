const axios = require("axios");
const fs = require("fs-extra");
const path = require("path");
const jimp = require("jimp");

module.exports = {
  config: {
    name: "kiss2",
    version: "2.1.0",
    hasPermssion: 0,
    credits: "𝐂𝐘𝐁𝐄𝐑 ☢️_𖣘 -𝐁𝐎𝐓 ⚠️ 𝑻𝑬𝑨𝑴_ ☢️ | Modified by GoatBot",
    description: "Kiss someone (by tag or reply)",
    commandCategory: "Love",
    usages: "kiss [tag/reply]",
    cooldowns: 5
  },

  onLoad: async () => {
    const dirMaterial = path.join(__dirname, "cache");
    const filePath = path.join(dirMaterial, "hon0.jpeg");
    if (!fs.existsSync(dirMaterial)) fs.mkdirSync(dirMaterial, { recursive: true });
    if (!fs.existsSync(filePath)) {
      const img = await axios.get("https://i.imgur.com/j96ooUs.jpeg", { responseType: "arraybuffer" });
      fs.writeFileSync(filePath, Buffer.from(img.data, "utf-8"));
    }
  },

  run: async function ({ event, api, args, Currencies }) {
    const { threadID, messageID, senderID } = event;
    const mention = Object.keys(event.mentions);
    let one = senderID, two;

    // if reply
    if (event.type === "message_reply") {
      two = event.messageReply.senderID;
    }
    // if mention
    else if (mention.length > 0) {
      two = mention[0];
    }

    if (!two) return api.sendMessage("⚠️ Please tag or reply to 1 person to kiss.", threadID, messageID);

    // random money reward
    const hc = Math.floor(Math.random() * 101);
    const rd = Math.floor(Math.random() * 100000) + 100000;
    await Currencies.increaseMoney(senderID, parseInt(hc * rd));

    // random captions
    const captions = [
      "কারণে অকারণে প্রতিদিন নিয়ম করে, তোমার মায়াতে জড়িয়ে পড়ছি আমি বারেবার!🌷",
      "তোমাকে কেন ভালোবাসি তার কোন বিশেষ কারণ আমার জানা নাই! কিন্তু তোমার কাছে সারাজীবন থেকে যাওয়ার হাজারটা কারণ আমার কাছে আছে!💚",
      "তোমার সাথে কাটানো সময়গুলোর কথা চিন্তা করলে মনে হয়, এই এক জনম তোমার সাথে অনেক কম সময়!😘",
      "প্রিয় তুমি কি আমার জীবনের সেই গল্প হবে? যেই গল্পের শুরু থাকবে, কিন্তু কোনো শেষ থাকবে না!♥️",
      "তুমি পাশে থাকলে সবকিছু সুন্দর মনে হয়, জীবন যেন একটা মধুর কবিতায় রূপ নেয়!😍",
      "তোমাকে ছাড়া জীবনটা অসম্পূর্ণ, তুমি আমার ভালোবাসার পূর্ণতা!🧡",
      "তুমি আমার স্বপ্ন, তুমি আমার জীবনের প্রতিটি সুন্দর মুহূর্ত!🌻",
      "আমার চোখে তোমার অস্থিত্ব খোঁজতে এসোনা, হারিয়ে যাবে! কেননা আমার পুরোটা-জুরেই তোমারই নির্বাক আনাগোনা!🌺",
      "তোমাতে শুরু তোমাতেই শেষ, তুমি না থাকলে আমাদের গল্প এখানেই শেষ!😘",
      "ভালোবাসা যদি কোনো অনুভূতি হয়, তাহলে তোমার প্রতি আমার অনুভূতি পৃথিবীর সেরা অনুভূতি।🌻ღ🌺"
    ];
    const caption = captions[Math.floor(Math.random() * captions.length)];

    // generate image
    const imgPath = await makeImage({ one, two });
    return api.sendMessage({
      body: caption,
      attachment: fs.createReadStream(imgPath)
    }, threadID, () => fs.unlinkSync(imgPath), messageID);
  }
};

// helper functions
async function makeImage({ one, two }) {
  const __root = path.resolve(__dirname, "cache");
  const hon_img = await jimp.read(path.join(__root, "hon0.jpeg"));
  const pathImg = path.join(__root, `hon0_${one}_${two}.jpeg`);
  const avatarOne = path.join(__root, `avt_${one}.png`);
  const avatarTwo = path.join(__root, `avt_${two}.png`);

  // download avatars
  const getAvatarOne = (await axios.get(`https://graph.facebook.com/${one}/picture?width=512&height=512&access_token=6628568379%7Cc1e620fa708a1d5696fb991c1bde5662`, { responseType: "arraybuffer" })).data;
  fs.writeFileSync(avatarOne, Buffer.from(getAvatarOne, "utf-8"));

  const getAvatarTwo = (await axios.get(`https://graph.facebook.com/${two}/picture?width=512&height=512&access_token=6628568379%7Cc1e620fa708a1d5696fb991c1bde5662`, { responseType: "arraybuffer" })).data;
  fs.writeFileSync(avatarTwo, Buffer.from(getAvatarTwo, "utf-8"));

  let circleOne = await jimp.read(await circle(avatarOne));
  let circleTwo = await jimp.read(await circle(avatarTwo));

  hon_img
    .resize(700, 440)
    .composite(circleOne.resize(150, 150), 390, 23)
    .composite(circleTwo.resize(150, 150), 115, 130);

  let raw = await hon_img.getBufferAsync("image/png");
  fs.writeFileSync(pathImg, raw);

  fs.unlinkSync(avatarOne);
  fs.unlinkSync(avatarTwo);

  return pathImg;
}

async function circle(image) {
  let img = await jimp.read(image);
  img.circle();
  return await img.getBufferAsync("image/png");
    }
