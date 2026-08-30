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

// Gestion du parc : réservée à l'administration (admin + administratif)
router.post("/", verifierToken, autoriserRoles("admin", "administratif"), ajouterSalle);
router.put("/:id", verifierToken, autoriserRoles("admin", "administratif"), modifierSalle);
router.delete("/:id", verifierToken, autoriserRoles("admin", "administratif"), supprimerSalle);

module.exports = router;
