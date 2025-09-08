const axios = require("axios");
const fs = require("fs");
const path = require("path");

const VIP_PATH = path.join(__dirname, "cache", "vip.json");
const OWNERS = ["61557991443492"]; // Owner UIDs

const xApi = async () => {
  const res = await axios.get(
    "https://raw.githubusercontent.com/nazrul4x/Noobs/main/Apis.json"
  );
  return res.data.api2;
};

async function downloadAndSendVideo(videoUrl, api, event) {
  try {
    const { messageID, threadID } = event;
    api.setMessageReaction("🦆", messageID, () => {}, true);

    const { data } = await axios.get(
      `${await xApi()}/nazrul/ytMp4?url=${encodeURIComponent(videoUrl)}`
    );

    if (!data.downloads?.data?.fileUrl) {
      throw new Error("Download link not found!");
    }

    const downloadUrl = data.downloads.data.fileUrl;
    const fileName = `video_${Date.now()}.mp4`;
    const filePath = path.join(__dirname, fileName);

    const response = await axios({
      url: downloadUrl,
      method: "GET",
      responseType: "stream",
    });

    const writer = fs.createWriteStream(filePath);
    response.data.pipe(writer);

    return new Promise((resolve, reject) => {
      writer.on("finish", () => {
        let messageBody = "✅ Here's your video";
        if (data.title) messageBody += `\n🛠️ Title: ${data.title}`;
        if (data.duration) messageBody += `\n⏱ Duration: ${data.duration}`;

        api.sendMessage(
          { body: messageBody, attachment: fs.createReadStream(filePath) },
          threadID,
          (err) => {
            fs.unlinkSync(filePath);
            if (err) reject(err);
            else {
              api.setMessageReaction("✅", messageID, () => {}, true);
              resolve();
            }
          }
        );
      });

      writer.on("error", (err) => {
        fs.unlinkSync(filePath);
        reject(new Error(`🦆 Failed: ${err.message}`));
      });
    });
  } catch (err) {
    api.setMessageReaction("❌", event.messageID, () => {}, true);
    throw err;
  }
}

module.exports.config = {
  name: "video",
  aliases: ["v"],
  version: "1.7.0",
  author: "Nazrul + Hasib",
  role: 0,
  countDown: 15,
  category: "media",
  guide: {
    en: "{pn} [YouTube URL] - Download video\n{pn} [search query] - Search and download",
  },
};

module.exports.onStart = async ({ api, event, args }) => {
  const { threadID, messageID } = event;
  let sender = String(event.senderID);

  // --- Load VIPs ---
  if (!fs.existsSync(VIP_PATH)) fs.writeFileSync(VIP_PATH, JSON.stringify([]));
  let vipData = JSON.parse(fs.readFileSync(VIP_PATH));
  const now = Date.now();
  vipData = vipData.filter(u => u.expire > now);
  fs.writeFileSync(VIP_PATH, JSON.stringify(vipData, null, 2));

  const isOwner = OWNERS.includes(sender);
  const isVIP = vipData.some(u => u.uid === sender && u.expire > now);

  if (!isOwner && !isVIP) {
    return api.sendMessage(
      "❌ You are not a VIP! Ask an Owner to add you.",
      threadID,
      messageID
    );
  }

  let query = args.join(" ");
  const ytRegex = /https?:\/\/(www\.)?(youtube\.com|youtu\.be)\/\S+/gi;
  let videoUrl =
    event.messageReply?.body?.match(ytRegex)?.[0] || query.match(ytRegex)?.[0];

  try {
    if (!videoUrl) {
      if (!query) {
        return api.sendMessage(
          "❌ Please provide a YouTube URL or search query",
          threadID,
          messageID
        );
      }

      const searchResponse = await axios.get(
        `${await xApi()}/nazrul/ytSearch?query=${encodeURIComponent(query)}`
      );

      const videos = searchResponse.data?.data;

      if (!videos?.length) {
        return api.sendMessage("🦆 No videos found for your search", threadID, messageID);
      }

      // Pick a random video from the first 3 results
      videoUrl = videos[Math.floor(Math.random() * Math.min(3, videos.length))].url;
    }

    await downloadAndSendVideo(videoUrl, api, event);

  } catch (err) {
    api.sendMessage(`🦆 Error: ${err.message}`, threadID, messageID);
  }
};
