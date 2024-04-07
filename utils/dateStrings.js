const parseToMs = async function (timeString) {
	const numericValue = Number(timeString.slice(0, -1));

	const unit = timeString.slice(-1);

	const conversionFactors = {
		s: 1000,
		h: 3600000,
		d: 86400000,
		w: 604800000,
		m: 2592000000,
	};

	if (
		!conversionFactors.hasOwnProperty(unit) ||
		Number.isNaN(numericValue) ||
		numericValue === 0
	)
		throw new Error(
			"Invalid time format. Supported: s = second, h = hour, w = week , m = month",
		);

	return numericValue * conversionFactors[unit];
};

const generateLicenseInfoStr = function (doc) {
	const { durationInStr, durationInMs, claimedAtInMs, usedBy, isBanned } = doc;

	let str = ``;

	if (!usedBy) {
		str += `\n**Expiry** : ${durationInStr}`;
	}

	if (usedBy) {
		str += `\n**Used by**: <@${usedBy}>`;
		str += `\n**Expiry** : ${generateExpiryStr(durationInMs, claimedAtInMs)}`;
	}

	isBanned && (str += `\n**Banned:** yes`);

	return str;
};

const generateExpiryStr = function (durationInMs, claimedAtInMs) {
	const curDate = Date.now();
	let expiry = "";

	const total = durationInMs + claimedAtInMs;

	if (total < curDate) expiry = "has expired";

	if (total > curDate)
		expiry = `<t:${Math.floor((curDate + total - curDate) / 1000)}:f>`;

	return expiry;
};

module.exports = { parseToMs, generateLicenseInfoStr };
