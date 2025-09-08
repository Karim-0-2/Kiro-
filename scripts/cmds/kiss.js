const DIG = require("discord-image-generation");
const fs = require("fs-extra");
const path = require("path");

const VIP_PATH = path.join(__dirname, "/cache/vip.json");
const OWNERS = ["61578418080601", "61557991443492"];
const ADMINS = ["100060606189407", "61576296543095", "61554678316179", "100091527859576"];

module.exports = {
  config: {
    name: "kiss",
    aliases: ["kiss"],
    version: "1.4",
    author: "NIB + Hasib",
    countDown: 5,
    role: 0,
    shortDescription: "KISS (VIP only, Owner exempt)",
    category: "funny",
    guide: "{pn} @tag | reply to someone's message | no input to kiss random member"
  },

  onStart: async function ({ api, message, event, usersData, threadsData }) {
    // --- Load VIPs ---
    if (!fs.existsSync(VIP_PATH)) fs.writeFileSync(VIP_PATH, JSON.stringify([]));
    const vipData = JSON.parse(fs.readFileSync(VIP_PATH));

    const sender = String(event.senderID);

    // --- Access check ---
    const senderIsOwner = OWNERS.includes(sender);
    const senderIsAdmin = ADMINS.includes(sender);
    const senderIsVIP = vipData.some(u => u.uid === sender);

    if (!senderIsOwner && !senderIsVIP) {
      if (senderIsAdmin) {
        return message.reply("⚠️ Admins must be VIP to use this command!");
      } else {
        return message.reply("❌ You must be a VIP to use this command!");
      }
    }

    let one = sender;
    let two;

    const mention = Object.keys(event.mentions || {});

    if (mention.length > 0) {
      two = mention[0];
    } else if (event.messageReply) {
      two = event.messageReply.senderID;
    } else {
      // Pick a random member from the thread
      const threadInfo = await api.getThreadInfo(event.threadID);
      const members = threadInfo.participantIDs.filter(id => id !== sender);
      if (!members.length) return message.reply("No one else to kiss 😅");
      two = members[Math.floor(Math.random() * members.length)];
    }

    // Generate avatars
    const avatarURL1 = await usersData.getAvatarUrl(one);
    const avatarURL2 = await usersData.getAvatarUrl(two);

    const img = await new DIG.Kiss().getImage(avatarURL1, avatarURL2);
    const tmpDir = path.join(__dirname, "tmp");
    if (!fs.existsSync(tmpDir)) fs.mkdirSync(tmpDir);
    const pathSave = path.join(tmpDir, `${one}_${two}_kiss.png`);
    fs.writeFileSync(pathSave, Buffer.from(img));

    // Special message for Owners
    const content = senderIsOwner
      ? "👑 My Lord, thanks for using my feature 😘"
      : "😘😘";

    message.reply(
      {
        body: content,
        attachment: fs.createReadStream(pathSave)
      },
      () => fs.unlinkSync(pathSave)
    );
  }
};
