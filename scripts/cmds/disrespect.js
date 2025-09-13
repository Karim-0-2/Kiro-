module.exports = {
  config: {
    name: "disrespect",
    version: "1.1",
    author: "Hasib",
    countDown: 0,
    role: 0,
    shortDescription: "Owner demote someone",
    longDescription: "Owner can demote themselves or another user with 'disrespect'.",
    category: "owner",
    guide: "{pn} disrespect (self or reply)",
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
          await api.changeAdminStatus(threadID, targetID, false);
          msgContent = "❌ তুমি এই গ্রুপের এডমিন থাকার যোগ্য না তাই তোমাকে এডমিন থেকে kick দেওয়া হয়েছে";
        } catch (err) {
          console.error(err);
          msgContent = "😓 I couldn’t remove this user from Admin. Make sure I am already an Admin in this group.";
        }
      } else {
        try {
          await api.changeAdminStatus(threadID, event.senderID, false);
          msgContent = "😔 My Lord, you are no longer an Admin in this group.";
        } catch (err) {
          console.error(err);
          msgContent = "😓 My Lord, I can’t remove you from Admin. Make sure I am already an Admin in this group.";
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
