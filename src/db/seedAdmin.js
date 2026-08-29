const bcrypt = require("bcryptjs");
const pool = require("../config/db");
require("dotenv").config();

const creerCompte = async () => {
    const [, , nom, email, motDePasse, role] = process.argv;

    if (!nom || !email || !motDePasse || !role) {
        console.log("Usage : node src/db/seedAdmin.js \"Nom Complet\" email@uam.sn motdepasse role");
        console.log("Rôle attendu : administratif ou admin");
        process.exit(1);
    }

    if (!["administratif", "admin"].includes(role)) {
        console.log("Le rôle doit être 'administratif' ou 'admin'.");
        process.exit(1);
    }

    try {
        const motDePasseHash = await bcrypt.hash(motDePasse, 10);
        const query = `
            INSERT INTO users (nom, email, mot_de_passe, role)
            VALUES ($1, $2, $3, $4)
            RETURNING id, nom, email, role
        `;
        const { rows } = await pool.query(query, [nom, email, motDePasseHash, role]);
        console.log("Compte créé avec succès :", rows[0]);
        process.exit(0);
    } catch (error) {
        console.error("Erreur :", error.message);
        process.exit(1);
    }
};

creerCompte();