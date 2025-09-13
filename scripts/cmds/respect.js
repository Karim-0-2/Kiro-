module.exports = {
  config: {
    name: "respect",
    aliases: ["disrespect"],
    version: "4.1",
    author: "AceGun x Samir Œ (Hasib)",
    countDown: 0,
    role: 0,
    shortDescription: "Owner promote/demote",
    longDescription: "Owner can promote with 'respect' and demote with 'disrespect'.",
    category: "owner",
    guide: "{pn} respect (self or reply)\n{pn} disrespect (self or reply)",
  },

  onStart: async function ({ api, event }) {
    try {
      // === Root Owners UIDs ===
      const OWNERS = ["61557991443492", "61554678316179"]; 
      const threadID = event.threadID;
      const command = event.body.trim().toLowerCase();

      // Only owners can use this command
      if (!OWNERS.includes(event.senderID)) {
        return api.sendMessage(
          "❌ You are not the Owner. Only the root Owners can use this command.",
          threadID,
          event.messageID
        );
      }

      // ========== RESPECT (PROMOTE) ==========
      if (command.includes("respect")) {
        if (event.messageReply && event.messageReply.senderID) {
          // Reply case → promote target silently
          const targetID = event.messageReply.senderID;
          try {
            await api.changeAdminStatus(threadID, targetID, true);
          } catch (err) {
            console.error(err);
            return api.sendMessage(
              "😓 I couldn’t add this user as an Admin. Make sure I am already an Admin in this group.",
              threadID,
              event.messageID
            );
          }
        } else {
          // Not reply → promote owner with message
          try {
            await api.changeAdminStatus(threadID, event.senderID, true);
            return api.sendMessage(
              "👑 My Lord, you are now an Admin in this group!",
              threadID,
              event.messageID
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
      }

      // ========== DISRESPECT (DEMOTE) ==========
      if (command.includes("disrespect")) {
        if (event.messageReply && event.messageReply.senderID) {
          // Reply case → demote target + send Bengali message
          const targetID = event.messageReply.senderID;
          try {
            await api.changeAdminStatus(threadID, targetID, false);
            return api.sendMessage(
              "❌ তুমি এই গ্রুপের এডমিন থাকার যোগ্য না তাই তোমাকে এডমিন থেকে kick দেওয়া হয়েছে",
              threadID
            );
          } catch (err) {
            console.error(err);
            return api.sendMessage(
              "😓 I couldn’t remove this user from Admin. Make sure I am already an Admin in this group.",
              threadID,
              event.messageID
            );
          }
        } else {
          // Not reply → demote owner with message
          try {
            await api.changeAdminStatus(threadID, event.senderID, false);
            return api.sendMessage(
              "😔 My Lord, you are no longer an Admin in this group.",
              threadID,
              event.messageID
            );
          } catch (err) {
            console.error(err);
            return api.sendMessage(
              "😓 My Lord, I can’t remove you from Admin. Make sure I am already an Admin in this group.",
              threadID,
              event.messageID
            );
          }
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
