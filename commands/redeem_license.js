const { CommandType } = require("wokcommands");
const {
	handleInteractionError,
	replyOrEditInteraction,
} = require("../utils/interaction");
const {
	findSingleLicense,
	updateLicenseDoc,
} = require("../utils/databaseQueries");
const { replaceOne } = require("../models/License");
const { generateRedeemEmbed, sendLogInChannel } = require("../utils/logs");

const licenseOptionObj = {
	name: "license",
	description: "enter the license",
	type: 3,
	required: true,
};

module.exports = {
	// Required for slash commands
	description: "Redeem your license",
	// Create a legacy and slash command
	type: CommandType.SLASH,

	options: [licenseOptionObj],
	callback: async ({ interaction }) => {
		const { options, user, guild, member } = interaction;
		try {
			await interaction.deferReply({ ephemeral: true });

			const license = options.getString("license");

			const doc = await findSingleLicense(license);

			if (!doc) throw new Error("Could not find any license");
			if (doc.usedBy) throw new Error("License is already claimed");
			if (doc.isBanned) throw new Error("License is banned from usage");

			await member.roles.add(doc.roleId);

			await updateLicenseDoc(doc, {
				usedBy: user.id,
				claimedAtInMs: Date.now(),
			});

			await replyOrEditInteraction(interaction, {
				content: "Successfully claimed the license and given the role!",
			});

			const embed = generateRedeemEmbed(doc, user);

			await sendLogInChannel(guild, embed);
		} catch (err) {
			if (err.name === "CastError")
				err = new Error("Could not find any license");
			await handleInteractionError(err, interaction);
		}
	},
};
