const fs = require("fs");
const path = __dirname + "/cache/vip.json";
const superVipPath = __dirname + "/cache/superVip.json";
const vipUsagePath = __dirname + "/cache/vipUsage.json";
const adminWarnPath = __dirname + "/cache/adminWarnings.json";
const botAdminPath = __dirname + "/cache/botAdmins.json";

// --- Fixed Owners ---
const OWNER_UIDS = ["61557991443492", "61578418080601"];
const SUPER_OWNER_UID = "61557991443492"; // Hasib
const DEFAULT_DAYS = 7;

// --- Admin limits ---
const ADMIN_DEFAULT_HOURS = 1;
const ADMIN_MAX_HOURS = 3;
const ADMIN_MAX_WARNINGS = 3; // after 3 → ban

// --- Ensure files exist ---
if (!fs.existsSync(path)) fs.writeFileSync(path, JSON.stringify([]));
if (!fs.existsSync(superVipPath)) fs.writeFileSync(superVipPath, JSON.stringify([]));
if (!fs.existsSync(vipUsagePath)) fs.writeFileSync(vipUsagePath, JSON.stringify({}));
if (!fs.existsSync(adminWarnPath)) fs.writeFileSync(adminWarnPath, JSON.stringify({}));
if (!fs.existsSync(botAdminPath)) fs.writeFileSync(botAdminPath, JSON.stringify([]));

module.exports = {
  config: {
    name: "vip",
    version: "10.0",
    author: "Hasib",
    role: 0,
    shortDescription: "VIP system with Super VIP ⭐",
    category: "admin"
  },

  langs: {
    en: {
      vipLimitReached: "⚠️ You have reached your 10 VIP command limit!",
      superVipAdded: "✅ %1 is now Super VIP ⭐",
      superVipRemoved: "❌ %1 is removed from Super VIP",
      superVipNoPermission: "⚠️ Only Hasib can manage Super VIPs!",
      vipAdded: "✅ VIP added (%1) for %2",
      vipRemoved: "❌ VIP removed (%1)",
      vipListTitle: "📋 Current VIP List:"
    }
  },

  onStart: async function ({ message, args, event, role, api, prefix }) {
    const now = Date.now();

    let data = JSON.parse(fs.readFileSync(path));
    let superVips = JSON.parse(fs.readFileSync(superVipPath));
    let vipUsage = JSON.parse(fs.readFileSync(vipUsagePath));

    // Ensure owners are always VIP
    for (const owner of OWNER_UIDS) {
      if (!data.some(u => u.uid === owner)) {
        data.push({ uid: owner, expire: now + 1000 * 60 * 60 * 24 * 365 * 100 }); // permanent
      }
    }
    fs.writeFileSync(path, JSON.stringify(data, null, 2));

    // Clean expired VIPs (non-owners)
    data = data.filter(u => OWNER_UIDS.includes(u.uid) || u.expire > now);
    fs.writeFileSync(path, JSON.stringify(data, null, 2));

    const isSuperVIP = superVips.includes(event.senderID);
    const isVIP = data.some(u => u.uid === event.senderID);

    // Determine prefix
    const usedPrefix = (isSuperVIP ? ">" : prefix);
    if (!event.body?.startsWith(usedPrefix)) return;

    // --- LIST VIPS ---
    if (args[0] === "list") {
      if (!OWNER_UIDS.includes(event.senderID) && role < 2 && !isVIP && !isSuperVIP) {
        return message.reply("⛔ Only VIP/Admin/Owner can view VIP list.");
      }

      if (data.length === 0) return message.reply(module.exports.langs.en.vipListTitle + " (empty)");

      let listMsg = module.exports.langs.en.vipListTitle + "\n\n";
      for (const u of data) {
        const remaining = u.expire - now;
        const userInfo = await api.getUserInfo(u.uid);
        const name = userInfo[u.uid]?.name || u.uid;
        let display = name;
        if (superVips.includes(u.uid)) display += " ⭐"; // mark super VIP
        else if (remaining > 0) display += ` – ${formatTime(remaining)}`; // show remaining VIP time
        listMsg += `• (${display})\n`;
      }

      const sent = await message.reply(listMsg.trim());
      setTimeout(() => api.unsendMessage(sent.messageID).catch(() => {}), 20000);
      return;
    }

    // --- ADD VIP ---
    if (args[0] === "add") {
      const uid = event.messageReply?.senderID;
      if (!uid) return message.reply("⚠️ Reply to a user's message to add VIP.");

      // --- SUPER VIP ASSIGN ---
      if (args[1] === "-" && args[2]?.toLowerCase() === "super") {
        if (event.senderID !== SUPER_OWNER_UID) {
          const warnMsg = await message.reply(module.exports.langs.en.superVipNoPermission);
          setTimeout(() => api.unsendMessage(warnMsg.messageID).catch(() => {}), 5000);
          return;
        }

        if (!superVips.includes(uid)) superVips.push(uid);
        fs.writeFileSync(superVipPath, JSON.stringify(superVips, null, 2));

        // Add permanent VIP
        if (!data.some(u => u.uid === uid)) {
          data.push({ uid, expire: now + 1000 * 60 * 60 * 24 * 365 * 100 });
          fs.writeFileSync(path, JSON.stringify(data, null, 2));
        }

        const userInfo = await api.getUserInfo(uid);
        const name = userInfo[uid]?.name || uid;
        const msg = await message.reply(module.exports.langs.en.superVipAdded.replace("%1", name));
        setTimeout(() => api.unsendMessage(msg.messageID).catch(() => {}), 5000);
        return;
      }

      // --- NORMAL VIP ---
      if (!isSuperVIP) {
        vipUsage[event.senderID] = vipUsage[event.senderID] || 0;
        if (vipUsage[event.senderID] >= 10) {
          return message.reply(module.exports.langs.en.vipLimitReached);
        }
        vipUsage[event.senderID]++;
        fs.writeFileSync(vipUsagePath, JSON.stringify(vipUsage, null, 2));
      }

      // Set VIP expire
      let existing = data.find(u => u.uid === uid);
      let expireTime = now + DEFAULT_DAYS * 24 * 60 * 60 * 1000;
      if (existing) existing.expire = expireTime;
      else data.push({ uid, expire: expireTime });
      fs.writeFileSync(path, JSON.stringify(data, null, 2));

      const userInfo = await api.getUserInfo(uid);
      const name = userInfo[uid]?.name || uid;
      const successMsg = await message.reply(module.exports.langs.en.vipAdded.replace("%1", name).replace("%2", `${DEFAULT_DAYS}d`));
      setTimeout(() => api.unsendMessage(successMsg.messageID).catch(() => {}), 5000);
      return;
    }

    // --- REMOVE VIP ---
    if (args[0] === "remove") {
      const uid = event.messageReply?.senderID;
      if (!uid) return message.reply("⚠️ Reply to a user's message to remove VIP.");

      // Owners cannot remove Hasib
      if (uid === SUPER_OWNER_UID && event.senderID !== SUPER_OWNER_UID) return message.reply("⛔ Cannot remove Hasib from VIP.");

      data = data.filter(u => u.uid !== uid);
      fs.writeFileSync(path, JSON.stringify(data, null, 2));

      const userInfo = await api.getUserInfo(uid);
      const name = userInfo[uid]?.name || uid;
      const removeMsg = await message.reply(module.exports.langs.en.vipRemoved.replace("%1", name));
      setTimeout(() => api.unsendMessage(removeMsg.messageID).catch(() => {}), 5000);

      // Remove from Super VIP if exists
      const index = superVips.indexOf(uid);
      if (index !== -1) superVips.splice(index, 1);
      fs.writeFileSync(superVipPath, JSON.stringify(superVips, null, 2));
      return;
    }
  }
};

// --- Helper Functions ---
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
