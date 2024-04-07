const { EmbedBuilder } = require("discord.js");
const {
	pagination,
	ButtonTypes,
	ButtonStyles,
} = require("@devraelfreeze/discordjs-pagination");

const License = require("../models/License");
const { updateLicenseDoc } = require("./databaseQueries");
const { replyOrEditInteraction } = require("./interaction");
const { parseToMs, generateLicenseInfoStr } = require("./dateStrings");

const hundredItems = Array.from({ length: 100 }, (_, index) => index);

const handleGenerateCommad = async ({ interaction, roleId, durationInStr }) => {
	const durationInMs = await parseToMs(durationInStr);

	const docsPromises = hundredItems.map((_) =>
		License.create({ roleId, durationInStr, durationInMs }),
	);

	await Promise.all(docsPromises);

	await replyOrEditInteraction(interaction, {
		content:
			"Success! created 100 licenses. Please check by running the command /view_licenses.",
	});
};
const handleAddTimeCommand = async ({ interaction, doc, durationInStr }) => {
	const durationInMs = await parseToMs(durationInStr);

	await updateLicenseDoc(doc, {
		durationInStr: `${doc.durationInStr} + ${durationInStr}`,
		$inc: {
			durationInMs,
		},
	});

	await replyOrEditInteraction(interaction, {
		content: "Success! added the extra expiry time.",
	});
};

const handleViewAllCommand = async ({ interaction, roleId }) => {
	const licenses = await License.find({ roleId });

	if (licenses.length === 0)
		return await replyOrEditInteraction(interaction, {
			content: "Nothing to show yet.",
		});

	let sum = 0;
	let text = ``;
	const embeds = [];

	const arr = licenses.entries();

	for (const [i, doc] of arr) {
		text += `${i + 1} ~ \`${doc._id}\`${generateLicenseInfoStr(doc)}\n\n`;
		if (sum === 9) {
			const embed = new EmbedBuilder()
				.setColor(0x0099ff)
				.setTitle(`License List 🥣`);

			embed.setDescription(text);
			text = "";
			sum = 1;
			embeds.push(embed);
		} else if (licenses.length === i + 1) {
			const embed = new EmbedBuilder()
				.setColor(0x0099ff)
				.setTitle(`License List 🥣`);

			embed.setDescription(text);
			embeds.push(embed);
		}
		sum += 1;
	}

	await pagination({
		embeds: embeds /** Array of embeds objects */,
		author: interaction.member.user,
		interaction: interaction,
		ephemeral: true,
		time: 1000 * 60 * 3 /** 40 seconds */,
		disableButtons: false /** Remove buttons after timeout */,
		fastSkip: false,
		pageTravel: false,
		buttons: [
			{
				type: ButtonTypes.previous,
				label: "Previous Page",
				style: ButtonStyles.Primary,
			},
			{
				type: ButtonTypes.next,
				label: "Next Page",
				style: ButtonStyles.Succepoints,
			},
		],
	});
};

const handleDeleteAllCommand = async ({ interaction, roleId }) => {
	const { deletedCount } = await License.deleteMany({ roleId });

	await replyOrEditInteraction(interaction, {
		content: `Deleted ${deletedCount} licenses.`,
	});
};

const handleSingleDeleteCommand = async (interaction, doc) => {
	await doc.deleteOne();

	await replyOrEditInteraction(interaction, {
		content: "Deleted the license.",
	});
};

const handleInfoCommand = async (interaction, license) => {
	const content = `**Role:** <@&${license.roleId}>${generateLicenseInfoStr(
		license,
	)}`;

	await replyOrEditInteraction(interaction, {
		content,
	});
};

const handleBanCommand = async (interaction, doc) => {
	const { isBanned } = doc;

	if (isBanned) throw new Error("License is already banned");

	await updateLicenseDoc(doc, {
		isBanned: true,
	});

	await replyOrEditInteraction(interaction, {
		content: "Banned the license from usage.",
	});
};

const handleUnbanCommand = async (interaction, doc) => {
	const { isBanned } = doc;

	if (!isBanned) throw new Error("License is not banned");

	await updateLicenseDoc(doc, {
		isBanned: false,
	});

	await replyOrEditInteraction(interaction, {
		content: "Unbanned the license from usage.",
	});
};

module.exports = {
	handleInfoCommand,
	handleBanCommand,
	handleUnbanCommand,
	handleSingleDeleteCommand,
	handleGenerateCommad,
	handleDeleteAllCommand,
	handleViewAllCommand,
	handleAddTimeCommand,
};
