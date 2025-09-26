const ownerID = "61557991443492"; // <- your FBUID here

module.exports = {
  config: {
    name: "botnick",
    aliases: ["botname"],
    version: "1.0",
    author: "Hasib",
    countDown: 5,
    role: 2,
    shortDescription: {
      en: "Change nickname of the bot in all group chats"
    },
    longDescription: {
      en: "Change nickname of the bot in all group chats"
    },
    category: "owner",
    guide: {
      en: "{pn} <new nickname>"
    },
    envConfig: {
      delayPerGroup: 250
    }
  },

  langs: {
    en: {
      missingNickname: "Please enter the new nickname for the bot",
      successMessage: "✅ Successfully changed nickname in all group chats to '%1'",
      sendingNotification: "Sending notification to %1 group chats."
    }
  },

  onStart: async function ({ api, args, threadsData, message, getLang, event }) {
    // if not Hasib, just react 😹 and ignore
    if (event.senderID !== ownerID) {
      return api.setMessageReaction("😹", event.messageID, () => {}, true);
    }

    const newNickname = args.join(" ");
    if (!newNickname) return message.reply(getLang("missingNickname"));

    const allThreadID = (await threadsData.getAll())
      .filter(t => t.isGroup && t.members.find(m => m.userID == api.getCurrentUserID())?.inGroup);
    const threadIds = allThreadID.map(thread => thread.threadID);

    for (const threadId of threadIds) {
      try {
        await api.changeNickname(newNickname, threadId, api.getCurrentUserID());
      } catch (error) {
        console.error(`Failed to change nickname for thread ${threadId}: ${error.message}`);
      }
    }

    message.reply(getLang("successMessage", newNickname));
    message.reply(getLang("sendingNotification", allThreadID.length));
  }
};
