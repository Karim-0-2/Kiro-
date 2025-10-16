const axios = require("axios");
const { execSync } = require("child_process");
const fs = require("fs-extra");
const path = require("path");
const cheerio = require("cheerio");
const { client } = global;

const { configCommands } = global.GoatBot;
const { log, loading, removeHomeDir } = global.utils;

function getDomain(url) {
	const regex = /^(?:https?:\/\/)?(?:[^@\n]+@)?(?:www\.)?([^:/\n]+)/im;
	const match = url.match(regex);
	return match ? match[1] : null;
}

function isURL(str) {
	try {
		new URL(str);
		return true;
	}
	catch (e) {
		return false;
	}
}

module.exports = {
	config: {
		name: "cmd",
		version: "1.17",
		author: "NTKhang",
		countDown: 5,
		role: 2,
		description: {
			vi: "Quản lý các tệp lệnh của bạn",
			en: "Manage your command files"
		},
		category: "owner",
		guide: {
			vi: "   {pn} load <tên file lệnh>"
				+ "\n   {pn} loadAll"
				+ "\n   {pn} install <url> <tên file lệnh>: Tải xuống và cài đặt một tệp lệnh từ một url, url là đường dẫn đến tệp lệnh (raw)"
				+ "\n   {pn} install <tên file lệnh> <code>: Tải xuống và cài đặt một tệp lệnh từ một code, code là mã của lệnh",
			en: "   {pn} load <command file name>"
				+ "\n   {pn} loadAll"
				+ "\n   {pn} install <url> <command file name>: Download and install a command file from a url, url is the path to the file (raw)"
				+ "\n   {pn} install <command file name> <code>: Download and install a command file from a code, code is the code of the command"
		}
	},

	langs: {
		vi: {
			missingFileName: "⚠️ | Vui lòng nhập vào tên lệnh bạn muốn reload",
			loaded: "✅ | Đã load command \"%1\" thành công",
			loadedError: "❌ | Load command \"%1\" thất bại với lỗi\n%2: %3",
			loadedSuccess: "✅ | Đã load thành công (%1) command",
			loadedFail: "❌ | Load thất bại (%1) command\n%2",
			openConsoleToSeeError: "👀 | Hãy mở console để xem chi tiết lỗi",
			missingCommandNameUnload: "⚠️ | Vui lòng nhập vào tên lệnh bạn muốn unload",
			unloaded: "✅ | Đã unload command \"%1\" thành công",
			unloadedError: "❌ | Unload command \"%1\" thất bại với lỗi\n%2: %3",
			missingUrlCodeOrFileName: "⚠️ | Vui lòng nhập vào url hoặc code và tên file lệnh bạn muốn cài đặt",
			missingUrlOrCode: "⚠️ | Vui lòng nhập vào url hoặc code của tệp lệnh bạn muốn cài đặt",
			missingFileNameInstall: "⚠️ | Vui lòng nhập vào tên file để lưu lệnh (đuôi .js)",
			invalidUrl: "⚠️ | Vui lòng nhập vào url hợp lệ",
			invalidUrlOrCode: "⚠️ | Không thể lấy được mã lệnh",
			alreadExist: "⚠️ | File lệnh đã tồn tại, bạn có chắc chắn muốn ghi đè lên file lệnh cũ không?\nThả cảm xúc bất kì vào tin nhắn này để tiếp tục",
			installed: "✅ | Đã cài đặt command \"%1\" thành công, file lệnh được lưu tại %2",
			installedError: "❌ | Cài đặt command \"%1\" thất bại với lỗi\n%2: %3",
			missingFile: "⚠️ | Không tìm thấy tệp lệnh \"%1\"",
			invalidFileName: "⚠️ | Tên tệp lệnh không hợp lệ",
			unloadedFile: "✅ | Đã unload lệnh \"%1\""
		},
		en: {
			missingFileName: "⚠️ | Please enter the command name you want to reload",
			loaded: "✅ | Loaded command \"%1\" successfully",
			loadedError: "❌ | Failed to load command \"%1\" with error\n%2: %3",
			loadedSuccess: "✅ | Loaded successfully (%1) command",
			loadedFail: "❌ | Failed to load (%1) command\n%2",
			openConsoleToSeeError: "👀 | Open console to see error details",
			missingCommandNameUnload: "⚠️ | Please enter the command name you want to unload",
			unloaded: "✅ | Unloaded command \"%1\" successfully",
			unloadedError: "❌ | Failed to unload command \"%1\" with error\n%2: %3",
			missingUrlCodeOrFileName: "⚠️ | Please enter the url or code and command file name you want to install",
			missingUrlOrCode: "⚠️ | Please enter the url or code of the command file you want to install",
			missingFileNameInstall: "⚠️ | Please enter the file name to save the command (with .js extension)",
			invalidUrl: "⚠️ | Please enter a valid url",
			invalidUrlOrCode: "⚠️ | Unable to get command code",
			alreadExist: "⚠️ | The command file already exists, are you sure you want to overwrite the old command file?\nReact to this message to continue",
			installed: "✅ | Installed command \"%1\" successfully, the command file is saved at %2",
			installedError: "❌ | Failed to install command \"%1\" with error\n%2: %3",
			missingFile: "⚠️ | Command file \"%1\" not found",
			invalidFileName: "⚠️ | Invalid command file name",
			unloadedFile: "✅ | Unloaded command \"%1\""
		}
	},

	onStart: async ({ args, message, api, threadModel, userModel, dashBoardModel, globalModel, threadsData, usersData, dashBoardData, globalData, event, commandName, getLang }) => {
		const { unloadScripts, loadScripts } = global.utils;
		if (
			args[0] == "load"
			&& args.length == 2
		) {
			if (!args[1])
				return message.reply(getLang("missingFileName"));
			const infoLoad = loadScripts("cmds", args[1], log, configCommands, api, threadModel, userModel, dashBoardModel, globalModel, threadsData, usersData, dashBoardData, globalData, getLang);
			if (infoLoad.status == "success")
				message.reply(getLang("loaded", infoLoad.name));
			else {
				message.reply(
					getLang("loadedError", infoLoad.name, infoLoad.error.name, infoLoad.error.message)
					+ "\n" + infoLoad.error.stack
			filePath: pathCommand,
			commandName: [scriptName, ...configCommand.aliases || []]
		});

		return {
			status: "success",
			name: fileName,
			command
		};
	}
	catch (err) {
		const defaultError = new Error();
		defaultError.name = err.name;
		defaultError.message = err.message;
		defaultError.stack = err.stack;

		err.stack ? err.stack = removeHomeDir(err.stack || "") : "";
		fs.writeFileSync(global.client.dirConfigCommands, JSON.stringify(configCommands, null, 2));
		return {
			status: "failed",
			name: fileName,
			error: err,
			errorWithThoutRemoveHomeDir: defaultError
		};
	}
}

function unloadScripts(folder, fileName, configCommands, getLang) {
	const pathCommand = `${process.cwd()}/scripts/${folder}/${fileName}.js`;
	if (!fs.existsSync(pathCommand)) {
		const err = new Error(getLang("missingFile", `${fileName}.js`));
		err.name = "FileNotFound";
		throw err;
	}
	const command = require(pathCommand);
	const commandName = command.config?.name;
	if (!commandName)
		throw new Error(getLang("invalidFileName", `${fileName}.js`));
	const { GoatBot } = global;
	const { onChat: allOnChat, onEvent: allOnEvent, onAnyEvent: allOnAnyEvent } = GoatBot;
	const indexOnChat = allOnChat.findIndex(item => item == commandName);
	if (indexOnChat != -1)
		allOnChat.splice(indexOnChat, 1);
	const indexOnEvent = allOnEvent.findIndex(item => item == commandName);
	if (indexOnEvent != -1)
		allOnEvent.splice(indexOnEvent, 1);
	const indexOnAnyEvent = allOnAnyEvent.findIndex(item => item == commandName);
	if (indexOnAnyEvent != -1)
		allOnAnyEvent.splice(indexOnAnyEvent, 1);
	// ————————————————— CHECK ALIASES ————————————————— //
	if (command.config.aliases) {
		let aliases = command.config?.aliases || [];
		if (typeof aliases == "string")
			aliases = [aliases];
		for (const alias of aliases)
			GoatBot.aliases.delete(alias);
	}
	const setMap = folder == "cmds" ? "commands" : "eventCommands";
	delete require.cache[require.resolve(pathCommand)];
	GoatBot[setMap].delete(commandName);
	log.master("UNLOADED", getLang("unloaded", commandName));
	const commandUnload = configCommands[folder == "cmds" ? "commandUnload" : "commandEventUnload"] || [];
	if (!commandUnload.includes(`${fileName}.js`))
		commandUnload.push(`${fileName}.js`);
	configCommands[folder == "cmds" ? "commandUnload" : "commandEventUnload"] = commandUnload;
	fs.writeFileSync(global.client.dirConfigCommands, JSON.stringify(configCommands, null, 2));
	return {
		status: "success",
		name: fileName
	};
}

global.utils.loadScripts = loadScripts;
global.utils.unloadScripts = unloadScripts;
