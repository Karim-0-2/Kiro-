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

        // Special triggers only for owner
        if (event.senderID == ownerID) {
            if (["bou", "bow" , "oi"].includes(body)) {
                const replies = [
                    "হ্যাঁ, বলো জান শুনছি তোমার কথা 😘😘",
                    "এইতো আমি এখনো 🙈🙈",
                    "আমি তোমার জন্যই অপেক্ষা করেছিলাম 🙈😘"
                ];
                sendAndRegister(api, event, replies[Math.floor(Math.random() * replies.length)]);
            }

            if (body === "kire") {
                const replies = [
                    "তুমি কি রাগ করছো জান ☹️",
                    "কি করলাম আমি 🙂",
                    "আছি আমি 🙊",
                    "আমি কি কিছু করছি 🤔"
                ];
                sendAndRegister(api, event, replies[Math.floor(Math.random() * replies.length)]);
            }

            if (body === "sali") {
                const replies = [
                    "গালি দাও কেন 😾😾",
                    "আমি তোমার বউ সালি না 😒😒",
                    "এতো রাগ দেখাও কেন ☹️☹️",
                    "বউ*, বার বার ভূলে যাও কেন আমি তোমার বউ 😭😠"
                ];
                sendAndRegister(api, event, replies[Math.floor(Math.random() * replies.length)]);
            }
        }

        // Everyone else silently ignores these special words
        const specialWords = ["bou", "bow", "kire", "sali"];
        if (specialWords.includes(body) && event.senderID != ownerID) return;

        // Default triggers for everyone (including owner talking normally)
        const triggers = ["baby","bby","bot","babu","janu","naru","karim","hinata","hina"];
        const matchedTrigger = triggers.find(t => body.startsWith(t));
        if (!matchedTrigger) return;

        const userMessage = body.replace(new RegExp(`^${matchedTrigger}\\s*`), "");
        const randomReplies = ["😚","তোমাকে না পেলে তোমার বোনকে বিয়ে করবো, কিন্তু বিয়ে আমি তোমার ফ্যামিলিতেই করবো!'🙂🌚" , "Hi 😀, I am here!", "What's up?", "Bolo jaan ki korte panmr jonno","chup besi Kotha kos ken 😒" , " ji bolen" , "Akta may asa gc ta.... Attitude, loyality... And  ignor..... Shobe kisu milai a may ta k vlo lagsa... 🫵" , "⋆⃝⋆⃝❥᭄𝐀𝐬𝐬𝐚𝐥𝐚𝐦𝐮𝐲𝐚𝐥𝐚𝐢𝐤𝐮𝐦»̶̶͓͓͓̽̽̽⑅⃝✺❥","হাজারও যুদ্ধ বয়ে গেছে -তোমাকে কথা বলব বলে 🤒🤒
                               
                               'আজও হয়নি বলে কি ছিল মনে 🙃🙃", " hye 🙃" , "Take care yourself , Always prey to almighty Allah and enjoy your life 🥰🥰 ",
                              "Do You Know Who Is The Cutest Person In The World?
                               'now read the 2nd word🥰😘❤️‍🩹" , 
                              "When God Wanted To Explain What 'Beauty' Means
'god Created You😎🤙" ,"‎ ‎‎—͟͞͞★メ No words can explain how happy i am , when I am with you 😌😌»̶̶͓͓͓̽̽̽⑅⃝✺❥" ," If you wait for me 🤗🤗one day I will be your 😇😇" , "Are you a time traveler?
            'Because I can see you in my Future..🫵😘🥰" , "তোমার সাথে কাটানো মুহূর্তগুলো যেমন ভূলতে পারবো না...!!🙃🙃তোমাকে নিজের করে পাওয়ার ইচ্ছাও কখনো শেষ হবে না...!!☺️🥀", "যুগের পর যুগ চলে যাবে,তবু তোমাকে না পাওয়ার আ`ক্ষেপ আমার ফুরাবে না!
    '⋆⃝⋆⃝💖তুমি আমার হৃদয়ে থাকবে , আর অন্য কারো ভাগ্যে  ⑅⃝✺❥" , "_ওই বেস্ট ফ্রেন্ড হবি...!!🤗🌺 

 'বউয়েএর মতো ভালোবাসবো...!!🥰😇🤭" ,"আমার গল্পে,আমার সাহিত্যে,আমার উপন্যাসে নিঃসন্দেহে তুমি ভীষণ সুন্দর!🤍🌻" , "‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎🐰:  ‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎    ⎯͢⎯⃝💚🍒-- 𝐎𝐧𝐞𝐤 𝐉𝐨𝐭𝐧𝐨 𝐊𝐨𝐫𝐞 𝐑𝐚𝐤𝐡𝐛𝐨__𝐓𝐨𝐦𝐚𝐢 𝐒𝐮𝐝𝐡𝐮 𝐀𝐤𝐛𝐚𝐫 𝐀𝐦𝐫 𝐇𝐨𝐲𝐞 𝐝𝐞𝐤𝐡𝐨—♡<"𝟯🌷🫶🥺🩷⏤͟͟͞͞◇💜✨⎯͢     
‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎" ,"‎‎‎‎‎‎‎‎‎‎‎‎‎ '─‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎─‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎─‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎─‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎Ꮗ𝐓𝐮͜͡𝐦𝐢 𝐚𝐛͜͡𝐚𝐫𝐨'𝐨͜͡𝐨 𝐣𝐨𝐧͜͡𝐦𝐨'𝐨𝐨 𝐧𝐢͠𝐲𝐨 𝐚⃞𝐦𝐢 𝐚𝐛𝐚⃞𝐫𝐨 𝐧𝐨͜͡𝐭𝐮͜͡𝐧 𝐤𝐨͜͡𝐫𝐞'𝐞𝐞 𝐭⃞𝐦𝐫⃞'𝐫𝐫 𝐩𝐫᷍𝐞𝐦͜͡𝐞'𝐞𝐞 𝐩𝐨⃞𝐫𝐛⃞𝐨'𝐨𝐨♡🌷🩵🫶🏻 '" ,"— 𝗜 𝗵𝗮𝘃𝗲 𝗻𝗼 𝘀𝗲𝗰𝗼𝗻𝗱 𝗹𝗼𝘃𝗲 𝗱𝗲𝗮𝗿'- 𝗬𝗼𝘂 𝘄𝗲𝗿𝗲 𝘆𝗼𝘂 𝗮𝗿𝗲 𝘆𝗼𝘂 𝘄𝗶𝗹𝗹 𝗯𝗲..!!🙂💔🐰" ,"⎯͢⎯ ♡︎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎─‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎─‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎Ꮗ  তুমি আমার মস্তিষ্কে মিশে থাকা এক অদ্ভুত মায়া:)<𝟯🌷🌸" , " কিবোর্ডের এই ব্যাকপেস্ট জানে তোমাকে কতকিছু বলতে গিয়েও হয়নি বলা 👍😅" ,"I never believed in love at first sight…Until I saw you.
'Now I think I might need lessons… from you.🙊😍" , "যদি ফ্লার্ট করা অপরাধ হতো,আমি তোমার জন্য প্রতিদিন দোষী হতাম।
 'I LOVE YOU 🥺💔🫶🏻" ,"🦋🪶____𝐓𝐡𝐞 𝐟𝐥𝐨𝐰𝐞𝐫𝐬 𝐚𝐫𝐞 𝐛𝐞𝐚𝐮𝐭𝐢𝐟𝐮𝐥 𝐛𝐮𝐭 𝐛𝐞𝐥𝐨𝐧𝐠 𝐭𝐨 𝐦𝐲 𝐪𝐮𝐞𝐞𝐧 (𝒀𝒐𝒖)𝐭𝐡𝐞 𝐞𝐲𝐞𝐬
'𝐌𝐨𝐫𝐞 𝐛𝐞𝐚𝐮𝐭𝐢𝐟𝐮𝐥 𝐭𝐡𝐚𝐧 𝐟𝐥𝐨𝐰𝐞𝐫𝐬...!❤️" ," কতটা ভেসেছি ভালো শুধু মন জানে এ হ্দয় জানে ,
    'জানে রাতের ও আকাশে নিশ্চুপ সাথী ,দুরের ঐ দ্রুব তারা " ," - সবকিছুর দাম বাড়ছে.!🙂
'- শুধু কমছে মানুষের সততা আর
'___বিশ্বাসের দাম.!💔😓 " ,"- জীবন তো খুব বেশি বড় না, কাটিয়ে দাওনা এই ছোট্ট জীবন টা আমার সাথেই!😌🌸 " ," আমি বলি মনের কথা....🤒🙃 
'সে তো বোঝো কবিতা....😌🥀 
'তাহলে কিভাবে বুঝবেন এই মনের ব্যাথা...🙃🥀 ","প্রতিটা মানুষই বহুরুপী,আমরা একজনকে ঠিক ততটুকুই চিনতে পারি,যতটুক সে আমাদের সামনে তুলে ধরে।🖤🧑‍🍼 ","1. In chemistry, you are my oxygen❤️‍🩹🩹
'In physics, you are my gravity🩹❤️‍🩹
'In geometry, you are my universe🩹❤️‍🩹 
'In biology, you are my heart❤️‍🩹🩹
'In history, you are my queen🩹❤️‍🩹
'In mathematics,  you are my solution❤️‍🩹🩹 
'Damnn you are my everything, I love you "];

        if (!userMessage) {
            return sendAndRegister(api, event, randomReplies[Math.floor(Math.random() * randomReplies.length)]);
        }

        // Chat reply from API
        const res = (await axios.get(`${baseApiUrl()}/baby?text=${encodeURIComponent(userMessage)}&senderID=${event.senderID}&font=1`)).data.reply;
        return sendAndRegister(api, event, res, { res });

    } catch (err) {
        return sendAndRegister(api, event, `Error: ${err.message}`);
    }
};
