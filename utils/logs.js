const { EmbedBuilder } = require("discord.js");

const { LOGS_CHANNEL_ID } = process.env;

const sendLogInChannel = async (guild, embed) => {
	const channel = await guild.channels.fetch(LOGS_CHANNEL_ID);

	await channel.send({ embeds: [embed] });
};

const generateRedeemEmbed = function (doc, user) {
	const showExpiry = true;
	return new EmbedBuilder()
		.setColor("Green")
		.setTitle(`License Claimed`)
		.addFields(...generateFields(doc, user, showExpiry));
};

const generateExpireEmbed = function (doc, user) {
	return new EmbedBuilder()
		.setColor("Red")
		.setTitle(`License Expired`)
		.addFields(...generateFields(doc, user));
};

const generateFields = function (doc, user, showExpiry) {
	const curDate = Date.now();

	const options = [
		{
			name: `User`,
			value: `${user ? user : `<@${doc.usedBy}> `}`,
		},
		{
			name: `License`,
			value: `${doc._id}`,
		},
		{
			name: `Role`,
			value: `<@&${doc.roleId}>`,
		},
	];

	showExpiry &&
		options.push({
			name: `Expiry`,
			value: `<t:${Math.floor(
				(curDate + doc.durationInMs + curDate - curDate) / 1000,
			)}:f>`,
		});

	return options;
};
module.exports = { generateRedeemEmbed, sendLogInChannel, generateExpireEmbed };
