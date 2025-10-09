const axios = require("axios");
const fs = require("fs-extra");

const baseApiUrl = async () => {
  const base = await axios.get(`https://raw.githubusercontent.com/Blankid018/D1PT0/main/baseApiUrl.json`);
  return base.data.api;
};

const config = {
  name: "autodl",
  version: "2.0",
  author: "Hasib",
  credits: "Hasib",
  description: "Auto download video from TikTok, Facebook, Instagram, YouTube, and more.",
  category: "media",
  usePrefix: true,
  prefix: true,
  dependencies: {
    "fs-extra": "",
  },
};

const onStart = () => {};

const onChat = async ({ api, event }) => {
  let dipto = event.body ? event.body : "", ex, cp;

  try {
    if (
      dipto.startsWith("https://vt.tiktok.com") ||
      dipto.startsWith("https://www.tiktok.com/") ||
      dipto.startsWith("https://www.facebook.com") ||
      dipto.startsWith("https://www.instagram.com/") ||
      dipto.startsWith("https://youtu.be/") ||
      dipto.startsWith("https://youtube.com/") ||
      dipto.startsWith("https://x.com/") ||
      dipto.startsWith("https://twitter.com/") ||
      dipto.startsWith("https://pin.it/") ||
      dipto.startsWith("https://vm.tiktok.com") ||
      dipto.startsWith("https://fb.watch")
    ) {
      api.setMessageReaction("⌛", event.messageID, {}, true);
      const waitMsg = await api.sendMessage("Wait Bby 😘", event.threadID);

      const response = await axios.get(`${await baseApiUrl()}/alldl?url=${encodeURIComponent(dipto)}`);
      const d = response.data;

      if (d.result.includes(".jpg")) {
        ex = ".jpg";
        cp = "Here's your Photo 😘";
      } else if (d.result.includes(".png")) {
        ex = ".png";
        cp = "Here's your Photo 😘";
      } else if (d.result.includes(".jpeg")) {
        ex = ".jpeg";
        cp = "Here's your Photo 😘";
      } else {
        ex = ".mp4";
        cp = d.cp || "Here’s your video 😘";
      }

      const filePath = __dirname + `/cache/video${ex}`;
      fs.writeFileSync(filePath, Buffer.from((await axios.get(d.result, { responseType: "arraybuffer" })).data, "binary"));

      const tinyUrlResponse = await axios.get(`https://tinyurl.com/api-create.php?url=${d.result}`);

      api.setMessageReaction("✅", event.messageID, {}, true);
      api.unsendMessage(waitMsg.messageID);

      await api.sendMessage({
        body: `${cp}\n✅ | Link: ${tinyUrlResponse.data || d.result}`,
        attachment: fs.createReadStream(filePath),
      }, event.threadID, () => fs.unlinkSync(filePath), event.messageID);
    }
  } catch (err) {
    // Silent fail: only react ❌, no message
    api.setMessageReaction("❌", event.messageID, {}, true);
  }
};

module.exports = {
  config,
  onChat,
  onStart,
  run: onStart,
  handleEvent: onChat,
};
