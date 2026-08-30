const {
    getAllReservations,
    getReservationsByUser,
    getReservationsByDepartement,
    getReservationById,
    existeConflit,
    createReservation,
    updateReservation,
    getCreneauxOccupesBySalle,
    getStatsParSalle,
    updateStatutReservation,
    deleteReservation
} = require("../models/reservationModel");

const { getSalleById } = require("../models/salleModel");
const { findUserById } = require("../models/userModel");

const listerReservations = async (req, res, next) => {
    try {
        const { statut } = req.query;
        let reservations = await getAllReservations();

        if (statut) {
            reservations = reservations.filter((r) => r.statut === statut);
        }

        res.status(200).json(reservations);
    } catch (error) {
        next(error);
    }
};

const mesReservations = async (req, res, next) => {
    try {
        const reservations = await getReservationsByUser(req.user.id);
        res.status(200).json(reservations);
    } catch (error) {
        next(error);
    }
};

const reservationsDeMonDepartement = async (req, res, next) => {
    try {
        const utilisateur = await findUserById(req.user.id);

        if (!utilisateur.departement) {
            return res.status(400).json({ message: "Aucun département associé à ce compte." });
        }

        const reservations = await getReservationsByDepartement(utilisateur.departement);
        res.status(200).json({ departement: utilisateur.departement, reservations });
    } catch (error) {
        next(error);
    }
};

// Créneaux occupés d'une salle — accessible à tout utilisateur connecté
// (y compris un étudiant simple qui ne peut pas réserver), sans exposer
// le motif ni l'identité du demandeur.
const creneauxOccupesSalle = async (req, res, next) => {
    try {
        const salle = await getSalleById(req.params.salleId);
        if (!salle) {
            return res.status(404).json({ message: "Salle introuvable." });
        }

        const creneaux = await getCreneauxOccupesBySalle(req.params.salleId);
        res.status(200).json(creneaux);
    } catch (error) {
        next(error);
    }
};

// Tableau de bord statistique — réservé aux gestionnaires (administratif / admin).
const statistiquesSalles = async (req, res, next) => {
    try {
        const stats = await getStatsParSalle();
        res.status(200).json(stats);
    } catch (error) {
        next(error);
    }
};

const creerReservation = async (req, res, next) => {
    try {
        // Seuls les enseignants et les étudiants marqués "responsable de classe"
        // peuvent créer une réservation. Un étudiant simple ne peut pas.
        const { role, est_responsable_classe: estResponsableClasse } = req.user;
        const peutReserver = role === "enseignant" || (role === "etudiant" && estResponsableClasse);

        if (!peutReserver) {
            return res.status(403).json({
                message: "Seuls les enseignants et les responsables de classe peuvent réserver une salle."
            });
        }

        const { salleId, date, heureDebut, heureFin, motif, effectif } = req.body;

        if (!salleId || !date || !heureDebut || !heureFin || !motif) {
            return res.status(400).json({ message: "Tous les champs sont obligatoires." });
        }

        if (heureFin <= heureDebut) {
            return res.status(400).json({ message: "L'heure de fin doit être après l'heure de début." });
        }

        const aujourdhui = new Date().toISOString().slice(0, 10);
        if (date < aujourdhui) {
            return res.status(400).json({ message: "Impossible de réserver une date passée." });
        }

        if (effectif !== undefined && effectif !== null && effectif !== "" && Number(effectif) <= 0) {
            return res.status(400).json({ message: "L'effectif doit être supérieur à 0." });
        }

        const salle = await getSalleById(salleId);
        if (!salle || !salle.active) {
            return res.status(404).json({ message: "Salle introuvable." });
        }

        if (effectif && Number(effectif) > salle.capacite) {
            return res.status(400).json({ message: `Cette salle ne peut accueillir que ${salle.capacite} personnes.` });
        }

        const conflit = await existeConflit(salleId, date, heureDebut, heureFin);
        if (conflit) {
            return res.status(409).json({ message: "Ce créneau est déjà réservé pour cette salle." });
        }

        const reservation = await createReservation({
            salleId,
            userId: req.user.id,
            date,
            heureDebut,
            heureFin,
            motif,
            effectif: effectif ? Number(effectif) : null
        });

        res.status(201).json(reservation);
    } catch (error) {
        next(error);
    }
};

// Modification d'une réservation par son propriétaire, uniquement tant
// qu'elle est "en_attente" (une réservation déjà validée ou refusée ne
// peut pas être modifiée : il faut l'annuler et en recréer une autre).
const modifierReservation = async (req, res, next) => {
    try {
        const reservation = await getReservationById(req.params.id);
        if (!reservation) {
            return res.status(404).json({ message: "Réservation introuvable." });
        }

        if (reservation.user_id !== req.user.id) {
            return res.status(403).json({ message: "Tu ne peux modifier que tes propres réservations." });
        }

        if (reservation.statut !== "en_attente") {
            return res.status(400).json({ message: "Seules les réservations en attente peuvent être modifiées." });
        }

        const { date, heureDebut, heureFin, motif, effectif } = req.body;

        if (!date || !heureDebut || !heureFin || !motif) {
            return res.status(400).json({ message: "Tous les champs sont obligatoires." });
        }

        if (heureFin <= heureDebut) {
            return res.status(400).json({ message: "L'heure de fin doit être après l'heure de début." });
        }

        const aujourdhui = new Date().toISOString().slice(0, 10);
        if (date < aujourdhui) {
            return res.status(400).json({ message: "Impossible de réserver une date passée." });
        }

        if (effectif !== undefined && effectif !== null && effectif !== "" && Number(effectif) <= 0) {
            return res.status(400).json({ message: "L'effectif doit être supérieur à 0." });
        }

        const salle = await getSalleById(reservation.salle_id);
        if (effectif && Number(effectif) > salle.capacite) {
            return res.status(400).json({ message: `Cette salle ne peut accueillir que ${salle.capacite} personnes.` });
        }

        const conflit = await existeConflit(reservation.salle_id, date, heureDebut, heureFin, reservation.id);
        if (conflit) {
            return res.status(409).json({ message: "Ce créneau est déjà réservé pour cette salle." });
        }

        const reservationMaj = await updateReservation(req.params.id, {
            date,
            heureDebut,
            heureFin,
            motif,
            effectif: effectif ? Number(effectif) : null
        });

        res.status(200).json(reservationMaj);
    } catch (error) {
        next(error);
    }
};

const validerReservation = async (req, res, next) => {
    try {
        const reservation = await getReservationById(req.params.id);
        if (!reservation) {
            return res.status(404).json({ message: "Réservation introuvable." });
        }

        const conflit = await existeConflit(
            reservation.salle_id,
            reservation.date_reservation,
            reservation.heure_debut,
            reservation.heure_fin,
            reservation.id
        );
        if (conflit) {
            return res.status(409).json({ message: "Conflit détecté avec une autre réservation déjà validée." });
        }

        const reservationMaj = await updateStatutReservation(req.params.id, "validee");
        res.status(200).json(reservationMaj);
    } catch (error) {
        next(error);
    }
};

const refuserReservation = async (req, res, next) => {
    try {
        const reservation = await getReservationById(req.params.id);
        if (!reservation) {
            return res.status(404).json({ message: "Réservation introuvable." });
        }

        const reservationMaj = await updateStatutReservation(req.params.id, "refusee");
        res.status(200).json(reservationMaj);
    } catch (error) {
        next(error);
    }
};

// Annulation : le propriétaire de la réservation, ou l'administration
// (administratif / admin), peut annuler — à tout moment, quel que soit le statut.
const annulerReservation = async (req, res, next) => {
    try {
        const reservation = await getReservationById(req.params.id);
        if (!reservation) {
            return res.status(404).json({ message: "Réservation introuvable." });
        }

        const estProprietaire = reservation.user_id === req.user.id;
        const estGestionnaire = ["admin", "administratif"].includes(req.user.role);

        if (!estProprietaire && !estGestionnaire) {
            return res.status(403).json({ message: "Vous ne pouvez annuler que vos propres réservations." });
        }

        await deleteReservation(req.params.id);
        res.status(200).json({ message: "Réservation annulée avec succès." });
    } catch (error) {
        next(error);
    }
};

module.exports = {
    listerReservations,
    mesReservations,
    reservationsDeMonDepartement,
    creneauxOccupesSalle,
    statistiquesSalles,
    creerReservation,
    modifierReservation,
    validerReservation,
    refuserReservation,
    annulerReservation
};