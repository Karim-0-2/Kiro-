const fs = require("fs-extra");
const path = require("path");
const axios = require("axios");
const jimp = require("jimp");

module.exports = {
  config: {
    name: "kiss",
    version: "2.1.0",
    author: "𝐇𝐚𝐬𝐢𝐛",
    countDown: 5,
    role: 0,
    shortDescription: "Kiss the person you tag or reply",
    longDescription: "Send a kiss frame with you and the person you tag or reply to",
    category: "love",
    guide: {
      en: "{pn} @mention\n{pn} (by replying to a message)"
    }
  },

  // === LOAD BACKGROUND IMAGE ===
  onLoad: async () => {
    const dir = path.join(__dirname, "cache");
    const filePath = path.join(dir, "kiss.png");
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    if (!fs.existsSync(filePath)) {
      const imgURL = "https://i.imgur.com/j96ooUs.jpeg";
      const imgData = (await axios.get(imgURL, { responseType: "arraybuffer" })).data;
      fs.writeFileSync(filePath, Buffer.from(imgData));
    }
  },

  // === MAKE IMAGE ===
  makeImage: async function ({ one, two }) {
    const dir = path.join(__dirname, "cache");
    const bg = await jimp.read(path.join(dir, "kiss.png"));
    const pathImg = path.join(dir, `kiss_${one}_${two}.png`);
    const avatarOnePath = path.join(dir, `avt_${one}.png`);
    const avatarTwoPath = path.join(dir, `avt_${two}.png`);

    const getAvatar = async (uid, filePath) => {
      const url = `https://graph.facebook.com/${uid}/picture?width=512&height=512&access_token=6628568379|c1e620fa708a1d5696fb991c1bde5662`;
      const avatarData = (await axios.get(url, { responseType: "arraybuffer" })).data;
      fs.writeFileSync(filePath, Buffer.from(avatarData));
    };

    await getAvatar(one, avatarOnePath);
    await getAvatar(two, avatarTwoPath);

    const circle = async (imagePath) => {
      const img = await jimp.read(imagePath);
      img.circle();
      return await img.getBufferAsync("image/png");
    };

    const circleOne = await jimp.read(await circle(avatarOnePath));
    const circleTwo = await jimp.read(await circle(avatarTwoPath));

    // Place avatars
    bg.resize(700, 440)
      .composite(circleOne.resize(150, 150), 390, 23)
      .composite(circleTwo.resize(150, 150), 115, 130);

    const finalBuffer = await bg.getBufferAsync("image/png");
    fs.writeFileSync(pathImg, finalBuffer);

    fs.unlinkSync(avatarOnePath);
    fs.unlinkSync(avatarTwoPath);

    return pathImg;
  },

  // === MAIN COMMAND ===
  onStart: async function ({ event, api }) {
    const { threadID, messageID, senderID, mentions, type, messageReply } = event;
    const mention = Object.keys(mentions);

    let one = senderID;
    let two;

    if (mention[0]) {
      two = mention[0]; // case: user mentioned someone
    } else if (type === "message_reply") {
      two = messageReply.senderID; // case: user replied to someone's message
    }

    if (!two) {
      return api.sendMessage("⚠️ Please tag or reply to someone!", threadID, messageID);
    }

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
      const imagePath = await this.makeImage({ one, two });
      return api.sendMessage({
        body: caption,
        attachment: fs.createReadStream(imagePath)
      }, threadID, () => fs.unlinkSync(imagePath), messageID);
    } catch (e) {
      console.error(e);
      return api.sendMessage("❌ ছবিটি তৈরি করতে সমস্যা হয়েছে!", threadID, messageID);
    }
  }
};
