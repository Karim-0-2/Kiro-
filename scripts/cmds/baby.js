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
        en: "{pn} [anyMessage] OR\nteach [YourMessage] - [Reply1], [Reply2], [Reply3]... OR\nteach [react] [YourMessage] - [react1], [react2], [react3]... OR\nremove [YourMessage] OR\nrm [YourMessage] - [indexNumber] OR\nmsg [YourMessage] OR\nlist OR all OR\nedit [YourMessage] - [NewMessage]"
    }
};

// Replies
const randomReplies = [ "Assalamualaikum 🥰 , kemon asen?" ," Bolo jaan ki Korte pare tumar jonno" , " Chup besi Kotha bolos ken " , "এত Bot bot না করে পড়তে যাও " , "Jamai bol jamai " , "Amar boss Karim re akta gf dite parba?😫🌚 " ,"serious প্রেম করতে চাইলে ইনবক্স করো 😘😘" ,
    "তুমি জানো? তোমার হাসিটা এমন যে, মনে হয় পুরো পৃথিবীটা এক মুহূর্তের জন্য থেমে গেছে… 🌸 তুমি হাসলে আমার মনটাও হাসে 😍",
    "তুমি যখন কথা বলো, মনে হয় মেঘলা আকাশে সূর্য উঠছে ☀️ তোমার কণ্ঠে এমন এক মায়া আছে, যা আমার পুরো দিনটা বদলে দেয় 💖",
    "তুমি পাশে থাকলে পৃথিবীটা হালকা লাগে, সব কষ্ট মুছে যায়… শুধু তোমার হাসিটাই চাই, আর কিছু না 😌💫",
    "তোমার একটা ‘hi’ আমার মুড ঠিক করে দেয়, আর একটা ‘bye’ মানে পুরো দিনটাই শেষ 🥺 তুমি আমার ছোট্ট সুখ 💕",
    "তোমার চোখের দিকে তাকালে মনে হয় সমুদ্রের ঢেউয়ে হারিয়ে যাচ্ছি 🌊 তুমি চুপ থাকলেও আমি তোমার ভালোবাসা শুনতে পাই 💞",
    "তুমি আমার কাছে শুধু মানুষ না, একটা অনুভূতি 💗 তুমি না থাকলে আমার দিন শুরু হয় না, রাত ঘুম আসে না 🌙",
    "তুমি যতটা দূরে, মন ততটাই কাছে… তুমি যদি জানতে, আমি প্রতিদিন তোমার নামটাই প্রথম লিখি 💌",
    "তোমার কথা শুনলে মনে হয় আমি ঠিক জায়গায় আছি, নিরাপদে, শান্তিতে… তোমার ভালোবাসা আমার আশ্রয় 💞",
    "তুমি আমার প্রিয় অভ্যাস, যেটা ছাড়তে পারি না, চাইও না 💕 তুমি ছাড়া আমি একদম অসম্পূর্ণ 🌻",
    "তুমি হাসলে আমি ভুলে যাই পৃথিবীর সব চিন্তা, আর তুমি রাগ করলে আমি নিজেকেই হারিয়ে ফেলি 💔 কিন্তু তবুও তুমি-ই আমার পছন্দ 🌹",
    "রাতের চাঁদে দেখি তোমার মুখ, হাওয়ার সুরে শুনি তোমার সুখ 🌙\nদূর থেকেও তুমি আমার পাশে, স্বপ্নে আসে তোমার চোখ 💫\nতোমার হাসি যেন রাতের নীরবতাকে আলোকিত করে, আর তোমার চুপ সব ব্যথা মুছে দেয় 🌸",
    "বৃষ্টির ফোঁটায় তোমার নাম লিখি, বাতাসে তোমার গন্ধ পাই 🌧️\nতুমি না থাকলেও মনে হয়, তুমি ঠিক পাশে আছো তাই 💖\nপ্রতিটি ফোঁটা যেন তোমার স্পর্শের মতো, প্রতিটি ঝাপটায় হৃদয় স্পন্দিত হয় 💞",
    "চাঁদের আলোয় তোমার চোখের ছায়া, রাত জেগে শুধু তাকিয়ে থাকি 🌝\nতুমি কি জানো, আমার প্রতিটা কবিতায় শুধু তোমারই নাম থাকে 💌\nতোমার স্মৃতি আমার রচনায় জীবন ছড়ায়, প্রতিটি শব্দে তোমার ছোঁয়া 💫",

    "আল্লাহর পথে হাঁটতে থাকো, তিনি তোমাকে কখনও একা ছাড়বেন না 🤲\nপ্রতিটি কষ্টের পর আনন্দ আসে, শুধু ধৈর্য ধরো 🌸",
    "প্রার্থনা হৃদয়ের ভাষা, এবং আল্লাহ সব শুনেন 💖\nতোমার বিশ্বাস থাকলে কোনো বাধা তোমাকে থামাতে পারবে না 🌙",
    "যে আল্লাহর উপর ভরসা রাখে, তার জন্য সহজ হয়ে যায় সমস্ত পথ ✨\nভয় করো না, তিনি তোমাকে সঠিক সময়ে সাহায্য করবেন 🤲",
    "সত্যিই শান্তি পাওয়া যায় কেবল আল্লাহর স্মরণে 🌸\nপ্রতিদিন একটু সময় নিও নিজের ও মনকে আল্লাহর কাছে দিতে 💞",
    "আল্লাহর দয়া অশেষ, শুধু ভরসা রাখো, প্রত্যেক অসুবিধা অতিক্রমযোগ্য 🌙",

    "~কার জন্য এতো মায়া…! 😌🥀\nএই শহরে সবাই অচেনা, শুধু তুমি মনে হয় কাছে…\nতবু মনে হয়, আমি একা…\nকোথায় যেন হারিয়ে যাচ্ছি…! 😔",
    "~শুধুই তো নিজের ছায়া…! 😥🥀\nযদি পাশে থাকত কেউ,\nহৃদয়টা হয়তো শান্ত হত,\nকিন্তু শুধু আমি আর আমার নিঃশব্দতা… 🌙",
    "~এই শহরে আপন বলতে কেউ নেই 😔🥀\nশুধুই নিজের ছায়া, আর হাজারো ব্যথা…",
    
    "কেউ তোমায় বিশ্বাস না করলে সমস্যা নেই — তুমি নিজেকে বিশ্বাস করো 💪",
    "হার মানলে হেরে যাবে, চেষ্টা করলে জিতবেই একদিন ✨",
    "অন্যের কথায় নয়, নিজের ইচ্ছায় বাঁচো 🔥",
    "জীবন ছোট — মন খারাপ নয়, নিজের জন্য হাসো 😄",
    "প্রতিদিন একটু একটু করে নিজেকে গড়ো, একদিন সবাই তাকিয়ে দেখবে 🌟"
];

// Owner-only replies
const ownerReplies = {
    oi: ["হ্যাঁ, বলো জান শুনছি তোমার কথা 😘😘", "এইতো আমি এখনো 🙈🙈", "আমি তোমার জন্যই অপেক্ষা করেছিলাম 🙈😘"],
    bou: ["হ্যাঁ, বলো জান শুনছি তোমার কথা 😘😘", "এইতো আমি এখনো 🙈🙈", "আমি তোমার জন্যই অপেক্ষা করেছিলাম 🙈😘"],
    bow: ["হ্যাঁ, বলো জান শুনছি তোমার কথা 😘😘", "এইতো আমি এখনো 🙈🙈", "আমি তোমার জন্যই অপেক্ষা করেছিলাম 🙈😘"],
    kire: ["তুমি কি রাগ করছো জান ☹️", "কি করলাম আমি 🙂", "আছি আমি 🙊", "আমি কি কিছু করছি 🤔"],
    sali: ["গালি দাও কেন 😾😾", "আমি তোমার বউ সালি না 😒😒", "এতো রাগ দেখাও কেন ☹️☹️", "বউ*, বার বার ভুলে যাও কেন আমি তোমার বউ 😭😠"]
};

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
    const body = event.body ? event.body.toLowerCase() : "";
    const ownerID = "61557991443492";

    try {
        // Owner-only triggers
        const specialWord = Object.keys(ownerReplies).find(w => body.startsWith(w));
        if (specialWord && event.senderID === ownerID) {
            const replies = ownerReplies[specialWord];
            return sendAndRegister(api, event, replies[Math.floor(Math.random() * replies.length)]);
        }

        // Commands
        if (!args[0]) return sendAndRegister(api, event, randomReplies[Math.floor(Math.random() * randomReplies.length)]);

        if (args[0] === 'remove') {
            const fina = dipto.replace("remove ", "");
            const dat = (await axios.get(`${link}?remove=${encodeURIComponent(fina)}&senderID=${uid}`)).data.message;
            return sendAndRegister(api, event, dat);
        }

        if (args[0] === 'rm' && dipto.includes('-')) {
            const [fi, f] = dipto.replace("rm ", "").split(/\s*-\s*/);
            const da = (await axios.get(`${link}?remove=${encodeURIComponent(fi)}&index=${encodeURIComponent(f)}`)).data.message;
            return sendAndRegister(api, event, da);
        }

        if (args[0] === 'list') {
            const data = (await axios.get(`${link}?list=all`)).data;
            const teacherList = data?.teacher?.teacherList || [];
            const output = teacherList.map((t, i) => `${i + 1}/ ${Object.keys(t)[0]}: ${Object.values(t)[0]}`).join('\n');
            return sendAndRegister(api, event, `Total Teach = ${teacherList.length}\nList of Teachers:\n${output}`);
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

        // "What's my name"
        if (/amar name ki|amr nam ki|amar nam ki|amr name ki|whats my name/i.test(dipto)) {
            const data = (await axios.get(`${link}?text=amar name ki&senderID=${uid}&key=intro`)).data.reply;
            return sendAndRegister(api, event, data);
        }

        // Normal triggers
        const triggers = ["baby","bby","bot","babu","janu","naru","karim","hinata","hina","jamai"];
        const matchedTrigger = triggers.find(t => body.startsWith(t));
        if (!matchedTrigger) return;
        const userMessage = body.replace(new RegExp(`^${matchedTrigger}\\s*`), "");
        if (!userMessage) return sendAndRegister(api, event, randomReplies[Math.floor(Math.random() * randomReplies.length)]);
        const res = (await axios.get(`${baseApiUrl()}/baby?text=${encodeURIComponent(userMessage)}&senderID=${event.senderID}&font=1`)).data.reply;
        return sendAndRegister(api, event, res);

    } catch (err) {
        return sendAndRegister(api, event, `Error: ${err.message}`);
    }
};
