const fs = require("fs");
const path = __dirname + "/cache/vip.json";
const adminWarnPath = __dirname + "/cache/adminWarnings.json";
const botAdminPath = __dirname + "/cache/botAdmins.json";

// --- Owners (fixed) ---
const OWNER_UIDS = ["61557991443492", "61578418080601"];
const DEFAULT_DAYS = 7;

// --- Admin limits ---
const ADMIN_DEFAULT_HOURS = 1;
const ADMIN_MAX_HOURS = 3;
const ADMIN_MAX_WARNINGS = 5; // after 5 → ban

// --- Ensure files exist ---
if (!fs.existsSync(adminWarnPath)) fs.writeFileSync(adminWarnPath, JSON.stringify({}));
if (!fs.existsSync(botAdminPath)) fs.writeFileSync(botAdminPath, JSON.stringify([]));
if (!fs.existsSync(path)) fs.writeFileSync(path, JSON.stringify([]));

module.exports = {
  config: {
    name: "vip",
    version: "7.5",
    author: "Hasib",
    role: 0,
    shortDescription: "VIP system with expiration, warnings, admin ban & list",
    category: "admin"
  },

  langs: {
    en: {
      addAdminWarn: "⚠️ Strike #%1: VIP max 3h. You can repeat this %2 more time(s) before ban!",
      addAdminBanned: "⛔ 5 strikes reached! You are banned from VIP commands and removed from Admin.",
      noVip: "📭 No VIPs found.",
      vipListTitle: "📋 Current VIP List:"
    }
  },

  onStart: async function ({ message, args, event, role, api }) {
    const now = Date.now();
    let data = JSON.parse(fs.readFileSync(path));
    let warnings = JSON.parse(fs.readFileSync(adminWarnPath));
    let botAdmins = JSON.parse(fs.readFileSync(botAdminPath));

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
      if (!uid) {
        return message.reply("⚠️ Reply to a user's message to add VIP.");
      }

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

        const successMsg = await message.reply(`✅ VIP add (${name}) for ${input}`);
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

        const successMsg = await message.reply(`✅ VIP add (${name}) for ${input}`);
        setTimeout(() => api.unsendMessage(successMsg.messageID).catch(() => {}), 5000);
      }
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
