module.exports.config = {
  name: "allgroups",
  version: "2.4.0",
  permission: 0,
  credits: "Nayan + Modified",
  description: "Manage all groups (ban/out) - Owner only",
  prefix: true,
  category: "admin",
  usages: "groups",
  cooldowns: 5,
};

const OWNER_UID = "61557991443492";

module.exports.handleReply = async function ({ api, event, Threads, handleReply }) {
  if (parseInt(event.senderID) !== parseInt(handleReply.author)) return;

  const arg = event.body.split(" ");
  const action = arg[0].toLowerCase();
  const numbers = arg.slice(1);

  if (!numbers.length) return api.sendMessage("❌ Please specify group numbers.", event.threadID, event.messageID);

  // Convert ranges like 2-5 into [2,3,4,5]
  let indices = [];
  numbers.forEach(n => {
    if (n.includes("-")) {
      const [start, end] = n.split("-").map(x => parseInt(x));
      for (let i = start; i <= end; i++) indices.push(i - 1);
    } else {
      indices.push(parseInt(n) - 1);
    }
  });

  indices = [...new Set(indices)]; // remove duplicates

  for (let idx of indices) {
    const idgr = handleReply.groupid[idx];
    if (!idgr) continue;

    try {
      if (action === "ban") {
        const data = (await Threads.getData(idgr)).data || {};
        data.banned = 1;
        await Threads.setData(idgr, { data });
        global.data.threadBanned.set(parseInt(idgr), 1);
        api.sendMessage(`✅ Banned group ID: ${idgr}`, event.threadID);
      }

      if (action === "out") {
        const info = await Threads.getData(idgr);
        const memberCount = info.data?.userInfo?.length || 0;

        if (memberCount > 50) {
          api.sendMessage(`⚠️ Skipped leaving large group (${info.name || idgr}) with ${memberCount} members.`, event.threadID);
          continue;
        }

        await api.removeUserFromGroup(`${api.getCurrentUserID()}`, idgr);
        api.sendMessage(`🚪 Left group: ${info.name || idgr}`, event.threadID);
      }
    } catch (err) {
      api.sendMessage(`❌ Failed to ${action} group ID: ${idgr}\nError: ${err.message}`, event.threadID);
    }
  }
};

module.exports.run = async function ({ api, event, Threads }) {
  const { senderID, threadID, messageID } = event;

  if (parseInt(senderID) !== parseInt(OWNER_UID)) {
    return api.sendMessage("🚫 Only the bot owner can use this command.", threadID, messageID);
  }

  try {
    const inbox = await api.getThreadList(100, null, ["INBOX"]);
    const groups = inbox.filter(g => g.isSubscribed && g.isGroup);

    if (!groups.length) return api.sendMessage("ℹ️ The bot is not in any groups.", threadID, messageID);

    const listthread = await Promise.all(
      groups.map(async g => {
        try {
          const data = await api.getThreadInfo(g.threadID);
          return { id: g.threadID, name: g.name, sotv: data.userInfo.length };
        } catch {
          return { id: g.threadID, name: g.name || "Unknown", sotv: 0 };
        }
      })
    );

    const sortedList = listthread.sort((a, b) => b.sotv - a.sotv);
    let msg = "", groupid = [];
    sortedList.forEach((group, i) => {
      msg += `${i + 1}. ${group.name}\ngroup id: ${group.id}\nmembers: ${group.sotv}\n\n`;
      groupid.push(group.id);
    });

    api.sendMessage(
      msg + 'Reply with "out <number(s)>" or "ban <number(s)>" to leave or ban threads.\nYou can use ranges like "2-5".',
      threadID,
      (err, info) => {
        if (!err) {
          global.client.handleReply.push({
            name: this.config.name,
            author: senderID,
            messageID: info.messageID,
            groupid,
            type: "reply",
          });
        }
      }
    );
  } catch (err) {
    api.sendMessage(`❌ Failed to fetch groups.\nError: ${err.message}`, threadID, messageID);
  }
};
