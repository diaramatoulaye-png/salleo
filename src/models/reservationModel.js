const pool = require("../config/db");

const getAllReservations = async () => {
    const query = `
        SELECT r.*, s.nom AS salle_nom, u.nom AS user_nom, u.departement AS user_departement
        FROM reservations r
        JOIN salles s ON s.id = r.salle_id
        JOIN users u ON u.id = r.user_id
        ORDER BY r.date_reservation DESC, r.heure_debut ASC
    `;
    const { rows } = await pool.query(query);
    return rows;
};

const getReservationsByUser = async (userId) => {
    const query = `
        SELECT r.*, s.nom AS salle_nom
        FROM reservations r
        JOIN salles s ON s.id = r.salle_id
        WHERE r.user_id = $1
        ORDER BY r.date_reservation DESC, r.heure_debut ASC
    `;
    const { rows } = await pool.query(query, [userId]);
    return rows;
};

// Vue en lecture seule pour le responsable de département :
// toutes les réservations faites par des utilisateurs de son propre département
const getReservationsByDepartement = async (departement) => {
    const query = `
        SELECT r.*, s.nom AS salle_nom, s.batiment, u.nom AS user_nom, u.role AS user_role
        FROM reservations r
        JOIN salles s ON s.id = r.salle_id
        JOIN users u ON u.id = r.user_id
        WHERE u.departement = $1
        ORDER BY r.date_reservation DESC, r.heure_debut ASC
    `;
    const { rows } = await pool.query(query, [departement]);
    return rows;
};

const getReservationById = async (id) => {
    const query = `SELECT * FROM reservations WHERE id = $1`;
    const { rows } = await pool.query(query, [id]);
    return rows[0];
};

const existeConflit = async (salleId, date, heureDebut, heureFin, excludeId = null) => {
    const query = `
        SELECT 1 FROM reservations
        WHERE salle_id = $1
          AND date_reservation = $2
          AND statut != 'refusee'
          AND heure_debut < $4
          AND heure_fin > $3
          ${excludeId ? "AND id != $5" : ""}
        LIMIT 1
    `;
    const params = excludeId
        ? [salleId, date, heureDebut, heureFin, excludeId]
        : [salleId, date, heureDebut, heureFin];

    const { rows } = await pool.query(query, params);
    return rows.length > 0;
};

const createReservation = async ({ salleId, userId, date, heureDebut, heureFin, motif }) => {
    const query = `
        INSERT INTO reservations (salle_id, user_id, date_reservation, heure_debut, heure_fin, motif)
        VALUES ($1, $2, $3, $4, $5, $6)
        RETURNING *
    `;
    const { rows } = await pool.query(query, [salleId, userId, date, heureDebut, heureFin, motif]);
    return rows[0];
};

const updateStatutReservation = async (id, statut) => {
    const query = `
        UPDATE reservations
        SET statut = $1
        WHERE id = $2
        RETURNING *
    `;
    const { rows } = await pool.query(query, [statut, id]);
    return rows[0];
};

const deleteReservation = async (id) => {
    const query = `DELETE FROM reservations WHERE id = $1 RETURNING *`;
    const { rows } = await pool.query(query, [id]);
    return rows[0];
};

module.exports = {
    getAllReservations,
    getReservationsByUser,
    getReservationsByDepartement,
    getReservationById,
    existeConflit,
    createReservation,
    updateStatutReservation,
    deleteReservation
};