const express = require("express");
const router = express.Router();

const {
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
} = require("../controllers/reservationController");

const { verifierToken, autoriserRoles } = require("../middlewares/auth");

router.get("/mes-reservations", verifierToken, mesReservations);
router.post("/", verifierToken, creerReservation);
router.patch("/:id", verifierToken, modifierReservation);
router.delete("/:id", verifierToken, annulerReservation);

// Consultation des créneaux occupés d'une salle : ouverte à tout utilisateur
// connecté, y compris un étudiant simple qui ne peut pas réserver.
router.get("/salle/:salleId", verifierToken, creneauxOccupesSalle);

router.get(
    "/mon-departement",
    verifierToken,
    autoriserRoles("responsable_departement", "admin"),
    reservationsDeMonDepartement
);

router.get("/stats/salles", verifierToken, autoriserRoles("administratif", "admin"), statistiquesSalles);

router.get("/", verifierToken, autoriserRoles("administratif", "admin"), listerReservations);
router.patch("/:id/valider", verifierToken, autoriserRoles("administratif", "admin"), validerReservation);
router.patch("/:id/refuser", verifierToken, autoriserRoles("administratif", "admin"), refuserReservation);

module.exports = router;