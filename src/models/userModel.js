const pool = require("../config/db");

const createUser = async ({ nom, email, motDePasseHash, role, departement }) => {
    const query = `
        INSERT INTO users (nom, email, mot_de_passe, role, departement)
        VALUES ($1, $2, $3, $4, $5)
        RETURNING id, nom, email, role, departement, created_at
    `;
    const { rows } = await pool.query(query, [nom, email, motDePasseHash, role, departement || null]);
    return rows[0];
};

const findUserByEmail = async (email) => {
    const query = `SELECT * FROM users WHERE email = $1`;
    const { rows } = await pool.query(query, [email]);
    return rows[0];
};

const findUserById = async (id) => {
    const query = `SELECT id, nom, email, role, departement, created_at FROM users WHERE id = $1`;
    const { rows } = await pool.query(query, [id]);
    return rows[0];
};

module.exports = { createUser, findUserByEmail, findUserById };