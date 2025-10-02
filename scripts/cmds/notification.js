const { getStreamsFromAttachment } = global.utils;
const fs = require("fs-extra");

const OWNER_UID = "61557991443492";
const MAX_ADMIN_USES = 2;

const dbPath = __dirname + "/cache/notificationAdmins.json";

let adminUses = {};
if (fs.existsSync(dbPath)) {
  try {
    adminUses = JSON.parse(fs.readFileSync(dbPath)) || {};
  } catch (e) {
    adminUses = {};
  }
}

function saveAdminUses() {
  try {
    fs.writeFileSync(dbPath, JSON.stringify(adminUses, null, 2));
  } catch {}
}

module.exports = {
  config: {
    name: "notification",
    aliases: ["notify", "noti"],
    version: "2.8",
    author: "NTKhang + modified",
    countDown: 5,
    role: 2,
    description: {
      vi: "Owner gửi thông báo đến tất cả nhóm, admin có thể dùng 2 lần",
      en: "Owner sends notification to all groups, admin can use twice"
    },
    category: "owner",
    guide: {
      en: "{pn} <message>"
    },
    envConfig: {
      delayPerGroup: 250
    }
  },

  langs: {
    vi: {
      noPermission: "⚠️ Lệnh này chỉ dành cho owner hoặc admin bot.",
      missingMessage: "Vui lòng nhập tin nhắn bạn muốn gửi đến tất cả các nhóm",
      notification: "Thông báo từ bot đến tất cả nhóm chat (không phản hồi tin nhắn này)",
      sendingNotification: "Bắt đầu gửi thông báo đến %1 nhóm chat",
      sentNotification: "✅ Đã gửi thông báo đến %1 nhóm thành công",
      errorSendingNotification: "Có lỗi xảy ra khi gửi đến %1 nhóm:\n%2"
    },
    en: {
      noPermission: "⚠️ This command is only for the bot owner or admins.",
      missingMessage: "Please enter the message you want to send to all groups",
      notification: "Notification from bot to all chat groups (do not reply to this message)",
      sendingNotification: "Start sending notification to %1 chat groups",
      sentNotification: "✅ Sent notification to %1 groups successfully",
      errorSendingNotification: "An error occurred while sending to %1 groups:\n%2"
    }
  },

  onStart: async function ({ message, api, event, args, commandName, envCommands, threadsData, getLang, role, usersData }) {
    const { delayPerGroup } = envCommands[commandName];

    // Permission check
    if (event.senderID !== OWNER_UID && role < 2) {
      return message.reply(getLang("noPermission"));
    }

    // Admin usage limitation (owner bypasses)
    if (event.senderID !== OWNER_UID && role >= 2) {
      const used = adminUses[event.senderID] || 0;
      if (used >= MAX_ADMIN_USES) {
        return message.reply("The command you are using does not exist, type !help to see all available commands");
      }
      adminUses[event.senderID] = used + 1;
      saveAdminUses();
    }

    if (!args[0]) return message.reply(getLang("missingMessage"));

    // Build notification header
    let header;
    if (event.senderID === OWNER_UID) {
      header = "🌟🚀 **NOTIFICATION FROM OWNER** 🚀🌟";
    } else {
      const senderName = await usersData.getName(event.senderID);
      header = `Notification from an admin (${senderName})`;
    }

    const formSend = {
      body: `${header}\n────────────────\n${args.join(" ")}`,
      attachment: await getStreamsFromAttachment(
        [
          ...event.attachments,
          ...(event.messageReply?.attachments || [])
        ].filter(item => ["photo", "png", "animated_image", "video", "audio"].includes(item.type))
      )
    };

    const allThreadID = (await threadsData.getAll())
      .filter(t => t.isGroup && t.members.find(m => m.userID == api.getCurrentUserID())?.inGroup);

    message.reply(getLang("sendingNotification", allThreadID.length));

    let sendSucces = 0;
    const sendError = [];
    const wattingSend = [];

    for (const thread of allThreadID) {
      const tid = thread.threadID;
      try {
        wattingSend.push({
          threadID: tid,
          pending: api.sendMessage(formSend, tid)
        });
        await new Promise(resolve => setTimeout(resolve, delayPerGroup));
      } catch (e) {
        sendError.push(tid);
      }
    }

    for (const sended of wattingSend) {
      try {
        await sended.pending;
        sendSucces++;
      } catch (e) {
        const { errorDescription } = e;
        if (!sendError.some(item => item.errorDescription == errorDescription))
          sendError.push({
            threadIDs: [sended.threadID],
            errorDescription
          });
        else
          sendError.find(item => item.errorDescription == errorDescription).threadIDs.push(sended.threadID);
      }
    }

    let msg = "";
    if (sendSucces > 0)
      msg += getLang("sentNotification", sendSucces) + "\n";
    if (sendError.length > 0)
      msg += getLang("errorSendingNotification",
        sendError.reduce((a, b) => a + b.threadIDs.length, 0),
        sendError.reduce((a, b) => a + `\n - ${b.errorDescription}\n  + ${b.threadIDs.join("\n  + ")}`, "")
      );
    message.reply(msg);
  },

  // 🔔 Bot startup notification
  onLoad: async function ({ api, threadsData }) {
    const allThreadID = (await threadsData.getAll())
      .filter(t => t.isGroup && t.members.find(m => m.userID == api.getCurrentUserID())?.inGroup);

    const formSend = {
      body: "🤖✨ **BOT IS ONLINE** ✨🤖\n────────────────\nHello everyone! I'm back online.",
      attachment: []
    };

    for (const thread of allThreadID) {
      try {
        await api.sendMessage(formSend, thread.threadID);
        await new Promise(resolve => setTimeout(resolve, 250)); // delay between groups
      } catch {}
    }
  }
};
