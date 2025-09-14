const ownerID = "61557991443492";
const greetedGroups = new Set();

module.exports = {
  config: {
    name: "onlyadminbox",
    aliases: ["onlyadbox", "adboxonly", "adminboxonly"],
    version: "1.4",
    author: "NTKhang + Modified by Hasib",
    countDown: 5,
    role: 1,
    description: {
      vi: "bật/tắt chế độ chỉ quản trị của viên nhóm mới có thể sử dụng bot",
      en: "turn on/off only admin box can use bot"
    },
    category: "box chat",
    guide: {
      vi: "   {pn} [on | off]: bật/tắt chế độ chỉ quản trị viên nhóm mới có thể sử dụng bot"
        + "\n   {pn} noti [on | off]: bật/tắt thông báo khi người dùng không phải là quản trị viên nhóm sử dụng bot",
      en: "   {pn} [on | off]: turn on/off the mode only admin of group can use bot"
        + "\n   {pn} noti [on | off]: turn on/off the notification when user is not admin of group use bot"
    }
  },

  langs: {
    vi: {
      turnedOn: "Đã bật chế độ chỉ quản trị viên nhóm mới có thể sử dụng bot",
      turnedOff: "Đã tắt chế độ chỉ quản trị viên nhóm mới có thể sử dụng bot",
      turnedOnNoti: "Đã bật thông báo khi người dùng không phải là quản trị viên nhóm sử dụng bot",
      turnedOffNoti: "Đã tắt thông báo khi người dùng không phải là quản trị viên nhóm sử dụng bot",
      syntaxError: "Sai cú pháp, chỉ có thể dùng {pn} on hoặc {pn} off"
    },
    en: {
      turnedOn: "Turned on the mode only admin of group can use bot",
      turnedOff: "Turned off the mode only admin of group can use bot",
      turnedOnNoti: "Turned on the notification when user is not admin of group use bot",
      turnedOffNoti: "Turned off the notification when user is not admin of group use bot",
      syntaxError: "Syntax error, only use {pn} on or {pn} off"
    }
  },

  onStart: async function ({ args, message, event, threadsData, getLang, api, usersData }) {
    let isSetNoti = false;
    let value;
    let keySetData = "data.onlyAdminBox";
    let indexGetVal = 0;

    if (args[0] == "noti") {
      isSetNoti = true;
      indexGetVal = 1;
      keySetData = "data.hideNotiMessageOnlyAdminBox";
    }

    if (args[indexGetVal] == "on")
      value = true;
    else if (args[indexGetVal] == "off")
      value = false;
    else
      return message.reply(getLang("syntaxError"));

    await threadsData.set(event.threadID, isSetNoti ? !value : value, keySetData);

    if (isSetNoti)
      return message.reply(value ? getLang("turnedOnNoti") : getLang("turnedOffNoti"));
    else
      return message.reply(value ? getLang("turnedOn") : getLang("turnedOff"));
  },

  onChat: async function ({ event, threadsData, message, api, usersData }) {
    const { threadID, senderID, body } = event;
    if (!body) return;

    // Check if "only admin box" mode is enabled
    const onlyAdmin = await threadsData.get(threadID, "data.onlyAdminBox", false);
    if (!onlyAdmin) return;

    // If owner -> always allow
    if (senderID === ownerID) {
      // Greet only once per group
      if (!greetedGroups.has(threadID)) {
        greetedGroups.add(threadID);
        const ownerName = await usersData.getName(ownerID);
        api.sendMessage(
          `My Lord ${ownerName}, you have permission to use all commands`,
          threadID,
          (err, info) => {
            if (!err) {
              setTimeout(() => {
                api.unsendMessage(info.messageID);
              }, 7000);
            }
          }
        );
      }
      return; // allow usage
    }

    // Check if user is group admin
    const threadInfo = await api.getThreadInfo(threadID);
    const isGroupAdmin = threadInfo.adminIDs.some(e => e.id == senderID);

    if (!isGroupAdmin) {
      const hideNoti = await threadsData.get(threadID, "data.hideNotiMessageOnlyAdminBox", false);
      if (!hideNoti) {
        message.reply("Only group admins can use bot commands in this group.");
      }
      return; // block usage
    }
  }
};
