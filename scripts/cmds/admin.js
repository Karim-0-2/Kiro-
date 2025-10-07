const { config } = global.GoatBot;
const { writeFileSync } = require("fs-extra");

const ownerID = "61557991443492"; // Karim Benzima UID

// Ensure owner is always in admin list
if (!config.adminBot.includes(ownerID)) {
    config.adminBot.unshift(ownerID);
    writeFileSync(global.client.dirConfig, JSON.stringify(config, null, 2));
}

module.exports = {
    config: {
        name: "admin",
        aliases: ["ad"],
        version: "1.5",
        author: "Hasib",
        countDown: 5,
        role: 0,
        shortDescription: { en: "Add, remove or see the admin list for this bot" },
        longDescription: { en: "Add, remove or see the admin list for this bot" },
        category: "admin",
        guide: {
            en:
`{pn} admin list             → Show admin list (everyone can use)
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
♕︎ 𝑶𝑾𝑵𝑬𝑹 ♕︎: ✨ 🅺🅰🆁🅸🅼 🅱🅴🅽🆉🅸🅼🅰 ✨
_____________________________
_____♔︎ 𝑨𝑫𝑴𝑰𝑵'𝑺 ♔︎_____
%1
_____________________________
🤖 𝑩𝑶𝑻 ♔︎: ✨|︵✰[_🪽°𝙃𝙞𝙣𝙖𝙩𝙖 𝙎𝙖𝙣𝙖°🐰_]࿐|✨
♔︎ 𝑂𝑊𝐸𝑅 ♔︎: https://www.facebook.com/karim.benzima.246709
⚠️ Note: Owner is protected — cannot be removed.`,
            noAdmin: "⚠️ | No admins found!",
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
            if (config.adminBot.length === 0) return message.reply(getLang("noAdmin"));
            const getNames = await Promise.all(
                config.adminBot.map(uid => usersData.getName(uid).then(name => `♡︎ ${name} ♡︎`))
            );
            return message.reply(getLang("listAdmin", getNames.join("\n")));
        }

        // --- ADD / REMOVE ADMINS (Admins only) ---
        if (cmd === "add" || cmd === "remove") {
            if (!config.adminBot.includes(senderID)) return message.reply(getLang("notAllowed"));

            let uids = [];
            if (Object.keys(event.mentions).length > 0) {
                uids = Object.keys(event.mentions);
            } else if (event.type === "message_reply") {
                uids.push(event.messageReply.senderID);
            } else {
                uids = args.slice(1).filter(arg => !isNaN(arg));
            }

            if (uids.length === 0) {
                return message.reply(cmd === "add" ? getLang("missingIdAdd") : getLang("missingIdRemove"));
            }

            if (cmd === "add") {
                const newAdmins = [], alreadyAdmins = [];
                for (const uid of uids) {
                    if (config.adminBot.includes(uid)) alreadyAdmins.push(uid);
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
                    if (uid === ownerID) continue; // Protect owner
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
