const DIG = require("discord-image-generation");
const fs = require("fs-extra");

// Owner UID
const OWNER_UID = "61557991443492";

module.exports = {
  config: {
    name: "slap2",
    version: "1.7",
    author: "KSHITIZ + Modified",
    countDown: 5,
    role: 0,
    shortDescription: "Buttslap image",
    longDescription: "Buttslap image",
    category: "meme",
    guide: {
      en: "{pn} @tag or reply to someone's message"
    }
  },

  langs: {
    vi: { noTag: "Bạn phải tag người muốn tát" },
    en: { noTag: "You must tag the person you want to slap or reply to their message" },
    ownerError: "You cannot slap the owner!"
  },

  onStart: async function ({ event, message, usersData, args, getLang }) {
    const uid1 = event.senderID;

    // Get the target user: either mention or reply
    let uid2 = Object.keys(event.mentions)[0];
    if (!uid2 && event.messageReply) uid2 = event.messageReply.senderID;

    if (!uid2) return message.reply(getLang("noTag"));

    // Prevent slapping the owner
    if (uid2 === OWNER_UID) return message.reply(getLang("ownerError"));

    const avatarURL1 = await usersData.getAvatarUrl(uid1);
    const avatarURL2 = await usersData.getAvatarUrl(uid2);

    const img = await new DIG.Spank().getImage(avatarURL1, avatarURL2);
    const pathSave = `${__dirname}/tmp/${uid1}_${uid2}_spank.png`;
    fs.writeFileSync(pathSave, Buffer.from(img));

    const content = args.join(' ').replace(Object.keys(event.mentions)[0] || "", "").trim();

    message.reply(
      {
        body: content || "hehe boii",
        attachment: fs.createReadStream(pathSave)
      },
      () => fs.unlinkSync(pathSave)
    );
  }
};
