const jwt = require("jsonwebtoken");

const JWT_SECRET = process.env.JWT_SECRET || "sba_secret_key_2024";

module.exports = (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader) {
      return res.status(401).json({
        error: "Token manquant",
      });
    }

    if (!authHeader.startsWith("Bearer ")) {
      return res.status(401).json({
        error: "Format du token invalide",
      });
    }

    const token = authHeader.split(" ")[1];

    if (!token) {
      return res.status(401).json({
        error: "Token manquant",
      });
    }

    const decoded = jwt.verify(token, JWT_SECRET);

    req.user = decoded;

    next();
  } catch (err) {
    console.error("Auth error:", err.message);

    return res.status(403).json({
      error: "Token invalide ou expiré",
    });
  }
};
