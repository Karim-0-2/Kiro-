const { getTime, drive } = global.utils;
if (!global.temp.welcomeEvent) global.temp.welcomeEvent = {};

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
        },
        bd: {
            botJoin: "চ্ঁলে্ঁ এ্ঁসে্ঁছি্ঁ {BOT_NAME} এঁখঁনঁ তোঁমাঁদেঁরঁ সাঁথেঁ আঁড্ডাঁ দিঁবঁ..!",
            welcomeStart: "আ্ঁস্ঁসা্ঁলা্ঁমু্ঁ💚আ্ঁলা্ঁই্ঁকু্ঁম্ঁ",
            welcomeEnd: "হাসি, মজা, ঠাট্টায় গড়ে উঠুক\nচিরস্থায়ী বন্ধুত্বের বন্ধন।🥰\nভালোবাসা ও সম্পর্ক থাকুক আজীবন।💝",
            viewCommands: "কমান্ড দেখতে টাইপ করুন: {prefix}help"
        }
    },

    // Hardcoded Goat Bot info
    BOT_NAME: "𝐇𝐢𝐧𝐚𝐭𝐚 𝐒𝐚𝐧𝐚",
    OWNER_NAME: "𝐊𝐚𝐫𝐢𝐦 𝐁𝐞𝐧𝐳𝐢𝐦𝐚",
    OWNER_FB: "https://www.facebook.com/karim.benzima.246709",

    onStart: async ({ threadsData, message, event, api, getLang }) => {
        if (event.logMessageType == "log:subscribe") return async function () {
            const hours = getTime("HH");
            const { threadID } = event;
            const { nickNameBot } = global.GoatBot.config;
            const prefix = global.utils.getPrefix(threadID);
            const dataAddedParticipants = event.logMessageData.addedParticipants;

            // If the bot itself joins
            if (dataAddedParticipants.some(item => item.userFbId == api.getCurrentUserID())) {
                if (nickNameBot) await api.changeNickname(nickNameBot, threadID, api.getCurrentUserID());

                const botJoinMsg = getLang("bd", "botJoin").replace("{BOT_NAME}", this.BOT_NAME) +
                    `\n\nPrefix: ${prefix}\nOwner: ${this.OWNER_NAME}\nFacebook: ${this.OWNER_FB}`;

                const sentBotMsg = await message.send(botJoinMsg);
                return setTimeout(() => {
                    api.unsendMessage(sentBotMsg.messageID).catch(err => console.error(err));
                }, 10000);
            }

            // If new member joins
            if (!global.temp.welcomeEvent[threadID]) {
                global.temp.welcomeEvent[threadID] = {
                    joinTimeout: null,
                    dataAddedParticipants: []
                };
            }

            global.temp.welcomeEvent[threadID].dataAddedParticipants.push(...dataAddedParticipants);
            clearTimeout(global.temp.welcomeEvent[threadID].joinTimeout);

            // Set timeout to send welcome message
            global.temp.welcomeEvent[threadID].joinTimeout = setTimeout(async () => {
                const threadData = await threadsData.get(threadID);
                if (threadData.settings.sendWelcomeMessage == false) return;

                const participants = global.temp.welcomeEvent[threadID].dataAddedParticipants;
                const dataBanned = threadData.data.banned_ban || [];
                const threadName = threadData.threadName;
                const userName = [], mentions = [];
                let multiple = participants.length > 1;

                for (const user of participants) {
                    if (dataBanned.some(item => item.id == user.userFbId)) continue;
                    userName.push(user.fullName);
                    mentions.push({ tag: user.fullName, id: user.userFbId });
                }
                if (userName.length == 0) return;

                let { welcomeMessage = getLang("defaultWelcomeMessage") } = threadData.data;
                const form = { mentions: welcomeMessage.match(/\{userNameTag\}/g) ? mentions : null };

                // Bangla-style welcome message
                welcomeMessage = `${getLang("bd", "welcomeStart")}\n\n${userName.join(", ")}\n\n${getLang("bd", "welcomeEnd")}\n\n★ Owner: ${this.OWNER_NAME}\nFacebook: ${this.OWNER_FB}\n★ Bot Name: ${this.BOT_NAME}`;

                form.body = welcomeMessage;

                if (threadData.data.welcomeAttachment) {
                    const files = threadData.data.welcomeAttachment;
                    const attachments = files.map(file => drive.getFile(file, "stream"));
                    form.attachment = (await Promise.allSettled(attachments))
                        .filter(a => a.status === "fulfilled")
                        .map(a => a.value);
                }

                // Send and auto-delete after 10s
                const sentMessage = await message.send(form);
                setTimeout(() => {
                    api.unsendMessage(sentMessage.messageID).catch(err => console.error(err));
                }, 10000);

                delete global.temp.welcomeEvent[threadID];
            }, 1500);
        };
    }
};
