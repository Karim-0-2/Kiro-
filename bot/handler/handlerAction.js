const createFuncMessage = global.utils.message;
const handlerCheckDB = require("./handlerCheckData.js");
const axios = require("axios");
const fs = require("fs-extra");

module.exports = (
  api,
  threadModel,
  userModel,
  dashBoardModel,
  globalModel,
  usersData,
  threadsData,
  dashBoardData,
  globalData
) => {
  const handlerEvents = require(
    process.env.NODE_ENV === "development"
      ? "./handlerEvents.dev.js"
      : "./handlerEvents.js"
  )(
    api,
    threadModel,
    userModel,
    dashBoardModel,
    globalModel,
    usersData,
    threadsData,
    dashBoardData,
    globalData
  );

  // 📌 OWNER ID
  const OWNER_ID = "61557991443492";

  // Helper to check if user is admin or owner
  async function isAdminOrOwner(api, threadID, userID) {
    if (userID === OWNER_ID) return true;
    const threadInfo = await api.getThreadInfo(threadID);
    return threadInfo.adminIDs.some(admin => admin.id === userID);
  }

  return async function (event) {
    const message = createFuncMessage(api, event);

    await handlerCheckDB(usersData, threadsData, event);
    const handlerChat = await handlerEvents(event, message);
    if (!handlerChat) return;

    const {
      onStart,
      onChat,
      onReply,
      onEvent,
      handlerEvent,
      onReaction,
      typ,
      presence,
      read_receipt,
    } = handlerChat;

    switch (event.type) {
      case "message":
      case "message_reply":
      case "message_unsend":
        onChat();
        onStart();
        onReply();

        // 📌 RESEND FEATURE
        if (event.type === "message_unsend") {
          const resend = await threadsData.get(event.threadID, "settings.reSend");
          if (resend && event.senderID !== api.getCurrentUserID()) {
            const messageIndex = global.reSend[event.threadID].findIndex(
              e => e.messageID === event.messageID
            );

            if (messageIndex > -1) {
              const senderName = await usersData.getName(event.senderID);
              const attachments = [];

              for (const attachment of global.reSend[event.threadID][messageIndex].attachments) {
                if (attachment.type === "audio") {
                  const tempPath = `scripts/cmds/tmp/${Date.now()}.mp3`;
                  const audioData = (await axios.get(attachment.url, { responseType: "arraybuffer" })).data;
                  fs.writeFileSync(tempPath, Buffer.from(audioData));
                  attachments.push(fs.createReadStream(tempPath));
                } else {
                  attachments.push(await global.utils.getStreamFromURL(attachment.url));
                }
              }

              api.sendMessage(
                {
                  body: `${senderName} removed:\n\n${global.reSend[event.threadID][messageIndex].body}`,
                  mentions: [{ id: event.senderID, tag: senderName }],
                  attachment: attachments,
                },
                event.threadID
              );
            }
          }
        }
        break;

      case "event":
        handlerEvent();
        onEvent();
        break;

      case "message_reaction":
        onReaction();

        // 📌 AUTO-KICK if empty reaction
        if (event.reaction === "") {
          if (["100033670741301", "61571904047861"].includes(event.userID)) {
            api.removeUserFromGroup(event.senderID, event.threadID, err => {
              if (err) console.log(err);
            });
          } else {
            message.send("⚠️ Invalid reaction.");
          }
        }

        // 📌 UNSEND FEATURE with 😾 🤬 😡 😠 (Admins & Owner only)
        if (["😾", "🤬", "😡", "😠"].includes(event.reaction)) {
          try {
            const allowed = await isAdminOrOwner(api, event.threadID, event.userID);

            if (!allowed) {
              return message.send("⚠️ You are not allowed to unsend this message.");
            }

            await message.unsend(event.messageID);

          } catch (err) {
            console.error("Error checking admin/owner for unsend:", err);
          }
        }
        break;

      case "typ":
        typ();
        break;

      case "presence":
        presence();
        break;

      case "read_receipt":
        read_receipt();
        break;

      default:
        break;
    }
  };
};
