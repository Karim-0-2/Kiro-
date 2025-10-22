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

// Random replies array (updated with your 29 messages)
const randomReplies = [
"𝐇𝐢 😀, 𝐈 𝐚𝐦 𝐡𝐞𝐫𝐞!",
"𝐖𝐡𝐚𝐭'𝐬 𝐮𝐩?",
"𝐁𝐨𝐥𝐨 𝐣𝐚𝐚𝐧 𝐤𝐢 𝐤𝐨𝐫𝐭𝐞 𝐩𝐚𝐧𝐦𝐫 𝐣𝐨𝐧𝐧𝐨",
"𝐜𝐡𝐮𝐩 𝐛𝐞𝐬𝐢 𝐊𝐨𝐭𝐡𝐚 𝐤𝐨𝐬 𝐤𝐞𝐧 😒",
"𝐣𝐢 𝐛𝐨𝐥𝐞𝐧",
"𝐚𝐬𝐬𝐚𝐥𝐚𝐦𝐮𝐚𝐥𝐚𝐢𝐤𝐮𝐦 🥰",
"𝐡𝐲𝐞 🙃",
"𝐓𝐚𝐤𝐞 𝐜𝐚𝐫𝐞 𝐲𝐨𝐮𝐫𝐬𝐞𝐥𝐟, 𝐚𝐥𝐰𝐚𝐲𝐬 𝐩𝐫𝐚𝐲 𝐭𝐨 𝐀𝐥𝐥𝐚𝐡 𝐚𝐧𝐝 𝐞𝐧𝐣𝐨𝐲 𝐲𝐨𝐮𝐫 𝐥𝐢𝐟𝐞 🥰🥰",
"𝐃𝐨 𝐘𝐨𝐮 𝐊𝐧𝐨𝐰 𝐖𝐡𝐨 𝐈𝐬 𝐓𝐡𝐞 𝐂𝐮𝐭𝐞𝐬𝐭 𝐏𝐞𝐫𝐬𝐨𝐧 𝐈𝐧 𝐓𝐡𝐞 𝐖𝐨𝐫𝐥𝐝? 𝐍𝐨𝐰 𝐫𝐞𝐚𝐝 𝐭𝐡𝐞 2𝐧𝐝 𝐰𝐨𝐫𝐝 🥰😘",
"𝐖𝐡𝐞𝐧 𝐆𝐨𝐝 𝐖𝐚𝐧𝐭𝐞𝐝 𝐓𝐨 𝐄𝐱𝐩𝐥𝐚𝐢𝐧 𝐖𝐡𝐚𝐭 𝐁𝐞𝐚𝐮𝐭𝐲 𝐌𝐞𝐚𝐧𝐬, 𝐆𝐨𝐝 𝐂𝐫𝐞𝐚𝐭𝐞𝐝 𝐘𝐨𝐮 🫵🙈",
"𝐍𝐨 𝐰𝐨𝐫𝐝𝐬 𝐜𝐚𝐧 𝐞𝐱𝐩𝐥𝐚𝐢𝐧 𝐡𝐨𝐰 𝐡𝐚𝐩𝐩𝐲 𝐈 𝐚𝐦, 𝐰𝐡𝐞𝐧 𝐈 𝐚𝐦 𝐰𝐢𝐭𝐡 𝐲𝐨𝐮 😌😌",
"𝐈𝐟 𝐲𝐨𝐮 𝐰𝐚𝐢𝐭 𝐟𝐨𝐫 𝐦𝐞 🤗🤗 𝐨𝐧𝐞 𝐝𝐚𝐲 𝐈 𝐰𝐢𝐥𝐥 𝐛𝐞 𝐲𝐨𝐮𝐫 😇🫵",
"𝐀𝐫𝐞 𝐲𝐨𝐮 𝐚 𝐭𝐢𝐦𝐞 𝐭𝐫𝐚𝐯𝐞𝐥𝐞𝐫? 𝐁𝐞𝐜𝐚𝐮𝐬𝐞 𝐈 𝐜𝐚𝐧 𝐬𝐞𝐞 𝐲𝐨𝐮 𝐢𝐧 𝐦𝐲 𝐟𝐮𝐭𝐮𝐫𝐞 🫵😘🥰",
"𝐈 𝐧𝐞𝐯𝐞𝐫 𝐛𝐞𝐥𝐢𝐞𝐯𝐞𝐝 𝐢𝐧 𝐥𝐨𝐯𝐞 𝐚𝐭 𝐟𝐢𝐫𝐬𝐭 𝐬𝐢𝐠𝐡𝐭… 𝐔𝐧𝐭𝐢𝐥 𝐈 𝐬𝐚𝐰 𝐲𝐨𝐮. 𝐍𝐨𝐰 𝐈 𝐭𝐡𝐢𝐧𝐤 𝐈 𝐦𝐢𝐠𝐡𝐭 𝐧𝐞𝐞𝐝 𝐥𝐞𝐬𝐬𝐨𝐧𝐬… 𝐟𝐫𝐨𝐦 𝐲𝐨𝐮 🙊🫵",
"𝐈 𝐡𝐚𝐯𝐞 𝐧𝐨 𝐬𝐞𝐜𝐨𝐧𝐝 𝐥𝐨𝐯𝐞 𝐝𝐞𝐚𝐫 - 𝐘𝐨𝐮 𝐰𝐞𝐫𝐞, 𝐲𝐨𝐮 𝐚𝐫𝐞, 𝐲𝐨𝐮 𝐰𝐢𝐥𝐥 𝐛𝐞 🫣🫵",
"তোমার সাথে কাটানো মুহূর্তগুলো যেমন ভূলতে পারবো না...!! 🙃🙃 তোমাকে নিজের করে পাওয়ার ইচ্ছাও কখনো শেষ হবে না...!! 🙃🥀✨",
"যুগের পর যুগ চলে যাবে, তবু তোমাকে না পাওয়ার আ`ক্ষেপ আমার ফুরাবে না! তুমি আমার হৃদয়ে থাকবে, আর অন্য কারো ভাগ্যে ⑅⃝✺❥😌🥀✨",
"ওই বেস্ট ফ্রেন্ড হবি...!! 🤗🌺 বউয়েএর মতো ভালোবাসবো...!! 🥰😇🤭",
"আমার গল্পে, আমার সাহিত্যে, আমার উপন্যাসে নিঃসন্দেহে তুমি ভীষণ সুন্দর! 🤍🌻😻😫",
"কিবোর্ডের এই ব্যাকপেস্ট জানে তোমাকে কতকিছু বলতে গিয়েও হয়নি বলা 😅🥀",
"যদি ফ্লার্ট করা অপরাধ হতো, আমি তোমার জন্য প্রতিদিন দোষী হতাম। I LOVE YOU 🥺🫣🫶🏻",
"সবকিছুর দাম বাড়ছে.!🙂 শুধু কমছে মানুষের সততা আর বিশ্বাসের দাম.!💔😓",
"তোমার মুখের দিকে তাকিয়ে! এক সমুদ্র পরিমাণ দুঃখ ভুলে থাকা সম্ভব!🖤💐💫 🐰 𝐘𝐨𝐮 𝐰𝐢𝐥𝐥 𝐚𝐥𝐰𝐚𝐲𝐬 𝐛𝐞 𝐦𝐲 𝐬𝐩𝐞𝐜𝐢𝐚𝐥 𝐩𝐞𝐫𝐬𝐨𝐧 🩵🐰",
"𝐀𝐤𝐭𝐚 𝐦𝐚𝐲 𝐚𝐬𝐚 𝐠𝐜 𝐭𝐚.... 𝐀𝐭𝐭𝐢𝐭𝐮𝐝𝐞, 𝐥𝐨𝐲𝐚𝐥𝐭𝐲... 𝐀𝐧𝐝 𝐢𝐠𝐧𝐨𝐫𝐞..... 𝐒𝐡𝐨𝐛𝐞 𝐤𝐢𝐬𝐮 𝐦𝐢𝐥𝐚𝐢 𝐚 𝐦𝐚𝐲 𝐭𝐚 𝐤𝐞 𝐛𝐡𝐚𝐥𝐨 𝐥𝐚𝐠𝐬𝐚... 🫵",
"এই শহরে এখনো একটা মুরগী ও ধরতে পারলাম না.!!🥺 এই শিয়ালের সমাজে আমি মুখ দেখাবো কেমন করে..☹️😞",
"🦋🪶____𝐓𝐡𝐞 𝐟𝐥𝐨𝐰𝐞𝐫𝐬 𝐚𝐫𝐞 𝐛𝐞𝐚𝐮𝐭𝐢𝐟𝐮𝐥 𝐛𝐮𝐭 𝐛𝐞𝐥𝐨𝐧𝐠 𝐭𝐨 𝐦𝐲 𝐪𝐮𝐞𝐞𝐧 (𝐘𝐨𝐮🫣) 𝐭𝐡𝐞 𝐞𝐲𝐞𝐬 𝐌𝐨𝐫𝐞 𝐛𝐞𝐚𝐮𝐭𝐢𝐟𝐮𝐥 𝐭𝐡𝐚𝐧 𝐟𝐥𝐨𝐰𝐞𝐫𝐬...! 😻🫵",
"𝐈𝐟 𝐭𝐡𝐞 𝐰𝐨𝐫𝐥𝐝 𝐰𝐚𝐬 𝐞𝐧𝐝𝐢𝐧𝐠, 𝐈 𝐰𝐚𝐧𝐧𝐚 𝐛𝐞 𝐧𝐞𝐱𝐭 𝐭𝐨 𝐲𝐨𝐮 ...😉🤙",
"কত যুদ্ধ বয়ে গেছি শুধু তোমাকে বলবো বলে 🤒🤒",
"তুমি আমার মস্তিষ্কে মিশে থাকা এক অদ্ভুত মায়া :) 🌷🌸"
];

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

module.exports.onChat = async ({ api, event, message }) => {
    try {
        const body = event.body ? event.body.toLowerCase() : "";

        // Owner-only special triggers
        if (event.senderID === ownerID) {
            if (["bou", "bow"].includes(body)) {
                const replies = [
                    "হ্যাঁ, বলো জান শুনছি তোমার কথা 😘😘",
                    "এইতো আমি এখনো 🙈🙈",
                    "আমি তোমার জন্যই অপেক্ষা করেছিলাম 🙈😘"
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
                    "বউ*, বার বার ভুলে যাও কেন আমি তোমার বউ 😭😠"
                ];
                return sendAndRegister(api, event, replies[Math.floor(Math.random() * replies.length)]);
            }
        }

        // Non-owner ignores special words silently
        const specialWords = ["bou", "bow", "kire", "sali"];
        if (specialWords.includes(body) && event.senderID !== ownerID) return;

        // Normal triggers for everyone
        const triggers = ["baby","bby","bot","babu","janu","naru","karim","hinata","hina"];
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

module.exports.onStart = async ({ api, event, args, usersData }) => {
    try {
        const dipto = args.join(" ");
        const link = `${baseApiUrl()}/baby`;
        const uid = event.senderID;

        if (args[0] === 'rm' && dipto.includes('-')) {
            const [fi, f] = dipto.replace("rm ", "").split(/\s*-\s*/);
            const da = (await axios.get(`${link}?remove=${encodeURIComponent(fi)}&index=${encodeURIComponent(f)}`)).data.message;
            return sendAndRegister(api, event, da);
        }

        if (args[0] === 'list') {
            const data = (await axios.get(`${link}?list=all`)).data;
            if (args[1] === 'all') {
                const teacherList = data?.teacher?.teacherList || [];
                const limit = Math.min(parseInt(args[2]) || 100, teacherList.length);
                const limited = teacherList.slice(0, limit);
                const teachers = await Promise.all(limited.map(async (item) => {
                    const number = Object.keys(item)[0];
                    const value = item[number];
                    const name = await usersData.getName(number).catch(() => number) || "Not found";
                    return { name, value };
                }));
                teachers.sort((a, b) => b.value - a.value);
                const output = teachers.map((t, i) => `${i + 1}/ ${t.name}: ${t.value}`).join('\n');
                return sendAndRegister(api, event, `Total Teach = ${teacherList.length}\n👑 | List of Teachers of baby\n${output}`);
            } else {
                return sendAndRegister(api, event, `❇️ | Total Teach = ${data.length || "api off"}\n♻️ | Total Response = ${data.responseLength || "api off"}`);
            }
        }

        if (args[0] === 'msg') {
            const fuk = dipto.replace("msg ", "");
            const d = (await axios.get(`${link}?list=${encodeURIComponent(fuk)}`)).data.data;
            return sendAndRegister(api, event, `Message ${fuk} = ${d}`);
        }

        if (args[0] === 'edit') {
            if (!dipto.includes('-')) return sendAndRegister(api, event, '❌ | Invalid format! Use edit [YourMessage] - [NewReply]');
            const [oldMsg, newMsg] = dipto.replace(/^edit\s*/, "").split(/\s*-\s*/);
            if (!oldMsg || !newMsg) return sendAndRegister(api, event, '❌ | Invalid format!');
            const dA = (await axios.get(`${link}?edit=${encodeURIComponent(oldMsg)}&replace=${encodeURIComponent(newMsg)}&senderID=${uid}`)).data.message;
            return sendAndRegister(api, event, `✅ Changed: ${dA}`);
        }

        if (args[0] === 'teach') {
            const type = args[1];
            const [input, replies] = dipto.replace(/^teach\s*(?:amar|react)?\s*/, "").split(/\s*-\s*/);
            if (!input || !replies) return sendAndRegister(api, event, '❌ | Invalid format!');

            let url = `${link}?teach=${encodeURIComponent(input)}&reply=${encodeURIComponent(replies)}&senderID=${uid}&threadID=${event.threadID}`;
            if (type === 'amar') url += "&key=intro";
            if (type === 'react') url = `${link}?teach=${encodeURIComponent(input)}&react=${encodeURIComponent(replies)}`;

            const res = (await axios.get(url)).data;
            return sendAndRegister(api, event, `✅ Replies added ${res.message}`);
        }

        const d = (await axios.get(`${link}?text=${encodeURIComponent(dipto)}&senderID=${uid}&font=1`)).data.reply;
        sendAndRegister(api, event, d, { apiUrl: link });

    } catch (e) {
        console.log(e);
        return sendAndRegister(api, event, "Check console for error");
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
