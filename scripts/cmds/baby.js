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

// Helper to send message and register reply
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

module.exports.onStart = async ({ api, event, args, usersData }) => {
    const link = `${baseApiUrl()}/baby`;
    const uid = event.senderID;
    const dipto = args.join(" ").toLowerCase();

    try {
        if (!args[0]) {
            const ran = ["Bolo baby", "hum", "type help baby", "type !baby hi"];
            return sendAndRegister(api, event, ran[Math.floor(Math.random() * ran.length)]);
        }

        // REMOVE command
        if (args[0] === 'remove') {
            const fina = dipto.replace("remove ", "");
            const dat = (await axios.get(`${link}?remove=${encodeURIComponent(fina)}&senderID=${uid}`)).data.message;
            return sendAndRegister(api, event, dat);
        }

        // RM command with index
        if (args[0] === 'rm' && dipto.includes('-')) {
            const [fi, f] = dipto.replace("rm ", "").split(/\s*-\s*/);
            const da = (await axios.get(`${link}?remove=${encodeURIComponent(fi)}&index=${encodeURIComponent(f)}`)).data.message;
            return sendAndRegister(api, event, da);
        }

        // LIST commands
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

        // MSG command
        if (args[0] === 'msg') {
            const fuk = dipto.replace("msg ", "");
            const d = (await axios.get(`${link}?list=${encodeURIComponent(fuk)}`)).data.data;
            return sendAndRegister(api, event, `Message ${fuk} = ${d}`);
        }

        // EDIT command
        if (args[0] === 'edit') {
            if (!dipto.includes('-')) return sendAndRegister(api, event, '❌ | Invalid format! Use edit [YourMessage] - [NewReply]');
            const [oldMsg, newMsg] = dipto.replace(/^edit\s*/, "").split(/\s*-\s*/);
            if (!oldMsg || !newMsg) return sendAndRegister(api, event, '❌ | Invalid format!');
            const dA = (await axios.get(`${link}?edit=${encodeURIComponent(oldMsg)}&replace=${encodeURIComponent(newMsg)}&senderID=${uid}`)).data.message;
            return sendAndRegister(api, event, `✅ Changed: ${dA}`);
        }

        // TEACH command
        if (args[0] === 'teach') {
            const type = args[1]; // normal, amar, react
            const [input, replies] = dipto.replace(/^teach\s*(?:amar|react)?\s*/, "").split(/\s*-\s*/);
            if (!input || !replies) return sendAndRegister(api, event, '❌ | Invalid format!');
            
            let url = `${link}?teach=${encodeURIComponent(input)}&reply=${encodeURIComponent(replies)}&senderID=${uid}&threadID=${event.threadID}`;
            if (type === 'amar') url += "&key=intro";
            if (type === 'react') url = `${link}?teach=${encodeURIComponent(input)}&react=${encodeURIComponent(replies)}`;

            const res = (await axios.get(url)).data;
            return sendAndRegister(api, event, `✅ Replies added ${res.message}`);
        }

        // "What's my name" queries
        if (/amar name ki|amr nam ki|amar nam ki|amr name ki|whats my name/i.test(dipto)) {
            const data = (await axios.get(`${link}?text=amar name ki&senderID=${uid}&key=intro`)).data.reply;
            return sendAndRegister(api, event, data);
        }

        // Default chat reply
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

module.exports.onChat = async ({ api, event, message }) => {
    try {
        const body = event.body ? event.body.toLowerCase() : "";
        const ownerID = "61557991443492";

        // --- Special triggers (owner only) ---
        const specialWords = ["bou", "bow", "kire", "sali"];
        const specialWord = specialWords.find(w => body.startsWith(w));
        if (specialWord) {
            if (event.senderID == ownerID) {
                // If only the special word → special replies
                if (body.trim() === specialWord) {
                    const repliesMap = {
                        bou: [
                            "হ্যাঁ, বলো জান শুনছি তোমার কথা 😘😘",
                            "এইতো আমি এখনো 🙈🙈",
                            "আমি তোমার জন্যই অপেক্ষা করেছিলাম 🙈😘"
                        ],
                        bow: [
                            "হ্যাঁ, বলো জান শুনছি তোমার কথা 😘😘",
                            "এইতো আমি এখনো 🙈🙈",
                            "আমি তোমার জন্যই অপেক্ষা করেছিলাম 🙈😘"
                        ],
                        kire: [
                            "তুমি কি রাগ করছো জান ☹️",
                            "কি করলাম আমি 🙂",
                            "আছি আমি 🙊",
                            "আমি কি কিছু করছি 🤔"
                        ],
                        sali: [
                            "গালি দাও কেন 😾😾",
                            "আমি তোমার বউ সালি না 😒😒",
                            "এতো রাগ দেখাও কেন ☹️☹️",
                            "বউ*, বার বার ভূলে যাও কেন আমি তোমার বউ 😭😠"
                        ]
                    };
                    const replies = repliesMap[specialWord] || [];
                    return sendAndRegister(api, event, replies[Math.floor(Math.random() * replies.length)]);
                }

                // If extra text after → act like normal trigger
                const userMessage = body.replace(new RegExp(`^${specialWord}\\s*`), "");
                if (userMessage) {
                    const res = (await axios.get(`${baseApiUrl()}/baby?text=${encodeURIComponent(userMessage)}&senderID=${event.senderID}&font=1`)).data.reply;
                    return sendAndRegister(api, event, res, { res });
                }
            } else {
                // Non-owner → ignore silently
                return;
            }
        }

        // --- Normal triggers (everyone) ---
        const triggers = ["baby","bby","bot","babu","janu","naru","karim","hinata","hina","jamai"];
        const matchedTrigger = triggers.find(t => body.startsWith(t));
        if (!matchedTrigger) return;

        const userMessage = body.replace(new RegExp(`^${matchedTrigger}\\s*`), "");
        const randomReplies = [
            "😚", "Hi 😀, I am here!", "What's up?", "Bolo jaan ki korte panmr jonno",
            "chup besi Kotha kos ken 😒", "ji bolen", "assalamualaikum🥰", "hye 🙃",
            "Take care yourself , Always prey to almighty Allah and enjoy your life 🥰🥰 "
        ];

        if (!userMessage) {
            return sendAndRegister(api, event, randomReplies[Math.floor(Math.random() * randomReplies.length)]);
        }

        // API chat reply
        const res = (await axios.get(`${baseApiUrl()}/baby?text=${encodeURIComponent(userMessage)}&senderID=${event.senderID}&font=1`)).data.reply;
        return sendAndRegister(api, event, res, { res });

    } catch (err) {
        return sendAndRegister(api, event, `Error: ${err.message}`);
    }
};
