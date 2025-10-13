const ownerID = "61557991443492";
const greetedGroups = new Set();

module.exports = {
  config: {
    name: "onlyadminbox",
    aliases: ["onlyadbox", "adboxonly", "adminboxonly"],
    version: "1.7",
    author: "Hasib",
    countDown: 5,
    role: 1,
    description: {
      en: "Turn on/off mode where only group admins can use the bot"
    },
    category: "box chat",
    guide: {
      en: "   {pn} [on | off] → Enable/disable admin-only mode\n   {pn} noti [on | off] → Toggle notifications for non-admins"
    }
  },

  langs: {
    en: {
      turnedOn: "✅ Admin-only mode enabled. Only group admins can use bot commands.",
      turnedOff: "🟢 Admin-only mode disabled. Everyone can use bot commands now.",
      turnedOnNoti: "🔔 Notification for non-admins enabled.",
      turnedOffNoti: "🔕 Notification for non-admins disabled.",
      syntaxError: "⚠️ Invalid syntax. Use: {pn} on | off"
    }
  },

  // ================================
  // 📘 Command Start Handler
  // ================================
  onStart: async function ({ args, message, event, threadsData, getLang, api, usersData }) {
    const { senderID, threadID } = event;

    // ✅ Owner is always treated as group admin
    if (senderID !== ownerID) {
      const threadInfo = await api.getThreadInfo(threadID);
      const isGroupAdmin = threadInfo.adminIDs.some(e => e.id == senderID);
      if (!isGroupAdmin) {
        return message.reply("❌ Only group admins or the bot owner can toggle this setting.");
      }
    }

    let isSetNoti = false;
    let key = "data.onlyAdminBox";
    let value;

    if (args[0] === "noti") {
      isSetNoti = true;
      key = "data.hideNotiMessageOnlyAdminBox";
      args.shift();
    }

    if (args[0] === "on") value = true;
    else if (args[0] === "off") value = false;
    else return message.reply(getLang("syntaxError"));

    await threadsData.set(threadID, isSetNoti ? !value : value, key);

    return message.reply(
      isSetNoti
        ? value ? getLang("turnedOnNoti") : getLang("turnedOffNoti")
        : value ? getLang("turnedOn") : getLang("turnedOff")
    );
  },

  // ================================
  // 💬 Chat Handler
  // ================================
  onChat: async function ({ event, threadsData, message, api, usersData }) {
    const { threadID, senderID, body } = event;
    if (!body) return;

    const onlyAdmin = await threadsData.get(threadID, "data.onlyAdminBox", false);
    if (!onlyAdmin) return;

    // ✅ Owner always bypasses admin restriction
    if (senderID === ownerID) {
      if (!greetedGroups.has(threadID)) {
        greetedGroups.add(threadID);
        const ownerName = await usersData.getName(ownerID);
        api.sendMessage(
          `👑 My Lord ${ownerName}, admin-only mode is active but you have full access to all commands.`,
          threadID,
          (err, info) => {
            if (!err) setTimeout(() => api.unsendMessage(info.messageID), 7000);
          }
        );
      }
      return; // Allow owner to use everything
    }

    // 🧩 Check group admin status for others
    const threadInfo = await api.getThreadInfo(threadID);
    const isGroupAdmin = threadInfo.adminIDs.some(e => e.id == senderID);

    // 🚫 Block non-admins (owner bypasses already)
    if (!isGroupAdmin) {
      const hideNoti = await threadsData.get(threadID, "data.hideNotiMessageOnlyAdminBox", false);
      if (!hideNoti) {
        message.reply("⚠️ Only group admins can use bot commands in this group.");
      }
      return; // Block non-admins
    }
  },

  // ================================
  // 🌐 Global Helper (Owner bypasses everywhere)
  // ================================
  onCommandCheck: async function ({ event, threadsData }) {
    // This helper allows owner to use all commands globally, even if adminboxonly = on
    const onlyAdmin = await threadsData.get(event.threadID, "data.onlyAdminBox", false);
    if (!onlyAdmin) return true; // feature off, allow everyone
    if (event.senderID === ownerID) return true; // ✅ owner bypass
    return false; // others handled per command
  }
};
