const DIG = require('discord-image-generation');
const https = require('https');
const fs = require('fs');
const path = require('path');

const OWNER_UID = "61557991443492"; // Owner UID
const WIFE_UID = "61578418080601"; // Wife UID
const VIP_PATH = path.join(__dirname, "cache", "vip.json");

module.exports = {
  config: {
    name: 'hitler',
    version: '1.1',
    author: 'AceGun',
    description: "Generates an image with Hitler effect applied to the user's avatar.",
    category: 'vip',
    usage: '{prefix}hitler [@mention]',
    role: 0
  },

  onStart: async function ({ event, api, message }) {
    // --- Load VIPs ---
    if (!fs.existsSync(VIP_PATH)) fs.writeFileSync(VIP_PATH, JSON.stringify([]));
    let vipData = JSON.parse(fs.readFileSync(VIP_PATH, "utf8"));
    const now = Date.now();
    vipData = vipData.filter(u => u.expire > now);
    fs.writeFileSync(VIP_PATH, JSON.stringify(vipData, null, 2));

    const sender = String(event.senderID);
    const isOwnerOrWife = sender === OWNER_UID || sender === WIFE_UID;
    const isVIP = vipData.some(u => u.uid === sender && u.expire > now);

    if (!isOwnerOrWife && !isVIP) {
      return message.reply("❌ This command is VIP-only!");
    }

    // --- Visual feedback: processing ---
    api.setMessageReaction('⏳', event.messageID, () => {}, true);

    try {
      let userID;

      if (event.mentions && Object.keys(event.mentions).length > 0) {
        userID = Object.keys(event.mentions)[0];
      } else {
        const threadInfo = await api.getThreadInfo(event.threadID);
        const participants = threadInfo.participantIDs.filter(id => id !== api.getCurrentUserID());
        userID = participants[Math.floor(Math.random() * participants.length)];
      }

      const avatarUrl = `https://graph.facebook.com/${userID}/picture?width=512&height=512&access_token=6628568379%7Cc1e620fa708a1d5696fb991c1bde5662`;
      const avatar = await fetchImage(avatarUrl);

      const hitlerImage = await new DIG.Hitler().getImage(avatar);
      const pathHitler = __dirname + '/cache/hitler.png';
      fs.writeFileSync(pathHitler, hitlerImage);

      let bodyText = 'This guy is worse than Hitler!';
      let mentions = [];
      if (event.mentions && Object.keys(event.mentions).length > 0) {
        const mentionID = Object.keys(event.
