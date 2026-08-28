const express = require("express");
const router = express.Router();

const {
    listerReservations,
    mesReservations,
    creerReservation,
    validerReservation,
    refuserReservation,
    annulerReservation
} = require("../controllers/reservationController");

const { verifierToken, autoriserRoles } = require("../middlewares/auth");

// Tout utilisateur connecté peut réserver et consulter ses réservations
router.get("/mes-reservations", verifierToken, mesReservations);
router.post("/", verifierToken, creerReservation);
router.delete("/:id", verifierToken, annulerReservation);

// Vue globale et validation : réservées à l'administratif et à l'admin
router.get("/", verifierToken, autoriserRoles("administratif", "admin"), listerReservations);
router.patch("/:id/valider", verifierToken, autoriserRoles("administratif", "admin"), validerReservation);
router.patch("/:id/refuser", verifierToken, autoriserRoles("administratif", "admin"), refuserReservation);

module.exports = router;
