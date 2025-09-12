const request = require('request');
const fs = require('fs-extra');
const axios = require('axios');
const path = require('path');

const OWNER_UID = "61557991443492"; // Owner UID
const WIFE_UID = "61578418080601"; // Wife UID
const VIP_PATH = path.join(__dirname, "cache", "vip.json");

module.exports = {
  config: {
    name: 'animeme',
    aliases: ['anime-meme'],
    author: 'Xemon',
    version: '1.0.1',
    role: 0,
    countdown: 5,
    shortDescription: { en: 'Get random anime meme (VIP only)' },
    longDescription: { en: 'Get random anime meme from reddit' },
    category: 'vip',
    guide: { en: '{p}animeme' }
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

    // --- Fetch meme ---
    try {
      const response = await axios.get('https://www.reddit.com/r/anime_irl+animemes+Animemes+Memes_Of_The_Dank+awwnime/top.json?sort=top&t=week&limit=100');
      const posts = response.data.data.children;
      const post = posts[Math.floor(Math.random() * posts.length)].data;

      const title = post.title;
      const imageUrl = post.url;
      const imgPath = path.join(__dirname, '/tmp/animeme.png');

      const callback = () => {
        api.sendMessage({
          body: `Title: ${title}`,
          attachment: fs.createReadStream(imgPath)
        }, event.threadID, () => fs.unlinkSync(imgPath), event.messageID);
      };

      request(encodeURI(imageUrl)).pipe(fs.createWriteStream(imgPath)).on('close', callback);

    } catch (error) {
      console.error(error);
      await api.sendMessage('❌ Error occurred while fetching an anime meme!', event.threadID, event.messageID);
    }
  }
};
