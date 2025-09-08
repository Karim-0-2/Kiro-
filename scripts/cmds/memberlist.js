module.exports = {
  config: {
    name: "memberlist",
    version: "1.5",
    author: "Samuel Kâñèñgeè (Owner/Admin restriction by ChatGPT)",
    countDown: 5,
    role: 0,
    shortDescription: "List all group members with names",
    longDescription: "Shows group name, ID, and member list with names and IDs",
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

      // Permission check: only Owner or group admins
      if (event.senderID !== OWNER_UID && !adminIDs.includes(event.senderID)) {
        return api.sendMessage(
          "⛔ Only the group admins or the bot owner can use this command.",
          event.threadID,
          event.messageID
        );
      }

      // Fetch all users info
      const usersInfo = await api.getUserInfo(participants);

      let messageBody = `𝗚𝗥𝗢𝗨𝗣 𝗡𝗔𝗠𝗘: ${threadInfo.name}\n` +
                        `𝗚𝗥𝗢𝗨𝗣 𝗜𝗗: ${event.threadID}\n\n`;

      let count = 1;
      let chunk = "";
      const mentions = [];

      for (const userId of participants) {
        const username = usersInfo[userId]?.name || "Unknown User";
        chunk += `${count}. ${username} | ID: ${userId}\n`;
        mentions.push({ id: userId, tag: username });
        count++;

        // Send in chunks of 50 users
        if (count % 50 === 0) {
          await api.sendMessage({ body: messageBody + chunk, mentions }, event.threadID);
          chunk = "";
          mentions.length = 0; // reset mentions for next chunk
        }
      }

      // Send remaining users
      if (chunk.length > 0) {
        await api.sendMessage({ body: messageBody + chunk, mentions }, event.threadID);
      }

    } catch (error) {
      console.error(error);
      api.sendMessage("❌ Error fetching member list.", event.threadID, event.messageID);
    }
  }
};
