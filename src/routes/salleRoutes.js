const express = require("express");
const router = express.Router();

const {
    listerSalles,
    obtenirSalle,
    ajouterSalle,
    modifierSalle,
    supprimerSalle
} = require("../controllers/salleController");

const { verifierToken, autoriserRoles } = require("../middlewares/auth");

// Consultation : accessible à tout utilisateur connecté
router.get("/", verifierToken, listerSalles);
router.get("/:id", verifierToken, obtenirSalle);

// Gestion du parc : réservée à l'administrateur
router.post("/", verifierToken, autoriserRoles("admin"), ajouterSalle);
router.put("/:id", verifierToken, autoriserRoles("admin"), modifierSalle);
router.delete("/:id", verifierToken, autoriserRoles("admin"), supprimerSalle);

module.exports = router;
