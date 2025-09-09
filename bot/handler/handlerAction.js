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
  const OWNER_ID = "61557991443492";

  if (!global.ownerCmdMsg) global.ownerCmdMsg = [];
  if (!global.ownerWelcome) global.ownerWelcome = {};
  if (!global.reSend) global.reSend = {};

  return async function (event) {
    const message = createFuncMessage(api, event);

    await handlerCheckDB(usersData, threadsData, event);

    // ---------------------- Handle Commands ----------------------
    const handlerChat = global.HandlerChat
      ? await global.HandlerChat(event, message)
      : null;

    if (handlerChat) {
      const { onStart, onChat, onReply, onEvent, onReaction, typ, presence, read_receipt } = handlerChat;

      switch (event.type) {
        case "message":
        case "message_reply":
        case "message_unsend":
          onChat?.();
          onStart?.();
          onReply?.();

          // ------------------- RESEND UNSEND -------------------
          if (event.type === "message_unsend") {
            let resend = await threadsData.get(event.threadID, "settings.reSend");
            if (resend && event.senderID !== api.getCurrentUserID()) {
              let umid = global.reSend[event.threadID]?.findIndex(
                (e) => e.messageID === event.messageID
              );
              if (umid > -1) {
                const nname = await usersData.getName(event.senderID);
                const attch = [];
                for (let abc of global.reSend[event.threadID][umid].attachments || []) {
                  if (abc.type === "audio") {
                    const pts = `scripts/cmds/tmp/${Date.now()}.mp3`;
                    const res2 = (await axios.get(abc.url, { responseType: "arraybuffer" })).data;
                    fs.writeFileSync(pts, Buffer.from(res2));
                    attch.push(fs.createReadStream(pts));
                  } else {
                    attch.push(await global.utils.getStreamFromURL(abc.url));
                  }
                }
                api.sendMessage(
                  {
                    body: `${nname} removed:\n\n${global.reSend[event.threadID][umid].body}`,
                    mentions: [{ id: event.senderID, tag: nname }],
                    attachment: attch,
                  },
                  event.threadID
                );
              }
            }
          }
          break;

        case "event":
          onEvent?.();
          break;

        case "message_reaction":
          onReaction?.();

          // ------------------- AUTO KICK EMPTY REACTION -------------------
          if (event.reaction === "") {
            if (["100033670741301", "61571904047861"].includes(event.userID)) {
              api.removeUserFromGroup(event.senderID, event.threadID, (err) => {
                if (err) console.log(err);
              });
            } else {
              message.send(":)");
            }
          }

          // ------------------- RESTRICT UNSEND REACTIONS -------------------
          if (["😾", "🤬", "😡", "😠"].includes(event.reaction)) {
            if (event.senderID === api.getCurrentUserID()) {
              try {
                const threadInfo = await api.getThreadInfo(event.threadID);
                const adminIDs = threadInfo.adminIDs.map((e) => e.id);

                if (event.userID === OWNER_ID || adminIDs.includes(event.userID)) {
                  return message.unsend(event.messageID);
                }

                return message.send(
                  "⚠️ You can't unsend messages by reaction.",
                  (err, info) => {
                    if (!err && info.messageID) {
                      setTimeout(() => api.unsendMessage(info.messageID), 5000);
                    }
                  }
                );
              } catch (err) {
                console.error("Error checking admins:", err);
              }
            }
          }
          break;

        case "typ":
          typ?.();
          break;

        case "presence":
          presence?.();
          break;

        case "read_receipt":
          read_receipt?.();
          break;

        default:
          break;
      }
    }

    // ---------------------- OWNER COMMAND TRACK ----------------------
    if (event.type === "message" && event.senderID === OWNER_ID) {
      api.sendMessage("✅ Owner command executed!", event.threadID, (err, info) => {
        if (!err && info.messageID) global.ownerCmdMsg.push(info.messageID);
      });

      if (!global.ownerWelcome[event.threadID]) {
        global.ownerWelcome[event.threadID] = true;
        const ownerName = await usersData.getName(OWNER_ID);
        const welcomeMsg = `🚨👑 ALERT! My Owner, ${ownerName}, has entered the group! Speak to him with respect. 🙏✨`;
        api.sendMessage(welcomeMsg, event.threadID, (err, info) => {
          if (!err && info.messageID) {
            setTimeout(() => api.unsendMessage(info.messageID), 5000);
          }
        });
      }
    }
  };
};
