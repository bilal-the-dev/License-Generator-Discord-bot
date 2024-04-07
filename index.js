const { Client, IntentsBitField, Partials } = require("discord.js");
const WOK = require("wokcommands");
const path = require("path");
const mongoose = require("mongoose");
const dotenv = require("dotenv");
const cron = require("node-cron");
const License = require("./models/License");

const { DefaultCommands } = WOK;
dotenv.config({ path: "./.env" });

const { generateExpireEmbed, sendLogInChannel } = require("./utils/logs");

const { TOKEN, MONGO_URI, GUILD_ID } = process.env;

const client = new Client({
	intents: [
		IntentsBitField.Flags.Guilds,
		IntentsBitField.Flags.GuildMessages,
		IntentsBitField.Flags.GuildMembers,
		IntentsBitField.Flags.MessageContent,
		IntentsBitField.Flags.GuildMessageReactions,
	],
	partials: [Partials.Channel],
});

client.on("ready", async (readyClient) => {
	try {
		console.log(`${readyClient.user.username} is running 🧶`);

		mongoose.set("strictQuery", false);

		await mongoose
			.connect(MONGO_URI)
			.catch((e) => console.log("Something went wrong with the database", e));

		console.log("Connected to database! 📅");

		cron.schedule("* * * * *", checkForLicenses);

		checkForLicenses();
	} catch (err) {
		console.log(err);
	}
	new WOK({
		client,
		commandsDir: path.join(__dirname, "./commands"),
		events: {
			dir: path.join(__dirname, "events"),
		},
		disabledDefaultCommands: [
			DefaultCommands.ChannelCommand,
			DefaultCommands.CustomCommand,
			DefaultCommands.Prefix,
			DefaultCommands.RequiredPermissions,
			DefaultCommands.RequiredRoles,
			DefaultCommands.ToggleCommand,
		],
		cooldownConfig: {
			errorMessage: "Please wait {TIME} before doing that again.",
			botOwnersBypass: false,
			dbRequired: 300,
		},
	});
});
client.login(TOKEN);

async function checkForLicenses() {
	const guild = client.guilds.cache.get(GUILD_ID);

	const docs = await License.find({ usedBy: { $ne: undefined } });

	for (const doc of docs) {
		const curDate = Date.now();

		const { durationInMs, usedBy, claimedAtInMs } = doc;

		const total = durationInMs + claimedAtInMs;

		if (total > curDate) continue;

		await doc.deleteOne();
		const embed = generateExpireEmbed(doc);
		await sendLogInChannel(guild, embed);

		const member = await guild.members.fetch(doc.usedBy);
		await member.roles.remove(doc.roleId);
	}
}
