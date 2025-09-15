const DIG = require("discord-image-generation");
const fs = require("fs-extra");
const path = __dirname + "/cache/vip.json"; // same vip.json as your vip system

module.exports = {
  config: {
    name: "kiss2",
    aliases: ["kiss"],
    version: "1.1",
    author: "NIB + Modified by Hasib",
    countDown: 5,
    role: 0,
    shortDescription: "KISS (VIP only)",
    longDescription: "Send a kiss image (only for VIP users)",
    category: "funny",
    guide: "{pn} (by replying to someone's message)"
  },

  onStart: async function ({ api, message, event, usersData }) {
    const now = Date.now();
    let data = [];
    try {
      data = JSON.parse(fs.readFileSync(path));
    } catch (e) {
      data = [];
    }

    // --- VIP check ---
    const vipUser = data.find(u => u.uid === event.senderID && u.expire > now);
    if (!vipUser) {
      return message.reply("⛔ This command is only for VIP users. You are not VIP.");
    }

    // --- Must reply to a message ---
    if (!event.messageReply) {
      return message.reply("⚠️ You must reply to someone's message to use this command.");
    }

    const one = event.senderID;
    const two = event.messageReply.senderID;

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
      message.reply("❌ Failed to create kiss image. Try again later.");
    }
  }
};
