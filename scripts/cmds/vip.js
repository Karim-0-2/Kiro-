const fs = require("fs");
const path = __dirname + "/cache/vip.json";

// Owners (full power)
const OWNER_UIDS = ["61557991443492", "61578418080601"];
const DEFAULT_DAYS = 7;

module.exports = {
  config: {
    name: "vip",
    version: "5.8",
    author: "Hasib",
    role: 0,
    shortDescription: "VIP system with expiration, re-add support, and respectful non-VIP reply",
    category: "admin",
    guide:
      "{pn} add [@tag/reply/uid] [time]\n   - Owner: e.g. 5d (5 days), 3h (3 hours)\n   - Admin: always 2h fixed\n" +
      "{pn} remove [@tag/reply/uid]\n{pn} list\n{pn} [message] (send to all VIPs)\n{pn} reply [@reply]"
  },

  langs: {
    en: {
      noOwner: "⚠️ Only Hasib or his wife can set custom time VIPs.",
      addOwnerSuccess: "✅ VIP set/extended for %1!",
      addAdminSuccess: "✅ VIP set/extended by admin for 2 hours only!",
      alreadyInVIP: "⚠️ User is already a VIP. Time extended!",
      removeSuccess: "🗑 VIP removed successfully!",
      notInVIP: "❌ User is not in VIP list.",
      list: "📜 VIP list:\n%1",
      missingMessage: "❌ You need to write a message to send to VIPs!",
      reply: "📍 VIP %1: %2",
      replyUserSuccess: "✅ Message sent to VIP successfully!",
      expiredNotice: "⏰ VIP expired for user %1.",
      notVipReply: "🌷 Dear friend, this feature is for VIPs only ✨.\nIf you would like to become a VIP, please respectfully ask my Owner or Bot Admins 💖."
    }
  },

  onStart: async function ({ message, args, event, usersData, role, getLang }) {
    if (!fs.existsSync(path)) fs.writeFileSync(path, JSON.stringify([]));
    let data = JSON.parse(fs.readFileSync(path));
    const now = Date.now();

    // --- Auto-remove expired VIPs ---
    const expired = data.filter(u => u.expire <= now);
    if (expired.length > 0) {
      for (const u of expired) {
        const name = await usersData.getName(u.uid);
        message.send(getLang("expiredNotice", name));
      }
      data = data.filter(u => u.expire > now);
      fs.writeFileSync(path, JSON.stringify(data, null, 2));
    }

    // --- ADD VIP ---
    if (args[0] === "add") {
      const uid =
        event.messageReply?.senderID ||
        event.mentions?.[Object.keys(event.mentions || {})[0]] ||
        args[1];
      if (!uid) return message.reply("Provide a UID, reply, or mention.");
      let existing = data.find(u => u.uid === uid);

      // Owner: custom time (days or hours)
      if (OWNER_UIDS.includes(event.senderID)) {
        let input = args[2] || `${DEFAULT_DAYS}d`;
        let expireTime = null;

        if (/^\d+d$/i.test(input)) {
          const days = parseInt(input);
          expireTime = now + days * 24 * 60 * 60 * 1000;
        } else if (/^\d+h$/i.test(input)) {
          const hours = parseInt(input);
          expireTime = now + hours * 60 * 60 * 1000;
        } else {
          expireTime = now + DEFAULT_DAYS * 24 * 60 * 60 * 1000;
          input = `${DEFAULT_DAYS}d`;
        }

        if (existing) {
          existing.expire = Math.max(existing.expire, now) + (expireTime - now);
        } else {
          data.push({ uid, expire: expireTime });
        }

        fs.writeFileSync(path, JSON.stringify(data, null, 2));
        return message.reply(getLang("addOwnerSuccess", input));
      }

      // Admins: fixed 2 hours
      if (role >= 2) {
        if (existing) {
          existing.expire = Math.max(existing.expire, now) + 2 * 60 * 60 * 1000;
        } else {
          data.push({ uid, expire: now + 2 * 60 * 60 * 1000 });
        }
        fs.writeFileSync(path, JSON.stringify(data, null, 2));
        return message.reply(getLang("addAdminSuccess"));
      }

      return message.reply(getLang("noOwner"));
    }

    // --- REMOVE VIP (Owner & Admin both) ---
    if (args[0] === "remove") {
      if (role < 2 && !OWNER_UIDS.includes(event.senderID))
        return message.reply("⚠️ Only admins or owners can remove VIPs.");
      const uid =
        event.messageReply?.senderID ||
        event.mentions?.[Object.keys(event.mentions || {})[0]] ||
        args[1];
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
      const listText = await Promise.all(
        data.map(async (u, i) => {
          const name = await usersData.getName(u.uid);
          const msLeft = u.expire - now;
          const days = Math.floor(msLeft / (1000 * 60 * 60 * 24));
          const hours = Math.floor((msLeft % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
          const minutes = Math.floor((msLeft % (1000 * 60 * 60)) / (1000 * 60));
          let timeLeft = "";
          if (days > 0) timeLeft += `${days}d `;
          if (hours > 0) timeLeft += `${hours}h `;
          if (minutes > 0 && days === 0) timeLeft += `${minutes}m`;
          if (timeLeft === "") timeLeft = "less than 1m";

          return `${i + 1}. ${name} - ${timeLeft} left`;
        })
      );
      return message.reply(getLang("list", listText.join("\n")));
    }

    // --- REPLY TO VIP MESSAGE ---
    if (args[0] === "reply") {
      if (!event.messageReply)
        return message.reply("Reply to a VIP message to respond!");
      if (!data.find(u => u.uid === event.senderID)) {
        return message.reply(getLang("notVipReply"));
      }
      const uid = event.messageReply.senderID;
      await message.send({
        body: getLang(
          "reply",
          await usersData.getName(uid),
          args.slice(1).join(" ")
        ),
        mentions: [{ id: uid }]
      });
      return message.reply(getLang("replyUserSuccess"));
    }

    // --- BROADCAST TO ALL VIPs ---
    if (!args[0]) {
      if (!data.find(u => u.uid === event.senderID)) {
        return message.reply(getLang("notVipReply"));
      }
      return message.reply(getLang("missingMessage"));
    }

    if (!data.find(u => u.uid === event.senderID)) {
      return message.reply(getLang("notVipReply"));
    }

    const msg = args.join(" ");
    let success = 0,
      failed = 0;
    for (const { uid } of data) {
      try {
        await message.send(
          {
            body: `📣 VIP message from ${await usersData.getName(
              event.senderID
            )}:\n\n${msg}`
          },
          uid
        );
        success++;
      } catch (e) {
        failed++;
      }
    }
    return message.reply(`✅ Sent to ${success} VIP(s), failed: ${failed}`);
  }
};
