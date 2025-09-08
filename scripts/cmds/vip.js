const fs = require("fs");
const vipPath = __dirname + "/cache/vip.json";
const botAdminPath = __dirname + "/cache/botAdmins.json";

// --- Owners (fixed) ---
const OWNERS = ["61557991443492", "61578418080601"];
const DEFAULT_DAYS = 7;

// --- Admin role level threshold ---
const ADMIN_ROLE_LEVEL = 2; // role >= 2 can remove VIPs

module.exports = {
  config: {
    name: "vip",
    version: "5.4",
    author: "Hasib",
    role: 0,
    shortDescription: "VIP system with dynamic bot admins",
    category: "admin",
    guide: "{pn} add [@tag/reply/uid] [days] | remove [@tag/reply/uid]\n{pn} list\n{pn} reply [@reply]\n{pn} botadmin add/remove [@uid]"
  },

  langs: {
    en: {
      noOwner: "⚠️ Only owners can do this.",
      noAdmin: "⚠️ Only admins can remove VIPs.",
      notBotAdmin: "⚠️ You are not a bot admin.",
      addSuccess: "✅ VIP added successfully for %1 day(s)!",
      removeSuccess: "🗑 VIP removed successfully!",
      alreadyInVIP: "⚠️ This user is already a VIP.",
      notInVIP: "❌ User is not in VIP list.",
      list: "📜 VIP list:\n%1",
      missingMessage: "❌ You need to write a message to send to VIPs!",
      reply: "📍 VIP %1: %2",
      replyUserSuccess: "✅ Message sent to VIP successfully!",
      expiredNotice: "⏰ VIP expired for user %1.",
      botAdminAdd: "✅ Bot admin %1 added.",
      botAdminRemove: "🗑 Bot admin %1 removed.",
      notInBotAdmin: "❌ User is not a bot admin."
    }
  },

  onStart: async function({ message, args, event, usersData, role, getLang }) {
    // --- Load VIP data ---
    if (!fs.existsSync(vipPath)) fs.writeFileSync(vipPath, JSON.stringify([]));
    let vipData = [];
    try { vipData = JSON.parse(fs.readFileSync(vipPath)); } 
    catch { fs.writeFileSync(vipPath, JSON.stringify([])); }

    // --- Load Bot Admin data ---
    if (!fs.existsSync(botAdminPath)) fs.writeFileSync(botAdminPath, JSON.stringify([]));
    let botAdmins = [];
    try { botAdmins = JSON.parse(fs.readFileSync(botAdminPath)); } 
    catch { fs.writeFileSync(botAdminPath, JSON.stringify([])); }

    const now = Date.now();

    // --- Remove expired VIPs ---
    const expired = vipData.filter(u => u.expire && u.expire <= now);
    if (expired.length > 0) {
      for (const u of expired) {
        const name = await usersData.getName(u.uid);
        message.send(getLang("expiredNotice", name));
      }
      vipData = vipData.filter(u => u.expire > now);
      fs.writeFileSync(vipPath, JSON.stringify(vipData, null, 2));
    }

    // --- BOT ADMIN MANAGEMENT (Owner only) ---
    if (args[0] === "botadmin") {
      if (!OWNERS.includes(event.senderID)) return message.reply(getLang("noOwner"));
      const action = args[1]; // add or remove
      const uid = event.messageReply?.senderID || event.mentions?.[Object.keys(event.mentions || {})[0]] || args[2];
      if (!uid) return message.reply("Provide a UID, reply, or mention.");

      if (action === "add") {
        if (!botAdmins.includes(uid)) {
          botAdmins.push(uid);
          fs.writeFileSync(botAdminPath, JSON.stringify(botAdmins, null, 2));
          return message.reply(getLang("botAdminAdd", await usersData.getName(uid)));
        } else return message.reply(getLang("botAdminAdd", await usersData.getName(uid)));
      }

      if (action === "remove") {
        const index = botAdmins.indexOf(uid);
        if (index !== -1) {
          botAdmins.splice(index, 1);
          fs.writeFileSync(botAdminPath, JSON.stringify(botAdmins, null, 2));
          return message.reply(getLang("botAdminRemove", await usersData.getName(uid)));
        } else return message.reply(getLang("notInBotAdmin", await usersData.getName(uid)));
      }

      return message.reply("Invalid botadmin command. Use add/remove.");
    }

    // --- ADD VIP (Owners or Bot Admins) ---
    if (args[0] === "add") {
      const uid = event.messageReply?.senderID || event.mentions?.[Object.keys(event.mentions || {})[0]] || args[1];
      if (!uid) return message.reply("Provide a UID, reply, or mention.");
      if (vipData.find(u => u.uid === uid)) return message.reply(getLang("alreadyInVIP"));

      let days;
      if (OWNERS.includes(event.senderID)) {
        days = parseInt(args[2]) || DEFAULT_DAYS;
        if (isNaN(days) || days < 1) days = 1;
      } else if (botAdmins.includes(event.senderID)) {
        days = 2 / 24; // 2 hours
      } else {
        return message.reply(getLang("noOwner"));
      }

      vipData.push({ uid, expire: now + days * 24 * 60 * 60 * 1000 });
      fs.writeFileSync(vipPath, JSON.stringify(vipData, null, 2));
      return message.reply(getLang("addSuccess", days >= 1 ? days : "0.08 (~2 hours)"));
    }

    // --- REMOVE VIP (Admins) ---
    if (args[0] === "remove") {
      if (role < ADMIN_ROLE_LEVEL) return message.reply(getLang("noAdmin"));
      const uid = event.messageReply?.senderID || event.mentions?.[Object.keys(event.mentions || {})[0]] || args[1];
      if (!uid) return message.reply("Provide a UID, reply, or mention.");

      const index = vipData.findIndex(u => u.uid === uid);
      if (index === -1) return message.reply(getLang("notInVIP"));

      vipData.splice(index, 1);
      fs.writeFileSync(vipPath, JSON.stringify(vipData, null, 2));
      return message.reply(getLang("removeSuccess"));
    }

    // --- VIP LIST ---
    if (args[0] === "list") {
      if (vipData.length === 0) return message.reply("📜 VIP list is empty.");
      const listText = await Promise.all(vipData.map(async (u, i) => {
        const name = await usersData.getName(u.uid);
        const daysLeft = Math.max(0, Math.ceil((u.expire - now) / (1000 * 60 * 60 * 24)));
        return `${i + 1}. ${name} - ${daysLeft} day(s) left`;
      }));
      return message.reply(getLang("list", listText.join("\n")));
    }

    // --- REPLY TO VIP MESSAGE ---
    if (args[0] === "reply") {
      if (!event.messageReply) return message.reply("Reply to a VIP message to respond!");
      const uid = event.messageReply.senderID;
      await message.send({
        body: getLang("reply", await usersData.getName(uid), args.slice(1).join(" ")),
        mentions: [{ id: uid }]
      });
      return message.reply(getLang("replyUserSuccess"));
    }

    // --- BROADCAST MESSAGE TO ALL VIPs ---
    if (!args[0]) return message.reply(getLang("missingMessage"));
    const msg = args.join(" ");
    let success = 0, failed = 0;

    for (const { uid } of vipData) {
      try {
        await message.send({
          body: `📣 VIP message from ${await usersData.getName(event.senderID)}:\n\n${msg}`
        }, uid);
        success++;
      } catch (e) {
        failed++;
      }
    }
    return message.reply(`✅ Sent to ${success} VIP(s), failed: ${failed}`);
  }
};
