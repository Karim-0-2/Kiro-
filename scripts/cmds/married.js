const fs = require("fs-extra");
const path = require("path");
const axios = require("axios");
const { createCanvas, loadImage } = require("canvas");

const OWNER_UID = "61557991443492";
const WIFE_UID = "61578418080601";
const VIP_PATH = path.join(__dirname, "cache", "vip.json");

module.exports = {
	config: {
		name: "married",
		aliases: ["married"],
		version: "1.2",
		author: "Hasib",
		countDown: 5,
		role: 0,
		shortDescription: "Get a wife 💖",
		longDescription: "Mention someone or reply to their message to get married! VIP only.",
		category: "vip",
		guide: "{@mention} | reply to a message",
	},

	onLoad: async function () {
		const dirMaterial = path.resolve(__dirname, "cache", "canvas");
		if (!fs.existsSync(dirMaterial)) fs.mkdirSync(dirMaterial, { recursive: true });

		const bgPath = path.resolve(dirMaterial, "marriedv5.png");
		if (!fs.existsSync(bgPath)) {
			const url = "https://i.ibb.co/mhxtgwm/49be174dafdc259030f70b1c57fa1c13.jpg";
			const response = await axios.get(url, { responseType: "arraybuffer" });
			fs.writeFileSync(bgPath, Buffer.from(response.data));
		}
	},

	createCircleImage: async function (image) {
		const size = 512;
		const canvas = createCanvas(size, size);
		const ctx = canvas.getContext("2d");

		ctx.beginPath();
		ctx.arc(size / 2, size / 2, size / 2, 0, Math.PI * 2, true);
		ctx.closePath();
		ctx.clip();

		ctx.drawImage(image, 0, 0, size, size);
		return canvas;
	},

	makeImage: async function ({ one, two }) {
		const dirCanvas = path.resolve(__dirname, "cache", "canvas");
		const bgPath = path.resolve(dirCanvas, "marriedv5.png");
		const outPath = path.resolve(dirCanvas, `married_${one}_${two}.png`);

		const background = await loadImage(bgPath);

		const urlOne = `https://graph.facebook.com/${one}/picture?width=512&height=512&access_token=6628568379|c1e620fa708a1d5696fb991c1bde5662`;
		const urlTwo = `https://graph.facebook.com/${two}/picture?width=512&height=512&access_token=6628568379|c1e620fa708a1d5696fb991c1bde5662`;

		const avatarOne = await loadImage(urlOne);
		const avatarTwo = await loadImage(urlTwo);

		const circleOneCanvas = await this.createCircleImage(avatarOne);
		const circleTwoCanvas = await this.createCircleImage(avatarTwo);

		const canvas = createCanvas(background.width, background.height);
		const ctx = canvas.getContext("2d");

		ctx.drawImage(background, 0, 0);
		ctx.drawImage(circleOneCanvas, 300, 150, 130, 130);
		ctx.drawImage(circleTwoCanvas, 170, 230, 130, 130);

		const buffer = canvas.toBuffer("image/png");
		fs.writeFileSync(outPath, buffer);

		return outPath;
	},

	onStart: async function ({ event, api }) {
		const { threadID, messageID, senderID } = event;

		// --- Load VIPs ---
		if (!fs.existsSync(VIP_PATH)) fs.writeFileSync(VIP_PATH, JSON.stringify([]));
		let vipData = JSON.parse(fs.readFileSync(VIP_PATH));
		const now = Date.now();
		vipData = vipData.filter(u => u.expire > now);
		fs.writeFileSync(VIP_PATH, JSON.stringify(vipData, null, 2));

		const sender = String(senderID);
		const isOwner = sender === OWNER_UID;
		const isWife = sender === WIFE_UID;
		const isVIP = vipData.some(u => u.uid === sender && u.expire > now);

		if (!isOwner && !isWife && !isVIP) {
			return api.sendMessage("❌ You must be VIP to use this command!", threadID, messageID);
		}

		// --- Determine target ---
		const mention = Object.keys(event.mentions);
		let target;
		if (mention.length === 1) target = mention[0];
		else if (event.messageReply) target = event.messageReply.senderID;
		if (!target) return api.sendMessage("👰 Please mention 1 person or reply to their message!", threadID, messageID);

		// --- Show processing ---
		await api.react(messageID, "⏳");

		const pathImg = await this.makeImage({ one: senderID, two: target });

		// --- Send final image ---
		api.sendMessage(
			{ body: "💖 Here's your marriage image 💖", attachment: fs.createReadStream(pathImg) },
			threadID,
			() => {
				fs.unlinkSync(pathImg);
				api.react(messageID, "✅"); // done reaction
			},
			messageID
		);
	},
};
