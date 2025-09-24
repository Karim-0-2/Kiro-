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
    name: "pussy",
    aliases: ["pussy"],
    version: "1.1",
    author: "Doru fix by kivv",
    countDown: 5,
    role: 2,
    shortDescription: "send you pic of pussy",
    longDescription: "sends u pic of girls pussy",
    category: "𝗦𝘂𝗽𝗲𝗿 𝗩𝗶𝗽",
    guide: "{pn}"
  },

  onStart: async function ({ message, event }) {
    // Super VIP check
    if (!checkSuperVip(event.senderID)) {
      return message.send("⛔ Only Super VIPs or the Super Owner can use this command.");
    }

    const links = [
      "https://i.ibb.co/jfqMF07/image.jpg",
      "https://i.ibb.co/tBBCS4y/image.jpg",
      "https://i.ibb.co/3zpyMVY/image.jpg",
      "https://i.ibb.co/gWbWT8k/image.jpg",
      "https://i.ibb.co/mHtyD1P/image.jpg",
      "https://i.ibb.co/vPHNhdY/image.jpg",
      "https://i.ibb.co/rm6rPjb/image.jpg",
      "https://i.ibb.co/7GpN2GW/image.jpg",
      "https://i.ibb.co/CnfMVpg/image.jpg"
    ];

    const img = links[Math.floor(Math.random() * links.length)];

    await message.send({
      body: '「 Pussy💦🥵 」',
      attachment: await global.utils.getStreamFromURL(img)
    });
  }
};
