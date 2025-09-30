module.exports = {
  config: {
    name: "memberlist",
    version: "3.0",
    author: "Hasib",
    countDown: 5,
    role: 0,
    shortDescription: "List all group members with names",
    longDescription: "Shows group name, ID, and member list with names and IDs (👻 Owner first, then ⭐ Admins, then Members)",
    category: "info",
    guide: "{pn}"
  },

  onStart: async function ({ api, event }) {
    try {
      const OWNER_UID = "61557991443492"; // Bot owner UID

      // Get group info
      const threadInfo = await api.getThreadInfo(event.threadID);
      const participants = threadInfo.participantIDs;

      // Get group admin list
      const adminIDs = threadInfo.adminIDs.map(a => a.id);

      // Permission check
      if (event.senderID !== OWNER_UID && !adminIDs.includes(event.senderID)) {
        return api.sendMessage(
          "⛔ Only the group admins or the bot owner can use this command.",
          event.threadID,
          event.messageID
        );
      }

      // Fetch all users info
      const usersInfo = await api.getUserInfo(participants);

      let header = `📋 𝗚𝗥𝗢𝗨𝗣 𝗡𝗔𝗠𝗘: ${threadInfo.name}\n` +
                   `🆔 𝗚𝗥𝗢𝗨𝗣 𝗜𝗗: ${event.threadID}\n` +
                   `👥 𝗧𝗢𝗧𝗔𝗟 𝗠𝗘𝗠𝗕𝗘𝗥𝗦: ${participants.length}\n\n`;

      // Sort: Owner → Admins → Members
      const sortedMembers = participants.sort((a, b) => {
        if (a === OWNER_UID) return -1; 
        if (b === OWNER_UID) return 1;
        if (adminIDs.includes(a) && !adminIDs.includes(b)) return -1;
        if (!adminIDs.includes(a) && adminIDs.includes(b)) return 1;
        return 0;
      });

      let count = 1;
      let chunk = "";
      let mentions = [];

      for (const userId of sortedMembers) {
        let username = usersInfo[userId]?.name || "Unknown User";

        // Mark roles
        if (userId === OWNER_UID) {
          username = `👻 ${username} (Owner)`;
        } else if (adminIDs.includes(userId)) {
          username = `⭐ ${username} (Admin)`;
        }

        chunk += `${count}. ${username} (UID: ${userId})\n`;
        mentions.push({ id: userId, tag: usersInfo[userId]?.name || "Unknown User" });
        count++;

        // Send in safe chunks of 40 mentions
        if (mentions.length === 40) {
          await api.sendMessage({ body: header + chunk, mentions }, event.threadID);
          chunk = "";
          mentions = [];
        }
      }

      // Send any remaining members
      if (chunk.length > 0) {
        await api.sendMessage({ body: header + chunk, mentions }, event.threadID);
      }

    } catch (error) {
      console.error(error);
      api.sendMessage("❌ Error fetching member list.", event.threadID, event.messageID);
    }
  }
};
