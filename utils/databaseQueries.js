const License = require("../models/License");

const findSingleLicense = async (id) => await License.findById(id);

const updateLicenseDoc = async (doc, data) => await doc.updateOne(data);

module.exports = { findSingleLicense, updateLicenseDoc };
