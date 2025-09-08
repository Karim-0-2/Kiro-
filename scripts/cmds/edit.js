const axios = require("axios");
const fs = require("fs-extra");
const path = require("path");

const OWNER_UID = "61557991443492"; // Owner UID
const ADMINS = ["100060606189407", "61576296543095", "61554678316179", "100091527859576"];
const VIP_PATH = path.join(__dirname, "cache", "vip.json");

module.exports = {
  config: {
    name: "edit",
    aliases: ["e"],
    version: "1.2",
    author: "Hasib",
    countDown: 5,
    role: 0,
    shortDescription: { en: "Edit image" },
    longDescription: { en: "Edit an uploaded image (reply only, no prompt)." },
    category: "image",
    guide: { en: "{p}edit (reply to image)" }
  },

  onStart: async function ({ api, event, message }) {
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
      return message.reply("❌ You must be a VIP to use this command!");
    }

    // --- Main logic ---
    const repliedImage = event.messageReply?.attachments?.[0];
    if (!repliedImage || repliedImage.type !== "photo") {
      return message.reply("❌ Reply to an image to edit it.");
    }

    const imgPath = path.join(__dirname, "cache", `${Date.now()}_edit.jpg`);

    try {
      const imgURL = repliedImage.url;
      const imageUrl = `https://edit-and-gen.onrender.com/gen?image=${encodeURIComponent(imgURL)}`;
      const res = await axios.get(imageUrl, { responseType: "arraybuffer" });

      await fs.ensureDir(path.dirname(imgPath));
      await fs.writeFile(imgPath, Buffer.from(res.data, "binary"));

      await message.reply({
        attachment: fs.createReadStream(imgPath)
      });
    } catch (err) {
      console.error("EDIT Error:", err);
      message.reply("❌ Failed to edit the image. Please try again later.");
    } finally {
      await fs.remove(imgPath);
    }
  }
};
