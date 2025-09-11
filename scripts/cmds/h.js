const fs = require('fs');
const path = require('path');
const { drive, getStreamFromURL } = global.utils;

const hotDataFilePath = path.join(__dirname, 'vdo.json');
const OWNER_ID = "61557991443492"; // Replace with your owner UID

function readHotData() {
    try {
        const data = fs.readFileSync(hotDataFilePath, 'utf8');
        return JSON.parse(data) || [];
    } catch (error) {
        return [];
    }
}

function writeHotData(data) {
    fs.writeFileSync(hotDataFilePath, JSON.stringify(data), 'utf8');
}

module.exports = {
    config: {
        name: 'h', // Changed command name
        version: '1.0',
        author: 'Kshitiz',
        role: 0, // Manual owner check
        shortDescription: {
            en: 'Manage videos'
        },
        longDescription: {
            en: 'Add and send videos'
        },
        category: 'custom',
        guide: {
            en: '   {pn} add: Reply to a video to add it to the video collection'
                + '\n   {pn} send: Send a random video from the video collection'
        }
    },

    onStart: async function ({ args, message, event }) {
        if (message.senderID !== OWNER_ID) {
            return message.reply('❌ Only the owner can use this command.');
        }

        const hotData = readHotData();

        switch (args[0]) {
            case 'add': {
                if (event.messageReply && event.messageReply.attachments && event.messageReply.attachments.length > 0) {
                    const videoAttachment = event.messageReply.attachments.find(att => att.type === 'video');

                    if (!videoAttachment) {
                        return message.reply('Reply to a video to add it to the video collection.');
                    }

                    const fileName = `hot_${Date.now()}.mp4`;
                    const infoFile = await drive.uploadFile(fileName, 'application/octet-stream', await getStreamFromURL(videoAttachment.url));

                    hotData.push(infoFile.id);
                    writeHotData(hotData); 
                    message.reply('Video added to the hot collection.');
                } else {
                    message.reply('Please reply to a video to add it to the video collection.');
                }
                break;
            }

            case 'send': {
                if (hotData.length === 0) {
                    return message.reply('The video collection is empty.');
                }

                if (!hotData._sentVideos || hotData._sentVideos.length === hotData.length) {
                    hotData._sentVideos = [];
                }

                let randomVideoId;
                do {
                    randomVideoId = hotData[Math.floor(Math.random() * hotData.length)];
                } while (hotData._sentVideos.includes(randomVideoId));

                const videoStream = await drive.getFile(randomVideoId, 'stream', true);
                message.reply({
                    attachment: [videoStream],
                });

                hotData._sentVideos.push(randomVideoId);
                writeHotData(hotData); 
                break;
            }

            default:
                message.SyntaxError();
                break;
        }
    }
};
