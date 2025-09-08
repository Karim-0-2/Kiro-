const fs = require("fs-extra");
const path = require("path");

const VIP_PATH = path.join(__dirname, "cache", "vip.json");
const OWNER_UID = "61557991443492";

module.exports = {
  config: {
    name: "pair5",
    author: "Hasib",
    role: 0,
    shortDescription: "Pair with a random member in chat",
    category: "love",
    guide: "{pn}"
  },

  onStart: async function({ api, event, usersData }) {
    if (!fs.existsSync(VIP_PATH)) fs.writeFileSync(VIP_PATH, JSON.stringify([]));
    let vipData = JSON.parse(fs.readFileSync(VIP_PATH));
    const now = Date.now();
    vipData = vipData.filter(u => u.expire > now);

    const sender = String(event.senderID);
    const isOwner = sender === OWNER_UID;
    const isVIP = vipData.some(u => u.uid === sender && u.expire > now);

    if (!isVIP && !isOwner) {
      return api.sendMessage("❌ You are not a VIP! Ask an owner to add you.", event.threadID);
    }

    const ThreadInfo = await api.getThreadInfo(event.threadID);
    const botID = api.getCurrentUserID();
    const members = ThreadInfo.userInfo.filter(u => u.id !== sender && u.id !== botID);
    if (!members.length) return api.sendMessage("❌ No one to pair with!", event.threadID);

    const partner = members[Math.floor(Math.random() * members.length)];
    const name1 = await usersData.getName(sender);
    const name2 = await usersData.getName(partner.id);

    const emojis = ["💞","💖","💘","💗"];
    const tile = Math.floor(Math.random() * 101);

    const messageBody = isOwner 
      ? `👑 My Lord, you are paired with ${name2} ${emojis[Math.floor(Math.random()*emojis.length)]} — Love chance: ${tile}%`
      : `${name1} ${emojis[Math.floor(Math.random()*emojis.length)]} ${name2} — Love meter: ${tile}%`;

    return api.sendMessage(messageBody, event.threadID);
  }
};
