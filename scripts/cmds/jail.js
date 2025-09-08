const DIG = require("discord-image-generation");
const fs = require("fs-extra");
const path = require("path");

const VIP_PATH = path.join(__dirname, "cache", "vip.json");
const OWNER_UID = "61557991443492";

module.exports = {
  config: {
    name: "jail",
    version: "1.3",
    author: "Samir Thakuri + Hasib",
    countDown: 5,
    role: 0,
    shortDescription: "Jail image (VIP only, Owner exempt)",
    longDescription: "Generate a jail-style image for someone",
    category: "image",
    guide: { en: "{pn} @tag [optional text]" }
  },

  langs: {
    vi: { 
      noTag: "Bạn phải tag người bạn muốn tù", 
      notVIP: "❌ Chỉ VIP mới có thể sử dụng lệnh này!", 
      ownerWarn: "⚠️ Đừng cố tù chủ bot! Bạn sẽ bị cảnh cáo!" 
    },
    en: { 
      noTag: "You must tag the person you want to jail", 
      notVIP: "❌ Only VIPs can use this command!", 
      ownerWarn: "⚠️ Do not jail the bot owner! You will be warned!" 
    }
  },

  onStart: async function({ event, message, usersData, args, getLang }) {
    try {
      // --- Load VIPs ---
      if (!fs.existsSync(VIP_PATH)) fs.writeFileSync(VIP_PATH, JSON.stringify([]));
      let vipData = JSON.parse(fs.readFileSync(VIP_PATH));
      const now = Date.now();
      vipData = vipData.filter(u => u.expire > now);
      fs.writeFileSync(VIP_PATH, JSON.stringify(vipData, null, 2));

      const sender = String(event.senderID);
      const isOwner = sender === OWNER_UID;
      const isVIP = vipData.some(u => u.uid === sender && u.expire > now);

      if (!isOwner && !isVIP) {
        return message.reply(getLang("notVIP"));
      }

      const uid2 = Object.keys(event.mentions)[0];
      if (!uid2) return message.reply(getLang("noTag"));

      // --- Warn if targeting owner ---
      if (uid2 === OWNER_UID && !isOwner) {
        return message.reply(getLang("ownerWarn"));
      }

      const avatarURL2 = await usersData.getAvatarUrl(uid2);

      // Generate jail image
      const img = await new DIG.Jail().getImage(avatarURL2);

      // Save image temporarily
      const tmpDir = path.join(__dirname, "tmp");
      await fs.ensureDir(tmpDir);
      const pathSave = path.join(tmpDir, `${uid2}_Jail.png`);
      fs.writeFileSync(pathSave, Buffer.from(img));

      // Optional custom message
      const content = args.join(" ").replace(Object.keys(event.mentions)[0], "").trim();
      const replyText = content || "You're in jail! 🚔";

      await message.reply({
        body: replyText,
        attachment: fs.createReadStream(pathSave)
      });

      // Clean up
      fs.unlinkSync(pathSave);

    } catch (err) {
      console.error(err);
      message.reply("❌ Something went wrong while generating the jail image.");
    }
  }
};
