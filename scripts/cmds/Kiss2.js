const fs = require("fs-extra");
const path = require("path");
const axios = require("axios");
const jimp = require("jimp");

module.exports = {
  config: {
    name: "kiss2",
    aliases: ["hon", "kissv2"],
    version: "2.0.1",
    author: "ℋ𝒜𝒮ℐℬ",
    countDown: 5,
    role: 0,
    shortDescription: "kiss someone",
    longDescription: "Send a kissing image with caption (mention or reply supported)",
    category: "love",
    guide: "{pn} @mention or reply"
  },

  onLoad: async function () {
    const dirMaterial = path.join(__dirname, "cache");
    const filePath = path.join(dirMaterial, "hon.png");

    if (!fs.existsSync(dirMaterial)) fs.mkdirSync(dirMaterial, { recursive: true });
    if (!fs.existsSync(filePath)) {
      const img = (await axios.get("https://i.imgur.com/BtSlsSS.jpg", { responseType: "arraybuffer" })).data;
      fs.writeFileSync(filePath, Buffer.from(img, "utf-8"));
    }
  },

  onStart: async function ({ message, event }) {
    const mention = Object.keys(event.mentions || {});
    let targetID;

    // case 1: mention
    if (mention.length > 0) {
      targetID = mention[0];
    }
    // case 2: reply
    else if (event.messageReply && event.messageReply.senderID) {
      targetID = event.messageReply.senderID;
    }

    if (!targetID) {
      return message.reply("⚠️ Please mention or reply to someone to kiss!");
    }

    const one = event.senderID;
    const two = targetID;

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

    try {
      const imgPath = await makeImage({ one, two });
      await message.reply({
        body: caption,
        attachment: fs.createReadStream(imgPath)
      });
      fs.unlinkSync(imgPath);
    } catch (e) {
      message.reply("❌ ছবি বানাতে সমস্যা হয়েছে।");
    }
  }
};

// ===== helper functions =====
async function makeImage({ one, two }) {
  const __root = path.resolve(__dirname, "cache");
  const hon_img = await jimp.read(path.join(__root, "hon.png"));

  const pathImg = path.join(__root, `hon_${one}_${two}.png`);
  const avatarOne = path.join(__root, `avt_${one}.png`);
  const avatarTwo = path.join(__root, `avt_${two}.png`);

  const getAvatarOne = (await axios.get(`https://graph.facebook.com/${one}/picture?width=512&height=512&access_token=6628568379%7Cc1e620fa708a1d5696fb991c1bde5662`, { responseType: "arraybuffer" })).data;
  fs.writeFileSync(avatarOne, Buffer.from(getAvatarOne, "utf-8"));

  const getAvatarTwo = (await axios.get(`https://graph.facebook.com/${two}/picture?width=512&height=512&access_token=6628568379%7Cc1e620fa708a1d5696fb991c1bde5662`, { responseType: "arraybuffer" })).data;
  fs.writeFileSync(avatarTwo, Buffer.from(getAvatarTwo, "utf-8"));

  let circleOne = await jimp.read(await circle(avatarOne));
  let circleTwo = await jimp.read(await circle(avatarTwo));

  hon_img
    .resize(700, 440)
    .composite(circleOne.resize(200, 200), 390, 23)
    .composite(circleTwo.resize(180, 180), 140, 80);

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
