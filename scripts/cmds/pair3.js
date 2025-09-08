const { getStreamFromURL } = global.utils;
const fs = require("fs");
const path = require("path");

const VIP_PATH = path.join(__dirname, "cache", "vip.json");
const OWNERS = ["61578418080601", "61557991443492"];
const ADMINS = ["100060606189407", "61576296543095", "61554678316179", "100091527859576"];

module.exports = {
  config: {
    name: "pair3",
    version: "1.0",
    author: "Rulex-al LOUFI",
    shortDescription: {
      en: "Pair Girls 😗",
      vi: ""
    },
    category: "love",
    guide: "{prefix}random-female"
  },

  onStart: async function({ event, threadsData, message, usersData }) {
    try {
      // --- Load VIP data ---
      if (!fs.existsSync(VIP_PATH)) fs.writeFileSync(VIP_PATH, JSON.stringify([]));
      const vipData = JSON.parse(fs.readFileSync(VIP_PATH));
      const sender = String(event.senderID);

      const senderIsOwner = OWNERS.includes(sender);
      const senderIsVIP = vipData.some(u => u.uid === sender);

      // --- VIP check ---
      if (!senderIsOwner && !senderIsVIP) {
        return message.reply("❌ Sorry, you need to be a VIP to use this feature!");
      }

      // --- Main pairing logic ---
      const uidI = event.senderID;
      const avatarUrl1 = await usersData.getAvatarUrl(uidI);
      const name1 = await usersData.getName(uidI);

      const threadData = await threadsData.get(event.threadID);
      const members = threadData.members.filter(member => member.gender === "FEMALE" && member.inGroup);

      if (!members.length) return message.reply("❌ No female members found in this group.");

      const randomIndex = Math.floor(Math.random() * members.length);  
      const randomMember = members[randomIndex];  
      const name2 = await usersData.getName(randomMember.userID);  
      const avatarUrl2 = await usersData.getAvatarUrl(randomMember.userID);  

      const randomNumber1 = Math.floor(Math.random() * 36) + 65;  
      const randomNumber2 = Math.floor(Math.random() * 36) + 65;  

      message.reply({
        body: senderIsOwner
          ? `👑 My Lord, pairing result:  
❤️ ${name1} 💕 ${name2} ❤️

Love percentage: "${randomNumber1}% 🤭"
Compatibility ratio: "${randomNumber2}% 💕"

Congratulations 🥳`
          : `•Everyone congratulates the new husband and wife:  
❤️ ${name1} 💕 ${name2} ❤️

Love percentage: "${randomNumber1}% 🤭"
Compatibility ratio: "${randomNumber2}% 💕"

Congratulations 🥳`,
        attachment: [
          await getStreamFromURL(avatarUrl1),
          await getStreamFromURL(avatarUrl2)
        ]
      });

    } catch (err) {
      console.error(err);
      message.reply("❌ Something went wrong while pairing.");
    }
  }
};
