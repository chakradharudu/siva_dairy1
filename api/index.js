process.env.VERCEL = "1";

module.exports = function handler(req, res) {

	try {
		const app = require("../server");
		return app(req, res);
	}
	catch (error) {
		console.error("FUNCTION LOAD ERROR:", error);
		return res.status(500).json({
			message: "Server failed to start.",
			error: error.message
		});
	}

};
