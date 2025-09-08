const fs = require("fs-extra");
const path = require("path");

const VIP_PATH = path.join(__dirname, "cache", "vip.json");
const OWNER_UID = "61557991443492";

module.exports = {
  config: {
    name: "pair4",
    author: "Hasib",
    role: 0,
    shortDescription: "Exclusive VIP pairing",
    category: "love",
    guide: "{pn} | reply to someone's message"
  },

  onStart: async function({ api, event, usersData }) {
    if (!fs.existsSync(VIP_PATH)) fs.writeFileSync(VIP_PATH, JSON.stringify([]));
    let vipData = JSON.parse(fs.readFileSync(VIP_PATH));
    const now = Date.now();
    vipData = vipData.filter(u => u.expire > now);

    const sender = String(event.senderID);
    const isOwner = sender === OWNER_UID;
    const isVIP = vipData.some(u => u.uid === sender && u.expire > now);

    if (!isVIP && !isOwner) return api.sendMessage("❌ VIP only feature!", event.threadID);

    let id2;
    if (event.messageReply) id2 = event.messageReply.senderID;
    else {
      const ThreadInfo = await api.getThreadInfo(event.threadID);
      const botID = api.getCurrentUserID();
      const members = ThreadInfo.userInfo.filter(u => u.id !== sender && u.id !== botID);
      if (!members.length) return api.sendMessage("❌ No partner found!", event.threadID);
      id2 = members[Math.floor(Math.random() * members.length)].id;
    }

    const name1 = await usersData.getName(sender);
    const name2 = await usersData.getName(id2);
    const tile = Math.floor(Math.random() * 101);

    const ownerReplies = [
      `${name2}, lucky you! My Lord chose you 💌`,
      `Wow ${name2}! Paired with My Lord 😍`,
      `Blessed day! ${name2}, My Lord is with you 💖`
    ];

    const messageBody = isOwner ? ownerReplies[Math.floor(Math.random()*ownerReplies.length)] : `💗 ${name1} 💕 ${name2} — Love chance: ${tile}%`;

    return api.sendMessage(messageBody, event.threadID);
  }
};
