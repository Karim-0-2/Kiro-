const fs = require("fs-extra");
const path = require("path");
const axios = require("axios");
const jimp = require("jimp");

module.exports = {
    config: {
        name: "kiss2",
        version: "2.0.0",
        hasPermssion: 0,
        credits: "—͟͟͞͞𝐂𝐘𝐁𝐄𝐑 ☢️_𖣘 -𝐁𝐎𝐓 ⚠️ 𝑻𝑬𝑨𝑴_ ☢️",
        description: "Send a cute kiss to someone!",
        commandCategory: "Love",
        usages: "[tag or reply]",
        cooldowns: 5,
        dependencies: {
            "axios": "",
            "fs-extra": "",
            "path": "",
            "jimp": ""
        }
    },

    onLoad: async () => {
        const { resolve } = path;
        const dirMaterial = resolve(__dirname, "cache");
        const honPath = resolve(dirMaterial, "hon.png");

        if (!fs.existsSync(dirMaterial)) fs.mkdirSync(dirMaterial, { recursive: true });
        if (!fs.existsSync(honPath)) {
            const { downloadFile } = global.utils;
            await downloadFile("https://i.imgur.com/BtSlsSS.jpg", honPath);
        }
    },

    run: async function ({ event, api }) {
        const { threadID, messageID, senderID, messageReply, mentions } = event;

        // Determine target user: either mention or reply
        let two;
        if (Object.keys(mentions).length > 0) two = Object.keys(mentions)[0];
        else if (messageReply) two = messageReply.senderID;

        if (!two) return api.sendMessage("Please tag someone or reply to their message!", threadID, messageID);

        // Captions
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

        // Create image
        const imagePath = await makeImage({ one: senderID, two });

        // Send image
        return api.sendMessage({
            body: caption,
            attachment: fs.createReadStream(imagePath)
        }, threadID, () => fs.unlinkSync(imagePath), messageID);
    }
};

// Helper functions
async function makeImage({ one, two }) {
    const __root = path.resolve(__dirname, "cache");
    const hon_img = await jimp.read(__root + "/hon.png");
    const pathImg = __root + `/hon_${one}_${two}.png`;

    const avatarOne = __root + `/avt_${one}.png`;
    const avatarTwo = __root + `/avt_${two}.png`;

    const getAvatar = async (id, path) => {
        const res = await axios.get(`https://graph.facebook.com/${id}/picture?width=512&height=512&access_token=6628568379%7Cc1e620fa708a1d5696fb991c1bde5662`, { responseType: 'arraybuffer' });
        fs.writeFileSync(path, Buffer.from(res.data, 'utf-8'));
    };

    await getAvatar(one, avatarOne);
    await getAvatar(two, avatarTwo);

    const circleOne = await jimp.read(await circle(avatarOne));
    const circleTwo = await jimp.read(await circle(avatarTwo));

    hon_img.resize(700, 440)
        .composite(circleOne.resize(200, 200), 390, 23)
        .composite(circleTwo.resize(180, 180), 140, 80);

    const raw = await hon_img.getBufferAsync("image/png");
    fs.writeFileSync(pathImg, raw);

    fs.unlinkSync(avatarOne);
    fs.unlinkSync(avatarTwo);

    return pathImg;
}

async function circle(imagePath) {
    const image = await jimp.read(imagePath);
    image.circle();
    return await image.getBufferAsync("image/png");
          }
