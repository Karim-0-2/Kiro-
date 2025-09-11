const axios = require("axios");
const fs = require("fs-extra");
const path = require("path");

const OWNER_UID = "61557991443492"; // Owner UID
const WIFE_UID = "61578418080601"; // Wife UID
const VIP_PATH = path.join(__dirname, "cache", "vip.json");

module.exports = {
  config: {
    name: "edit",
    aliases: ["e"],
    version: "2.0",
    author: "Hasib",
    countDown: 5,
    role: 0,
    shortDescription: { en: "Edit image by prompt" },
    longDescription: { en: "Edit an uploaded image using a prompt." },
    category: "image",
    guide: { en: "{p}edit [prompt] (reply to an image)" }
  },

  onStart: async function ({ api, event, message, args }) {
    // --- Load VIPs ---
    if (!fs.existsSync(VIP_PATH)) fs.writeFileSync(VIP_PATH, JSON.stringify([]));
    let vipData = JSON.parse(fs.readFileSync(VIP_PATH, "utf8"));
    const now = Date.now();
    vipData = vipData.filter(u => u.expire > now);
    fs.writeFileSync(VIP_PATH, JSON.stringify(vipData, null, 2));

    const sender = String(event.senderID);
    const isOwnerOrWife = sender === OWNER_UID || sender === WIFE_UID;
    const isVIP = vipData.some(u => u.uid === sender && u.expire > now);

    if (!isOwnerOrWife && !isVIP) return; // Block non-VIP users

    // --- Check replied image ---
    const repliedImage = event.messageReply?.attachments?.[0];
    if (!repliedImage || repliedImage.type !== "photo") return;

    // --- Get prompt ---
    const prompt = args.join(" ");
    if (!prompt) return message.reply("❌ Please provide a prompt after the command!");

    // --- Reaction: processing ---
    api.setMessageReaction("⏳", event.messageID, () => {}, true);

    const imgPath = path.join(__dirname, "cache", `${Date.now()}_edit.jpg`);

    try {
      const imgURL = repliedImage.url;
      const apiURL = `https://edit-and-gen.onrender.com/gen?image=${encodeURIComponent(imgURL)}&prompt=${encodeURIComponent(prompt)}`;
      const res = await axios.get(apiURL, { responseType: "arraybuffer" });

      await fs.ensureDir(path.dirname(imgPath));
      await fs.writeFile(imgPath, Buffer.from(res.data, "binary"));

      // --- Send edited image ---
      await message.reply({ attachment: fs.createReadStream(imgPath) });

      // --- Reaction: done ---
      api.setMessageReaction("✅", event.messageID, () => {}, true);
    } catch (err) {
      console.error("EDIT Error:", err);
      api.setMessageReaction("❌", event.messageID, () => {}, true);
    } finally {
      await fs.remove(imgPath);
    }
  }
};
