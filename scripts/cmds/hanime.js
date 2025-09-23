const axios = require("axios");
const fs = require("fs");
const path = require("path");

const superVipPath = path.join(__dirname, "cache/superVip.json"); // for super VIP
const SUPER_OWNER_UID = "61557991443492";

async function fetchAnimeList(query) {
  try {
    const response = await axios.get(`https://hanime-reco.vercel.app/search?query=${query}`);
    const data = JSON.parse(response.data.response);
    return data;
  } catch (error) {
    console.error(error);
    throw new Error("Failed to fetch anime list");
  }
}

async function fetchRecentAnimeList() {
  try {
    const response = await axios.get("https://hanime-reco.vercel.app/recent");
    const data = JSON.parse(response.data.response);
    return data;
  } catch (error) {
    console.error(error);
    throw new Error("Failed to fetch recent anime list");
  }
}

async function downloadPoster(posterUrl, fileName) {
  try {
    const cacheDir = path.join(__dirname, 'cache');
    if (!fs.existsSync(cacheDir)) fs.mkdirSync(cacheDir, { recursive: true });

    const response = await axios.get(posterUrl, { responseType: "stream" });
    const writer = fs.createWriteStream(fileName);
    response.data.pipe(writer);
    return new Promise((resolve, reject) => {
      writer.on("finish", () => resolve(fileName));
      writer.on("error", reject);
    });
  } catch (error) {
    console.error(error);
    throw new Error("Failed to download image");
  }
}

function checkSuperVip(uid) {
  if (uid === SUPER_OWNER_UID) return true; // Super Owner always allowed
  const superVipData = fs.existsSync(superVipPath) ? JSON.parse(fs.readFileSync(superVipPath, "utf-8")) : [];
  return superVipData.includes(uid); // Only Super VIP allowed
}

module.exports = {
  config: {
    name: "hanime",
    author: "Vex_Kshitiz",
    version: "1.2",
    cooldowns: 5,
    role: 2,
    shortDescription: "search or get recent hentai list",
    longDescription: "search for hentai or get recent hentai list",
    category: "Super vip",
    guide: "{p}hanime {query/recent}",
  },

  onStart: async function ({ api, event, args }) {
    // Only Super Owner or Super VIP
    if (!checkSuperVip(event.senderID)) {
      api.sendMessage({ body: "⛔ Only Super VIPs or the Super Owner can use this command." }, event.threadID, event.messageID);
      return;
    }

    api.setMessageReaction("🕐", event.messageID, () => {}, true);

    try {
      const subCmd = args[0]?.toLowerCase();
      let animeList = [];

      if (subCmd === 'recent') {
        animeList = await fetchRecentAnimeList();
      } else {
        const query = args.join(" ");
        animeList = await fetchAnimeList(query);
      }

      if (!Array.isArray(animeList) || animeList.length === 0) {
        api.sendMessage({ body: `No hanime found.` }, event.threadID, event.messageID);
        api.setMessageReaction("❌", event.messageID, () => {}, true);
        return;
      }

      const animeNames = animeList.map((anime, index) => `${index + 1}. ${anime.name}`).join("\n");
      const message = `Choose an hanime by replying with its number:\n\n${animeNames}`;

      api.sendMessage({ body: message }, event.threadID, (err, info) => {
        global.GoatBot.onReply.set(info.messageID, {
          commandName: "hanime",
          messageID: info.messageID,
          author: event.senderID,
          animeList,
        });
      });

      api.setMessageReaction("✅", event.messageID, () => {}, true);
    } catch (error) {
      console.error(error);
      api.sendMessage({ body: "{p} hanime {query} or {p} hanime recent / reply by number" }, event.threadID, event.messageID);
      api.setMessageReaction("❌", event.messageID, () => {}, true);
    }
  },

  onReply: async function ({ api, event, Reply, args }) {
    const { author, animeList } = Reply;
    if (event.senderID !== author || !animeList) return;

    const animeIndex = parseInt(args[0], 10);
    if (isNaN(animeIndex) || animeIndex <= 0 || animeIndex > animeList.length) {
      api.sendMessage({ body: "Invalid input.\nPlease provide a valid number." }, event.threadID, event.messageID);
      return;
    }

    const selectedAnime = animeList[animeIndex - 1];
    const posterUrl = selectedAnime.poster_url;
    const description = selectedAnime.description;

    try {
      const posterFileName = path.join(__dirname, 'cache', `${Date.now()}_${selectedAnime.name}.jpg`);
      await downloadPoster(posterUrl, posterFileName);
      const posterStream = fs.createReadStream(posterFileName);
      api.sendMessage({ body: description, attachment: posterStream }, event.threadID, event.messageID);
    } catch (error) {
      console.error(error);
      api.sendMessage({ body: "An error occurred while processing the anime.\nPlease try again later." }, event.threadID);
    } finally {
      global.GoatBot.onReply.delete(event.messageID);
    }
  },
};
