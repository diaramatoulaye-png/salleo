const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
require("dotenv").config();

const { createUser, findUserByEmail, findUserById } = require("../models/userModel");

// Le payload embarque le rôle ET le statut de responsable de classe,
// pour que les contrôleurs puissent vérifier les droits sans requête DB supplémentaire.
const genererTokens = (user) => {
    const payload = {
        id: user.id,
        role: user.role,
        est_responsable_classe: user.est_responsable_classe || false
    };

    const accessToken = jwt.sign(payload, process.env.JWT_SECRET, {
        expiresIn: process.env.JWT_EXPIRES_IN
    });

    const refreshToken = jwt.sign(payload, process.env.JWT_REFRESH_SECRET, {
        expiresIn: process.env.JWT_REFRESH_EXPIRES_IN
    });

    return { accessToken, refreshToken };
};

const register = async (req, res, next) => {
    try {
        const { nom, email, motDePasse, role, departement, classe, estResponsableClasse } = req.body;

        if (!nom || !email || !motDePasse || !role) {
            return res.status(400).json({ message: "Tous les champs sont obligatoires." });
        }

        if (motDePasse.length < 8) {
            return res.status(400).json({ message: "Le mot de passe doit contenir au moins 8 caractères." });
        }

        const rolesValides = ["etudiant", "enseignant"];
        if (!rolesValides.includes(role)) {
            return res.status(400).json({ message: "Rôle invalide." });
        }

        if (!departement || !departement.trim()) {
            return res.status(400).json({ message: "Le département / filière est obligatoire." });
        }

        if (role === "etudiant" && estResponsableClasse && (!classe || !classe.trim())) {
            return res.status(400).json({ message: "Le nom de la classe est obligatoire pour un responsable de classe." });
        }

        const utilisateurExistant = await findUserByEmail(email);
        if (utilisateurExistant) {
            return res.status(409).json({ message: "Un compte existe déjà avec cet email." });
        }

        const motDePasseHash = await bcrypt.hash(motDePasse, 10);
        const nouvelUtilisateur = await createUser({
            nom,
            email,
            motDePasseHash,
            role,
            departement: departement.trim(),
            classe: role === "etudiant" ? (classe || "").trim() || null : null,
            estResponsableClasse: role === "etudiant" ? Boolean(estResponsableClasse) : false
        });

        const { accessToken, refreshToken } = genererTokens(nouvelUtilisateur);

        res.status(201).json({ user: nouvelUtilisateur, accessToken, refreshToken });
    } catch (error) {
        next(error);
    }
};

const login = async (req, res, next) => {
    try {
        const { email, motDePasse } = req.body;

        if (!email || !motDePasse) {
            return res.status(400).json({ message: "Email et mot de passe requis." });
        }

        const utilisateur = await findUserByEmail(email);
        if (!utilisateur) {
            return res.status(401).json({ message: "Identifiants incorrects." });
        }

        const motDePasseValide = await bcrypt.compare(motDePasse, utilisateur.mot_de_passe);
        if (!motDePasseValide) {
            return res.status(401).json({ message: "Identifiants incorrects." });
        }

        const { accessToken, refreshToken } = genererTokens(utilisateur);

        res.status(200).json({
            user: {
                id: utilisateur.id,
                nom: utilisateur.nom,
                email: utilisateur.email,
                role: utilisateur.role,
                departement: utilisateur.departement,
                classe: utilisateur.classe,
                est_responsable_classe: utilisateur.est_responsable_classe
            },
            accessToken,
            refreshToken
        });
    } catch (error) {
        next(error);
    }
};

const refresh = async (req, res, next) => {
    try {
        const { refreshToken } = req.body;
        if (!refreshToken) {
            return res.status(401).json({ message: "Refresh token manquant." });
        }

        const payload = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);
        const utilisateur = await findUserById(payload.id);

        if (!utilisateur) {
            return res.status(401).json({ message: "Utilisateur introuvable." });
        }

        const { accessToken } = genererTokens(utilisateur);
        res.status(200).json({ accessToken });
    } catch (error) {
        return res.status(401).json({ message: "Refresh token invalide ou expiré." });
    }
};

const me = async (req, res, next) => {
    try {
        const utilisateur = await findUserById(req.user.id);
        if (!utilisateur) {
            return res.status(404).json({ message: "Utilisateur introuvable." });
        }
        res.status(200).json(utilisateur);
    } catch (error) {
        next(error);
    }
};

module.exports = { register, login, refresh, me };