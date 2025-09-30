const { existsSync, mkdirSync, createReadStream } = global.nodemodule["fs-extra"];
const { join } = global.nodemodule["path"];

module.exports = {
  config: {
    name: "joinnoti",
    eventType: ["log:subscribe"],
    version: "3.1.0",
    credits: "Hasib",
    description: "English bot-join, Bangla user-join with join.jpeg + owner contact",
    category: "events"
  },

  // Ensure cache folder exists
  onLoad() {
    const gifPath = join(__dirname, "cache", "joinGif");
    if (!existsSync(gifPath)) mkdirSync(gifPath, { recursive: true });
  },

  async run({ api, event }) {
    const { threadID, logMessageData } = event;

    // Owner/Admin FB link
    const ownerFB = "https://m.me/61557991443492"; // Replace with your actual FB link

    // ----- If bot is added -----
    if (logMessageData.addedParticipants.some(i => i.userFbId == api.getCurrentUserID())) {
      return api.sendMessage(
        `✅ Thanks for adding me to this group!\n\n📌 Type /help to see my commands.\n\nIf you need any help, contact the owner: ${ownerFB}`,
        threadID
      );
    }

    // ----- If user joins -----
    try {
      const threadInfo = await api.getThreadInfo(threadID);
      let mentions = [];
      let names = [];

      for (const user of logMessageData.addedParticipants) {
        names.push(user.fullName);
        mentions.push({ tag: user.fullName, id: user.userFbId });
      }

      // Beautiful Bangla welcome message
      let msg = `╔══❁🌺❁══╗
   আ্ঁস্ঁসা্ঁলা্ঁমু্ঁ💚আ্ঁলা্ঁই্ঁকু্ঁম্ঁ
╚══❁🌺❁══╝

✨ প্রিয় ${names.join(", ")} ✨  
আপনাকে আমাদের সুন্দর পরিবারে স্বাগতম! 🥰  

💖 এই গ্রুপে থাকুক —  
হাসি, খুশি, মজা আর অনন্ত বন্ধুত্ব 🌸  
চলুন একসাথে গড়ে তুলি একটি  
ভালোবাসায় ভরা বন্ধন 💞  

🌷 গ্রুপের নাম: ${threadInfo.threadName} 🌷  

➤ দয়া করে রুলস মেনে চলুন ✅  
➤ সবার সাথে সুন্দর ব্যবহার করুন 🌺  
➤ আনন্দে আড্ডা দিন 😍  

📌 অভিযোগ বা সাহায্যের জন্য গ্রুপের মালিকের সাথে যোগাযোগ করুন: ${ownerFB}

╭─╼╾─╼🌸╾─╼╾───╮  
     𝗛𝗶𝗻𝗮𝘁𝗮 𝗦𝗮𝗻𝗮 🌺  
╰───╼╾─╼🌸╾─╼╾─╯`;

      // Load fixed join.jpeg
      const joinImagePath = join(__dirname, "cache", "joinGif", "join.jpeg");
      const attachment = existsSync(joinImagePath)
        ? createReadStream(joinImagePath)
        : null;

      return api.sendMessage(
        attachment ? { body: msg, attachment, mentions } : { body: msg, mentions },
        threadID
      );

    } catch (err) {
      console.error(err);
      return api.sendMessage("❌ Sorry, I couldn’t send the welcome message.", threadID);
    }
  }
};
