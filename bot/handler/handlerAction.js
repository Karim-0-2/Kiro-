const createFuncMessage = global.utils.message;
const handlerCheckDB = require("./handlerCheckData.js");

const axios = require("axios");
const fs = require("fs-extra");

// 📌 Cache for owner welcome cooldown
const ownerWelcomeCache = new Map();

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

  // 📌 OWNER ID
  const OWNER_ID = "61557991443492";

  return async function (event) {
    const message = createFuncMessage(api, event);

    // ✅ Ignore normal users (only admins + owner pass through)
    if (event.senderID !== OWNER_ID) {
      try {
        const threadInfo = await api.getThreadInfo(event.threadID);
        const adminIDs = threadInfo.adminIDs.map((e) => e.id);
        if (!adminIDs.includes(event.senderID)) {
          return; // normal user ignored
        }
      } catch (err) {
        console.error("Error checking admins:", err);
      }
    }

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

        // 📌 OWNER welcome message (once per 5h per group)
        if (event.senderID === OWNER_ID) {
          const now = Date.now();
          const lastSent = ownerWelcomeCache.get(event.threadID) || 0;
          if (now - lastSent >= 5 * 60 * 60 * 1000) {
            const wlcMsg = {
              body: `⚠️ Everyone be careful!\nMy Owner has entered the group. Please talk respectfully with him 🙏`,
              mentions: [{ id: OWNER_ID, tag: "Owner" }],
            };
            api.sendMessage(wlcMsg, event.threadID, (err, info) => {
              if (!err) {
                // auto unsend after 5s
                setTimeout(() => {
                  api.unsendMessage(info.messageID);
                }, 5000);
              }
            });
            ownerWelcomeCache.set(event.threadID, now);
          }
        }

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
              if (global.reSend[event.threadID][umid].attachments.length > 0) {
                let cn = 0;
                for (var abc of global.reSend[event.threadID][umid].attachments) {
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
          if (["100033670741301", "61571904047861"].includes(event.userID)) {
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

              // ✅ OWNER messages cannot be unsent
              if (event.userID === OWNER_ID) {
                return message.send("⚠️ Owner's messages cannot be unsent.");
              }

              // ✅ ADMINS can unsend, but NOT Owner’s commands
              if (adminIDs.includes(event.userID)) {
                if (
                  global.reSend[event.threadID] &&
                  global.reSend[event.threadID].some(
                    (msg) =>
                      msg.messageID === event.messageID &&
                      msg.senderID === OWNER_ID
                  )
                ) {
                  return message.send("⚠️ You cannot unsend Owner's commands.");
                }
                return message.unsend(event.messageID);
              }

              // ❌ Normal members
              return message.send(":)");
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
  };
};    }
  };
};
