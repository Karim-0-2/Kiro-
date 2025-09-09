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

module.exports = {
  config: {
    name: "vip",
    version: "7.2",
    author: "Hasib",
    role: 0,
    shortDescription: "VIP system with expiration, warnings, and admin ban for abuse",
    category: "admin"
  },

  langs: {
    en: {
      addAdminSuccess: "✅ VIP set/extended for %1!",
      addAdminWarn: "⚠️ Strike #%1: VIP max 3h. You can repeat this %2 more time(s) before ban!",
      addAdminBanned: "⛔ 5 strikes reached! You are banned from VIP commands and removed from Admin."
    }
  },

  onStart: async function ({ message, args, event, role, api }) {
    const now = Date.now();
    let data = fs.existsSync(path) ? JSON.parse(fs.readFileSync(path)) : [];
    let warnings = JSON.parse(fs.readFileSync(adminWarnPath));
    let botAdmins = JSON.parse(fs.readFileSync(botAdminPath));

    // --- ADD VIP ---
    if (args[0] === "add") {
      const uid =
        event.messageReply?.senderID ||
        event.mentions?.[Object.keys(event.mentions || {})[0]] ||
        args[1];
      if (!uid) return message.reply("Provide a UID, reply, or mention.");
      let existing = data.find(u => u.uid === uid);

      // --- Owner full power ---
      if (OWNER_UIDS.includes(event.senderID)) {
        let input = args[2] || `${DEFAULT_DAYS}d`;
        let expireTime = parseTime(input, now, DEFAULT_DAYS * 24 * 60);

        if (existing) existing.expire = Math.max(existing.expire, now) + (expireTime - now);
        else data.push({ uid, expire: expireTime });

        fs.writeFileSync(path, JSON.stringify(data, null, 2));

        const successMsg = await message.reply(`✅ VIP set/extended for ${input}`);
        setTimeout(() => api.unsendMessage(successMsg.messageID).catch(() => {}), 5000);
        return;
      }

      // --- Admin limited power ---
      if (role >= 2) {
        // Check if banned
        if (warnings[event.senderID]?.banned) {
          const bannedMsg = await message.reply("⛔ You are banned from adding VIPs due to abuse!");
          setTimeout(() => api.unsendMessage(bannedMsg.messageID).catch(() => {}), 5000);
          return;
        }

        let input = args[2] || `${ADMIN_DEFAULT_HOURS}h`;
        let minutesRequested = getMinutes(input);
        if (minutesRequested <= 0) minutesRequested = ADMIN_DEFAULT_HOURS * 60;

        let minutesLimit = ADMIN_MAX_HOURS * 60;
        let expireMinutes = Math.min(minutesRequested, minutesLimit);
        let expireTime = now + expireMinutes * 60 * 1000;

        if (existing) existing.expire = Math.max(existing.expire, now) + (expireTime - now);
        else data.push({ uid, expire: expireTime });

        fs.writeFileSync(path, JSON.stringify(data, null, 2));

        // If tried to cross limit
        if (minutesRequested > minutesLimit) {
          if (!warnings[event.senderID]) warnings[event.senderID] = { count: 0, banned: false };
          warnings[event.senderID].count++;

          const remaining = ADMIN_MAX_WARNINGS - warnings[event.senderID].count;

          // If reached ban level
          if (warnings[event.senderID].count >= ADMIN_MAX_WARNINGS) {
            warnings[event.senderID].banned = true;

            // Remove from admin list
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

        // Success message
        const successMsg = await message.reply(
          module.exports.langs.en.addAdminSuccess.replace("%1", input)
        );
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
