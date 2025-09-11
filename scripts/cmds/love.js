const axios = require('axios');
const jimp = require("jimp");
const fs = require("fs");
const path = require("path");

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
        name: "love",
        aliases: ["love 2 love"],
        version: "1.0",
        author: "MOHAMMAD-BADOL", 
        countDown: 5,
        role: 0,
        shortDescription: "love dp",
        longDescription: "",
        category: "photo",
        guide: ""
    },

    onStart: async function ({ message, api, event, args }) {
        const senderID = event.senderID;

        // VIP / Owner check
        if (!isAllowed(senderID)) {
            return message.reply("❌ This command is VIP-only.");
        }

        const mention = Object.keys(event.mentions);
        if (mention.length == 0) return message.reply("💚আপমি যাকে ভালবাসেন তাকে মেনশন করুন প্লিজ✅");
        else if (mention.length == 1) {
            const one = event.senderID, two = mention[0];
            bal(one, two).then(ptth => { 
                message.reply({ 
                    body: "ইগো আর ভালোবাসা লড়াই হলে ভালোবাসা টাই হেরে যায়.💔🥀", 
                    attachment: fs.createReadStream(ptth) 
                }) 
            })
        } else {
            const one = mention[1], two = mention[0];
            bal(one, two).then(ptth => { 
                message.reply({ 
                    body: "he is not me🕸", 
                    attachment: fs.createReadStream(ptth) 
                }) 
            })
        }
    }
};

async function bal(one, two) {
    let avone = await jimp.read(`https://graph.facebook.com/${one}/picture?width=512&height=512&access_token=6628568379%7Cc1e620fa708a1d5696fb991c1bde5662`)
    avone.circle()
    let avtwo = await jimp.read(`https://graph.facebook.com/${two}/picture?width=512&height=512&access_token=6628568379%7Cc1e620fa708a1d5696fb991c1bde5662`)
    avtwo.circle()
    let pth = "spiderman.png"
    let img = await jimp.read("https://i.imgur.com/LjpG3CW.jpeg")
    img.resize(1440, 1080)
       .composite(avone.resize(470, 470), 125, 210)
       .composite(avtwo.resize(470, 470), 800, 200);

    await img.writeAsync(pth)
    return pth
}
