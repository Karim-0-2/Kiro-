const fs = require("fs");
const path = require("path");

const VIP_PATH = path.join(__dirname, "/cache/vip.json");
const OWNERS = ["61578418080601", "61557991443492"];
const ADMINS = ["100060606189407", "61576296543095", "61554678316179", "100091527859576"];

module.exports = {
  config: {
    name: "gc",
    author: "Hasib",
    category: "fakechat",
    version: "2.6",
    countDown: 5,
    role: 0,
    guide: {
      en: `<text> ++ <text> | reply | --user <uid> | --theme <theme number> | --attachment <image url> | --time <true or false> | blank
THEMES:
0. lo-fi
1. bubble tea
2. swimming
3. lucky pink
4. default
5. monochrome
Adding more themes soon`
    }
  },

  onStart: async function({ message, usersData, event, args, api }) {
    // --- Load VIP data ---
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

    // --- Prepare prompt ---
    let prompt = args.join(" ").split("\n").join("++");
    if (!prompt) return message.reply("❌ Please provide a text");

    let id = event.senderID;

    // Handle --user flag or reply sender
    if (event.messageReply) {
      if (prompt.match(/--user/)) {
        const userPart = prompt.split("--user ")[1].split(" ")[0];
        id = userPart.includes(".com") ? await api.getUID(userPart) : userPart;
      } else {
        id = event.messageReply.senderID;
      }
    } else if (prompt.match(/--user/)) {
      const userPart = prompt.split("--user ")[1].split(" ")[0];
      id = userPart.includes(".com") ? await api.getUID(userPart) : userPart;
    }

    // Default theme
    let themeID = 4;
    if (prompt.match(/--theme/)) themeID = prompt.split("--theme ")[1].split(" ")[0];

    // Handle special user check (original logic)
    if (event?.messageReply?.senderID === "100063840894133" || event?.messageReply?.senderID === "100083343477138") {
      if (event.senderID !== "100063840894133" && event.senderID !== "100083343477138") {
        prompt = "hi guys I'm gay";
        id = event.senderID;
      }
    }

    // User name and avatar
    const name = (await usersData.getName(id)).split(" ")[0];
    const avatarUrl = await usersData.getAvatarUrl(id);

    // Reply image
    let replyImage;
    if (event?.messageReply?.attachments[0]) {
      replyImage = event.messageReply.attachments[0].url;
    } else if (prompt.match(/--attachment/)) {
      replyImage = prompt.split("--attachment ")[1].split(" ")[0];
    }

    // Time param
    let time = prompt.split("--time ")[1];
    time = time === "true" || !time ? "true" : "";

    // Clean prompt text
    prompt = prompt.split("--")[0].trim();

    message.reaction("⏳", event.messageID);
    try {
      let url = `https://tawsifz-fakechat.onrender.com/image?theme=${themeID}&name=${encodeURIComponent(name)}&avatar=${encodeURIComponent(avatarUrl)}&text=${encodeURIComponent(prompt)}&time=${time}`;
      if (replyImage) url += `&replyImageUrl=${encodeURIComponent(replyImage)}`;

      message.reply({ attachment: await global.utils.getStreamFromURL(url, 'gc.png') });
      message.reaction("✅", event.messageID);
    } catch (error) {
      message.send("❌ | " + error.message);
    }
  }
};
