module.exports = {
  config: {
    name: "offbot",
    version: "1.1",
    author: "Hasib",
    countDown: 45,
    role: 0,
    shortDescription: "Turn off bot",
    longDescription: "Turn off bot",
    category: "owner",
    guide: "{p}{n}"
  },
  onStart: async function ({ event, api }) {
    const permission = ["61557991443492"]; // <-- your UID
    if (!permission.includes(event.senderID)) {
      return api.sendMessage(
        "❌ You don't have permission to use this command!",
        event.threadID,
        event.messageID
      );
    }

    api.sendMessage(
      "🔌 Bot is shutting down...\n💤 Goodbye! See you next time! ✅",
      event.threadID,
      () => process.exit(0)
    );
  }
};
