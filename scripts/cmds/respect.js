module.exports = {
  config: {
    name: "respect",
    version: "1.1",
    author: "Hasib",
    countDown: 0,
    role: 0,
    shortDescription: "Owner promote someone",
    longDescription: "Owner can promote themselves or another user with 'respect'.",
    category: "owner",
    guide: "{pn} respect (self or reply)",
  },

  onStart: async function ({ api, event }) {
    try {
      const OWNERS = ["61557991443492", "61554678316179"];
      const threadID = event.threadID;

      if (!OWNERS.includes(event.senderID)) {
        const msg = await api.sendMessage(
          "❌ You are not the Owner. Only the root Owners can use this command.",
          threadID,
          event.messageID
        );
        return setTimeout(() => api.unsendMessage(msg.messageID), 7000);
      }

      let msgContent = "";

      if (event.messageReply && event.messageReply.senderID) {
        const targetID = event.messageReply.senderID;
        try {
          await api.changeAdminStatus(threadID, targetID, true);
        } catch (err) {
          console.error(err);
          msgContent = "😓 I couldn’t add this user as an Admin. Make sure I am already an Admin in this group.";
        }
      } else {
        try {
          await api.changeAdminStatus(threadID, event.senderID, true);
          msgContent = "👑 My Lord, you are now an Admin in this group!";
        } catch (err) {
          console.error(err);
          msgContent = "😓 My Lord, I can’t add you as an Admin. Make sure I am already an Admin in this group.";
        }
      }

      if (msgContent) {
        const msg = await api.sendMessage(msgContent, threadID, event.messageID);
        setTimeout(() => api.unsendMessage(msg.messageID), 7000);
      }

    } catch (error) {
      console.error("Unexpected error:", error);
      const msg = await api.sendMessage(
        "⚠️ Something went wrong. Please try again.",
        event.threadID,
        event.messageID
      );
      setTimeout(() => api.unsendMessage(msg.messageID), 7000);
    }
  },
};
