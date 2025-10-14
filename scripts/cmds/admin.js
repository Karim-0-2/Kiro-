const { config } = global.GoatBot;
const { writeFileSync } = require("fs-extra");

// --- Owner setup ---
const OWNER_ID = "61557991443492"; // Owner UID
const OWNER_DISPLAY_NAME = "🅺🅰🆁🅸🅼 🅱🅴🅽🆉🅸🅼🅰"; // Always manually set

// Special 3 admins
const SPECIAL_ADMINS = [
    { uid: "61554678316179", name: "Arafat Mondal" },
    { uid: "100091527859576", name: "Six Pain" },
    { uid: "61581779215073", name: "ESHA Hawladar" }
];

module.exports = {
    config: {
        name: "admin",
        aliases: ["ad"],
        version: "2.2",
        author: "Hasib",
        countDown: 5,
        role: 0,
        shortDescription: { en: "Add, remove or see the admin list for this bot" },
        longDescription: { en: "Add, remove or see the admin list for this bot" },
        category: "admin",
        guide: {
            en: `{pn} admin list             → Show admin list (everyone can use)
{pn} admin add <uid|@tag>    → Add admin role for user (admins only)
{pn} admin remove <uid|@tag> → Remove admin role from user (admins only)
Reply to a user + {pn} admin add/remove → Add/remove admin by reply`
        }
    },

    langs: {
        en: {
            listAdmin:
`🎭 𝗢𝗪𝗡𝗘𝗥 𝑎𝑛𝑑 𝗔𝗗𝗠𝗜𝗡 🎭
♦___________________♦
♕︎ 𝑶𝑾𝑵𝑬𝑹 ♕︎: ✨ ${OWNER_DISPLAY_NAME} ✨
_____________________________
_____♔︎ 𝑨𝑫𝑴𝑰𝑵'𝑺 ♔︎_____
%1
_____________________________
🤖 𝑩𝑶𝑻 ♔︎: ✨|︵✰[_🪽°Hinata Sana°🐰_]࿐|✨
♔︎ 𝑂𝑊𝐸𝑅 ♔: https://www.facebook.com/karim.benzima.246709
⚠️ Note: Owner is protected — cannot be removed.`,
            added: "✅ | Added admin role for %1 users:\n%2",
            alreadyAdmin: "⚠️ | %1 users already have admin role:\n%2",
            missingIdAdd: "⚠️ | Please provide an ID, mention a user, or reply to a message to add admin",
            removed: "✅ | Removed admin role from %1 users:\n%2",
            notAdmin: "⚠️ | %1 users do not have admin role:\n%2",
            missingIdRemove: "⚠️ | Please provide an ID, mention a user, or reply to a message to remove admin",
            notAllowed: "⛔ | You don't have permission to use this command!"
        }
    },

    onStart: async function ({ message, args, usersData, event, getLang }) {
        const senderID = event.senderID;
        const cmd = args[0];

        // --- LIST ADMINS (Everyone can use) ---
        if (cmd === "list") {
            let adminNames = [];

            // Show SPECIAL_ADMINS only if their UID is in config.adminBot
            SPECIAL_ADMINS.forEach(admin => {
                if (config.adminBot.includes(admin.uid)) {
                    adminNames.push(`• ${admin.name}`);
                }
            });

            // Show other admins who have used bot
            const dynamicAdmins = config.adminBot.filter(uid => 
                !SPECIAL_ADMINS.some(a => a.uid === uid) && uid !== OWNER_ID
            );
            for (const uid of dynamicAdmins) {
                const name = await usersData.getName(uid);
                adminNames.push(`• ${name}`);
            }

            // Send the list
            return message.reply(getLang("listAdmin", adminNames.join("\n")));
        }

        // --- ADD / REMOVE ADMINS (Admins only) ---
        if (cmd === "add" || cmd === "remove") {
            if (!config.adminBot.includes(senderID) && senderID !== OWNER_ID)
                return message.reply(getLang("notAllowed"));

            let uids = [];
            if (Object.keys(event.mentions).length > 0)
                uids = Object.keys(event.mentions);
            else if (event.type === "message_reply")
                uids.push(event.messageReply.senderID);
            else
                uids = args.slice(1).filter(arg => !isNaN(arg));

            if (uids.length === 0)
                return message.reply(cmd === "add" ? getLang("missingIdAdd") : getLang("missingIdRemove"));

            if (cmd === "add") {
                const newAdmins = [], alreadyAdmins = [];
                for (const uid of uids) {
                    if (config.adminBot.includes(uid) || uid === OWNER_ID)
                        alreadyAdmins.push(uid);
                    else newAdmins.push(uid);
                }

                config.adminBot.push(...newAdmins);
                writeFileSync(global.client.dirConfig, JSON.stringify(config, null, 2));

                const newAdminNames = await Promise.all(newAdmins.map(uid => usersData.getName(uid)));
                const alreadyAdminNames = await Promise.all(alreadyAdmins.map(uid => usersData.getName(uid)));

                return message.reply(
                    (newAdmins.length > 0 ? getLang("added", newAdmins.length, newAdminNames.map(n => `• ${n}`).join("\n")) : "") +
                    (alreadyAdmins.length > 0 ? getLang("alreadyAdmin", alreadyAdmins.length, alreadyAdminNames.map(n => `• ${n}`).join("\n")) : "")
                );
            }

            if (cmd === "remove") {
                const removedAdmins = [], notAdmins = [];
                for (const uid of uids) {
                    // Protect Owner and SPECIAL_ADMINS
                    if (uid === OWNER_ID || SPECIAL_ADMINS.some(a => a.uid === uid)) continue;
                    if (config.adminBot.includes(uid)) {
                        removedAdmins.push(uid);
                        config.adminBot.splice(config.adminBot.indexOf(uid), 1);
                    } else notAdmins.push(uid);
                }

                writeFileSync(global.client.dirConfig, JSON.stringify(config, null, 2));

                const removedAdminNames = await Promise.all(removedAdmins.map(uid => usersData.getName(uid)));
                const notAdminNames = await Promise.all(notAdmins.map(uid => usersData.getName(uid)));

                return message.reply(
                    (removedAdmins.length > 0 ? getLang("removed", removedAdmins.length, removedAdminNames.map(n => `• ${n}`).join("\n")) : "") +
                    (notAdmins.length > 0 ? getLang("notAdmin", notAdmins.length, notAdminNames.map(n => `• ${n}`).join("\n")) : "")
                );
            }
        }

        return message.reply("⚠️ | Invalid command! Use 'admin list', 'admin add', or 'admin remove'.");
    }
};
