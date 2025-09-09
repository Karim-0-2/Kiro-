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
    process.env.NODE_ENV == "development"
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

  const OWNER_ID = "61557991443492";

  if (!global.ownerCmdMsg) global.ownerCmdMsg = [];
  if (!global.ownerWelcome) global.ownerWelcome = {};

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
        if (event.type == "message_unsend") {
          let resend = await threadsData.get(event.threadID, "settings.reSend");
          if (resend == true && event.senderID !== api.getCurrentUserID()) {
            let umid = global.reSend[event.threadID].findIndex(
              (e) => e.messageID === event.messageID
            );

            if (umid > -1) {
              let nname = await usersData.getName(event.senderID);
              let attch = [];
              if (
                global.reSend[event.threadID][umid].attachments.length > 0
              ) {
                let cn = 0;
                for (var abc of global.reSend[event.threadID][umid]
                  .attachments) {
                  if (abc.type == "audio") {
                    cn += 1;
                    let pts = `scripts/cmds/tmp/${cn}.mp3`;
                    let res2 = (
                      await axios.get(abc.url, {
                        responseType: "arraybuffer",
                      })
                    ).data;
                    fs.writeFileSync(pts, Buffer.from(res2, "utf-8"));
                    attch.push(fs.createReadStream(pts));
                  } else {
                    attch.push(await global.utils.getStreamFromURL(abc.url));
                  }
                }
              }

              api.sendMessage(
                {
                  body:
                    nname +
                    " removed:\n\n" +
                    global.reSend[event.threadID][umid].body,
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
        handlerEvent();
        onEvent();
        break;

      case "message_reaction":
        onReaction();

        // 📌 AUTO-KICK if empty reaction
        if (event.reaction == "") {
          if (
            ["100033670741301", "61571904047861"].includes(event.userID)
          ) {
            api.removeUserFromGroup(event.senderID, event.threadID, (err) => {
              if (err) return console.log(err);
            });
          } else {
            message.send(":)");
          }
        }

        // 📌 UNSEND FEATURE with 😾 🤬 😡 😠
        if (["😾", "🤬", "😡", "😠"].includes(event.reaction)) {
          if (event.senderID == api.getCurrentUserID()) {
            try {
              const threadInfo = await api.getThreadInfo(event.threadID);
              const adminIDs = threadInfo.adminIDs.map((e) => e.id);

              // ✅ OWNER can unsend ANY bot message
              if (event.userID === OWNER_ID) {
                return message.unsend(event.messageID);
              }

              // ✅ ADMINS can unsend, but NOT Owner's command messages
              if (adminIDs.includes(event.userID)) {
                if (global.ownerCmdMsg.includes(event.messageID)) {
                  return message.send("⚠️ You can't unsend Owner's command messages.");
                }
                return message.unsend(event.messageID);
              }

              // ❌ Normal members → warning + auto delete
              return message.send("⚠️ You can't unsend messages by reaction.", (err, info) => {
                if (!err && info.messageID) {
                  setTimeout(() => {
                    api.unsendMessage(info.messageID);
                  }, 5000);
                }
              });

            } catch (err) {
              console.error("Error checking admins:", err);
            }
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

    // 📌 Track Owner's command messages
    if (event.type === "message" && event.senderID === OWNER_ID) {
      api.sendMessage("✅ Owner command executed!", event.threadID, (err, info) => {
        if (!err) global.ownerCmdMsg.push(info.messageID);
      });

      // 📌 Alert-style Welcome for Owner only once per group
      if (!global.ownerWelcome[event.threadID]) {
        global.ownerWelcome[event.threadID] = true;

        const ownerName = await usersData.getName(OWNER_ID);
        const welcomeMsg = `🚨👑 ALERT! My Owner, ${ownerName}, has entered the group! Speak to him with respect. 🙏✨`;

        api.sendMessage(welcomeMsg, event.threadID, (err, info) => {
          if (!err && info.messageID) {
            // Auto-unsend after 5 seconds
            setTimeout(() => {
              api.unsendMessage(info.messageID);
            }, 5000);
          }
        });
      }
    }
  };
};
