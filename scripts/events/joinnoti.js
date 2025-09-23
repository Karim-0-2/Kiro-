const { drive, getStreamFromURL, getExtFromUrl, getTime } = global.utils;
const { existsSync, mkdirSync, createReadStream, readdirSync } = global.nodemodule["fs-extra"];
const { join } = global.nodemodule["path"];

module.exports = {
  config: {
    name: "joinnoti",
    eventType: ["log:subscribe"],
    version: "2.0.0",
    credits: "𝗞𝗮𝗿𝗶𝗺 𝗕𝗲𝗻𝘇𝗶𝗺𝗮",
    description: "Beautiful Bangla welcome with random gif/video support",
    category: "events"
  },

  onLoad() {
    const cachePaths = [
      join(__dirname, "cache", "joinGif"),
      join(__dirname, "cache", "randomgif")
    ];
    for (const path of cachePaths) {
      if (!existsSync(path)) mkdirSync(path, { recursive: true });
    }
  },

  async run({ api, event }) {
    const { threadID, logMessageData } = event;
    const botPrefix = global.config.PREFIX || "/";
    const botName = global.config.BOTNAME || "𝗦𝗵𝗮𝗵𝗮𝗱𝗮𝘁 𝗖𝗵𝗮𝘁 𝗕𝗼𝘁";

    // If bot is added to group
    if (logMessageData.addedParticipants.some(i => i.userFbId == api.getCurrentUserID())) {
      await api.changeNickname(`[ ${botPrefix} ] • ${botName}`, threadID, api.getCurrentUserID());

      const randomGifPath = join(__dirname, "cache", "randomgif");
      const files = readdirSync(randomGifPath).filter(file =>
        [".mp4", ".jpg", ".png", ".jpeg", ".gif", ".mp3"].some(ext => file.endsWith(ext))
      );
      const selected = files.length > 0
        ? createReadStream(join(randomGifPath, files[Math.floor(Math.random() * files.length)]))
        : null;

      const introMsg = `╭•┄┅═══❁🌺❁═══┅┄•╮
আ্ঁস্ঁসা্ঁলা্ঁমু্ঁ💚আ্ঁলা্ঁই্ঁকু্ঁম্ঁ
╰•┄┅═══❁🌺❁═══┅┄•╯

চ্ঁলে্ঁ এ্ঁসে্ঁছি্ঁ 𝗛𝗶𝗻𝗮𝘁𝗮 𝘀𝗮𝗻𝗮!
এঁখঁনঁ তোঁমাঁদেঁরঁ সাঁথেঁ আঁড্ডাঁ দিঁবঁ..!

➤ কমান্ড দেখতে:  
${botPrefix}Help  
${botPrefix}Info  
${botPrefix}Admin  

★ অভিযোগ/হেল্প এর জন্য এডমিনকে নক করুন ★
➤ Messenger: m.me/61557991443492  

❖⋆═══════════════════════⋆❖
     𝐁𝐨𝐭 𝐎𝐰𝐧𝐞𝐫 ➢ 𝗞𝗮𝗿𝗶𝗺 𝗕𝗲𝗻𝘇𝗶𝗺𝗮`;

      return api.sendMessage(
        selected ? { body: introMsg, attachment: selected } : { body: introMsg },
        threadID
      );
    }

    // When a normal user joins
    try {
      let { threadName, participantIDs } = await api.getThreadInfo(threadID);
      let mentions = [], nameArray = [], memLength = [], i = 0;

      for (const user of logMessageData.addedParticipants) {
        nameArray.push(user.fullName);
        mentions.push({ tag: user.fullName, id: user.userFbId });
        memLength.push(participantIDs.length - i++);
      }
      memLength.sort((a, b) => a - b);

      let msg = `╭•┄┅═══❁🌺❁═══┅┄•╮
আ্ঁস্ঁসা্ঁলা্ঁমু্ঁ💚আ্ঁলা্ঁই্ঁকু্ঁম্ঁ
╰•┄┅═══❁🌺❁═══┅┄•╯

হাসি, মজা, ঠাট্টায় গড়ে উঠুক  
চিরস্থায়ী বন্ধুত্বের বন্ধন।🥰
ভালোবাসা ও সম্পর্ক থাকুক আজীবন।💝

➤ আশা করি আপনি এখানে হাসি-মজা করে আড্ডা দিতে ভালোবাসবেন।😍  
➤ সবার সাথে মিলেমিশে থাকবেন।😉  
➤ খারাপ ব্যবহার করবেন না।🚫  
➤ এডমিনের কথা শুনবেন ও রুলস মেনে চলবেন।✅  

›› প্রিয় {name},  
আপনি এই গ্রুপের {soThanhVien} নম্বর মেম্বার!  

›› গ্রুপ: {threadName}  

💌 🌺 𝐖 𝐄 𝐋 𝐂 𝐎 𝐌 𝐄 🌺 💌  
╭─╼╾─╼🌸╾─╼╾───╮  
   ─꯭─⃝‌‌𝗛𝗶𝗮𝗻𝗮𝘁𝗮 𝗦𝗮𝗻𝗮 🌺  
╰───╼╾─╼🌸╾─╼╾─╯  

❖⋆══════════════════════════⋆❖`;

      msg = msg
        .replace(/\{name}/g, nameArray.join(", "))
        .replace(/\{soThanhVien}/g, memLength.join(", "))
        .replace(/\{threadName}/g, threadName);

      const joinGifPath = join(__dirname, "cache", "joinGif");
      const files = readdirSync(joinGifPath).filter(file =>
        [".mp4", ".jpg", ".png", ".jpeg", ".gif", ".mp3"].some(ext => file.endsWith(ext))
      );
      const selected = files.length > 0
        ? createReadStream(join(joinGifPath, files[Math.floor(Math.random() * files.length)]))
        : null;

      return api.sendMessage(
        selected ? { body: msg, attachment: selected, mentions } : { body: msg, mentions },
        threadID
      );
    } catch (e) {
      console.error(e);
    }
  }
};
