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
                       oi, bou , bow: [
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
            "Take care yourself , Always prey to almighty Allah and enjoy your life 🥰🥰 " , 
            "🙄","Amake na deke amar boss azad er sathe prem kor😊", "amar boss single ja sms diya mingle kor dor id link https://www.facebook.com/profile.php?id=61557991443492 😒" , "বেশি bot Bot করলে leave নিবো কিন্তু😒😒 " , "শুনবো না😼তুমি আমাকে প্রেম করাই দাও নাই🥺পচা তুমি🥺" , "-⎯͢⍥⃝💙⎯͢⎯⃝🪽😹🍒কঁবি্ঁ বঁলে্ঁছে্ঁন্ঁ কঁবি্ঁ বা্ঁল্ঁ বঁলে্ঁছে্ঁন্ঁ আ্ঁগে্ঁ আ্ঁমা্ঁর্ঁ কঁথা্ঁ শু্ঁনো্ঁ amar boss Single⎯͢🍒⍥⃝💙⎯͢⎯⃝🪽,ok😒" , "এতো ডেকো না,প্রেম এ পরে যাবো তো🙈" , "Bolo Babu, তুমি কি আমাকে ভালোবাসো? 🙈🙃 " , "বার বার ডাকলে মাথা গরম হয়ে যায় কিন্তু😑" , "এতো ডাকছিস কেন?গালি শুনবি নাকি? 🐸" , "আরে Bolo আমার জান ,কেমন আছো?😚 " , "Bot বলে অসম্মান করো,😰😿" , "Hop beda😾,Boss বল boss😼" , "চুপ থাক ,নাই তো তোর দাত ভেগে দিবো কিন্তু" , "Bot না , জানু বল জানু 😘 " , "বার বার Disturb করেছিস কোনো😾,আমি jamai এর এর সাথে ব্যাস্ত আসি😋" , "ইস  কোনো মেয়ে যদি আমার  Boss কে একা পেয়ে খেয়ে দিতো..!🥺🦆" , "আমাকে ডাকলে ,আমি কিন্তু কিস করে দিবো😘 " , "আমারে এতো ডাকিস না আমি মজা করার mood এ নাই এখন😒" , "হ্যাঁ জানু , এইদিক এ আসো কিস দেই🤭 😘" , "দূরে যা, তোর কোনো কাজ নাই, শুধু bot bot করিস  😉😋🤣" , "তোর কথা তোর বাড়ি কেউ শুনে না ,তো আমি কোনো শুনবো ?🤔😂 " , "আমাকে ডেকো না,আমি ব্যাস্ত আছি" , "বলো কি বলবা, সবার সামনে বলবা নাকি?🤭🤏" , "কালকে দেখা করিস তো একটু 😈" , "হা বলো, শুনছি আমি 😏" , "আর কত বার ডাকবি ,শুনছি তো" , "তোর কি চোখে পড়ে না আমি ব্যাস্ত আছি😒" , "আমাকে এতো না ডেকছ কেন ভলো টালো বাসো নাকি🤭🙈" , "🌻🌺💚-আসসালামু আলাইকুম ওয়া রাহমাতুল্লাহ-💚🌺🌻","আমি এখন বস Karim এর সাথে বিজি আছি আমাকে ডাকবেন না-😕😏 ধন্যবাদ-🤝🌻","আমাকে না ডেকে আমার বস Karim কে একটা জি এফ দাও-😽🫶🌺","ঝাং থুমালে আইলাপিউ পেপি-💝😽","উফফ বুঝলাম না এতো ডাকছেন কেনো-😤😡😈","জান তোমার নানি'রে আমার হাতে তুলে দিবা-🙊🙆‍♂","আজকে আমার মন ভালো নেই তাই আমারে ডাকবেন না-😪🤧","চুনা ও চুনা আমার বস Karim এর হবু বউ রে কেও দেকছো খুজে পাচ্ছি না😪🤧😭","স্বপ্ন তোমারে নিয়ে দেখতে চাই তুমি যদি আমার হয়ে থেকে যাও-💝🌺🌻","জান মেয়ে হলে চিপায় আসো ইউটিউব থেকে অনেক ভালোবাসা শিখছি তোমার জন্য-🙊🙈😽","ইসস এতো ডাকো কেনো লজ্জা লাগে তো-🙈🖤🌼","আমার বস Karim এ'র পক্ষ থেকে তোমারে এতো এতো ভালোবাসা-🥰😽🫶","serious প্রেম করতে চাইলে inbox 🌚🙈" ,"জান তুমি শুধু আমার আমি তোমারে ৩৬৫ দিন ভালোবাসি-💝🌺😽","-আন্টি-🙆-আপনার মেয়ে-👰‍♀️-রাতে আমারে ভিদু কল দিতে বলে🫣-🥵🤤💦","oii-🥺🥹-এক🥄 চামচ  karim re ভালোবাসা দিবা-🤏🏻🙂","-আপনার সুন্দরী বোনকে  ফিতরা হিসেবে আমার boss Karim কে দান করেন-🥱🐰🍒","wait jaan একটা কবিতা বলি -ও মিম ও মিম-😇-তুমি কেন চুরি করলা সাদিয়ার ফর্সা হওয়ার ক্রীম-🌚🤧","-অনুমতি দিলাম-𝙋𝙧𝙤𝙥𝙤𝙨𝙚 কর বস karim কে-🐸😾🔪","-𝙂𝙖𝙮𝙚𝙨-🤗-যৌবনের কসম দিয়ে আমারে 𝐁𝐥𝐚𝐜𝐤𝐦𝐚𝐢𝐥 করা হচ্ছে-🥲🤦‍♂️🤧","-𝗢𝗶𝗶 আন্টি-🙆‍♂️-তোমার মেয়ে চোখ মার 😾😾" ,"আজকে প্রপোজ করে দেখো রাজি হইয়া যামু-😌🤗😇","কি বেপার আপনি শ্বশুর বাড়িতে যাচ্ছেন না কেন-🤔🥱🌻","jaan akta Kotha jano -দিনশেষে পরের 𝐁𝐎𝐖 সুন্দর-☹️🤧","😭😭 -তাবিজ কইরা হইলেও ফ্রেম এক্কান করমুই তাতে যা হই হোক-🤧🥱🌻"," jaan jano-ছোটবেলা ভাবতাম বিয়ে করলে অটোমেটিক বাচ্চা হয়-🥱-ওমা এখন দেখি কাহিনী অন্যরকম-😦🙂🌻","-আজ একটা বিন নেই বলে ফেসবুকের নাগিন-🤧-গুলোরে আমার বস Karim ধরতে পারছে না-🐸🥲","-চুমু থাকতে তোরা বিড়ি খাস কেন বুঝা আমারে-😑😒🐸⚒️","—যে ছেড়ে গেছে-😔-তাকে ভুলে যাও-🙂-আমার boss Karim এর সাথে  প্রেম করে তাকে দেখিয়ে দাও-🙈🐸🤗","একটা সত্যি কথা জানো —হাজারো লুচ্চা লুচ্চির ভিরে-🙊🥵আমার বস karim এক নিস্পাপ ভালো মানুষ-🥱🤗🙆‍♂️","-রূপের অহংকার করো না-🙂❤️চকচকে সূর্যটাও দিনশেষে অন্ধকারে পরিণত হয়-🤗💜","সুন্দর মাইয়া মানেই-🥱আমার বস karim এর বউ-😽🫶আর বাকি গুলো আমার বেয়াইন-🙈🐸🤗","এত অহংকার করে লাভ নেই-🌸মৃত্যুটা নিশ্চিত শুধু সময়টা অ'নিশ্চিত-🖤🙂","-দিন দিন কিছু মানুষের কাছে অপ্রিয় হয়ে যাইতেছি-🙂😿🌸","হুদাই আমারে  শয়তানে লারে-😝😑☹️","-𝗜 𝗟𝗢𝗩𝗢 𝗬𝗢𝗨-😽-আহারে ভাবছো তোমারে প্রোপজ করছি-🥴-থাপ্পর দিয়া কিডনী লক করে দিব-😒-ভুল পড়া বের করে দিবো-🤭🐸","-আমি একটা দুধের শিশু-😇-🫵𝗬𝗢𝗨🐸💦","-কতদিন হয়ে গেলো বিছনায় মুতি না-😿-মিস ইউ নেংটা কাল-🥺🤧","-বালিকা━👸-𝐃𝐨 𝐲𝐨𝐮-🫵-বিয়া-𝐦𝐞-😽-আমি তোমাকে-😻-আম্মু হইতে সাহায্য করব-🙈🥱","-এই আন্টির মেয়ে-🫢🙈-𝐔𝐦𝐦𝐦𝐦𝐦𝐦𝐦𝐦𝐦𝐦𝐦𝐚𝐡-😽🫶-আসলেই তো স্বাদ-🥵💦-এতো স্বাদ কেন-🤔-সেই স্বাদ-😋","-ইস কেউ যদি বলতো-🙂-আমার শুধু  তোমাকেই লাগবে-💜🌸","-ওই বেডি তোমার বাসায় না আমার বস karim মেয়ে দেখতে গেছিলো-🙃-নাস্তা আনারস আর দুধ দিছো-🙄🤦‍♂️-বইন কইলেই তো হয় বয়ফ্রেন্ড আছে-🥺🤦‍♂-আমার বস Karim কে জানে মারার কি দরকার-🙄🤧","-একদিন সে ঠিকই ফিরে তাকাবে-😇-আর মুচকি হেসে বলবে ওর মতো আর কেউ ভালবাসেনি-🙂😅","-হুদাই গ্রুপে আছি-🥺🐸-কেও ইনবক্সে নক দিয়ে বলে না জান তোমারে আমি অনেক ভালোবাসি-🥺🤧","কি'রে গ্রুপে দেখি একটাও বেডি নাই-🤦‍🥱💦","-দেশের সব কিছুই চুরি হচ্ছে-🙄-শুধু আমার বস Karim এর মনটা ছাড়া-🥴😑😏","-🫵তোমারে প্রচুর ভাল্লাগে-😽-সময় মতো প্রপোজ করমু বুঝছো-🔨😼-ছিট খালি রাইখো- 🥱🐸🥵","-আজ থেকে আর কাউকে পাত্তা দিমু না -!😏-কারণ আমি ফর্সা হওয়ার ক্রিম কিনছি -!🙂🐸","বেশি Bot Bot করলে leave নিবো কিন্তু😒😒 " , "শুনবো না😼 তুমি আমাকে প্রেম করাই দাও নি🥺 পচা তুমি🥺 " , "আমি আবাল দের সাতে কথা বলি না,ok😒" , "এত কাছেও এসো না,প্রেম এ পরে যাবো তো 🙈" , "Bolo Babu, তুমি কি আমাকে ভালোবাসো? 🙈💋 " , "বার বার ডাকলে মাথা গরম হয় কিন্তু😑", "হা বলো😒,কি করতে পারি😐😑?" , "এতো ডাকছিস কোনো?গালি শুনবি নাকি? 🤬","মেয়ে হলে বস Karim'এর সাথে প্রেম করো🙈??. " ,  "আরে Bolo আমার জান ,কেমন আসো?😚 " , "Bot বলে অসম্মান করচ্ছিছ,😰😿" , "Hop bedi😾,Boss বল boss😼" , "চুপ থাক ,নাই তো তোর দাত ভেগে দিবো কিন্তু" , "Bot না , জানু বল জানু 😘 " , "বার বার Disturb করেছিস কোনো 😾" , "আমি গরীব এর সাথে কথা বলি না😼😼" , "আমাকে ডাকলে ,আমি কিন্তূ কিস করে দেবো😘 " , "আরে আমি মজা করার mood এ নাই😒" , "হা জানু , এইদিক এ আসো কিস দেই🤭 😘" , "দূরে যা, তোর কোনো কাজ নাই, শুধু bot bot করিস  😉😋🤣" , "তোর কথা তোর বাড়ি কেউ শুনে না ,তো আমি কোনো শুনবো ?🤔😂 " , "আমাকে ডেকো না,আমি ব্যাস্ত আসি" , "কি হলো ,মিস টিস করচ্ছিস নাকি🤣" , "বলো কি বলবা, সবার সামনে বলবা নাকি?🤭🤏" , "কালকে দেখা করিস তো একটু 😈" , "হা বলো, শুনছি আমি 😏" , "আর কত বার ডাকবি ,শুনছি তো" , "মাইয়া হলে আমার বস Karim কে Ummmmha দে 😒" , "বলো কি করতে পারি তোমার জন্য" , "আমি তো অন্ধ কিছু দেখি না🐸 😎" , "Bot না জানু,বল 😌" , "বলো জানু 🌚" , "তোর কি চোখে পড়ে না আমি বস azad এর সাথে ব্যাস্ত আসি😒" , "༊━━🦋নামাজি মানুষেরা সব থেকে বেশি সুন্দর হয়..!!😇🥀 🦋 কারণ.!! -অজুর পানির মত শ্রেষ্ঠ মেকআপ দুনিয়াতে নেই༊━ღ━༎🥰🥀 🥰-আলহামদুলিল্লাহ-🥰","- শখের নারী  বিছানায় মু'তে..!🙃🥴","-𝐈'𝐝 -তে সব 𝐖𝐨𝐰 𝐖𝐨𝐰 বুইড়া বেডি-🐸💦","🥛-🍍👈 -লে খাহ্..!😒🥺","- অনুমতি দিলে 𝚈𝚘𝚞𝚃𝚞𝚋𝚎-এ কল দিতাম..!😒","~আমি মারা গেলে..!🙂 ~অনেক মানুষ বিরক্ত হওয়া থেকে বেঁচে  যাবে..!😅💔","🍒---আমি সেই গল্পের বই-🙂 -যে বই সবাই পড়তে পারলেও-😌 -অর্থ বোঝার ক্ষমতা কারো নেই..!☺️🥀💔","~কার জন্য এতো মায়া...!😌🥀 ~এই শহরে আপন বলতে...!😔🥀 ~শুধুই তো নিজের ছায়া...!😥🥀","- দুনিয়ার সবাই প্রেম করে.!🤧 -আর মানুষ আমার বস Karim কে সন্দেহ করে.!🐸","- আমার থেকে ভালো অনেক পাবা-🙂 -কিন্তু সব ভালো তে কি আর ভালোবাসা থাকে..!💔🥀","- পুরুষকে সবচেয়ে বেশি কষ্ট দেয় তার শখের নারী...!🥺💔👈","- তোমার লগে দেখা হবে আবার - 😌 -কোনো এক অচেনা গলির চিপায়..!😛🤣👈","- থাপ্পড় চিনোস থাপ্পড়- 👋👋😡 -চিন্তা করিস না তরে মারমু না-🤗 -বস karim আমারে মারছে - 🥱 - উফফ সেই স্বাদ..!🥵🤤💦","- অবহেলা করিস না-😑😪 - যখন নিজেকে বদলে ফেলবো -😌 - তখন আমার চেয়েও বেশি কষ্ট পাবি..!🙂💔","- বন্ধুর সাথে ছেকা খাওয়া গান শুনতে শুনতে-🤧 -এখন আমিও বন্ধুর 𝙴𝚇 কে অনেক 𝙼𝙸𝚂𝚂 করি-🤕🥺","-৯৯টাকায় ৯৯জিবি ৯৯বছর-☺️🐸 -অফারটি পেতে এখনই আমাকে প্রোপস করুন-🤗😂👈","-প্রিয়-🥺 -তোমাকে না পেলে আমি সত্যি-😪 -আরেকজন কে-😼 -পটাতে বাধ্য হবো-😑🤧","•-কিরে🫵 তরা নাকি  prem করস..😐🐸•আমারে একটা করাই দিলে কি হয়-🥺","- যেই আইডির মায়ায় পড়ে ভুল্লি আমারে.!🥴- তুই কি যানিস সেই আইডিটাও আমি চালাইরে.!🙂"
if (!arr) {
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
