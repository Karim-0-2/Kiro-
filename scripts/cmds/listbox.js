const OWNER_UID = "61557991443492"; // 🔑 Replace with your UID

module.exports = {
  config: {
    name: "listbox",
    version: "2.1.0",
    author: "Hasib ",
    role: 2, // Admin only, but locked with OWNER_UID
    shortDescription: "List groups the bot is in",
    longDescription: "Show all groups where the bot is present. Option to ban, unban, or leave multiple groups.",
    category: "system",
    guide: {
      en: "{pn}\nReply with: ban <numbers>, out <numbers>, unban <numbers>"
    }
  },

  // 🔄 Handle reply actions
  onReply: async function({ api, event, Reply, threadsData }) {
    if (String(event.senderID) !== OWNER_UID)
      return api.sendMessage("❌ You are not authorized to use this command.", event.threadID);

    const args = event.body.trim().split(/\s+/);
    const action = args[0].toLowerCase();
    const indexes = args.slice(1).map(n => parseInt(n) - 1).filter(n => n >= 0);

    if (!["ban", "out", "unban"].includes(action))
      return api.sendMessage("❌ Invalid action! Use 'ban', 'out', or 'unban'.", event.threadID);

    let results = [];

    for (const i of indexes) {
      const idgr = Reply.groupid[i];
      if (!idgr) {
        results.push(`❌ Invalid number: ${i + 1}`);
        continue;
      }

      if (action === "ban") {
        try {
          const data = (await threadsData.get(idgr)).data || {};
          data.banned = 1;
          await threadsData.set(idgr, { data });
          global.data.threadBanned.set(parseInt(idgr), 1);
          results.push(`✅ Banned group [${idgr}]`);
        } catch (e) {
          results.push(`❌ Failed to ban group [${idgr}]`);
        }
      }

      if (action === "unban") {
        try {
          const data = (await threadsData.get(idgr)).data || {};
          data.banned = 0;
          await threadsData.set(idgr, { data });
          global.data.threadBanned.delete(parseInt(idgr));
          results.push(`🔓 Unbanned group [${idgr}]`);
        } catch (e) {
          results.push(`❌ Failed to unban group [${idgr}]`);
        }
      }

      if (action === "out") {
        try {
          await api.removeUserFromGroup(api.getCurrentUserID(), idgr);
          const info = await threadsData.get(idgr);
          results.push(`🚪 Left group: ${info.threadInfo?.threadName || "Unknown"} [${idgr}]`);
        } catch (e) {
          results.push(`❌ Failed to leave group [${idgr}]`);
        }
      }
    }

    return api.sendMessage(results.join("\n"), event.threadID);
  },

  // 🚀 Main command
  onStart: async function({ api, event, threadsData, message }) {
    if (String(event.senderID) !== OWNER_UID)
      return message.reply("❌ You are not authorized to use this command.");

    try {
      const inbox = await api.getThreadList(100, null, ["INBOX"]);
      const groups = inbox.filter(g => g.isSubscribed && g.isGroup);

      let listthread = [];
      for (const group of groups) {
        try {
          const info = await api.getThreadInfo(group.threadID);
          listthread.push({
            id: group.threadID,
            name: group.name || "Unnamed group",
            members: info.userInfo.length
          });
        } catch {
          listthread.push({
            id: group.threadID,
            name: "❌ Cannot fetch info",
            members: 0
          });
        }
      }

      // Sort by member count
      listthread.sort((a, b) => b.members - a.members);

      let msg = "📋 LIST OF GROUPS 📋\n━━━━━━━━━━━━━━\n";
      let i = 1, groupid = [];
      for (const group of listthread) {
        msg += `${i}. ${group.name}\n🆔 TID: ${group.id}\n👥 Members: ${group.members}\n━━━━━━━━━━━━━━\n`;
        groupid.push(group.id);
        i++;
      }

      msg += '\n👉 Reply: "out 1 2 3" to leave groups\n👉 Reply: "ban 2 4 5" to ban groups\n👉 Reply: "unban 1 3" to unban groups';

      return message.reply(msg, (err, info) => {
        if (err) return;
        global.GoatBot.onReply.set(info.messageID, {
          commandName: this.config.name,
          author: event.senderID,
          messageID: info.messageID,
          groupid,
          type: "reply"
        });
      });

    } catch (e) {
      return message.reply("❌ Error while fetching group list: " + e.message);
    }
  }
};
