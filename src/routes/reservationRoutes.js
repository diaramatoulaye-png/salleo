const express = require("express");
const router = express.Router();

const {
    listerReservations,
    mesReservations,
    reservationsDeMonDepartement,
    creerReservation,
    validerReservation,
    refuserReservation,
    annulerReservation
} = require("../controllers/reservationController");

const { verifierToken, autoriserRoles } = require("../middlewares/auth");

router.get("/mes-reservations", verifierToken, mesReservations);
router.post("/", verifierToken, creerReservation);
router.delete("/:id", verifierToken, annulerReservation);

router.get(
    "/mon-departement",
    verifierToken,
    autoriserRoles("responsable_departement", "admin"),
    reservationsDeMonDepartement
);

router.get("/", verifierToken, autoriserRoles("administratif", "admin"), listerReservations);
router.patch("/:id/valider", verifierToken, autoriserRoles("administratif", "admin"), validerReservation);
router.patch("/:id/refuser", verifierToken, autoriserRoles("administratif", "admin"), refuserReservation);

module.exports = router;