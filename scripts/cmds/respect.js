module.exports = {
  config: {
    name: "respect",
    aliases: [],
    version: "1.9",
    author: "AceGun x Samir Œ (Hasib)",
    countDown: 0,
    role: 0,
    shortDescription: "Promote someone or owner to admin",
    longDescription: "If the owner replies to someone with this command, the bot promotes them. Otherwise, the owner gets admin.",
    category: "owner",
    guide: "{pn} respect (use as reply or normal message)",
  },

  onStart: async function ({ api, event }) {
    try {
      const OWNER_ID = "61557991443492"; // Root owner UID
      const threadID = event.threadID;

      // Only owner can use this command
      if (event.senderID !== OWNER_ID) {
        return api.sendMessage(
          "❌ You are not the Owner. Only the root Owner can use this command.",
          threadID,
          event.messageID
        );
      }

      // Check if this is a reply
      if (event.messageReply && event.messageReply.senderID) {
        const targetID = event.messageReply.senderID;

        // Prevent owner from promoting themselves via reply
        if (targetID === OWNER_ID) {
          return api.sendMessage(
            "❌ You cannot promote yourself by replying to your own message. Use the command normally to promote yourself.",
            threadID,
            event.messageID
          );
        }

        // Try to promote the replied-to user
        try {
          await api.changeAdminStatus(threadID, targetID, true);
          return api.sendMessage(
            `✅ The person you respected has been promoted to Admin!\nThey must respect the owner and not misuse any powers.`,
            threadID
          );
        } catch (err) {
          console.error(err);
          return api.sendMessage(
            "😓 I couldn’t add this user as an Admin. Make sure I am already an Admin in this group.",
            threadID,
            event.messageID
          );
        }
      } else {
        // Not a reply → promote the owner
        try {
          await api.changeAdminStatus(threadID, OWNER_ID, true);
          return api.sendMessage(
            "👑 My Lord, you are now an Admin in this group! 🙇‍♂️\nEveryone must respect your authority and not misuse any powers.",
            threadID
          );
        } catch (err) {
          console.error(err);
          return api.sendMessage(
            "😓 My Lord, I can’t add you as an Admin. Make sure I am already an Admin in this group.",
            threadID,
            event.messageID
          );
        }
      }
    } catch (error) {
      console.error("Unexpected error:", error);
      api.sendMessage(
        "⚠️ Something went wrong. Please try again.",
        event.threadID,
        event.messageID
      );
    }
  },
};
