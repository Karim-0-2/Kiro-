const axios = require('axios');

const baseApiUrl = async () => {
    return "https://www.noobs-api.rf.gd/dipto";
};

module.exports.config = {
    name: "bby",
    aliases: ["baby", "bbe", "babe"],
    version: "6.9.0",
    author: "dipto",
    countDown: 0,
    role: 0,
    description: "better than all sim simi",
    category: "chat",
    guide: {
        en: "{pn} [anyMessage] OR\nteach [YourMessage] - [Reply1], [Reply2], [Reply3]... OR\nteach [react] [YourMessage] - [react1], [react2], [react3]... OR\nremove [YourMessage] OR\nrm [YourMessage] - [indexNumber] OR\nmsg [YourMessage] OR\nlist OR all OR\nedit [YourMessage] - [NewMessage]"
    }
};

module.exports.onStart = async ({ api, event, args, usersData }) => {
    const link = `${await baseApiUrl()}/baby`;
    const dipto = args.join(" ").toLowerCase();
    const uid = event.senderID;

    const ownerID = "61557991443492"; // Owner ID
    const ownerWords = ["bou", "bow", "oi"];

    try {
        // --- Owner special replies ---
        const body = event.body ? event.body.toLowerCase() : "";
        const ownerWord = ownerWords.find(w => body.startsWith(w));

        if (ownerWord && event.senderID == ownerID) {
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
                oi: [
                    "হ্যালো জান 😎",
                    "কি অবস্থা বলো? 🙃",
                    "আমি এখানে আছি, বলো কি করতে হবে 😌"
                ]
            };
            const replies = repliesMap[ownerWord] || [];
            return api.sendMessage(replies[Math.floor(Math.random() * replies.length)], event.threadID, event.messageID);
        }

        // --- Existing commands logic ---
        if (!args[0]) {
            const ran = ["Bolo baby", "hum", "type help baby", "type !baby hi"];
            return api.sendMessage(ran[Math.floor(Math.random() * ran.length)], event.threadID, event.messageID);
        }

        // REMOVE command
        if (args[0] === 'remove') {
            const fina = dipto.replace("remove ", "");
            const dat = (await axios.get(`${link}?remove=${fina}&senderID=${uid}`)).data.message;
            return api.sendMessage(dat, event.threadID, event.messageID);
        }

        // RM command
        if (args[0] === 'rm' && dipto.includes('-')) {
            const [fi, f] = dipto.replace("rm ", "").split(' - ');
            const da = (await axios.get(`${link}?remove=${fi}&index=${f}`)).data.message;
            return api.sendMessage(da, event.threadID, event.messageID);
        }

        // LIST command
        if (args[0] === 'list') {
            if (args[1] === 'all') {
                const data = (await axios.get(`${link}?list=all`)).data;
                const teachers = await Promise.all(data.teacher.teacherList.map(async (item) => {
                    const number = Object.keys(item)[0];
                    const value = item[number];
                    const name = (await usersData.get(number)).name;
                    return { name, value };
                }));
                teachers.sort((a, b) => b.value - a.value);
                const output = teachers.map((t, i) => `${i + 1}/ ${t.name}: ${t.value}`).join('\n');
                return api.sendMessage(`Total Teach = ${data.length}\n👑 | List of Teachers of baby\n${output}`, event.threadID, event.messageID);
            } else {
                const d = (await axios.get(`${link}?list=all`)).data.length;
                return api.sendMessage(`Total Teach = ${d}`, event.threadID, event.messageID);
            }
        }

        // MSG command
        if (args[0] === 'msg') {
            const fuk = dipto.replace("msg ", "");
            const d = (await axios.get(`${link}?list=${fuk}`)).data.data;
            return api.sendMessage(`Message ${fuk} = ${d}`, event.threadID, event.messageID);
        }

        // EDIT command
        if (args[0] === 'edit') {
            const command = dipto.split(' - ')[1];
            if (command.length < 2) return api.sendMessage('❌ | Invalid format! Use edit [YourMessage] - [NewReply]', event.threadID, event.messageID);
            const dA = (await axios.get(`${link}?edit=${args[1]}&replace=${command}&senderID=${uid}`)).data.message;
            return api.sendMessage(`changed ${dA}`, event.threadID, event.messageID);
        }

        // TEACH command (normal)
        if (args[0] === 'teach' && args[1] !== 'amar' && args[1] !== 'react') {
            const [comd, command] = dipto.split(' - ');
            const final = comd.replace("teach ", "");
            if (command.length < 2) return api.sendMessage('❌ | Invalid format!', event.threadID, event.messageID);
            const re = await axios.get(`${link}?teach=${final}&reply=${command}&senderID=${uid}`);
            const tex = re.data.message;
            const teacher = (await usersData.get(re.data.teacher)).name;
            return api.sendMessage(`✅ Replies added ${tex}\nTeacher: ${teacher}\nTeachs: ${re.data.teachs}`, event.threadID, event.messageID);
        }

        // TEACH AMAR command
        if (args[0] === 'teach' && args[1] === 'amar') {
            const [comd, command] = dipto.split(' - ');
            const final = comd.replace("teach ", "");
            if (command.length < 2) return api.sendMessage('❌ | Invalid format!', event.threadID, event.messageID);
            const tex = (await axios.get(`${link}?teach=${final}&senderID=${uid}&reply=${command}&key=intro`)).data.message;
            return api.sendMessage(`✅ Replies added ${tex}`, event.threadID, event.messageID);
        }

        // TEACH REACT command
        if (args[0] === 'teach' && args[1] === 'react') {
            const [comd, command] = dipto.split(' - ');
            const final = comd.replace("teach react ", "");
            if (command.length < 2) return api.sendMessage('❌ | Invalid format!', event.threadID, event.messageID);
            const tex = (await axios.get(`${link}?teach=${final}&react=${command}`)).data.message;
            return api.sendMessage(`✅ Replies added ${tex}`, event.threadID, event.messageID);
        }

        // Name queries
        if (dipto.includes('amar name ki') || dipto.includes('amr nam ki') || dipto.includes('amar nam ki') || dipto.includes('amr name ki') || dipto.includes('whats my name')) {
            const data = (await axios.get(`${link}?text=amar name ki&senderID=${uid}&key=intro`)).data.reply;
            return api.sendMessage(data, event.threadID, event.messageID);
        }

        // --- Bot trigger words (everyone) ---
        const triggers = ["baby","bby","bot","babu","janu","naru","karim","hinata","hina","jamai"];
        const matchedTrigger = triggers.find(t => body.startsWith(t));
        if (matchedTrigger) {
            const userMessage = body.replace(new RegExp(`^${matchedTrigger}\\s*`), "");
            const randomReplies = ["😚", "Hi 😀, I am here!", "What's up?", "Bolo jaan ki korte panmr jonno" , "Amar boss Karim er jonno akta gf khujo to🙊😫"];
            if (!userMessage) {
                return api.sendMessage(randomReplies[Math.floor(Math.random() * randomReplies.length)], event.threadID, event.messageID);
            }
            const res = (await axios.get(`${link}?text=${encodeURIComponent(userMessage)}&senderID=${uid}&font=1`)).data.reply;
            return api.sendMessage(res, event.threadID, event.messageID);
        }

        // --- Generic fallback ---
        const fallbackReplies = [
            "Hmm… আমি বুঝতে পারছি না 😅",
            "আমি এটা বোঝার চেষ্টা করছি… তুমি আরেকবার বলো? 🤔",
            "মনে হচ্ছে আমি এখনও শিখছি 😌",
            "হায়! আমি ঠিক বুঝিনি, আবার বলো 💭"
        ];
        return api.sendMessage(fallbackReplies[Math.floor(Math.random() * fallbackReplies.length)], event.threadID, event.messageID);

    } catch (e) {
        console.log(e);
        return api.sendMessage(`Error: ${e.message}`, event.threadID, event.messageID);
    }
};
