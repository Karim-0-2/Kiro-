const { getTime, drive } = global.utils;
if (!global.temp.welcomeEvent)
    global.temp.welcomeEvent = {};

module.exports = {
    config: {
        name: "welcome",
        version: "1.8",
        author: "NTKhang",
        category: "events"
    },

    langs: {
        vi: {
            session1: "sáng",
            session2: "trưa",
            session3: "chiều",
            session4: "tối",
            welcomeMessage: "Cảm ơn bạn đã mời tôi vào nhóm!\nPrefix bot: %1\nĐể xem danh sách lệnh hãy nhập: %1help",
            multiple1: "bạn",
            multiple2: "các bạn",
            defaultWelcomeMessage: "Xin chào {userName}.\nChào mừng bạn đến với {boxName}.\nChúc bạn có buổi {session} vui vẻ!"
        },
        en: {
            session1: "morning",
            session2: "noon",
            session3: "afternoon",
            session4: "evening",
            welcomeMessage: "Thank you for inviting me to the group!\nBot prefix: %1\nTo view the list of commands, please enter: %1help",
            multiple1: "you",
            multiple2: "you guys",
            defaultWelcomeMessage: `Hello {userName}.\nWelcome {multiple} to the chat group: {boxName}\nHave a nice {session} 😊`
        }
    },

    onStart: async ({ threadsData, message, event, api, getLang }) => {
        if (event.logMessageType == "log:subscribe")
            return async function () {
                const hours = getTime("HH");
                const { threadID } = event;
                const { nickNameBot } = global.GoatBot.config;
                const prefix = global.utils.getPrefix(threadID);
                const dataAddedParticipants = event.logMessageData.addedParticipants;

                // If bot joins
                if (dataAddedParticipants.some((item) => item.userFbId == api.getCurrentUserID())) {
                    if (nickNameBot)
                        api.changeNickname(nickNameBot, threadID, api.getCurrentUserID());
                    return message.send(getLang("welcomeMessage", prefix));
                }

                // Initialize thread welcome data
                if (!global.temp.welcomeEvent[threadID])
                    global.temp.welcomeEvent[threadID] = {
                        joinTimeout: null,
                        dataAddedParticipants: []
                    };

                global.temp.welcomeEvent[threadID].dataAddedParticipants.push(...dataAddedParticipants);
                clearTimeout(global.temp.welcomeEvent[threadID].joinTimeout);

                // Set new timeout for sending welcome
                global.temp.welcomeEvent[threadID].joinTimeout = setTimeout(async function () {
                    const threadData = await threadsData.get(threadID);
                    if (threadData.settings.sendWelcomeMessage == false)
                        return;

                    const dataAddedParticipants = global.temp.welcomeEvent[threadID].dataAddedParticipants;
                    const dataBanned = threadData.data.banned_ban || [];
                    const threadName = threadData.threadName;
                    const userName = [];
                    const mentions = [];
                    let multiple = false;

                    if (dataAddedParticipants.length > 1)
                        multiple = true;

                    for (const user of dataAddedParticipants) {
                        if (dataBanned.some((item) => item.id == user.userFbId))
                            continue;
                        userName.push(user.fullName);
                        mentions.push({ tag: user.fullName, id: user.userFbId });
                    }

                    if (userName.length == 0) return;

                    // You can set a join GIF here
                    const joinGif = "https://raw.githubusercontent.com/hasib-1kairim/Oh/f347f99d24d8063a7d97dc2316e78e7279150253/scripts/events/cache/joinGif/join.jpeg";

                    let { welcomeMessage = getLang("defaultWelcomeMessage"), welcomeAttachment } = threadData.data;
                    const form = {
                        mentions: welcomeMessage.match(/\{userNameTag\}/g) ? mentions : null
                    };

                    // Replace placeholders
                    welcomeMessage = welcomeMessage
                        .replace(/\{userName\}|\{userNameTag\}/g, userName.join(", "))
                        .replace(/\{boxName\}|\{threadName\}/g, threadName)
                        .replace(/\{multiple\}/g, multiple ? getLang("multiple2") : getLang("multiple1"))
                        .replace(/\{session\}/g,
                            hours <= 10 ? getLang("session1") :
                                hours <= 12 ? getLang("session2") :
                                    hours <= 18 ? getLang("session3") : getLang("session4")
                        );

                    form.body = welcomeMessage;

                    // Attach GIF or other attachments
                    if (joinGif) {
                        form.attachment = [await drive.getFile(joinGif, "stream")];
                    } else if (welcomeAttachment) {
                        const attachments = welcomeAttachment.map(file => drive.getFile(file, "stream"));
                        form.attachment = (await Promise.allSettled(attachments))
                            .filter(({ status }) => status === "fulfilled")
                            .map(({ value }) => value);
                    }

                    message.send(form);
                    delete global.temp.welcomeEvent[threadID];
                }, 1500);
            };
    }
};
