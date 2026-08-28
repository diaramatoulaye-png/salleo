const {
    getAllReservations,
    getReservationsByUser,
    getReservationById,
    existeConflit,
    createReservation,
    updateStatutReservation,
    deleteReservation
} = require("../models/reservationModel");

const { getSalleById } = require("../models/salleModel");

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

const creerReservation = async (req, res, next) => {
    try {
        const { salleId, date, heureDebut, heureFin, motif } = req.body;

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

        const salle = await getSalleById(salleId);
        if (!salle || !salle.active) {
            return res.status(404).json({ message: "Salle introuvable." });
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
            motif
        });

        res.status(201).json(reservation);
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

        // Re-vérification du conflit au moment de la validation,
        // au cas où une autre réservation aurait été validée entre-temps
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

const annulerReservation = async (req, res, next) => {
    try {
        const reservation = await getReservationById(req.params.id);
        if (!reservation) {
            return res.status(404).json({ message: "Réservation introuvable." });
        }

        const estProprietaire = reservation.user_id === req.user.id;
        const estAdmin = req.user.role === "admin";

        if (!estProprietaire && !estAdmin) {
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
    creerReservation,
    validerReservation,
    refuserReservation,
    annulerReservation
};
