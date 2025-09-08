const fs = require("fs");
const path = __dirname + "/cache/vip.json";

const OWNERS = ["61578418080601", "61557991443492"]; 
const ADMINS = ["100060606189407", "61576296543095", "61554678316179", "100091527859576"];
const DEFAULT_DAYS = 7;

module.exports = {
  config: {
    name: "vip",
    version: "6.3",
    author: "Hasib",
    role: 0,
    shortDescription: "VIP system with expiration, owner & admin rules",
    category: "admin",
    guide: {
      en: `{pn} add [@tag/reply/uid] [days] | remove [@tag/reply/uid]
{pn} list
{pn} [message] (send to all VIPs)
{pn} reply [@reply]`
    }
  },

  langs: {
    en: {
      noPermission: "⚠️ Only Owner(Hasib)or Admins can add VIPs.",
      noAdmin: "⚠️ Only Owner(Hasib)/Admins can remove VIPs.",
      addSuccess: "✅ Added %1 to VIP for %2!",
      alreadyInVIP: "⚠️ This user is already a VIP.",
      removeSuccess: "🗑 VIP removed successfully!",
      notInVIP: "❌ User is not in VIP list.",
      list: "📜 VIP list:\n%1",
      missingMessage: "❌ You need to write a message to send to VIPs!",
      reply: "📍 VIP %1: %2",
      replyUserSuccess: "✅ Message sent to VIP successfully!",
      expiredNotice: "⏰ Expired VIPs: %1",
      notVIP: "❌ You are not a VIP! Ask an Owner/Admin to add you."
    }
  },

  onStart: async function ({ message, args, event, usersData, getLang, api }) {
    // Load VIP data
    if (!fs.existsSync(path)) fs.writeFileSync(path, JSON.stringify([]));
    let data = JSON.parse(fs.readFileSync(path));
    const now = Date.now();

    // --- Remove expired VIPs automatically ---
    const expired = data.filter(u => u.expire <= now);
    if (expired.length > 0) {
      const names = await Promise.all(expired.map(u => usersData.getName(u.uid)));
      message.send(getLang("expiredNotice", names.join(", ")));
      data = data.filter(u => u.expire > now);
      fs.writeFileSync(path, JSON.stringify(data, null, 2));
    }

    const sender = String(event.senderID);

    // --- ADD VIP ---
    if (args[0] === "add") {
      const uid = String(
        event.messageReply?.senderID ||
        event.mentions?.[Object.keys(event.mentions || {})[0]] ||
        args[1]
      );
      if (!uid) return message.reply("Provide a UID, reply, or mention.");
      if (data.find(u => u.uid === uid)) return message.reply(getLang("alreadyInVIP"));

      if (OWNERS.includes(sender)) {
        let days = parseInt(args[2]) || DEFAULT_DAYS;
        if (isNaN(days) || days < 1) days = 1;
        data.push({ uid, expire: now + days * 24 * 60 * 60 * 1000 });
        fs.writeFileSync(path, JSON.stringify(data, null, 2));
        return message.reply(getLang("addSuccess", await usersData.getName(uid), `${days} day(s)`));
      }

      if (ADMINS.includes(sender)) {
        const hours = 3;
        data.push({ uid, expire: now + hours * 60 * 60 * 1000 });
        fs.writeFileSync(path, JSON.stringify(data, null, 2));
        return message.reply(getLang("addSuccess", await usersData.getName(uid), `${hours} hour(s)`));
      }

      return message.reply(getLang("noPermission"));
    }

    // --- REMOVE VIP ---
    if (args[0] === "remove") {
      if (!OWNERS.includes(sender) && !ADMINS.includes(sender)) {
        return message.reply(getLang("noAdmin"));
      }
      const uid = String(
        event.messageReply?.senderID ||
        event.mentions?.[Object.keys(event.mentions || {})[0]] ||
        args[1]
      );
      if (!uid) return message.reply("Provide a UID, reply, or mention.");
      const index = data.findIndex(u => u.uid === uid);
      if (index === -1) return message.reply(getLang("notInVIP"));
      data.splice(index, 1);
      fs.writeFileSync(path, JSON.stringify(data, null, 2));
      return message.reply(getLang("removeSuccess"));
    }

    // --- VIP LIST ---
    if (args[0] === "list") {
      if (data.length === 0) return message.reply("📜 VIP list is empty.");
      const listText = await Promise.all(data.map(async (u, i) => {
        const name = await usersData.getName(u.uid);
        const left = u.expire - now;
        const daysLeft = Math.floor(left / (1000 * 60 * 60 * 24));
        const hoursLeft = Math.floor((left % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        return `${i + 1}. ${name} - ${daysLeft}d ${hoursLeft}h left`;
      }));
      return message.reply(getLang("list", listText.join("\n")));
    }

    // --- REPLY TO VIP ---
    if (args[0] === "reply") {
      if (!event.messageReply) return message.reply("Reply to a VIP message to respond!");
      const uid = String(event.messageReply.senderID);
      if (!data.find(u => u.uid === uid)) return message.reply(getLang("notVIP"));
      await message.send({
        body: getLang("reply", await usersData.getName(uid), args.slice(1).join(" ")),
        mentions: [{ id: uid }]
      });
      return message.reply(getLang("replyUserSuccess"));
    }

    // --- BROADCAST MESSAGE TO ALL VIPs ---
    if (!args[0]) return message.reply(getLang("missingMessage"));

    // Check sender VIP status
    const senderIsVIP = data.some(u => u.uid === sender);
    if (!senderIsVIP && !OWNERS.includes(sender) && !ADMINS.includes(sender)) {
      return message.reply(getLang("notVIP"));
    }

    const msg = args.join(" ");
    let success = 0, failed = 0;
    for (const { uid } of data) {
      try {
        await api.sendMessage(
          `📣 VIP message from ${await usersData.getName(sender)}:\n\n${msg}`,
          uid
        );
        success++;
      } catch {
        failed++;
      }
    }
    return message.reply(`✅ Sent to ${success} VIP(s), failed: ${failed}`);
  }
};
