const { exec } = require("child_process");
const fs = require("fs");
const path = require("path");

module.exports = {
  config: {
    name: "a",
    version: "1.0",
    author: "Hasib",
    cooldowns: 5,
    description: { en: "Download audio from any video link" },
    category: "media",
    guide: { en: "{pn} [video link]" }
  },

  onStart: async function ({ args, message }) {
    const url = args[0];
    if (!url) return message.reply("❌ Please provide a video link!");

    message.reply("🎧 Downloading audio... Please wait...");

    exec(`python3 extract_audio.py "${url}"`, async (err, stdout) => {
      if (err) return message.reply("❌ Download failed:\n" + err.message);

      let data;
      try {
        data = JSON.parse(stdout);
      } catch {
        return message.reply("❌ Failed to parse audio info.");
      }

      if (data.error) return message.reply("❌ Error: " + data.error);

      const filePath = data.filename;
      if (!fs.existsSync(filePath)) return message.reply("❌ Audio file not found!");

      message.reply({
        body: `✅ Here's the audio from: ${data.title}`,
        attachment: fs.createReadStream(filePath)
      }, () => {
        fs.unlinkSync(filePath); // Send এর পর ফাইল ডিলিট
      });
    });
  }
};
