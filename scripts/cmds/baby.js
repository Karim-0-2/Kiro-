const axios = require('axios');

const baseApiUrl = () => "https://noobs-api.top/dipto";

module.exports.config = {
    name: "bby",
    aliases: ["baby", "bbe", "babe", "sam"],
    version: "6.9.0",
    author: "dipto",
    countDown: 0,
    role: 0,
    description: "better than all sim simi",
    category: "chat",
    guide: {
        en: "{pn} [anyMessage] OR\nteach [YourMessage] - [Reply1], [Reply2], [Reply3]... OR\nteach [react] [YourMessage] - [react1], [react2], [react3]... OR\nremove [YourMessage] OR\nrm [YourMessage] - [indexNumber] OR\nmsg [YourMessage] OR\nlist OR \nall OR\nedit [YourMessage] - [NewMessage]"
    }
};

// Owner ID
const ownerID = "61557991443492";

// Helper function to send message and register reply
async function sendAndRegister(api, event, text, replyData = {}) {
    api.sendMessage(text, event.threadID, (err, info) => {
        if (!err) {
            global.GoatBot.onReply.set(info.messageID, {
                commandName: module.exports.config.name,
                type: "reply",
                messageID: info.messageID,
                author: event.senderID,
                ...replyData
            });
        }
    }, event.messageID);
}

// Random replies
const randomReplies = [
    "😚", 
    "Hi 😀, I am here!", 
    "What's up?", 
    "Bolo jaan ki korte panmr jonno",
    "chup besi Kotha kos ken 😒", 
    "ji bolেন", 
    "assalamualaikum🥰", 
    "hye 🙃",
    "Take care yourself, Always pray to almighty Allah and enjoy your life 🥰🥰",
    "Do You Know Who Is The Cutest Person In The World? Now read the 2nd word 🥰😘❤️‍🩹",
    "When God Wanted To Explain What Beauty Means, God Created You 🫵🙈",
    "No words can explain how happy I am, when I am with you 😌😌",
    "If you wait for me 🤗 one day I will be your 😇🫵",
    "Are you a time traveler? Because I can see you in my Future.. 🫵😘🥰",
    "তোমার সাথে কাটানো মুহূর্তগুলো যেমন ভূলতে পারবো না...!! 🙃🥀✨ তোমাকে নিজের করে পাওয়ার ইচ্ছাও কখনো শেষ হবে না...!! 🙃🥀✨",
    "যুগের পর যুগ চলে যাবে, তবু তোমাকে না পাওয়ার আক্ষেপ আমার ফুরাবে না! 💖 তুমি আমার হৃদয়ে থাকবে, আর অন্য কারো ভাগ্যে নয় 😌🥀✨",
    "ওই বেস্ট ফ্রেন্ড হবি...!! 🤗🌺 বউয়ের মতো ভালোবাসবো...!! 🥰😇🤭",
    "আমার গল্পে, সাহিত্যে, উপন্যাসে নিঃসন্দেহে তুমি ভীষণ সুন্দর! 🤍🌻😻",
    "🐰 Onek jotno kore rakhbo tomai, sudhu akbar amar hoye dekho 🥺🩷✨",
    "তুমি আমার মস্তিষ্কে মিশে থাকা এক অদ্ভুত মায়া 🙂💖🌸",
    "I never believed in love at first sight… Until I saw you 😍🙊🫵",
    "যদি ফ্লার্ট করা অপরাধ হতো, আমি তোমার জন্য প্রতিদিন দোষী হতাম 😅💘",
    "🦋 The flowers are beautiful but belong to my queen (You🫣) 💐💞",
    "If the world was ending, I’d wanna be next to you 💞🤙",
    "কত যুদ্ধ বয়ে গেছি শুধু তোমাকে বলবো বলে 🤒🤒 আজও বলা হয়নি কিছু নেই 😌🙃🥀",
    "- সবকিছুর দাম বাড়ছে.!🙂\n- শুধু কমছে মানুষের সততা আর ___বিশ্বাসের দাম.!💔😓",
    
    // 💞 Your special romantic paragraph as one reply
    "💫🌸💫\n🧪 In chemistry, you are my oxygen ❤️‍🩹🩹\n🧲 In physics, you are my gravity 🩹❤️‍🩹\n📐 In geometry, you are my universe 🩹❤️‍🩹\n🫀 In biology, you are my heart ❤️‍🩹🩹\n👑 In history, you are my queen 🩹❤️‍🩹\n➕ In mathematics, you are my solution ❤️‍🩹🩹\n💞 Damnn you are my everything, I love you 💖\n💫🌸💫"
];

module.exports.onChat = async ({ api, event, message }) => {
    try {
        const body = event.body ? event.body.toLowerCase() : "";

        // Owner-only special triggers
        if (event.senderID === ownerID) {
            if (["bou", "oi", "bow"].includes(body)) {
                const replies = [
                    "হ্যাঁ, বলো জান শুনছি তোমার কথা 😘😘",
                    "এইতো আমি এখনো 🙈🙈",
                    "আমি তোমার জন্যই অপেক্ষা করছিলাম 🙈😘"
                ];
                return sendAndRegister(api, event, replies[Math.floor(Math.random() * replies.length)]);
            }
            if (body === "kire") {
                const replies = [
                    "তুমি কি রাগ করছো জান ☹️",
                    "কি করলাম আমি 🙂",
                    "আছি আমি 🙊",
                    "আমি কি কিছু করছি 🤔"
                ];
                return sendAndRegister(api, event, replies[Math.floor(Math.random() * replies.length)]);
            }
            if (body === "sali") {
                const replies = [
                    "গালি দাও কেন 😾😾",
                    "আমি তোমার বউ সালি না 😒😒",
                    "এতো রাগ দেখাও কেন ☹️☹️",
                    "বউ*, বার বার ভূলে যাও কেন আমি তোমার বউ 😭😠"
                ];
                return sendAndRegister(api, event, replies[Math.floor(Math.random() * replies.length)]);
            }
        }

        // Non-owner ignores special words silently
        const specialWords = ["bou", "bow", "kire", "sali"];
        if (specialWords.includes(body) && event.senderID !== ownerID) return;

        // Normal triggers for everyone
        const triggers = ["baby", "bby", "bot", "babu", "janu", "naru", "karim", "hinata", "hina"];
        const matchedTrigger = triggers.find(t => body.startsWith(t));
        if (!matchedTrigger) return;

        const userMessage = body.replace(new RegExp(`^${matchedTrigger}\\s*`), "");
        if (!userMessage) {
            return sendAndRegister(api, event, randomReplies[Math.floor(Math.random() * randomReplies.length)]);
        }

        const res = (await axios.get(`${baseApiUrl()}/baby?text=${encodeURIComponent(userMessage)}&senderID=${event.senderID}&font=1`)).data.reply;
        return sendAndRegister(api, event, res);

    } catch (err) {
        return sendAndRegister(api, event, `Error: ${err.message}`);
    }
};

module.exports.onReply = async ({ api, event, Reply }) => {
    if ([api.getCurrentUserID()].includes(event.senderID)) return;
    try {
        if (event.type === "message_reply") {
            const a = (await axios.get(`${baseApiUrl()}/baby?text=${encodeURIComponent(event.body?.toLowerCase())}&senderID=${event.senderID}&font=1`)).data.reply;
            return sendAndRegister(api, event, a, { a });
        }
    } catch (err) {
        return sendAndRegister(api, event, `Error: ${err.message}`);
    }
};
