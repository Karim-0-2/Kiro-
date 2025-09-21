module.exports.config = {
    name: "welcome",
    eventType: ["log:subscribe"],
    version: "1.0.0",
    credits: "𝐊𝐚𝐫𝐢𝐦 𝐁𝐞𝐧𝐳𝐢𝐦𝐚",
    description: "Welcome message with optional image/video for Goat Bot",
    dependencies: {
        "fs-extra": "",
        "path": ""
    }
};

module.exports.onLoad = function () {
    const { existsSync, mkdirSync } = global.nodemodule["fs-extra"];
    const { join } = global.nodemodule["path"];
    const paths = [
        join(__dirname, "cache", "joinGif"),
        join(__dirname, "cache", "randomgif")
    ];
    for (const path of paths) {
        if (!existsSync(path)) mkdirSync(path, { recursive: true });
    }
};

// Hardcoded owner and bot info for Goat Bot
const OWNER_NAME = "𝐊𝐚𝐫𝐢𝐦 𝐁𝐞𝐧𝐳𝐢𝐦𝐚";
const BOT_NAME = "𝐇𝐢𝐧𝐚𝐭𝐚 𝐒𝐚𝐧𝐚";
const OWNER_FB = "https://www.facebook.com/karim.benzima.246709";

module.exports.run = async function({ api, event }) {
    const fs = require("fs");
    const path = require("path");
    const { threadID } = event;
    const botPrefix = global.config.PREFIX || "/";

    // If Goat Bot joins the group
    if (event.logMessageData.addedParticipants.some(i => i.userFbId == api.getCurrentUserID())) {
        await api.changeNickname(`[ ${botPrefix} ] • ${BOT_NAME}`, threadID, api.getCurrentUserID());

        api.sendMessage(`চ্ঁলে্ঁ এ্ঁসে্ঁছি্ঁ ${𝐇𝐢𝐧𝐚𝐭𝐚 𝐒𝐚𝐧𝐚} এঁখঁনঁ তোঁমাঁদেঁরঁ সাঁথেঁ আঁড্ডাঁ দিঁবঁ..!`, threadID, () => {  
            const randomGifPath = path.join(__dirname, "cache", "randomgif");  
            const allFiles = fs.readdirSync(randomGifPath).filter(file =>  
                [".mp4", ".jpg", ".png", ".jpeg", ".gif", ".mp3"].some(ext => file.endsWith(ext))  
            );  

            const selected = allFiles.length > 0   
                ? fs.createReadStream(path.join(randomGifPath, allFiles[Math.floor(Math.random() * allFiles.length)]))   
                : null;  

            const messageBody = `╭•┄┅═══❁🌺❁═══┅┄•╮  
আ্ঁস্ঁসা্ঁলা্ঁমু্ঁ💚আ্ঁলা্ঁই্ঁকু্ঁম্ঁ

╰•┄┅═══❁🌺❁═══┅┄•╯

𝐓𝐡𝐚𝐧𝐤 𝐲𝐨𝐮 𝐟𝐨𝐫 𝐚𝐝𝐝𝐢𝐧𝐠 𝐦𝐞 𝐭𝐨 𝐲𝐨𝐮𝐫 𝐢-𝐠𝐫𝐨𝐮𝐩-🖤🤗
𝐈 𝐰𝐢𝐥𝐥 𝐚𝐥𝐰𝐚𝐲𝐬 𝐬𝐞𝐫𝐯𝐞 𝐲𝐨𝐮 𝐢𝐧𝐚𝐡𝐚𝐥𝐥𝐚𝐡 🌺❤️

𝐓𝐨 𝐯𝐢𝐞𝐰 𝐚𝐧𝐲 𝐜𝐨𝐦𝐦𝐚𝐧𝐝:
${botPrefix}Help
${botPrefix}Info
${botPrefix}Admin

★ For any complaints or help, contact owner ${𝐊𝐚𝐫𝐢𝐦 𝐁𝐞𝐧𝐳𝐢𝐦𝐚} ★
➤ 𝐅𝐚𝐜𝐞𝐛𝐨𝐨𝐤: ${https://www.facebook.com/karim.benzima.246709}

❖⋆═══════════════════════⋆❖
𝐁𝐨𝐭 𝐍𝐚𝐦𝐞 ➢ ${𝐇𝐢𝐧𝐚𝐭𝐚 𝐒𝐚𝐧𝐚}`;

            if (selected) {  
                api.sendMessage({ body: messageBody, attachment: selected }, threadID);  
            } else {  
                api.sendMessage(messageBody, threadID);  
            }  
        });

        return;
    }

    try {
        const { createReadStream, readdirSync } = global.nodemodule["fs-extra"];
        let { threadName, participantIDs } = await api.getThreadInfo(threadID);
        const threadData = global.data.threadData.get(parseInt(threadID)) || {};
        let mentions = [], nameArray = [], memLength = [], i = 0;

        for (let id in event.logMessageData.addedParticipants) {  
            const user = event.logMessageData.addedParticipants[id];
            const userName = user.fullName;
            nameArray.push(userName);  
            mentions.push({ tag: userName, id: user.userFbId });  
            memLength.push(participantIDs.length - i++);  
        }  
        memLength.sort((a, b) => a - b);  

        let msg = (typeof threadData.customJoin === "undefined") ? `╭•┄┅═══❁🌺❁═══┅┄•╮  
আ্ঁস্ঁসা্ঁলা্ঁমু্ঁ💚আ্ঁলা্ঁই্ঁকু্ঁম্ঁ

╰•┄┅═══❁🌺❁═══┅┄•╯
হাসি, মজা, ঠাট্টায় গড়ে উঠুক
চিরস্থায়ী বন্ধুত্বের বন্ধন।🥰
ভালোবাসা ও সম্পর্ক থাকুক আজীবন।💝

›› প্রিয় {name},
আপনি এই গ্রুপের {soThanhVien} নম্বর মেম্বার!

›› গ্রুপ: {threadName}

💌 🌺 𝐖 𝐄 𝐋 𝐂 𝐎 𝐌 𝐄 🌺 💌
╭─╼╾─╼🌸╾─╼╾───╮
─꯭─⃝‌‌${𝐇𝐢𝐧𝐚𝐭𝐚 𝐒𝐚𝐧𝐚} 🌺
╰───╼╾─╼🌸╾─╼╾─╯

❖⋆══════════════════════════⋆❖` : threadData.customJoin;

        msg = msg  
            .replace(/\{name}/g, nameArray.join(', '))  
            .replace(/\{soThanhVien}/g, memLength.join(', '))  
            .replace(/\{threadName}/g, threadName);  

        const joinGifPath = path.join(__dirname, "cache", "joinGif");  
        const files = readdirSync(joinGifPath).filter(file =>  
            [".mp4", ".jpg", ".png", ".jpeg", ".gif", ".mp3"].some(ext => file.endsWith(ext))  
        );  
        const randomFile = files.length > 0   
            ? createReadStream(path.join(joinGifPath, files[Math.floor(Math.random() * files.length)]))   
            : null;  

        return api.sendMessage(  
            randomFile ? { body: msg, attachment: randomFile, mentions } : { body: msg, mentions },  
            threadID  
        );

    } catch (e) {
        console.error(e);
    }
};
