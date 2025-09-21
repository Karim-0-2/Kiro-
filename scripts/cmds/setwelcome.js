const { existsSync, mkdirSync, createReadStream, unlinkSync } = global.nodemodule["fs-extra"];
const { join } = global.nodemodule["path"];
const https = require("https");
const fs = require("fs");

// Paths
const GIF_PATH = join(__dirname, "cache", "joinGif");
if (!existsSync(GIF_PATH)) mkdirSync(GIF_PATH, { recursive: true });

// Hardcoded owner & bot info
const OWNER_NAME = "𝐊𝐚𝐫𝐢𝐦 𝐁𝐞𝐧𝐳𝐢𝐦𝐚";
const BOT_NAME = "𝐇𝐢𝐧𝐚𝐭𝐚 𝐒𝐚𝐧𝐚";
const OWNER_FB = "https://www.facebook.com/karim.benzima.246709";

// Tenor GIF URL
const WELCOME_GIF_URL = "https://tenor.com/bt2ol.gif";
const WELCOME_GIF_PATH = join(GIF_PATH, "welcome.gif");

// Download GIF if not exists
if (!existsSync(WELCOME_GIF_PATH)) {
    const file = fs.createWriteStream(WELCOME_GIF_PATH);
    https.get(WELCOME_GIF_URL, (res) => {
        res.pipe(file);
    });
}

module.exports.config = {
    name: "setwelcome",
    eventType: ["log:subscribe"],
    version: "1.0.0",
    credits: "𝐊𝐚𝐫𝐢𝐦 𝐁𝐞𝐧𝐳𝐢𝐦𝐚",
    description: "Bangla welcome message with Tenor GIF and auto-unsend",
    dependencies: {}
};

module.exports.run = async function({ api, event }) {
    const { threadID, logMessageData } = event;

    // Ignore if bot itself
    if (logMessageData.addedParticipants.some(i => i.userFbId == api.getCurrentUserID())) {
        await api.changeNickname(`• ${BOT_NAME}`, threadID, api.getCurrentUserID());
        const botMsg = `চ্ঁলে্ঁ এ্ঁসে্ঁছি ${BOT_NAME} এঁখঁনঁ তোঁমাঁদেঁরঁ সাঁথেঁ আঁড্ডাঁ দিঁবঁ..!`;
        api.sendMessage({ body: botMsg, attachment: createReadStream(WELCOME_GIF_PATH) }, threadID, (err, info) => {
            if (err) console.error(err);
            else setTimeout(() => api.unsendMessage(info.messageID), 10000); // unsend after 10s
        });
        return;
    }

    try {
        const { threadName, participantIDs } = await api.getThreadInfo(threadID);
        const newMembers = logMessageData.addedParticipants;

        for (let user of newMembers) {
            const userName = user.fullName;
            const memberCount = participantIDs.length;

            const welcomeMsg = `╭•┄┅═══❁🌺❁═══┅┄•╮

আসসালামু আলাইকুম 💚

╰•┄┅═══❁🌺❁═══┅┄•╯
হাসি, মজা, ঠাট্টায় গড়ে উঠুক
চিরস্থায়ী বন্ধুত্বের বন্ধন 🥰
ভালোবাসা ও সম্পর্ক থাকুক আজীবন 💝

›› প্রিয় ${userName},
আপনি এই গ্রুপের ${memberCount} নম্বর মেম্বার! 🎉

›› গ্রুপ: ${threadName}

💌 🌺 𝐖𝐄𝐋𝐂𝐎𝐌𝐄 🌺 💌
───────────────
Bot ➢ ${BOT_NAME}
Owner ➢ ${OWNER_NAME}
FB ➢ ${OWNER_FB}
❖⋆════════════════⋆❖`;

            api.sendMessage({ body: welcomeMsg, mentions: [{ tag: userName, id: user.userFbId }], attachment: createReadStream(WELCOME_GIF_PATH) }, threadID, (err, info) => {
                if (err) console.error(err);
                else setTimeout(() => api.unsendMessage(info.messageID), 10000); // unsend after 10s
            });
        }
    } catch (e) {
        console.error(e);
    }
};
