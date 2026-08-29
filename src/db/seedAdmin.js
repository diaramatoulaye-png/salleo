const bcrypt = require("bcryptjs");
const pool = require("../config/db");
require("dotenv").config();

const creerCompte = async () => {
    const [, , nom, email, motDePasse, role, departement] = process.argv;

    if (!nom || !email || !motDePasse || !role) {
        console.log('Usage : node src/db/seedAdmin.js "Nom Complet" email@uam.sn motdepasse role [departement]');
        console.log("Rôle attendu : administratif, responsable_departement ou admin");
        console.log("Le département est obligatoire pour responsable_departement.");
        process.exit(1);
    }

    if (!["administratif", "responsable_departement", "admin"].includes(role)) {
        console.log("Le rôle doit être 'administratif', 'responsable_departement' ou 'admin'.");
        process.exit(1);
    }

    if (role === "responsable_departement" && !departement) {
        console.log("Le département est obligatoire pour le rôle responsable_departement.");
        process.exit(1);
    }

    try {
        const motDePasseHash = await bcrypt.hash(motDePasse, 10);
        const query = `
            INSERT INTO users (nom, email, mot_de_passe, role, departement)
            VALUES ($1, $2, $3, $4, $5)
            RETURNING id, nom, email, role, departement
        `;
        const { rows } = await pool.query(query, [
            nom,
            email,
            motDePasseHash,
            role,
            departement || null
        ]);
        console.log("Compte créé avec succès :", rows[0]);
        process.exit(0);
    } catch (error) {
        console.error("Erreur :", error.message);
        process.exit(1);
    }
};

creerCompte();