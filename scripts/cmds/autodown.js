const axios = require("axios");
const fs = require("fs");
const path = require("path");

module.exports = {
  config: {
    name: "autodown",
    aliases: ["autodl"],
    version: "2.0.0",
    author: "Nazrul + Upgraded",
    role: 0,
    description: "Auto-download media from any platform (video, audio, image)",
    category: "media",
    guide: { en: "Send any media link" }
  },

  onStart: async function({}) {},

  onChat: async function({ api, event }) {
    const urls = event.body?.match(/https?:\/\/[^\s]+/g);
    if (!urls?.length) return;

    api.setMessageReaction("⏳", event.messageID, () => {}, true);

    const apiUrl = (await axios.get("https://raw.githubusercontent.com/nazrul4x/Noobs/main/Apis.json")).data.api;

    for (let url of urls) {
      try {
        const { data } = await axios.get(`${apiUrl}/nazrul/alldlxx?url=${encodeURIComponent(url)}`);
        if (!data?.url) throw new Error(data.error || "No download link found");

        const ext = data.url.split(".").pop().split("?")[0] || "mp4";
        const filePath = path.join(__dirname, `n_${Date.now()}.${ext}`);

        const writer = fs.createWriteStream(filePath);
        const response = await axios({
          url: data.url,
          method: 'GET',
          responseType: 'stream',
          headers: {
            'User-Agent': 'Mozilla/5.0',
            'Accept': '*/*',
            'Connection': 'keep-alive'
          }
        });

        response.data.pipe(writer);

        await new Promise((resolve, reject) => {
          writer.on('finish', resolve);
          writer.on('error', reject);
        });

        await api.sendMessage({
          body: `${data.t}\n🛠️ Platform: ${data.p}`,
          attachment: fs.createReadStream(filePath)
        }, event.threadID);

        fs.unlink(filePath, () => {});
        api.setMessageReaction("✅", event.messageID, () => {}, true);

      } catch (e) {
        api.setMessageReaction("❌", event.messageID, () => {}, true);
        console.log(`[Autodown Error]: ${e.message}`);
      }
    }
  }
};
