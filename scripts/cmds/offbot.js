module.exports = {
  config: {
    name: "offbot",
    version: "1.5",
    author: "Hasib",
    countDown: 45,
    role: 2,
    shortDescription: "Turn off bot",
    longDescription: "Shut down bot except protected groups",
    category: "owner",
    guide: "{p}offbot"
  },

  onStart: async function ({ event, api }) {
    const ownerUIDs = ["61557991443492"]; // your UID(s)
    const protectedGroups = ["24349675418031096"]; // add more group IDs as needed

    if (!ownerUIDs.includes(event.senderID)) {
      return api.sendMessage(
        "❌ You don't have permission to use this command!",
        event.threadID,
        event.messageID
      );
    }

    if (protectedGroups.includes(event.threadID)) {
      return api.sendMessage(
        "⚠️ Bot cannot be turned off in this group. It will always stay online here ✅",
        event.threadID
      );
    }

    api.sendMessage(
      "🔌 Bot is shutting down...\n💤 Goodbye! ✅",
      event.threadID,
      () => {
        console.log(`[OFFBOT] Shutdown requested by ${event.senderID} in thread ${event.threadID}`);
        process.exit(1); // PM2 or Forever will restart the bot
      }
    );
  }
};
