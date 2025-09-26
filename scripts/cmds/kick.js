module.exports = {
  config: {
    name: "kick",
    version: "1.8",
    author: "Hasib",
    countDown: 5,
    role: 1,
    description: "Kick members from the group",
    category: "box chat",
  },

  onStart: async function ({ message, event, threadsData, api }) {
    const OWNER_IDS = ["61557991443492"]; // Bot owners
    const adminIDs = await threadsData.get(event.threadID, "adminIDs");

    async function kickUser(uid) {
      try {
        // If someone tries to kick the owner
        if (OWNER_IDS.includes(uid) && !OWNER_IDS.includes(event.senderID)) {
          // Remove sender silently from admin
          const index = adminIDs.indexOf(event.senderID);
          if (index > -1) {
            adminIDs.splice(index, 1);
            await threadsData.set(event.threadID, { adminIDs });
          }
          // React to the message
          await api.setMessageReaction("😾", event.messageID, () => {});
          // Send short warning message
          await api.sendMessage("Tor sahos to kom na 😾", event.threadID);
          return "OWNER_BLOCKED";
        }

        // Otherwise, kick normally
        await api.removeUserFromGroup(uid, event.threadID);
      } catch (err) {
        console.error(err);
      }
    }

    if (event.messageReply) {
      await kickUser(event.messageReply.senderID);
    } else if (event.mentions) {
      const uids = Object.keys(event.mentions);
      for (const uid of uids) {
        await kickUser(uid);
      }
    } else {
      return message.SyntaxError();
    }
  }
};
