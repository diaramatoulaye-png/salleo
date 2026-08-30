const pool = require("../config/db");

const createUser = async ({ nom, email, motDePasseHash, role, departement, classe, estResponsableClasse }) => {
    const query = `
        INSERT INTO users (nom, email, mot_de_passe, role, departement, classe, est_responsable_classe)
        VALUES ($1, $2, $3, $4, $5, $6, $7)
        RETURNING id, nom, email, role, departement, classe, est_responsable_classe, created_at
    `;
    const { rows } = await pool.query(query, [
        nom,
        email,
        motDePasseHash,
        role,
        departement || null,
        classe || null,
        estResponsableClasse || false
    ]);
    return rows[0];
};

const findUserByEmail = async (email) => {
    const query = `SELECT * FROM users WHERE email = $1`;
    const { rows } = await pool.query(query, [email]);
    return rows[0];
};

const findUserById = async (id) => {
    const query = `
        SELECT id, nom, email, role, departement, classe, est_responsable_classe, created_at
        FROM users WHERE id = $1
    `;
    const { rows } = await pool.query(query, [id]);
    return rows[0];
};

module.exports = { createUser, findUserByEmail, findUserById };