const pool = require("../config/db");

const getAllSalles = async () => {
    const query = `SELECT * FROM salles WHERE active = true ORDER BY nom ASC`;
    const { rows } = await pool.query(query);
    return rows;
};

const getSalleById = async (id) => {
    const query = `SELECT * FROM salles WHERE id = $1`;
    const { rows } = await pool.query(query, [id]);
    return rows[0];
};

const createSalle = async ({ nom, type, batiment, capacite, equipements }) => {
    const query = `
        INSERT INTO salles (nom, type, batiment, capacite, equipements)
        VALUES ($1, $2, $3, $4, $5)
        RETURNING *
    `;
    const { rows } = await pool.query(query, [
        nom,
        type,
        batiment,
        capacite,
        equipements || []
    ]);
    return rows[0];
};

const updateSalle = async (id, { nom, type, batiment, capacite, equipements }) => {
    const query = `
        UPDATE salles
        SET nom = $1, type = $2, batiment = $3, capacite = $4, equipements = $5
        WHERE id = $6
        RETURNING *
    `;
    const { rows } = await pool.query(query, [
        nom,
        type,
        batiment,
        capacite,
        equipements || [],
        id
    ]);
    return rows[0];
};

const desactiverSalle = async (id) => {
    const query = `UPDATE salles SET active = false WHERE id = $1 RETURNING *`;
    const { rows } = await pool.query(query, [id]);
    return rows[0];
};

module.exports = {
    getAllSalles,
    getSalleById,
    createSalle,
    updateSalle,
    desactiverSalle
};
