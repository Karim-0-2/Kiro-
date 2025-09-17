const axios = require("axios");
const fs = require("fs-extra");
const path = require("path");
const jimp = require("jimp");

module.exports = {
config: {
name: "Kiss",
aliases: [],
version: "2.0.0",
author: "Hasib",
countDown: 5,
role: 0,
shortDescription: "Kiss someone you tag",
longDescription: "Generates a kiss image with you and the person you tag",
category: "love",
guide: "{pn} @mention"
},

onStart: async function ({ api, event }) {
const { threadID, messageID, senderID } = event;
const mention = Object.keys(event.mentions);

if (mention.length === 0) {  
  return api.sendMessage("❌ Please tag 1 person to kiss!", threadID, messageID);  
}  

const one = senderID;  
const two = mention[0];  

try {  
  const imgPath = await makeImage({ one, two });  

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

  return api.sendMessage({  
    body: caption,  
    attachment: fs.createReadStream(imgPath)  
  }, threadID, () => fs.unlinkSync(imgPath), messageID);  

} catch (e) {  
  return api.sendMessage(`❌ Error: ${e.message}`, threadID, messageID);  
}

}
};

// === Helper functions === //

async function makeImage({ one, two }) {
const __root = path.resolve(__dirname, "cache");

const honPath = path.join(__root, "hon0.jpeg");
if (!fs.existsSync(honPath)) {
const img = (await axios.get("https://i.imgur.com/j96ooUs.jpeg", { responseType: "arraybuffer" })).data;
fs.writeFileSync(honPath, Buffer.from(img, "utf-8"));
}

let hon_img = await jimp.read(honPath);
let pathImg = path.join(__root, hon0_${one}_${two}.png);
let avatarOne = path.join(__root, avt_${one}.png);
let avatarTwo = path.join(__root, avt_${two}.png);

// Get avatars
let getAvatarOne = (await axios.get(https://graph.facebook.com/${one}/picture?width=512&height=512&access_token=6628568379%7Cc1e620fa708a1d5696fb991c1bde5662, { responseType: 'arraybuffer' })).data;
fs.writeFileSync(avatarOne, Buffer.from(getAvatarOne, 'utf-8'));

let getAvatarTwo = (await axios.get(https://graph.facebook.com/${two}/picture?width=512&height=512&access_token=6628568379%7Cc1e620fa708a1d5696fb991c1bde5662, { responseType: 'arraybuffer' })).data;
fs.writeFileSync(avatarTwo, Buffer.from(getAvatarTwo, 'utf-8'));

// Circle avatars
let circleOne = await jimp.read(await circle(avatarOne));
let circleTwo = await jimp.read(await circle(avatarTwo));

hon_img.resize(700, 440)
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

Make that this cmd working by massage reply

