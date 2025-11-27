const fs = require("fs");
const path = __dirname + "/cache/vip.json";
const superVipPath = __dirname + "/cache/superVip.json";

// --- Fixed Owners ---
const OWNER_UIDS = ["61557991443492"]; // Hasib 👹
const SUPER_OWNER_UID = "61557991443492"; // Only Hasib can manage Super VIPs

// --- Ensure files exist ---
if (!fs.existsSync(path)) fs.writeFileSync(path, JSON.stringify([]));
if (!fs.existsSync(superVipPath)) fs.writeFileSync(superVipPath, JSON.stringify([]));

module.exports = {
config: {
name: "vip",
version: "11.5",
author: "Hasib",
role: 0,
shortDescription: "VIP system (Owner controls Super VIP ⭐)",
category: "admin"
},

langs: {
en: {
superVipAdded: "✅ %1 is now Super VIP ⭐",
superVipRemoved: "❌ %1 𝐉𝐚𝐮 𝐦𝐮𝐫𝐢 𝐤𝐡𝐚𝐰",
vipAdded: "✅ %1 𝐕𝐢𝐩 𝐚𝐝𝐝 𝐝𝐨𝐧𝐞",
vipRemoved: "❌ %1 𝐕𝐢𝐩 𝐭𝐡𝐚𝐤𝐚𝐫 𝐣𝐨𝐠𝐠𝐨𝐭𝐚 𝐧𝐚𝐢 𝐭𝐨𝐫",
vipListTitle: "📋 Current VIP List:",
noPermission: "⛔ 𝐕𝐢𝐩 𝐥𝐢𝐬𝐭 𝐝𝐚𝐢𝐤𝐡𝐚 𝐤𝐢 𝐥𝐚𝐛!",
onlyOwnerSuperVip: "⚠️𝗦𝗢𝗥𝗥𝗬 𝗢𝗡𝗟𝗬 𝗢𝗪𝗡𝗘𝗥 𝗖𝗔𝗡 𝗔𝗕𝗟𝗘 𝗧𝗢 𝗨𝗦𝗘 𝗧𝗛𝗜𝗦 𝗙𝗘𝗔𝗨𝗧𝗨𝗥𝗘 !"
}
},

onStart: async function ({ message, args, event, role, api }) {
let data = JSON.parse(fs.readFileSync(path));
let superVips = JSON.parse(fs.readFileSync(superVipPath));

const isOwner = OWNER_UIDS.includes(event.senderID);  
const isAdmin = role >= 1; // Admin from config  
const now = Date.now();  

// --- Automatically ensure Owners & Admins are VIP ---  
const addIfMissing = uid => {  
  if (!data.some(u => u.uid === uid)) data.push({ uid });  
};  
for (const owner of OWNER_UIDS) addIfMissing(owner);  
if (isAdmin) addIfMissing(event.senderID);  

fs.writeFileSync(path, JSON.stringify(data, null, 2));  

// --- VIP LIST ---  
if (args[0] === "list") {  
  let listMsg = module.exports.langs.en.vipListTitle + "\n\n";  
  for (const u of data) {  
    const userInfo = await api.getUserInfo(u.uid);  
    const name = userInfo[u.uid]?.name || u.uid;  
    const display = superVips.includes(u.uid) ? `${name} ⭐` : name;  
    listMsg += `• ${display}\n`;  
  }  
  const sent = await message.reply(listMsg.trim());  
  setTimeout(() => api.unsendMessage(sent.messageID).catch(() => {}), 20000);  
  return;  
}  

// --- ADD VIP ---  
if (args[0] === "add") {  
  const uid = event.messageReply?.senderID;  
  if (!uid) return message.reply("⚠️ Reply to a user's message to add VIP.");  

  // Super VIP add → only owner  
  if (args[1]?.toLowerCase() === "super") {  
    if (event.senderID !== SUPER_OWNER_UID)  
      return message.reply(module.exports.langs.en.onlyOwnerSuperVip);  

    if (!superVips.includes(uid)) superVips.push(uid);  
    fs.writeFileSync(superVipPath, JSON.stringify(superVips, null, 2));  

    addIfMissing(uid);  
    fs.writeFileSync(path, JSON.stringify(data, null, 2));  

    const userInfo = await api.getUserInfo(uid);  
    const name = userInfo[uid]?.name || uid;  
    const msg = await message.reply(  
      module.exports.langs.en.superVipAdded.replace("%1", name)  
    );  
    setTimeout(() => api.unsendMessage(msg.messageID).catch(() => {}), 5000);  
    return;  
  }  

  // Normal VIP add → Admin or Owner  
  if (!isAdmin && !isOwner)  
    return message.reply(module.exports.langs.en.noPermission);  

  addIfMissing(uid);  
  fs.writeFileSync(path, JSON.stringify(data, null, 2));  

  const userInfo = await api.getUserInfo(uid);  
  const name = userInfo[uid]?.name || uid;  
  const msg = await message.reply(  
    module.exports.langs.en.vipAdded.replace("%1", name)  
  );  
  setTimeout(() => api.unsendMessage(msg.messageID).catch(() => {}), 5000);  
  return;  
}  

// --- REMOVE VIP ---  
if (args[0] === "remove") {  
  const uid = event.messageReply?.senderID;  
  if (!uid) return message.reply("⚠️ Reply to a user's message to remove VIP.");  

  // Super VIP remove → only owner  
  if (superVips.includes(uid)) {  
    if (event.senderID !== SUPER_OWNER_UID)  
      return message.reply(module.exports.langs.en.onlyOwnerSuperVip);  

    superVips = superVips.filter(u => u !== uid);  
    fs.writeFileSync(superVipPath, JSON.stringify(superVips, null, 2));  
  }  

  // Normal VIP remove → Admin or Owner  
  if (!isAdmin && !isOwner)  
    return message.reply(module.exports.langs.en.noPermission);  

  if (OWNER_UIDS.includes(uid) && !isOwner)  
    return message.reply("⛔ 𝐓𝐨𝐫 𝐬𝐚𝐡𝐨𝐬 𝐭𝐨 𝐤𝐨𝐦 𝐧𝐚😾");  

  data = data.filter(u => u.uid !== uid);  
  fs.writeFileSync(path, JSON.stringify(data, null, 2));  

  const userInfo = await api.getUserInfo(uid);  
  const name = userInfo[uid]?.name || uid;  
  const msg = await message.reply(  
    module.exports.langs.en.vipRemoved.replace("%1", name)  
  );  
  setTimeout(() => api.unsendMessage(msg.messageID).catch(() => {}), 5000);  
  return;  
}

}
};
