module.exports.config = {
  name: "spamkick",
  version: "1.0.2",
  role: 0, 
  author: "Hasib",
  usePrefix: true,
  description: { 
      en: "Automatically kick a user who spams messages in a group chat"
  },
  category: "group",
  guide: { en:"[on/off] or [settings]"},
  countDown: 5
};

// Set the owner UID
const OWNER_ID = "61557991443492";

module.exports.onChat = async ({ api, event, usersData, commandName, threadsData }) => {
  const { senderID, threadID } = event;

  // Skip kick for owner, bot admin, or group admin
  const threadInfoData = await threadsData.get(threadID);
  const groupAdmins = threadInfoData.adminIDs.map(ad => ad.id);

  if ([OWNER_ID, ...global.GoatBot.config.adminBot, ...groupAdmins].includes(senderID)) return;

  if (!global.antispam) global.antispam = new Map();

  const threadInfo = global.antispam.has(threadID) ? global.antispam.get(threadID) : { users: {} };
  if (!(senderID in threadInfo.users)) {
    threadInfo.users[senderID] = { count: 1, time: Date.now() };
  } else {
    threadInfo.users[senderID].count++;
    const timePassed = Date.now() - threadInfo.users[senderID].time;
    const messages = threadInfo.users[senderID].count;
    const timeLimit = 80000;
    const messageLimit = 14; // Limit of messages

    if (messages > messageLimit && timePassed < timeLimit) {
      api.removeUserFromGroup(senderID, threadID, async (err) => {
        if (err) console.error(err);
        else {
          api.sendMessage({body: `${await usersData.getName(senderID)} has been removed for spamming.\nUser ID: ${senderID}\nReact to add them back.`}, threadID, (error, info) => {
            global.GoatBot.onReaction.set(info.messageID, { 
              commandName, 
              uid: senderID,
              messageID: info.messageID
            });
          });
        }
      });

      threadInfo.users[senderID] = { count: 1, time: Date.now() };
    } else if (timePassed > timeLimit) {
      threadInfo.users[senderID] = { count: 1, time: Date.now() };
    }
  }

  global.antispam.set(threadID, threadInfo);
};

module.exports.onReaction = async ({ api, event, Reaction, threadsData, usersData , role }) => {
    const { uid, messageID } = Reaction;
    const { adminIDs, approvalMode } = await threadsData.get(event.threadID);
    const botID = api.getCurrentUserID();

    // Only owner, bot admin, or group admin can react
    const threadAdmins = adminIDs.map(ad => ad.id);
    if (![OWNER_ID, ...global.GoatBot.config.adminBot, ...threadAdmins].includes(event.senderID)) return;

    let msg = "";
    try {
        await api.addUserToGroup(uid, event.threadID);
        if (approvalMode === true && !adminIDs.includes(botID)){
            msg += `Added ${await usersData.getName(uid)} to approval list.`;
            await api.unsendMessage(messageID);
        } else {
            msg += `Added ${await usersData.getName(uid)} to the group.`;
            await api.unsendMessage(messageID);
        }
    } catch (err) {
        msg += `Failed to add ${await usersData.getName(uid)} to the group.`;
    }
    console.log(msg);
}

module.exports.onStart = async ({ api, event, args, role, threadsData }) => {
  // Check permission: owner, bot admin, or group admin
  const threadInfo = await threadsData.get(event.threadID);
  const groupAdmins = threadInfo.adminIDs.map(ad => ad.id);
  if (![OWNER_ID, ...global.GoatBot.config.adminBot, ...groupAdmins].includes(event.senderID)) {
    api.sendMessage("You don't have permission to use this command.", event.threadID, event.messageID);
    return;
  }

  switch (args[0]) {
      case "on":
        if (!global.antispam) global.antispam = new Map();
        global.antispam.set(event.threadID, { users: {} });
        api.sendMessage("Spam kick has been turned ON for this group.", event.threadID,event.messageID);
        break;
      case "off":
        if (global.antispam && global.antispam.has(event.threadID)) {
          global.antispam.delete(event.threadID);
          api.sendMessage("Spam kick has been turned OFF for this group.", event.threadID,event.messageID);
        } else {
          api.sendMessage("Spam kick is not active in this group.", event.threadID,event.messageID);
        }
        break;
      default:
        api.sendMessage("Please use 'on' or 'off' to control Spam kick.", event.threadID,event.messageID);
  }
};
