const fs = require("fs-extra");
const path = require("path");

module.exports.config = {
    name: "setjoin",
    version: "1.0.9",
    hasPermssion: 1,
    credits: "𝐇𝐚𝐬𝐢𝐛 𖣘",
    description: "Tự động gửi text + GIF khi thành viên mới tham gia nhóm",
    commandCategory: "config",
    usages: "[gif/text] [Text hoặc URL để tải GIF]",
    cooldowns: 10,
    dependencies: {
        "fs-extra": "",
        "path": ""
    }
};

// Tạo folder lưu GIF nếu chưa có
module.exports.onLoad = function () {
    const joinGifPath = path.join(__dirname, "..", "events", "cache", "joinGif");
    if (!fs.existsSync(joinGifPath)) fs.mkdirSync(joinGifPath, { recursive: true });
};

// --- Vietnamese text for code readability ---
const viText = {
    savedConfig: "Đã lưu tùy chỉnh của bạn thành công! Dưới đây là phần preview:",
    tagMember: "[Tên thành viên]",
    tagType: "[Bạn/các bạn]",
    tagCountMember: "[Số thành viên]",
    tagNameGroup: "[Tên nhóm]",
    gifPathNotExist: "Nhóm của bạn chưa từng cài đặt GIF join!",
    removeGifSuccess: "Đã gỡ bỏ thành công file GIF của nhóm bạn!",
    invaildURL: "URL không hợp lệ!",
    internetError: "Không thể tải file, có thể do vấn đề mạng!",
    saveGifSuccess: "Đã lưu file GIF thành công, dưới đây là phần preview:"
};

// --- English translation for messages sent by bot ---
const enText = {
    "Đã lưu tùy chỉnh của bạn thành công! Dưới đây là phần preview:": "✅ Your custom settings have been saved! Preview below:",
    "[Tên thành viên]": "[Member Name]",
    "[Bạn/các bạn]": "[You/All]",
    "[Số thành viên]": "[Member Count]",
    "[Tên nhóm]": "[Group Name]",
    "Nhóm của bạn chưa từng cài đặt GIF join!": "This group hasn't set a join GIF yet!",
    "Đã gỡ bỏ thành công file GIF của nhóm bạn!": "✅ GIF file removed successfully!",
    "URL không hợp lệ!": "❌ Invalid URL!",
    "Không thể tải file, có thể do vấn đề mạng!": "❌ Cannot download file. Check your internet connection!",
    "Đã lưu file GIF thành công, dưới đây là phần preview:": "✅ GIF saved successfully! Preview below:"
};

// Hàm lấy text, trả về English khi gửi
function getText(key) {
    const vi = viText[key] || key;
    return enText[vi] || vi;
}

// Xử lý sự kiện khi có thành viên mới
module.exports.handleEvent = async function ({ event, api, Threads, Users }) {
    try {
        const { threadID, addedParticipants } = event;
        if (!addedParticipants || addedParticipants.length === 0) return;

        const data = (await Threads.getData(threadID)).data;
        const pathGif = path.join(__dirname, "..", "events", "cache", "joinGif", `${threadID}.gif`);

        for (const user of addedParticipants) {
            const userName = (await Users.getData(user.userID)).name || getText("tagMember");

            let body = data.customJoin ? data.customJoin
                .replace(/\{name}/g, getText("tagMember"))
                .replace(/\{type}/g, getText("tagType"))
                .replace(/\{soThanhVien}/g, getText("tagCountMember"))
                .replace(/\{threadName}/g, getText("tagNameGroup")) : "";

            if (fs.existsSync(pathGif)) {
                await api.sendMessage({ body: body || undefined, attachment: fs.createReadStream(pathGif) }, threadID);
            } else if (body) {
                await api.sendMessage(body, threadID);
            }
        }

    } catch (e) {
        console.log("Join Event Error:", e);
    }
};

// Command cài đặt text/GIF
module.exports.run = async function ({ args, event, api, Threads }) {
    try {
        const { threadID, messageID } = event;
        const msg = args.slice(1).join(" ");
        const data = (await Threads.getData(threadID)).data;
        const joinGifPath = path.join(__dirname, "..", "events", "cache", "joinGif");
        const pathGif = path.join(joinGifPath, `${threadID}.gif`);

        switch (args[0]) {

            case "text": {
                if (!msg) return api.sendMessage("❌ Please enter a text!", threadID, messageID);
                data.customJoin = msg;
                global.data.threadData.set(parseInt(threadID), data);
                await Threads.setData(threadID, { data });

                const body = msg
                    .replace(/\{name}/g, getText("tagMember"))
                    .replace(/\{type}/g, getText("tagType"))
                    .replace(/\{soThanhVien}/g, getText("tagCountMember"))
                    .replace(/\{threadName}/g, getText("tagNameGroup"));

                if (fs.existsSync(pathGif)) {
                    return api.sendMessage({ body: `${getText("savedConfig")}\n\n${body}`, attachment: fs.createReadStream(pathGif) }, threadID, messageID);
                } else {
                    return api.sendMessage(`${getText("savedConfig")}\n\n${body}`, threadID, messageID);
                }
            }

            case "gif": {
                if (msg === "remove") {
                    if (!fs.existsSync(pathGif)) return api.sendMessage(getText("gifPathNotExist"), threadID, messageID);
                    fs.unlinkSync(pathGif);
                    return api.sendMessage(getText("removeGifSuccess"), threadID, messageID);
                } else {
                    if (!/^https?:\/\/.*\.(gif)$/i.test(msg)) return api.sendMessage(getText("invaildURL"), threadID, messageID);
                    try {
                        await global.utils.downloadFile(msg, pathGif);

                        const customText = data.customJoin ? data.customJoin
                            .replace(/\{name}/g, getText("tagMember"))
                            .replace(/\{type}/g, getText("tagType"))
                            .replace(/\{soThanhVien}/g, getText("tagCountMember"))
                            .replace(/\{threadName}/g, getText("tagNameGroup")) : "";

                        const messageBody = customText ? `${getText("saveGifSuccess")}\n\n${customText}` : getText("saveGifSuccess");

                        return api.sendMessage({ body: messageBody, attachment: fs.createReadStream(pathGif) }, threadID, messageID);
                    } catch (e) {
                        return api.sendMessage(getText("internetError"), threadID, messageID);
                    }
                }
            }

            default: {
                return api.sendMessage("❌ Invalid command! Use: text or gif", threadID, messageID);
            }
        }

    } catch (e) {
        console.log(e);
        return api.sendMessage("❌ An error occurred, please try again!", event.threadID, event.messageID);
    }
};
