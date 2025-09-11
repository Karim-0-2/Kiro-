const TIMEOUT_SECONDS = 120; // Game timeout duration in seconds, change as per need

// Initialize a Map to track ongoing fights by threadID
const ongoingFights = new Map();
// Initialize a Map to store game instances for each pair
const gameInstances = new Map();

module.exports = {
  config: {
    name: "fight",
    version: "1.0",
    author: "Shikaki",
    countDown: 10,
    role: 0,
    shortDescription: {
      vi: "",
      en: "Fight with your friends!",
    },
    longDescription: {
      vi: "",
      en: "Challenge your friends to a fight and see who wins!",
    },
    category: "🎮 Game",
    guide: "{prefix}fight @mention",
  },

  onStart: async function ({ event, message, usersData, args }) {
    const threadID = event.threadID;

    // Check if there's already an ongoing fight in this thread
    if (ongoingFights.has(threadID)) {
      return message.send("⚔️ A fight is already in progress in this group.");
    }

    const mention = Object.keys(event.mentions);

    if (mention.length !== 1) {
      return message.send("🤔 Please mention one person to start a fight with.");
    }

    const challengerID = event.senderID;
    const opponentID = mention[0];

    const challenger = await usersData.getName(challengerID);
    const opponent = await usersData.getName(opponentID);

    // Create a new fight instance for this pair
    const fight = {
      participants: [],
      currentPlayer: null,
      threadID: threadID,
      startTime: Date.now(),
    };

    fight.participants.push({
      id: challengerID,
      name: challenger,
      hp: 100,
    });
    fight.participants.push({
      id: opponentID,
      name: opponent,
      hp: 100,
    });

    // Create a new game instance for this pair
    const gameInstance = {
      fight: fight,
      lastAttack: null,
      lastPlayer: null,
      timeoutID: null,
      turnMessageSent: false,
    };

    // Randomly determine the starting player
    gameInstance.fight.currentPlayer = Math.random() < 0.5 ? challengerID : opponentID;

    // Add the game instance to the Map
    gameInstances.set(threadID, gameInstance);

    // Start the fight
    startFight(message, fight);

    // Start the timeout for this game
    startTimeout(threadID, message);
  },

  onChat: async function ({ event, message }) {
    const threadID = event.threadID;
    const gameInstance = gameInstances.get(threadID);
    if (!gameInstance) return;

    const currentPlayerID = gameInstance.fight.currentPlayer;
    const currentPlayer = gameInstance.fight.participants.find(p => p.id === currentPlayerID);

    // Normalize attack command for replies
    const attack = (event.body || event.messageReply?.body || "").trim().toLowerCase();

    const isCurrentPlayer = event.senderID === currentPlayerID;

    // Opponent trying to play when it's not their turn
    if (!isCurrentPlayer) {
      if (!gameInstance.turnMessageSent) {
        const turnMessage = `😒 It's ${currentPlayer.name}'s turn.`;
        message.send(turnMessage);
        gameInstance.turnMessageSent = true;
      }
      return;
    }

    // Handle forfeiting
    if (attack === "forfeit") {
      const forfeiter = currentPlayer.name;
      const opponent = gameInstance.fight.participants.find(p => p.id !== currentPlayerID).name;
      message.send(`🏃 ${forfeiter} forfeits the match! ${opponent} wins!`);
      endFight(threadID);
      return;
    }

    // Handle valid attacks
    if (["kick", "punch", "slap"].includes(attack)) {
      const damage = Math.random() < 0.1 ? 0 : Math.floor(Math.random() * 20 + 10);
      const opponent = gameInstance.fight.participants.find(p => p.id !== currentPlayerID);
      opponent.hp -= damage;

      message.send(
        `🥊 ${currentPlayer.name} attacks ${opponent.name} with ${attack} and deals ${damage} damage.\n\n` +
        `Now, ${opponent.name} has ${opponent.hp} HP, and ${currentPlayer.name} has ${currentPlayer.hp} HP.`
      );

      // Check for winner
      if (opponent.hp <= 0) {
        message.send(`🎉 ${currentPlayer.name} wins! ${opponent.name} is defeated.`);
        endFight(threadID);
        return;
      }

      // Switch turns
      gameInstance.fight.currentPlayer =
        currentPlayerID === gameInstance.fight.participants[0].id
          ? gameInstance.fight.participants[1].id
          : gameInstance.fight.participants[0].id;

      gameInstance.lastAttack = attack;
      gameInstance.lastPlayer = currentPlayer;
      gameInstance.turnMessageSent = false;

      const newCurrentPlayer = gameInstance.fight.participants.find(p => p.id === gameInstance.fight.currentPlayer);
      message.send(`🥲 It's ${newCurrentPlayer.name}'s turn now.`);
    } else {
      message.send("❌ Invalid attack! Use 'kick', 'punch', 'slap', or 'forfeit'.");
    }
  },
};

// Start a fight
function startFight(message, fight) {
  ongoingFights.set(fight.threadID, fight);

  const currentPlayer = fight.participants.find(p => p.id === fight.currentPlayer);
  const opponent = fight.participants.find(p => p.id !== fight.currentPlayer);

  const attackList = ["kick", "punch", "slap", "forfeit"];

  message.send(
    `${currentPlayer.name} has challenged ${opponent.name} to a duel!\n\n` +
    `${currentPlayer.name} has ${currentPlayer.hp} HP, and ${opponent.name} has ${opponent.hp} HP.\n\n` +
    `It's ${currentPlayer.name}'s turn currently.\n\nAvailable attacks: ${attackList.join(', ')}`
  );
}

// Start timeout
function startTimeout(threadID, message) {
  const timeoutID = setTimeout(() => {
    const gameInstance = gameInstances.get(threadID);
    if (!gameInstance) return;

    const [player1, player2] = gameInstance.fight.participants;
    const winner = player1.hp > player2.hp ? player1 : player2;
    const loser = player1.hp > player2.hp ? player2 : player1;

    message.send(`⏰ Time's up! ${winner.name} wins with more HP! ${loser.name} is defeated.`);
    endFight(threadID);
  }, TIMEOUT_SECONDS * 1000);

  gameInstances.get(threadID).timeoutID = timeoutID;
}

// End fight
function endFight(threadID) {
  const gameInstance = gameInstances.get(threadID);
  if (gameInstance?.timeoutID) clearTimeout(gameInstance.timeoutID);
  ongoingFights.delete(threadID);
  gameInstances.delete(threadID);
}
