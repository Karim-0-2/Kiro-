const axios = require("axios");
const fs = require("fs-extra");
const path = require("path");

const baseApiUrl = async () => {
  const base = await axios.get(
    "https://raw.githubusercontent.com/Blankid018/D1PT0/main/baseApiUrl.json"
  );
  return base.data.api;
};

module.exports = {
  config: {
    name: "alldl",
    author: "Dipto",
    version: "1.0.9",
    cooldown: 3,
    role: 0,
    shortDescription: "Download videos from TikTok, YouTube, Facebook, and more",
    longDescription: "Download videos from multiple platforms using an all-in-one downloader API.",
    category: "media",
    guide: "{pn} [video_link]",
  },

  onStart: async function ({ message, args }) {
    const link = args[0];
    if (!link) {
      return message.react("❌"); // no link = invalid input
    }

    const cacheDir = path.join(__dirname, "cache");
    const filePath = path.join(cacheDir, "vid.mp4");

    try {
      await message.react("⏳"); // downloading reaction

      const apiBase = await baseApiUrl();
      const { data } = await axios.get(`${apiBase}/alldl?url=${encodeURIComponent(link)}`);

      if (!data?.result) throw new Error("No valid download link found.");

      // Ensure cache directory
      if (!fs.existsSync(cacheDir)) fs.mkdirSync(cacheDir);

      // Download video
      const videoData = (
        await axios.get(data.result, { responseType: "arraybuffer" })
      ).data;
      fs.writeFileSync(filePath, Buffer.from(videoData, "utf-8"));

      // Shorten URL if available
      let shortUrl = data.result;
      if (global.utils && typeof global.utils.shortenURL === "function") {
        try {
          shortUrl = await global.utils.shortenURL(data.result);
        } catch {}
      }

      // Send file
      await message.reply({
        body: `${data.cp || "✅ Download Complete!"}\n🔗 Link: ${shortUrl}`,
        attachment: fs.createReadStream(filePath),
      });

      await message.react("✅"); // success
    } catch {
      await message.react("❎"); // failed silently
    } finally {
      if (fs.existsSync(filePath)) fs.unlinkSync(filePath); // clean cache
    }
  },
};
