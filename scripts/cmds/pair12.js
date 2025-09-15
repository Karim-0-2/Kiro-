const { getStreamFromURL } = global.utils;
const fs = require("fs");
const path = require("path");

const vipPath = path.join(__dirname, "cache", "vip.json");
const OWNER_UIDS = ["61557991443492", "61578418080601"]; // Fixed owners

// --- Helper: VIP check ---
function isVip(userID) {
  if (OWNER_UIDS.includes(userID)) return true;
  if (!fs.existsSync(vipPath)) return false;
  const data = JSON.parse(fs.readFileSync(vipPath, "utf8"));
  const now = Date.now();
  return data.some(u => u.uid === userID && u.expire > now);
}

module.exports = {
  config: {
    name: "pair12",
    version: "1.1",
    author: "RKO BRO",
    shortDescription: {
      en: "Pair with a random member in the group 😗 (VIP only)",
      vi: ""
    },
    category: "love",
    guide: "{pn}"
  },

  onStart: async function({ event, threadsData, message, usersData }) {
    try {
      const senderID = event.senderID;
      const threadID = event.threadID;

      // VIP check
      if (!isVip(senderID)) {
        const msg = await message.reply("⛔ This command is VIP-only!");
        setTimeout(() => message.unsend(msg.messageID).catch(() => {}), 10000);
        return;
      }

      // Get sender info
      const senderAvatar = await usersData.getAvatarUrl(senderID);
      const senderName = await usersData.getName(senderID);

      // Get thread members
      const threadData = await threadsData.get(threadID);
      const members = threadData.members.filter(member => member.inGroup);

      if (!members.length) {
        return message.reply('There are no members in the group ☹️💕😢');
      }

      // Get sender's gender
      const senderGender = members.find(member => member.userID === senderID)?.gender;

      // Filter eligible members of opposite gender
      const eligibleMembers = members.filter(member => member.gender !== senderGender && member.userID !== senderID);
      if (!eligibleMembers.length) {
        return message.reply('There are no suitable members to pair with ☹️💕😢');
      }

      // Pick a random member
      const randomMember = eligibleMembers[Math.floor(Math.random() * eligibleMembers.length)];
      const memberName = await usersData.getName(randomMember.userID);
      const memberAvatar = await usersData.getAvatarUrl(randomMember.userID);

      // Generate random percentages
      const lovePercentage = Math.floor(Math.random() * 36) + 65; // 65% - 100%
      const compatibility = Math.floor(Math.random() * 36) + 65;

      // Send reply with avatars and message
      message.reply({
        body: `💖 New Pair Alert! 💖
• ${senderName} ❤️ ${memberName}
• Love percentage: ${lovePercentage}% 🤭
• Compatibility ratio: ${compatibility}% 💕
Congratulations 💝`,
        attachment: [
          await getStreamFromURL(senderAvatar),
          await getStreamFromURL(memberAvatar)
        ]
      });

    } catch (error) {
      console.error(error);
      message.reply('Oops! Something went wrong 😢');
    }
  }
};
