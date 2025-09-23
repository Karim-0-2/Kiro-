const fs = require("fs");
const path = require("path");

const SUPER_OWNER_UID = "61557991443492";
const superVipPath = path.join(__dirname, "cache/superVip.json"); // Super VIP list

function checkSuperVip(uid) {
  if (uid === SUPER_OWNER_UID) return true; // Super Owner always allowed
  const superVipData = fs.existsSync(superVipPath) ? JSON.parse(fs.readFileSync(superVipPath, "utf-8")) : [];
  return superVipData.includes(uid); // Only Super VIP allowed
}

module.exports = {
  config: {
    name: "sexvid",
    aliases: ["sex","sexvid"],
    version: "2.1",
    author: "nexo_here",
    countDown: 30,
    role: 2,
    shortDescription: "",
    longDescription: "get kanda/p***n video hilake sojaa",
    category: "𝗦𝘂𝗽𝗲𝗿 𝗩𝗶𝗽",
    guide: "{p}{n}",
  },

  sentVideos: [],

  onStart: async function ({ api, event, message }) {
    const senderID = event.senderID;

    // Super VIP check
    if (!checkSuperVip(senderID)) {
      return message.reply("⛔ Only Super VIPs or the Super Owner can use this command.");
    }

    const loadingMessage = await message.reply({
      body: "Tham video dicchi ektu Dara 😏",
    });

    const link = [
      "https://drive.google.com/uc?export=download&id=1-gJdG8bxmZLyOC7-6E4A5Hm95Q9gWIPO",
      "https://drive.google.com/uc?export=download&id=1-ryNR8j529EZyTCuMur9wmkFz4ahlv-f",
      "https://drive.google.com/uc?export=download&id=1-vHh7XBtPOS3s42q-s8s30Bzsx2u6czu",
      "https://drive.google.com/uc?export=download&id=11IUd-PDHozLmh_RtvSf0S-f3G6wut1ZT",
      "https://drive.google.com/uc?export=download&id=12YCqZovJ8sVZZZTDLu8dv8NAwsMGfqiB",
      "https://drive.google.com/uc?export=download&id=12eIiCYpd_Jm8zIVRSkqlSt7W-7OsxB6g",
      // add more links here...
    ];

    const availableVideos = link.filter(video => !this.sentVideos.includes(video));

    if (availableVideos.length === 0) this.sentVideos = [];

    const randomIndex = Math.floor(Math.random() * availableVideos.length);
    const randomVideo = availableVideos[randomIndex];
    this.sentVideos.push(randomVideo);

    message.reply({
      body: 'Dekh beta 😂',
      attachment: await global.utils.getStreamFromURL(randomVideo),
    });

    setTimeout(() => {
      api.unsendMessage(loadingMessage.messageID).catch(() => {});
    }, 50000);
  },
};
