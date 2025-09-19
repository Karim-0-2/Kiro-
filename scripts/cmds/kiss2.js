const fs = require("fs-extra");
const path = require("path");
const { createCanvas, loadImage } = require("canvas");

const VIP_PATH = path.join(__dirname, "/cache/vip.json");
const OWNERS = ["61578418080601", "61557991443492"];
const ADMINS = ["100060606189407", "61576296543095", "61554678316179", "100091527859576"];

module.exports = {
  config: {
    name: "kiss2",
    aliases: ["kissbg"],
    version: "1.1",
    author: "Hasib",
    countDown: 5,
    role: 0,
    shortDescription: "KISS with fixed background (VIP only, Owner exempt)",
    category: "funny",
    guide: "{pn} @tag | reply to someone's message | no input to kiss random member"
  },

  onStart: async function ({ api, message, event, usersData }) {
    // --- Load VIPs ---
    if (!fs.existsSync(VIP_PATH)) fs.writeFileSync(VIP_PATH, JSON.stringify([]));
    const vipData = JSON.parse(fs.readFileSync(VIP_PATH));

    const sender = String(event.senderID);

    // --- Access check ---
    const senderIsOwner = OWNERS.includes(sender);
    const senderIsAdmin = ADMINS.includes(sender);
    const senderIsVIP = vipData.some(u => u.uid === sender);

    if (!senderIsOwner && !senderIsVIP) {
      if (senderIsAdmin) return message.reply("⚠️ Admins must be VIP to use this command!");
      else return message.reply("❌ You must be a VIP to use this command!");
    }

    let one = sender;
    let two;

    const mention = Object.keys(event.mentions || {});

    if (mention.length > 0) {
      two = mention[0];
    } else if (event.messageReply) {
      two = event.messageReply.senderID;
    } else {
      // Pick random user from thread except sender
      const threadInfo = await api.getThreadInfo(event.threadID);
      const members = threadInfo.participantIDs.filter(id => id !== sender);
      if (!members.length) return message.reply("No one else to kiss 😅");
      two = members[Math.floor(Math.random() * members.length)];
    }

    // Load avatars
    const avatarURL1 = await usersData.getAvatarUrl(one);
    const avatarURL2 = await usersData.getAvatarUrl(two);
    const avatar1 = await loadImage(avatarURL1);
    const avatar2 = await loadImage(avatarURL2);

    // Load background
    const background = await loadImage("https://i.imgur.com/3laJwc1.jpg");

    // Create canvas
    const canvas = createCanvas(background.width, background.height);
    const ctx = canvas.getContext("2d");

    // Draw background
    ctx.drawImage(background, 0, 0, canvas.width, canvas.height);

    // Avatar size (adjust as needed)
    const avatarSize = 200;

    // --- Place avatars on the faces like your example ---
    // Left face
    ctx.save();
    ctx.beginPath();
    ctx.arc(430, 370, avatarSize / 2, 0, Math.PI * 2); 
    ctx.closePath();
    ctx.clip();
    ctx.drawImage(avatar1, 330, 270, avatarSize, avatarSize);
    ctx.restore();

    // Right face
    ctx.save();
    ctx.beginPath();
    ctx.arc(870, 370, avatarSize / 2, 0, Math.PI * 2);
    ctx.closePath();
    ctx.clip();
    ctx.drawImage(avatar2, 770, 270, avatarSize, avatarSize);
    ctx.restore();

    // Save image
    const tmpDir = path.join(__dirname, "tmp");
    if (!fs.existsSync(tmpDir)) fs.mkdirSync(tmpDir);
    const pathSave = path.join(tmpDir, `${one}_${two}_kissbg.png`);
    const buffer = canvas.toBuffer("image/png");
    fs.writeFileSync(pathSave, buffer);

    const content = senderIsOwner ? "👑 My Lord, thanks for using my feature 😘" : "😘😘";

    message.reply(
      {
        body: content,
        attachment: fs.createReadStream(pathSave)
      },
      () => fs.unlinkSync(pathSave)
    );
  }
};
