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
    version: "7.0",
    author: "Hasib",
    role: 0,
    shortDescription: "VIP system with expiration, warnings, and admin ban for abuse",
    category: "admin"
  },

  langs: {
    en: {
      addAdminSuccess: "✅ VIP set/extended by admin for %1!",
      addAdminWarn: "🚨 WARNING 🚨\nYou attempted to give VIP for longer than 3 hours!\nThis is strike #%1 out of 5.\n⚠️ If you reach 5 strikes, you will be banned and removed from Admin list forever!",
      addAdminBanned: "⛔ You have reached 5 strikes!\nYou are now permanently banned from using VIP commands and removed from the Admin list.",
    }
  },

  onStart: async function ({ message, args, event, usersData, role, getLang }) {
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
        return message.reply(`✅ VIP set/extended for ${input}`);
      }

      // --- Admin limited power ---
      if (role >= 2) {
        // Check if banned
        if (warnings[event.senderID] && warnings[event.senderID].banned) {
          return message.reply("⛔ You are banned from adding VIPs due to abuse!");
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

          // If reached ban level
          if (warnings[event.senderID].count >= ADMIN_MAX_WARNINGS) {
            warnings[event.senderID].banned = true;

            // Remove from admin list
            botAdmins = botAdmins.filter(a => a !== event.senderID);
            fs.writeFileSync(botAdminPath, JSON.stringify(botAdmins, null, 2));

            fs.writeFileSync(adminWarnPath, JSON.stringify(warnings, null, 2));
            return message.reply(getLang("addAdminBanned"));
          }

          fs.writeFileSync(adminWarnPath, JSON.stringify(warnings, null, 2));
          return message.reply(getLang("addAdminWarn", warnings[event.senderID].count));
        }

        return message.reply(getLang("addAdminSuccess", input));
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
