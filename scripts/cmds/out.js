module.exports = {
  config: {
    name: "out",
    author: "xnil",
    role: 2,
    shortDescription: "Make the bot leave the group",
    category: "admin",
    guide: "{pn}"
  },

  onStart: async function ({ api, event }) {
    const threadID = event.threadID;
    const senderID = event.senderID;

    // Check if it's a group chat
    const threadInfo = await api.getThreadInfo(threadID);
    if (!threadInfo.isGroup) {
      return api.sendMessage("❌ This command can only be used in group chats.", threadID);
    }

    // Special farewell if the owner uses the command
    const farewellMessage = senderID === "61557991443492"
      ? "🙏 I respect you, my Lord. I shall leave the group now. Farewell! 👋"
      : "👋 Goodbye! I'm leaving this group now...";

    await api.sendMessage(farewellMessage, threadID, () => {
      api.removeUserFromGroup(api.getCurrentUserID(), threadID);
    });
  }
};
