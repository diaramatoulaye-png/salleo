const {
    getAllSalles,
    getSalleById,
    createSalle,
    updateSalle,
    desactiverSalle
} = require("../models/salleModel");

const TYPES_VALIDES = ["salle_de_classe", "amphitheatre", "salle_de_reunion", "laboratoire"];

const listerSalles = async (req, res, next) => {
    try {
        const { type, capaciteMin } = req.query;
        let salles = await getAllSalles();

        if (type) {
            salles = salles.filter((salle) => salle.type === type);
        }
        if (capaciteMin) {
            salles = salles.filter((salle) => salle.capacite >= Number(capaciteMin));
        }

        res.status(200).json(salles);
    } catch (error) {
        next(error);
    }
};

const obtenirSalle = async (req, res, next) => {
    try {
        const salle = await getSalleById(req.params.id);
        if (!salle) {
            return res.status(404).json({ message: "Salle introuvable." });
        }
        res.status(200).json(salle);
    } catch (error) {
        next(error);
    }
};

const ajouterSalle = async (req, res, next) => {
    try {
        const { nom, type, batiment, capacite, equipements } = req.body;

        if (!nom || !type || !batiment || !capacite) {
            return res.status(400).json({ message: "Nom, type, bâtiment et capacité sont obligatoires." });
        }
        if (!TYPES_VALIDES.includes(type)) {
            return res.status(400).json({ message: "Type de salle invalide." });
        }
        if (Number(capacite) <= 0) {
            return res.status(400).json({ message: "La capacité doit être supérieure à 0." });
        }

        const nouvelleSalle = await createSalle({ nom, type, batiment, capacite, equipements });
        res.status(201).json(nouvelleSalle);
    } catch (error) {
        next(error);
    }
};

const modifierSalle = async (req, res, next) => {
    try {
        const salleExistante = await getSalleById(req.params.id);
        if (!salleExistante) {
            return res.status(404).json({ message: "Salle introuvable." });
        }

        const { nom, type, batiment, capacite, equipements } = req.body;

        if (type && !TYPES_VALIDES.includes(type)) {
            return res.status(400).json({ message: "Type de salle invalide." });
        }

        const salleModifiee = await updateSalle(req.params.id, {
            nom: nom || salleExistante.nom,
            type: type || salleExistante.type,
            batiment: batiment || salleExistante.batiment,
            capacite: capacite || salleExistante.capacite,
            equipements: equipements || salleExistante.equipements
        });

        res.status(200).json(salleModifiee);
    } catch (error) {
        next(error);
    }
};

const supprimerSalle = async (req, res, next) => {
    try {
        const salleExistante = await getSalleById(req.params.id);
        if (!salleExistante) {
            return res.status(404).json({ message: "Salle introuvable." });
        }

        await desactiverSalle(req.params.id);
        res.status(200).json({ message: "Salle désactivée avec succès." });
    } catch (error) {
        next(error);
    }
};

module.exports = {
    listerSalles,
    obtenirSalle,
    ajouterSalle,
    modifierSalle,
    supprimerSalle
};