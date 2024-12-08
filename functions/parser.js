// Netlify Scheduled Function

const { parse } = require("../mainParser")

// @hourly
exports.handler = async () => {
  try {
    parse()
  } catch (e) {
    console.log("Error starting parser...")
  }
}
