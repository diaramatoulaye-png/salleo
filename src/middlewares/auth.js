const jwt = require("jsonwebtoken");
require("dotenv").config();

const verifierToken = (req, res, next) => {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
        return res.status(401).json({ message: "Token manquant, accès refusé." });
    }

    const token = authHeader.split(" ")[1];

    try {
        const payload = jwt.verify(token, process.env.JWT_SECRET);
        req.user = payload; // { id, role }
        next();
    } catch (error) {
        return res.status(401).json({ message: "Token invalide ou expiré." });
    }
};

const autoriserRoles = (...rolesAutorises) => {
    return (req, res, next) => {
        if (!req.user || !rolesAutorises.includes(req.user.role)) {
            return res.status(403).json({ message: "Accès interdit pour ce rôle." });
        }
        next();
    };
};

module.exports = { verifierToken, autoriserRoles };
