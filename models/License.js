const { Schema, model } = require("mongoose");

const defaultBoolObj = { type: Boolean, default: false };
const reqStr = { type: String, required: true };

const licenseSchema = new Schema({
	roleId: reqStr,
	durationInStr: reqStr,
	durationInMs: { type: Number, required: true },
	claimedAtInMs: Number,
	usedBy: String,
	isBanned: defaultBoolObj,
});

module.exports = model("License", licenseSchema);
