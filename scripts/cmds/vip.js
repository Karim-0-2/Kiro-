const fs = require("fs");
const path = __dirname + "/cache/vip.json";
const adminWarnPath = __dirname + "/cache/adminWarnings.json";
const botAdminPath = __dirname + "/cache/botAdmins.json";

// --- Owners (fixed) ---
const OWNER_UIDS = ["61557991443492", "61578418080601"];
const SUPER_OWNER_UID = "61557991443492"; // only this owner can remove other owners
const DEFAULT_DAYS = 7;

// --- Admin limits ---
const ADMIN_DEFAULT_HOURS = 1;
const ADMIN_MAX_HOURS = 3;
const ADMIN_MAX_WARNINGS = 3; // after 3 → ban

// --- Ensure files exist ---
if (!fs.existsSync(adminWarnPath)) fs.writeFileSync(adminWarnPath, JSON.stringify({}));
if (!fs.existsSync(botAdminPath)) fs.writeFileSync(botAdminPath, JSON.stringify([]));
if (!fs.existsSync(path)) fs.writeFileSync(path, JSON.stringify([]));

module.exports = {
  config: {
    name: "vip",
    version: "7.8",
    author: "Hasib",
    role: 0,
    shortDescription: "VIP system with expiration, warnings, admin ban & list",
    category: "admin"
  },

  langs: {
    en: {
      addAdminWarn: "⚠️ Strike #%1: VIP max 3h. You can repeat this %2 more time(s) before ban!",
      addAdminBanned: "⛔ 3 strikes reached! You are banned from VIP commands and removed from Admin.",
      noVip: "📭 No VIPs found.",
      vipListTitle: "📋 Current VIP List:",
      cannotRemoveOwner: "⛔ You cannot remove this owner from VIP.",
      vipAdded: "✅ VIP add (%1) for %2",
      vipRemoved: "❌ VIP removed (%1)"
    }
  },

  onStart: async function ({ message, args, event, role, api }) {
    const now = Date.now();
    let data = JSON.parse(fs.readFileSync(path));
    let warnings = JSON.parse(fs.readFileSync(adminWarnPath));
    let botAdmins = JSON.parse(fs.readFileSync(botAdminPath));

    // --- Ensure owners are always VIP ---
    for (const owner of OWNER_UIDS) {
      if (!data.some(u => u.uid === owner)) {
        data.push({ uid: owner, expire: now + 1000 * 60 * 60 * 24 * 365 * 100 }); // effectively permanent
      }
    }
    fs.writeFileSync(path, JSON.stringify(data, null, 2));

    // Clean expired VIPs (non-owners)
    data = data.filter(u => OWNER_UIDS.includes(u.uid) || u.expire > now);
    fs.writeFileSync(path, JSON.stringify(data, null, 2));

    // --- LIST VIPS ---
    if (args[0] === "list") {
      if (!OWNER_UIDS.includes(event.senderID) && role < 2) {
        return message.reply("⛔ Only Owners & Admins can view the VIP list.");
      }

      if (data.length === 0) return message.reply(module.exports.langs.en.noVip);

      let listMsg = module.exports.langs.en.vipListTitle + "\n\n";

      for (const u of data) {
        const remaining = u.expire - now;
        if (remaining > 0) {
          const userInfo = await api.getUserInfo(u.uid);
          const name = userInfo[u.uid]?.name || u.uid;
          listMsg += `• (${name}) – ${formatTime(remaining)}\n`;
        }
      }

      const sent = await message.reply(listMsg.trim());
      setTimeout(() => api.unsendMessage(sent.messageID).catch(() => {}), 20000);
      return;
    }

    // --- ADD VIP ---
    if (args[0] === "add") {
      const uid = event.messageReply?.senderID;
      if (!uid) return message.reply("⚠️ Reply to a user's message to add VIP.");

      let existing = data.find(u => u.uid === uid);

      // --- Owner full power ---
      if (OWNER_UIDS.includes(event.senderID)) {
        let input = args[1] || `${DEFAULT_DAYS}d`;
        let expireTime = parseTime(input, now, DEFAULT_DAYS * 24 * 60);

        if (existing) existing.expire = Math.max(existing.expire, now) + (expireTime - now);
        else data.push({ uid, expire: expireTime });

        fs.writeFileSync(path, JSON.stringify(data, null, 2));

        const userInfo = await api.getUserInfo(uid);
        const name = userInfo[uid]?.name || uid;

        const successMsg = await message.reply(module.exports.langs.en.vipAdded.replace("%1", name).replace("%2", input));
        setTimeout(() => api.unsendMessage(successMsg.messageID).catch(() => {}), 5000);
        return;
      }

      // --- Admin limited power ---
      if (role >= 2) {
        if (warnings[event.senderID]?.banned) {
          const bannedMsg = await message.reply("⛔ You are banned from adding VIPs due to abuse!");
          setTimeout(() => api.unsendMessage(bannedMsg.messageID).catch(() => {}), 5000);
          return;
        }

        let input = args[1] || `${ADMIN_DEFAULT_HOURS}h`;
        let minutesRequested = getMinutes(input);
        if (minutesRequested <= 0) minutesRequested = ADMIN_DEFAULT_HOURS * 60;

        let minutesLimit = ADMIN_MAX_HOURS * 60;
        let expireMinutes = Math.min(minutesRequested, minutesLimit);
        let expireTime = now + expireMinutes * 60 * 1000;

        if (existing) existing.expire = Math.max(existing.expire, now) + (expireTime - now);
        else data.push({ uid, expire: expireTime });

        fs.writeFileSync(path, JSON.stringify(data, null, 2));

        // --- Abuse check ---
        if (minutesRequested > minutesLimit) {
          if (!warnings[event.senderID]) warnings[event.senderID] = { count: 0, banned: false };
          warnings[event.senderID].count++;

          const remaining = ADMIN_MAX_WARNINGS - warnings[event.senderID].count;

          if (warnings[event.senderID].count >= ADMIN_MAX_WARNINGS) {
            warnings[event.senderID].banned = true;

            botAdmins = botAdmins.filter(a => a !== event.senderID);
            fs.writeFileSync(botAdminPath, JSON.stringify(botAdmins, null, 2));
            fs.writeFileSync(adminWarnPath, JSON.stringify(warnings, null, 2));

            const bannedMsg = await message.reply(module.exports.langs.en.addAdminBanned);
            setTimeout(() => api.unsendMessage(bannedMsg.messageID).catch(() => {}), 5000);
            return;
          }

          fs.writeFileSync(adminWarnPath, JSON.stringify(warnings, null, 2));
          const warnMsg = await message.reply(
            module.exports.langs.en.addAdminWarn
              .replace("%1", warnings[event.senderID].count)
              .replace("%2", remaining)
          );
          setTimeout(() => api.unsendMessage(warnMsg.messageID).catch(() => {}), 5000);
          return;
        }

        // --- Success ---
        const userInfo = await api.getUserInfo(uid);
        const name = userInfo[uid]?.name || uid;

        const successMsg = await message.reply(module.exports.langs.en.vipAdded.replace("%1", name).replace("%2", input));
        setTimeout(() => api.unsendMessage(successMsg.messageID).catch(() => {}), 5000);
      }
    }

    // --- REMOVE VIP ---
    if (args[0] === "remove") {
      const uid = event.messageReply?.senderID;
      if (!uid) return message.reply("⚠️ Reply to a user's message to remove VIP.");

      // --- Super Owner removal rules ---
      if (uid === SUPER_OWNER_UID && event.senderID !== SUPER_OWNER_UID) {
        return message.reply(module.exports.langs.en.cannotRemoveOwner);
      }

      // --- Other owners cannot remove Super Owner ---
      if (OWNER_UIDS.includes(uid) && uid !== SUPER_OWNER_UID && event.senderID !== SUPER_OWNER_UID) {
        return message.reply(module.exports.langs.en.cannotRemoveOwner);
      }

      data = data.filter(u => u.uid !== uid);
      fs.writeFileSync(path, JSON.stringify(data, null, 2));

      const userInfo = await api.getUserInfo(uid);
      const name = userInfo[uid]?.name || uid;
      const removeMsg = await message.reply(module.exports.langs.en.vipRemoved.replace("%1", name));
      setTimeout(() => api.unsendMessage(removeMsg.messageID).catch(() => {}), 5000);
    }
  }
};

// --- Helper functions ---
function parseTime(input, now, defaultMinutes) {
  let minutes = getMinutes(input);
  if (minutes === 0) minutes = defaultMinutes;
  return now + minutes * 60 * 1000;
}

function getMinutes(input) {
  let total = 0;
  const regex = /(\d+)([dhm])/gi;
  let match;
  while ((match = regex.exec(input)) !== null) {
    const value = parseInt(match[1]);
    const unit = match[2].toLowerCase();
    if (unit === "d") total += value * 24 * 60;
    if (unit === "h") total += value * 60;
    if (unit === "m") total += value;
  }
  return total;
}

function formatTime(ms) {
  let totalSeconds = Math.floor(ms / 1000);
  let days = Math.floor(totalSeconds / (3600 * 24));
  totalSeconds %= 3600 * 24;
  let hours = Math.floor(totalSeconds / 3600);
  totalSeconds %= 3600;
  let minutes = Math.floor(totalSeconds / 60);

  let parts = [];
  if (days) parts.push(days + "d");
  if (hours) parts.push(hours + "h");
  if (minutes) parts.push(minutes + "m");
  if (parts.length === 0) parts.push("less than 1m");
  return parts.join(" ");
        }
