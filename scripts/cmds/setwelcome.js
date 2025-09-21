const { drive, getStreamFromURL, getExtFromUrl, getTime } = global.utils;
const { existsSync, mkdirSync, createReadStream, unlinkSync } = global.nodemodule["fs-extra"];
const { join } = global.nodemodule["path"];

const DEFAULT_TEMPLATES = [
`🌸 ʜᴇʟʟᴏ {userName} 🎀 ᴡᴇʟᴄᴏᴍᴇ ᴛᴏ ᴏᴜʀ ɢʀᴏᴜᴘ — {boxName} 🌟 📌 ʏᴏᴜ'ʀᴇ ᴛʜᴇ {memberCount} ᴍᴇᴍʙᴇʀ ᴏɴ ᴛʜɪꜱ ɢʀᴏᴜᴘ! 💬 ғᴇᴇʟ ғʀᴇᴇ ᴛᴏ ᴄʜᴀᴛ, ᴄᴏɴɴᴇᴄᴛ ᴀɴᴅ ʜᴀᴠᴇ ꜰᴜɴ ʜᴇʀᴇ! ✿⃝ ʏᴏᴜʀ ʙʙᴢ_💋🧸ʙᴏᴛ ━━━━━━━━━━━━━━━━ 📅 {timestamp}`,
`🌟 ᴡᴇʟᴄᴏᴍᴇ {userName}!\n🎉 ʏᴏᴜ'ʀᴇ ᴛʜᴇ {memberCount}ᴛʜ ᴍᴇᴍʙᴇʀ ɪɴ {boxName}!\n💌 ʜᴀᴠᴇ ꜰᴜɴ ᴀɴᴅ ᴄʜᴀᴛ ᴡɪᴛʜ ᴏᴛʜᴇʀ ᴍᴇᴍʙᴇʀs!\n━━━━━━━━━━━━━━━━\n🕒 {timestamp}`,
`🎀 ʜᴇʟʟᴏ {userName}!\n🌸 ʏᴏᴜ'ᴠᴇ ᴊᴏɪɴᴇᴅ {boxName} — ᴡᴇ ᴀʀᴇ ʜᴀᴘᴘʏ ᴛᴏ ʜᴀᴠᴇ ʏᴏᴜ!\n📌 ᴛᴏᴛᴀʟ ᴍᴇᴍʙᴇʀs: {memberCount}\n💬 ᴇɴᴊᴏʏ ʏᴏᴜʀ ᴄʜᴀᴛ ʜᴇʀᴇ!\n━━━━━━━━━━━━━━━━\n📅 {timestamp}`
];

// Ensure GIF cache folder exists
const GIF_PATH = join(__dirname, "..", "events", "cache", "joinGif");
if (!existsSync(GIF_PATH)) mkdirSync(GIF_PATH, { recursive: true });

module.exports = {
    config: {
        name: "setwelcome",
        aliases: ["setwc"],
        version: "4.0",
        author: "Hasib",
        countDown: 5,
        role: 1,
        description: "Multi-template anime-style welcome with GIF support",
        category: "custom"
    },

    langs: {
        en: {
            turnedOn: "Welcome message enabled",
            turnedOff: "Welcome message disabled",
            missingContent: "Please enter welcome message content",
            edited: "Welcome message edited to: %1",
            reseted: "Welcome message reset to default",
            noFile: "No welcome attachments to delete",
            resetedFile: "Welcome attachments reset successfully",
            missingFile: "Please reply with image/video/audio file",
            addedFile: "Added %1 attachments to welcome message",
            gifSaved: "GIF saved successfully!",
            gifRemoved: "GIF removed successfully!",
            gifNotExist: "No GIF set for this thread",
            invalidURL: "Invalid GIF URL!"
        }
    },

    onStart: async function ({ args, threadsData, message, event }) {
        const { threadID } = event;
        const { data } = await threadsData.get(threadID);

        switch (args[0]) {
            case "template": {
                const index = parseInt(args[1]);
                if (isNaN(index) || index < 1 || index > DEFAULT_TEMPLATES.length)
                    return message.reply(`Invalid template number! Choose 1-${DEFAULT_TEMPLATES.length}`);
                data.selectedTemplate = index - 1;
                await threadsData.set(threadID, { data });
                return message.reply(`Template ${index} selected successfully!`);
            }

            case "text": {
                const text = args.slice(1).join(" ");
                if (!text) return message.reply("Please enter welcome message content!");
                if (text.toLowerCase() === "reset") delete data.welcomeMessage;
                else data.welcomeMessage = text;
                await threadsData.set(threadID, { data });
                return message.reply(data.welcomeMessage ? "Custom welcome message set!" : "Welcome message reset to default template.");
            }

            case "file": {
                if (args[1] === "reset") {
                    if (!data.welcomeAttachment) return message.reply("No attachments to delete");
                    try {
                        await Promise.all(data.welcomeAttachment.map(fileId => drive.deleteFile(fileId)));
                        delete data.welcomeAttachment;
                    } catch { }
                    await threadsData.set(threadID, { data });
                    return message.reply("Attachments reset successfully");
                } else {
                    if (event.attachments.length === 0 && (!event.messageReply || event.messageReply.attachments.length === 0))
                        return message.reply("Please reply with image/video/audio file");
                    saveAttachments(message, event, threadID, event.senderID, threadsData);
                }
                break;
            }

            case "gif": {
                const pathGif = join(GIF_PATH, `${threadID}.gif`);
                if (args[1] === "remove") {
                    if (!existsSync(pathGif)) return message.reply("No GIF set for this thread");
                    unlinkSync(pathGif);
                    return message.reply("GIF removed successfully!");
                } else {
                    const url = args[1];
                    if (!url || !url.match(/(http(s?):)([/|.|\w|\s|-])*\.(?:gif|GIF)/g))
                        return message.reply("Invalid GIF URL!");
                    try {
                        await global.utils.downloadFile(url, pathGif);
                    } catch {
                        return message.reply("Failed to download GIF. Check URL or internet.");
                    }
                    return message.reply("GIF saved successfully!");
                }
                break;
            }

            case "on":
            case "off": {
                const settings = (await threadsData.get(threadID)).settings || {};
                settings.sendWelcomeMessage = args[0] === "on";
                await threadsData.set(threadID, { settings });
                return message.reply(settings.sendWelcomeMessage ? "Welcome messages enabled" : "Welcome messages disabled");
            }

            default:
                message.SyntaxError();
        }
    },

    onUserJoin: async function ({ threadsData, event }) {
        const { threadID, userID } = event;
        const { data, info } = await threadsData.get(threadID);
        if (!info) return;

        const memberCount = info.participantIDs.length;
        const groupName = info.threadName;
        const now = new Date();
        const timestamp = `${now.toLocaleTimeString()} - ${now.toLocaleDateString()} - ${now.toLocaleString('en-US', { weekday: 'long' })}`;

        let msg = data.welcomeMessage || DEFAULT_TEMPLATES[data.selectedTemplate || 0];
        msg = msg.replace(/{userName}/g, `@${userID}`)
                 .replace(/{boxName}/g, groupName)
                 .replace(/{memberCount}/g, memberCount)
                 .replace(/{timestamp}/g, timestamp);

        const attachments = data.welcomeAttachment || [];
        const pathGif = join(GIF_PATH, `${threadID}.gif`);
        if (existsSync(pathGif)) attachments.push(createReadStream(pathGif));

        global.GoatBot.sendMessage({ body: msg, mentions: [{ tag: `@${userID}`, id: userID }], attachment: attachments }, threadID);
    }
};

async function saveAttachments(message, event, threadID, senderID, threadsData) {
    const { data } = await threadsData.get(threadID);
    const attachments = [...event.attachments, ...(event.messageReply?.attachments || [])].filter(a => ["photo","video","audio","animated_image"].includes(a.type));
    if (!data.welcomeAttachment) data.welcomeAttachment = [];

    await Promise.all(attachments.map(async a => {  
        const ext = getExtFromUrl(a.url);
        const fileName = `${getTime()}.${ext}`;
        const fileInfo = await drive.uploadFile(`setwelcome_${threadID}_${senderID}_${fileName}`, await getStreamFromURL(a.url));
        data.welcomeAttachment.push(fileInfo.id);
    }));

    await threadsData.set(threadID, { data });
    message.reply(`Added ${attachments.length} attachments to welcome message!`);
        }
