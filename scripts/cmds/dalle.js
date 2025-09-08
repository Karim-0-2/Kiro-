const axios = require("axios");
const { createReadStream } = require("fs");
const { writeFile } = require("fs/promises");
const path = require("path");
const fs = require("fs");

const VIP_PATH = path.join(__dirname, "cache", "vip.json");
const OWNERS = ["61578418080601", "61557991443492"]; // Owner UIDs
const ADMINS = ["100060606189407", "61576296543095", "61554678316179", "100091527859576"]; // Admin UIDs

module.exports = {
  config: {
    name: "dalle",
    aliases: ['imagine'],
    version: "1.3.0",
    author: "Rasin",
    countDown: 10,
    role: 2,
    description: { en: "Generate images using DALL·E 3" },
    category: "Image Generation",
    guide: { en: "{pn}dalle [prompt]" }
  },

  onStart: async function ({ event, args, message, api }) {
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

    // --- Prompt check ---
    const prompt = args.join(" ");
    if (!prompt) return message.reply("❌ Please provide a prompt!");

    try {
      const startTime = Date.now();
      const waitMessage = await message.reply(
        senderIsOwner
          ? "👑 My Lord, generating your image..."
          : "⌛ Generating image..."
      );

      const rasinAPI = "https://rasin-x-apis.onrender.com/api/rasin/dalle";
      const apiUrl = `${rasinAPI}?prompt=${encodeURIComponent(prompt)}&apikey=rs_5or55iwr-h6no-z7d7-ifsd-o5`;

      const res = await axios.get(apiUrl);
      const dalleImages = res.data?.dalle;

      if (!dalleImages || dalleImages.length === 0) {
        return message.reply("❌ No images returned!");
      }

      const imageBuffers = [];
      for (let i = 0; i < dalleImages.length; i++) {
        const imgRes = await axios.get(dalleImages[i].url, { responseType: "arraybuffer" });
        const buffer = Buffer.from(imgRes.data, "binary");
        const filePath = path.join(__dirname, `dalle_img_${i}.png`);
        await writeFile(filePath, buffer);
        imageBuffers.push(createReadStream(filePath));
      }

      const time = ((Date.now() - startTime) / 1000).toFixed(2);
      message.unsend(waitMessage.messageID);

      return message.reply({
        body: `✅ Here are your generated image(s) (${time}s)`,
        attachment: imageBuffers
      });

    } catch (e) {
      console.error(e);
      return message.reply(`❌ Error: ${e.message || "Something went wrong!"}`);
    }
  }
};
