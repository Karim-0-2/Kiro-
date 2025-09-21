module.exports.config = {
    name: "setwelcome",
    version: "1.0.4",
    hasPermssion: 1, // 1 = admin, 2 = owner
    credits: "𝐊𝐚𝐫𝐢𝐦 𝐁𝐞𝐧𝐳𝐢𝐦𝐚",
    description: "Edit text/animated images when new members join",
    commandCategory: "config",
    usages: "[gif/text] [Text or URL to download gif image]",
    cooldowns: 10,
    dependencies: {
        "fs-extra": "",
        "path": ""
    }
};

module.exports.onLoad = function () {
    const { existsSync, mkdirSync } = global.nodemodule["fs-extra"];
    const { join } = global.nodemodule["path"];
    const path = join(__dirname, "..", "events", "cache", "joinGif");

    if (!existsSync(path)) mkdirSync(path, { recursive: true });
    return;
};

module.exports.languages = {
    "vi": {
        "savedConfig": "Đã lưu tùy chỉnh thành công! Dưới đây là preview:",
        "tagMember": "[Tên thành viên]",
        "tagType": "[Bạn/các bạn]",
        "tagCountMember": "[Số thành viên]",
        "tagNameGroup": "[Tên nhóm]",
        "gifPathNotExist": "Nhóm của bạn chưa từng cài đặt gif join",
        "removeGifSuccess": "Đã gỡ bỏ thành công file gif của nhóm bạn!",
        "invaildURL": "Url bạn nhập không phù hợp!",
        "internetError": "Không thể tải file vì url không tồn tại hoặc bot gặp vấn đề mạng!",
        "saveGifSuccess": "Đã lưu file gif của nhóm bạn thành công, preview bên dưới:"
    },
    "en": {
        "savedConfig": "Saved your config, here is preview:",
        "tagMember": "[Member's name]",
        "tagType": "[You/They]",
        "tagCountMember": "[Member number]",
        "tagNameGroup": "[Thread's name]",
        "gifPathNotExist": "Your thread didn't set a join gif",
        "removeGifSuccess": "Removed thread's gif successfully!",
        "invaildURL": "Invalid URL!",
        "internetError": "Can't download file because the URL doesn't exist or internet has issues!",
        "saveGifSuccess": "Saved gif file successfully, preview below:"
    }
};

module.exports.run = async function ({ args, event, api, Threads, getText }) {
    try {
        const { existsSync, createReadStream, unlinkSync } = global.nodemodule["fs-extra"];
        const { join } = global.nodemodule["path"];
        const { threadID, messageID } = event;
        const msg = args.slice(1).join(" ");
        let data = (await Threads.getData(threadID)).data;

        switch (args[0]) {
            case "text": {
                data.customJoin = msg;
                global.data.threadData.set(parseInt(threadID), data);
                await Threads.setData(threadID, { data });

                return api.sendMessage(getText("savedConfig"), threadID, () => {
                    const body = msg
                        .replace(/\{name}/g, getText("tagMember"))
                        .replace(/\{type}/g, getText("tagType"))
                        .replace(/\{soThanhVien}/g, getText("tagCountMember"))
                        .replace(/\{threadName}/g, getText("tagNameGroup"));
                    return api.sendMessage(body, threadID);
                });
            }
            case "gif": {
                const path = join(__dirname, "..", "events", "cache", "joinGif");
                const pathGif = join(path, `${threadID}.gif`);

                if (msg.toLowerCase() === "remove") {
                    if (!existsSync(pathGif)) return api.sendMessage(getText("gifPathNotExist"), threadID, messageID);
                    unlinkSync(pathGif);
                    return api.sendMessage(getText("removeGifSuccess"), threadID, messageID);
                }

                if (!msg.match(/(http(s?):)([/|.|\w|\s|-])*\.(?:gif|GIF)/g)) 
                    return api.sendMessage(getText("invaildURL"), threadID, messageID);

                try {
                    await global.utils.downloadFile(msg, pathGif);
                } catch (e) {
                    return api.sendMessage(getText("internetError"), threadID, messageID);
                }

                return api.sendMessage({ body: getText("saveGifSuccess"), attachment: createReadStream(pathGif) }, threadID, messageID);
            }
            default: 
                return global.utils.throwError(this.config.name, threadID, messageID);
        }
    } catch (e) {
        console.error(e);
    }
};
