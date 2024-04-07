const { CommandType } = require("wokcommands");
const { handleInteractionError } = require("../utils/interaction");
const { findSingleLicense } = require("../utils/databaseQueries");
const {
	handleInfoCommand,
	handleUnbanCommand,
	handleBanCommand,
	handleGenerateCommad,
	handleSingleDeleteCommand,
	handleDeleteAllCommand,
	handleViewAllCommand,
	handleAddTimeCommand,
} = require("../utils/handleLicenseCmd");
const { PermissionsBitField, PermissionFlagsBits } = require("discord.js");

const licenseOptionObj = {
	name: "license",
	description: "enter the license",
	type: 3,
	required: true,
};

const licenseRoleOptionObj = {
	name: "role",
	description: "mention the role",
	type: 8,
	required: true,
};

const licenseFuncObj = {
	info: handleInfoCommand,
	ban: handleBanCommand,
	unban: handleUnbanCommand,
	delete_one: handleSingleDeleteCommand,
};
module.exports = {
	// Required for slash commands
	description: "Perform actions on License",
	// Create a legacy and slash command
	type: CommandType.SLASH,

	options: [
		{
			name: "generate",
			description: "Generate 100 licenses for a role",
			type: 1,
			options: [
				licenseRoleOptionObj,
				{
					name: "duration",
					description:
						"time after which license expires format = (1s,3h,3d,4w,2m)",
					type: 3,
					required: true,
				},
			],
		},
		{
			name: "add_time",
			description: "add extra expiry time for a license",
			type: 1,
			options: [
				licenseOptionObj,
				{
					name: "duration",
					description:
						"time after which license expires format = (1s,3h,3d,4w,2m)",
					type: 3,
					required: true,
				},
			],
		},
		{
			name: "view_all",
			description: "view all the licenses for a role",
			type: 1,
			options: [licenseRoleOptionObj],
		},
		{
			name: "delete_all",
			description: "delete all the licenses for a role",
			type: 1,
			options: [licenseRoleOptionObj],
		},
		{
			name: "delete_one",
			description: "delete the license",
			type: 1,
			options: [licenseOptionObj],
		},
		{
			name: "info",
			description: "get info about a license",
			type: 1,
			options: [licenseOptionObj],
		},
		{
			name: "ban",
			description: "ban the license",
			type: 1,
			options: [licenseOptionObj],
		},
		{
			name: "unban",
			description: "unban the license",
			type: 1,
			options: [licenseOptionObj],
		},
	],
	callback: async ({ interaction }) => {
		const { options, member } = interaction;
		try {
			await interaction.deferReply({ ephemeral: true });

			const license = options.getString("license");
			const role = options.getRole("role");
			const durationInStr = options.getString("duration");

			const type = options.getSubcommand();

			if (type !== "info") await isAdmin(member);

			if (type === "generate")
				return await handleGenerateCommad({
					interaction,
					roleId: role.id,
					durationInStr,
				});

			if (type === "delete_all")
				return await handleDeleteAllCommand({ interaction, roleId: role.id });

			if (type === "view_all")
				return await handleViewAllCommand({ interaction, roleId: role.id });

			const doc = await findSingleLicense(license);

			if (!doc) throw new Error("Could not find any license");

			if (type === "add_time")
				return await handleAddTimeCommand({ interaction, doc, durationInStr });

			await licenseFuncObj[type](interaction, doc);
		} catch (err) {
			if (err.name === "CastError")
				err = new Error("Could not find any license");
			await handleInteractionError(err, interaction);
		}
	},
};

const isAdmin = async function (member) {
	if (!member.permissions.has(PermissionFlagsBits.Administrator))
		throw new Error("Admin only");
};
