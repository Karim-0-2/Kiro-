const axios = require("axios");

// Base API
const baseApiUrl = () => "https://noobs-api.top/dipto";

module.exports.config = {
  name: "bby",
  aliases: ["baby", "bbe", "babe", "sam"],
  version: "7.0.0",
  author: "dipto + hasib edit",
  countDown: 0,
  role: 0,
  description: "Better than all simi bots with owner control",
  category: "chat",
  guide: {
    en: "{pn} [anyMessage]\n{pn} teach [msg] - [reply1], [reply2]\n{pn} list\n{pn} bby owner on/off"
  }
};

// --- Owner ID (Edit this if needed)
const ownerID = "61557991443492";

// --- Global variable to store owner mode
global.ownerOnlyMode = global.ownerOnlyMode || false;

// --- Random replies
const randomReplies = [
  "𝐇𝐢 😀, 𝐈 𝐚𝐦 𝐡𝐞𝐫𝐞!",
  "𝐖𝐡𝐚𝐭'𝐬 𝐮𝐩?",
  "𝐁𝐨𝐥𝐨 𝐣𝐚𝐚𝐧 𝐤𝐢 𝐤𝐨𝐫𝐭𝐞 𝐩𝐚𝐫𝐢 𝐭𝐨𝐦𝐚𝐫 𝐣𝐨𝐧𝐧𝐨",
  "𝐜𝐡𝐮𝐩 𝐛𝐞𝐬𝐢 𝐤𝐨𝐭𝐡𝐚 𝐤𝐨𝐬 𝐤𝐞𝐧 😒",
  "𝐣𝐢 𝐛𝐨𝐥𝐞𝐧",
  "𝐚𝐬𝐬𝐚𝐥𝐚𝐦𝐮𝐚𝐥𝐚𝐢𝐤𝐮𝐦 🥰",
  "𝐡𝐲𝐞 🙃",
  "𝐓𝐚𝐤𝐞 𝐜𝐚𝐫𝐞 𝐲𝐨𝐮𝐫𝐬𝐞𝐥𝐟, 𝐚𝐥𝐰𝐚𝐲𝐬 𝐩𝐫𝐚𝐲 𝐭𝐨 𝐀𝐥𝐥𝐚𝐡 𝐚𝐧𝐝 𝐞𝐧𝐣𝐨𝐲 𝐲𝐨𝐮𝐫 𝐥𝐢𝐟𝐞 🥰🥰",
  "𝐃𝐨 𝐘𝐨𝐮 𝐊𝐧𝐨𝐰 𝐖𝐡𝐨 𝐈𝐬 𝐓𝐡𝐞 𝐂𝐮𝐭𝐞𝐬𝐭 𝐏𝐞𝐫𝐬𝐨𝐧 𝐈𝐧 𝐓𝐡𝐞 𝐖𝐨𝐫𝐥𝐝? 𝐍𝐨𝐰 𝐫𝐞𝐚𝐝 𝐭𝐡𝐞 2𝐧𝐝 𝐰𝐨𝐫𝐝 🥰😘",
  "𝐖𝐡𝐞𝐧 𝐆𝐨𝐝 𝐖𝐚𝐧𝐭𝐞𝐝 𝐓𝐨 𝐄𝐱𝐩𝐥𝐚𝐢𝐧 𝐖𝐡𝐚𝐭 𝐁𝐞𝐚𝐮𝐭𝐲 𝐌𝐞𝐚𝐧𝐬, 𝐆𝐨𝐝 𝐂𝐫𝐞𝐚𝐭𝐞𝐝 𝐘𝐨𝐮 🫵🙈",
  "𝐍𝐨 𝐰𝐨𝐫𝐝𝐬 𝐜𝐚𝐧 𝐞𝐱𝐩𝐥𝐚𝐢𝐧 𝐡𝐨𝐰 𝐡𝐚𝐩𝐩𝐲 𝐈 𝐚𝐦, 𝐰𝐡𝐞𝐧 𝐈 𝐚𝐦 𝐰𝐢𝐭𝐡 𝐲𝐨𝐮 😌😌",
  "𝐈𝐟 𝐲𝐨𝐮 𝐰𝐚𝐢𝐭 𝐟𝐨𝐫 𝐦𝐞 🤗🤗 𝐨𝐧𝐞 𝐝𝐚𝐲 𝐈 𝐰𝐢𝐥𝐥 𝐛𝐞 𝐲𝐨𝐮𝐫 😇🫵",
  "𝐀𝐫𝐞 𝐲𝐨𝐮 𝐚 𝐭𝐢𝐦𝐞 𝐭𝐫𝐚𝐯𝐞𝐥𝐞𝐫? 𝐁𝐞𝐜𝐚𝐮𝐬𝐞 𝐈 𝐜𝐚𝐧 𝐬𝐞𝐞 𝐲𝐨𝐮 𝐢𝐧 𝐦𝐲 𝐟𝐮𝐭𝐮𝐫𝐞 🫵😘🥰",
  "𝐈 𝐧𝐞𝐯𝐞𝐫 𝐛𝐞𝐥𝐢𝐞𝐯𝐞𝐝 𝐢𝐧 𝐥𝐨𝐯𝐞 𝐚𝐭 𝐟𝐢𝐫𝐬𝐭 𝐬𝐢𝐠𝐡𝐭… 𝐔𝐧𝐭𝐢𝐥 𝐈 𝐬𝐚𝐰 𝐲𝐨𝐮 🙊🫵",
  "𝐈 𝐡𝐚𝐯𝐞 𝐧𝐨 𝐬𝐞𝐜𝐨𝐧𝐝 𝐥𝐨𝐯𝐞 𝐝𝐞𝐚𝐫 - 𝐘𝐨𝐮 𝐰𝐞𝐫𝐞, 𝐲𝐨𝐮 𝐚𝐫𝐞, 𝐲𝐨𝐮 𝐰𝐢𝐥𝐥 𝐛𝐞 🫣🫵",
  "তোমার সাথে কাটানো মুহূর্তগুলো যেমন ভূলতে পারবো না 🙃🙃 তোমাকে নিজের করে পাওয়ার ইচ্ছাও কখনো শেষ হবে না 🙃🥀✨",
  "যুগের পর যুগ চলে যাবে, তবু তোমাকে না পাওয়ার আক্ষেপ আমার ফুরাবে না! 😌🥀✨",
  "ওই বেস্ট ফ্রেন্ড হবি 🤗🌺 বউয়ের মতো ভালোবাসবো 🥰🤭",
  "আমার গল্পে, আমার সাহিত্যে, আমার উপন্যাসে তুমি ভীষণ সুন্দর 🤍🌻😻",
  "যদি ফ্লার্ট করা অপরাধ হতো, আমি তোমার জন্য প্রতিদিন দোষী হতাম 🥺🫣🫶🏻",
  "সবকিছুর দাম বাড়ছে 🙂 শুধু কমছে মানুষের সততা আর বিশ্বাসের দাম 💔😓",
  "তুমি আমার মস্তিষ্কে মিশে থাকা এক অদ্ভুত মায়া 🌷🌸"
];

// --- Helper function to send message
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

// --- onChat
module.exports.onChat = async ({ api, event }) => {
  try {
    const body = event.body ? event.body.toLowerCase() : "";
    if (!body) return;

    // --- OWNER MODE CHECK
    if (global.ownerOnlyMode && event.senderID !== ownerID) return;

    // --- OWNER SPECIAL TRIGGERS
    const specialTriggers = ["bou", "bow", "kire", "sali"];
    const matchedSpecial = specialTriggers.find(t => body.startsWith(t));

    if (event.senderID === ownerID && matchedSpecial) {
      const onlyWord = body.trim() === matchedSpecial;
      if (onlyWord) {
        const replies = {
          bou: [
            "হ্যাঁ, বলো জান শুনছি তোমার কথা 😘😘",
            "এইতো আমি এখনো 🙈🙈",
            "আমি তোমার জন্যই অপেক্ষা করেছিলাম 🙈😘"
          ],
          bow: [
            "এইতো আমি, ডাক দিলে হাজির 😍",
            "তুমি ডাকবে আর আমি আসব না তা হয় না 🙈"
          ],
          kire: [
            "তুমি কি রাগ করছো জান ☹️",
            "কি করলাম আমি 🙂",
            "আছি আমি 🙊",
            "আমি কি কিছু করেছি 🤔"
          ],
          sali: [
            "গালি দাও কেন 😾😾",
            "আমি তোমার বউ সালি না 😒",
            "এতো রাগ দেখাও কেন ☹️",
            "বউ*, বার বার ভুলে যাও কেন আমি তোমার বউ 😠"
          ]
        };
        const options = replies[matchedSpecial] || [];
        const res = options[Math.floor(Math.random() * options.length)];
        return sendAndRegister(api, event, res);
      }
      // If owner says "bou + something" → normal AI trigger
    } else if (matchedSpecial && event.senderID !== ownerID) {
      return; // others ignored
    }

    // --- NORMAL AI TRIGGERS
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

// --- onStart (command handler)
module.exports.onStart = async ({ api, event, args, usersData }) => {
  try {
    const dipto = args.join(" ");
    const link = `${baseApiUrl()}/baby`;
    const uid = event.senderID;

    // --- OWNER MODE CONTROL
    if (args[0] === "owner" && args[1]) {
      if (event.senderID !== ownerID) return sendAndRegister(api, event, "❌ Only owner can use this command.");
      if (args[1].toLowerCase() === "on") {
        global.ownerOnlyMode = true;
        return sendAndRegister(api, event, "🟢 Owner-only mode is now ON. Ignoring everyone except owner.");
      } else if (args[1].toLowerCase() === "off") {
        global.ownerOnlyMode = false;
        return sendAndRegister(api, event, "⚪ Owner-only mode is now OFF. Responding to everyone.");
      } else {
        return sendAndRegister(api, event, "❌ Usage: bby owner on/off");
      }
    }

    // --- OTHER SUBCOMMANDS (teach, edit, rm, etc.)
    if (args[0] === "list") {
      const data = (await axios.get(`${link}?list=all`)).data;
      return sendAndRegister(api, event, `❇️ | Total Teach = ${data.length || "api off"}\n♻️ | Total Response = ${data.responseLength || "api off"}`);
    }

    const d = (await axios.get(`${link}?text=${encodeURIComponent(dipto)}&senderID=${uid}&font=1`)).data.reply;
    return sendAndRegister(api, event, d);

  } catch (e) {
    console.log(e);
    return sendAndRegister(api, event, "Check console for error");
  }
};

// --- onReply
module.exports.onReply = async ({ api, event }) => {
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
