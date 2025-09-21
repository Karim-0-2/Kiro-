const { getTime, drive } = global.utils;
if (!global.temp.welcomeEvent) global.temp.welcomeEvent = {};

module.exports = {
    config: {
        name: "welcome",
        version: "1.9",
        author: "NTKhang",
        category: "events",
        description: "Send a Bangla-style welcome message with GIF when new members join."
    },

    langs: {
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
        if (event.logMessageType !== "log:subscribe") return;

        const { threadID } = event;
        const prefix = global.utils.getPrefix(threadID);
        const dataAddedParticipants = event.logMessageData.addedParticipants;

        // If the bot itself joins
        if (dataAddedParticipants.some(item => item.userFbId == api.getCurrentUserID())) {
            const botJoinMsg = getLang("bd", "botJoin").replace("{BOT_NAME}", this.BOT_NAME) +
                `\n\nPrefix: ${prefix}\nOwner: ${this.OWNER_NAME}\nFacebook: ${this.OWNER_FB}\n★ Bot Name: ${this.BOT_NAME}`;

            const sentBotMsg = await message.send(botJoinMsg);
            return setTimeout(() => {
                api.unsendMessage(sentBotMsg.messageID).catch(err => console.error(err));
            }, 10000);
        }

        // Initialize thread temp data
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
            const userName = [], mentions = [];

            for (const user of participants) {
                if (dataBanned.some(item => item.id == user.userFbId)) continue;
                userName.push(user.fullName);
                mentions.push({ tag: user.fullName, id: user.userFbId });
            }
            if (userName.length === 0) return;

            // Bangla-style welcome message with Naruto Hi GIF
            const welcomeMessage = `
${getLang("bd", "welcomeStart")}

${userName.join(", ")}

${getLang("bd", "welcomeEnd")}

★ Owner: ${this.OWNER_NAME}
Facebook: ${this.OWNER_FB}
★ Bot Name: ${this.BOT_NAME}

![Naruto Hi GIF](https://media.tenor.com/images/1b9e2a5a8f4a0b9b3b8e9e6c7e6c6e6e/tenor.gif)
`;

            const form = { body: welcomeMessage, mentions: mentions.length ? mentions : null };

            if (threadData.data.welcomeAttachment) {
                const files = threadData.data.welcomeAttachment;
                const attachments = files.map(file => drive.getFile(file, "stream"));
                form.attachment = (await Promise.allSettled(attachments))
                    .filter(a => a.status === "fulfilled")
                    .map(a => a.value);
            }

            // Send welcome message and auto-delete after 10s
            const sentMessage = await message.send(form);
            setTimeout(() => {
                api.unsendMessage(sentMessage.messageID).catch(err => console.error(err));
            }, 10000);

            delete global.temp.welcomeEvent[threadID];
        }, 1500);
    }
};
