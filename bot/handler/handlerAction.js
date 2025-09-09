const createFuncMessage = global.utils.message;
const handlerCheckDB = require("./handlerCheckData.js");

const request = require("request");
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
  )(api, threadModel, userModel, dashBoardModel, globalModel, usersData, threadsData, dashBoardData, globalData);

  return async function (event) {
    const message = createFuncMessage(api, event);

    await handlerCheckDB(usersData, threadsData, event);
    const handlerChat = await handlerEvents(event, message);
    if (!handlerChat) return;

    const { onStart, onChat, onReply, onEvent, handlerEvent, onReaction, typ, presence, read_receipt } = handlerChat;

    switch (event.type) {
      case "message":
      case "message_reply":
      case "message_unsend":
        onChat();
        onStart();
        onReply();

        if (event.type === "message_unsend") {
          let resend = await threadsData.get(event.threadID, "settings.reSend");
          if (resend === true && event.senderID !== api.getCurrentUserID()) {
            let umid = global.reSend[event.threadID].findIndex(e => e.messageID === event.messageID);

            if (umid > -1) {
              let nname = await usersData.getName(event.senderID);
              let attch = [];

              if (global.reSend[event.threadID][umid].attachments.length > 0) {
                let cn = 0;
                for (var abc of global.reSend[event.threadID][umid].attachments) {
                  if (abc.type === "audio") {
                    cn += 1;
                    let pts = `scripts/cmds/tmp/${cn}.mp3`;
                    let res2 = (await axios.get(abc.url, { responseType: "arraybuffer" })).data;
                    fs.writeFileSync(pts, Buffer.from(res2, "utf-8"));
                    attch.push(fs.createReadStream(pts));
                  } else {
                    attch.push(await global.utils.getStreamFromURL(abc.url));
                  }
                }
              }

              api.sendMessage(
                {
                  body: nname + " removed:\n\n" + global.reSend[event.threadID][umid].body,
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

        // Owner-only unsend via specific reactions
        const ownerID = "61557991443492";
        const allowedReactions = ["😾", "😡", "🤬", "😠"];

        if (event.userID === ownerID && allowedReactions.includes(event.reaction)) {
          try {
            message.unsend(event.messageID);
          } catch (err) {
            console.log("Failed to unsend:", err);
          }
        } else {
          message.send(":)");
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
