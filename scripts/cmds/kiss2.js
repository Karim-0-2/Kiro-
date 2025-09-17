const DIG = require("discord-image-generation");
const fs = require("fs-extra");
const vipPath = __dirname + "/cache/vip.json";

module.exports = {
  config: {
    name: "kiss5",
    aliases: ["kiss"],
    version: "2.0",
    author: "NIB + Modified by FireTix",
    countDown: 5,
    role: 0,
    shortDescription: "KISS (VIP only)",
    longDescription: "VIP-only kiss command with reply & mention support",
    category: "funny",
    guide: "{pn} @mention or reply to someone"
  },

  onStart: async function ({ api, message, event, args, usersData }) {
    const now = Date.now();
    let vipList = [];
    if (fs.existsSync(vipPath)) {
      vipList = JSON.parse(fs.readFileSync(vipPath));
    }

    // --- Check if sender is VIP ---
    let isVip = false;
    const senderVip = vipList.find(u => u.uid === event.senderID && u.expire > now);
    if (senderVip) isVip = true;

    if (!isVip) {
      return message.reply("⛔ This command is only for VIP members!");
    }

    // --- Get target user (mention or reply) ---
    let one, two;
    const mention = Object.keys(event.mentions);

    if (mention.length === 0) {
      if (event.messageReply) {
        one = event.senderID;
        two = event.messageReply.senderID;
      } else {
        return message.reply("⚠️ Please mention or reply to someone!");
      }
    } else if (mention.length === 1) {
      one = event.senderID;
      two = mention[0];
    } else {
      one = mention[1];
      two = mention[0];
    }

    // --- Generate kiss image ---
    try {
      const avatarURL1 = await usersData.getAvatarUrl(one);
      const avatarURL2 = await usersData.getAvatarUrl(two);
      const img = await new DIG.Kiss().getImage(avatarURL1, avatarURL2);

      const pathSave = `${__dirname}/tmp/${one}_${two}_kiss.png`;
      fs.writeFileSync(pathSave, Buffer.from(img));

      message.reply(
        {
          body: "😘😘",
          attachment: fs.createReadStream(pathSave)
        },
        () => fs.unlinkSync(pathSave)
      );
    } catch (err) {
      console.error(err);
      message.reply("❌ Failed to generate kiss image.");
    }
  }
};
