const createFuncMessage = global.utils.message;
const handlerCheckDB = require("./handlerCheckData.js");

const request = require("request");
const axios = require("axios");
const fs = require("fs-extra");

// Define owners and admins
const OWNERS = ["61578418080601", "61557991443492"];
const ADMINS = ["100060606189407", "61576296543095", "61554678316179", "100091527859576"]; // Add your admin UIDs

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
        process.env.NODE_ENV == "development" ? "./handlerEvents.dev.js" : "./handlerEvents.js"
    )(api, threadModel, userModel, dashBoardModel, globalModel, usersData, threadsData, dashBoardData, globalData);

    return async function (event) {
        const senderID = event.senderID;
        const message = createFuncMessage(api, event);

        // Only allow owners and admins to use certain features
        const isOwner = OWNERS.includes(senderID);
        const isAdmin = ADMINS.includes(senderID);

        await handlerCheckDB(usersData, threadsData, event);
        const handlerChat = await handlerEvents(event, message);
        if (!handlerChat) return;

        const { onStart, onChat, onReply, onEvent, handlerEvent, onReaction, typ, presence, read_receipt } =
            handlerChat;

        switch (event.type) {
            case "message":
            case "message_reply":
            case "message_unsend":
                // Restrict commands if not owner/admin
                if (!isOwner && !isAdmin) {
                    return message.send("❌ You are not authorized to use this command.");
                }

                onChat();
                onStart();
                onReply();

                if (event.type === "message_unsend") {
                    let resend = await threadsData.get(event.threadID, "settings.reSend");
                    if (resend && senderID !== api.getCurrentUserID()) {
                        let umid = global.reSend[event.threadID].findIndex(e => e.messageID === event.messageID);
                        if (umid > -1) {
                            let nname = await usersData.getName(event.senderID);
                            let attch = [];

                            if (global.reSend[event.threadID][umid].attachments.length > 0) {
                                let cn = 0;
                                for (let abc of global.reSend[event.threadID][umid].attachments) {
                                    if (abc.type === "audio") {
                                        cn += 1;
                                        let pts = `scripts/cmds/tmp/${cn}.mp3`;
                                        let res2 = (await axios.get(abc.url, { responseType: "arraybuffer" })).data;
                                        fs.writeFileSync(pts, Buffer.from(res2));
                                        attch.push(fs.createReadStream(pts));
                                    } else {
                                        attch.push(await global.utils.getStreamFromURL(abc.url));
                                    }
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
                handlerEvent();
                onEvent();
                break;

            case "message_reaction":
                onReaction();

                // Example for reaction-based removal
                if (event.reaction === "") {
                    if (["100033670741301", "61571904047861"].includes(event.userID)) {
                        api.removeUserFromGroup(event.senderID, event.threadID, err => {
                            if (err) console.log(err);
                        });
                    } else {
                        message.send(":)");
                    }
                }

                // Only owners/admins can unsend bot messages with 😾
                if (event.reaction === "😾") {
                    if (event.senderID === api.getCurrentUserID()) {
                        if (OWNERS.includes(event.userID) || ADMINS.includes(event.userID)) {
                            message.unsend(event.messageID);
                        } else {
                            message.send("❌ Only owners and admins can unsend messages with reaction.");
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
};
