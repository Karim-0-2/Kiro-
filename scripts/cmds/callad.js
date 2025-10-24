const { getStreamsFromAttachment, log } = global.utils;
const mediaTypes = ["photo", "png", "animated_image", "video", "audio"];

// 👇 Your personal UID
const OWNER_UID = "61557991443492";

module.exports = {
  config: {
    name: "callad",
    version: "1.8",
    author: "Modified by Hasib",
    countDown: 5,
    role: 0,
    description: {
      en: "Send report, feedback, or message directly to the owner"
    },
    category: "contacts admin",
    guide: {
      en: "{pn} <message>"
    }
  },

  langs: {
    en: {
      missingMessage: "Please enter the message you want to send to the owner",
      sendByGroup: "\n- Sent from group: %1\n- Thread ID: %2",
      sendByUser: "\n- Sent from user",
      content: "\n\nContent:\n─────────────────\n%1\n─────────────────\nReply this message to reply to user",
      success: "✅ Message sent successfully to the owner!",
      failed: "❌ Failed to send message to the owner.\n%1",
      reply: "📍 Reply from owner %1:\n─────────────────\n%2\n─────────────────\nReply this message to continue chat.",
      replySuccess: "✅ Your reply has been sent to the owner.",
      feedback: "💬 Message from %1\n- User ID: %2%3\n\n─────────────────\n%4\n─────────────────\nReply to message to reply to the user.",
      replyUserSuccess: "✅ Your reply has been sent to the user."
    }
  },

  onStart: async function ({ args, message, event, usersData, threadsData, api, commandName, getLang }) {
    if (!args[0])
      return message.reply(getLang("missingMessage"));

    const { senderID, threadID, isGroup } = event;
    const senderName = await usersData.getName(senderID);

    const msg = "==📨 CALL OWNER 📨=="
      + `\n- User: ${senderName}`
      + `\n- UID: ${senderID}`
      + (isGroup ? getLang("sendByGroup", (await threadsData.get(threadID)).threadName, threadID) : getLang("sendByUser"));

    const formMessage = {
      body: msg + getLang("content", args.join(" ")),
      mentions: [{ id: senderID, tag: senderName }],
      attachment: await getStreamsFromAttachment(
        [...event.attachments, ...(event.messageReply?.attachments || [])]
          .filter(item => mediaTypes.includes(item.type))
      )
    };

    try {
      const messageSend = await api.sendMessage(formMessage, OWNER_UID);
      message.reply(getLang("success"));

      global.GoatBot.onReply.set(messageSend.messageID, {
        commandName,
        messageID: messageSend.messageID,
        threadID,
        messageIDSender: event.messageID,
        type: "userToOwner"
      });
    } catch (err) {
      log.err("CALL OWNER", err);
      message.reply(getLang("failed", err.message));
    }
  },

  onReply: async ({ args, event, api, message, Reply, usersData, commandName, getLang }) => {
    const { type, threadID, messageIDSender } = Reply;
    const senderName = await usersData.getName(event.senderID);
    const { isGroup } = event;

    switch (type) {
      case "userToOwner": {
        // Owner replying to user
        const formMessage = {
          body: getLang("reply", senderName, args.join(" ")),
          mentions: [{ id: event.senderID, tag: senderName }],
          attachment: await getStreamsFromAttachment(
            event.attachments.filter(item => mediaTypes.includes(item.type))
          )
        };

        api.sendMessage(formMessage, threadID, (err, info) => {
          if (err)
            return message.err(err);
          message.reply(getLang("replyUserSuccess"));
          global.GoatBot.onReply.set(info.messageID, {
            commandName,
            messageID: info.messageID,
            messageIDSender: event.messageID,
            threadID: event.threadID,
            type: "ownerReply"
          });
        }, messageIDSender);
        break;
      }

      case "ownerReply": {
        // User replying to owner
        let sendByGroup = "";
        if (isGroup) {
          const { threadName } = await api.getThreadInfo(event.threadID);
          sendByGroup = getLang("sendByGroup", threadName, event.threadID);
        }
        const formMessage = {
          body: getLang("feedback", senderName, event.senderID, sendByGroup, args.join(" ")),
          mentions: [{ id: event.senderID, tag: senderName }],
          attachment: await getStreamsFromAttachment(
            event.attachments.filter(item => mediaTypes.includes(item.type))
          )
        };

        api.sendMessage(formMessage, OWNER_UID, (err, info) => {
          if (err)
            return message.err(err);
          message.reply(getLang("replySuccess"));
          global.GoatBot.onReply.set(info.messageID, {
            commandName,
            messageID: info.messageID,
            messageIDSender: event.messageID,
            threadID: event.threadID,
            type: "userToOwner"
          });
        }, messageIDSender);
        break;
      }

      default:
        break;
    }
  }
};
