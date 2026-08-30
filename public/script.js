const API_URL = `${window.location.origin}/api`;

// ---------- Éléments DOM ----------
const authScreen = document.querySelector("#authScreen");
const appScreen = document.querySelector("#appScreen");
const authMsg = document.querySelector("#authMsg");

const tabLogin = document.querySelector("#tabLogin");
const tabRegister = document.querySelector("#tabRegister");
const loginForm = document.querySelector("#loginForm");
const registerForm = document.querySelector("#registerForm");

const registerRole = document.querySelector("#registerRole");
const registerEstResponsable = document.querySelector("#registerEstResponsable");
const responsableClasseField = document.querySelector("#responsableClasseField");
const classeField = document.querySelector("#classeField");

const userNom = document.querySelector("#userNom");
const logoutBtn = document.querySelector("#logoutBtn");

const statDispo = document.querySelector("#statDispo");
const statAttente = document.querySelector("#statAttente");
const statValidees = document.querySelector("#statValidees");

const pasAutoriseMsg = document.querySelector("#pasAutoriseMsg");
const reservationFormWrapper = document.querySelector("#reservationFormWrapper");

const effectifInput = document.querySelector("#effectifInput");
const salleSelect = document.querySelector("#salleSelect");
const reservationForm = document.querySelector("#reservationForm");
const formMsg = document.querySelector("#formMsg");

const tabSalles = document.querySelector("#tabSalles");
const tabMesReservations = document.querySelector("#tabMesReservations");
const sallesView = document.querySelector("#sallesView");
const mesReservationsView = document.querySelector("#mesReservationsView");

const searchInput = document.querySelector("#searchInput");
const typeFilter = document.querySelector("#typeFilter");
const salleGrid = document.querySelector("#salleGrid");
const mesReservationsList = document.querySelector("#mesReservationsList");

// Modale disponibilités
const dispoModal = document.querySelector("#dispoModal");
const dispoModalTitle = document.querySelector("#dispoModalTitle");
const dispoModalContent = document.querySelector("#dispoModalContent");
const dispoModalClose = document.querySelector("#dispoModalClose");

// Modale modification de réservation
const modifierModal = document.querySelector("#modifierModal");
const modifierModalClose = document.querySelector("#modifierModalClose");
const modifierForm = document.querySelector("#modifierForm");
const modifierMsg = document.querySelector("#modifierMsg");
const modifierEffectif = document.querySelector("#modifierEffectif");
const modifierDate = document.querySelector("#modifierDate");
const modifierHeureDebut = document.querySelector("#modifierHeureDebut");
const modifierHeureFin = document.querySelector("#modifierHeureFin");
const modifierMotif = document.querySelector("#modifierMotif");

let salles = [];
let mesReservations = [];
let currentUser = null;
let reservationEnCoursDeModif = null;

// ---------- Auth : gestion du token ----------
const getToken = () => localStorage.getItem("salleo_token");
const setToken = (token) => localStorage.setItem("salleo_token", token);
const clearSession = () => {
    localStorage.removeItem("salleo_token");
    localStorage.removeItem("salleo_refresh");
    localStorage.removeItem("salleo_user");
};

const authFetch = async (url, options = {}) => {
    const headers = {
        "Content-Type": "application/json",
        Authorization: `Bearer ${getToken()}`,
        ...(options.headers || {})
    };
    const response = await fetch(url, { ...options, headers });
    if (response.status === 401) {
        clearSession();
        afficherAuth();
        throw new Error("Session expirée, reconnecte-toi.");
    }
    return response;
};

// ---------- Bascule Connexion / Inscription ----------
tabLogin.addEventListener("click", () => {
    tabLogin.classList.add("active");
    tabRegister.classList.remove("active");
    loginForm.classList.remove("hidden");
    registerForm.classList.add("hidden");
    authMsg.classList.add("hidden");
});

tabRegister.addEventListener("click", () => {
    tabRegister.classList.add("active");
    tabLogin.classList.remove("active");
    registerForm.classList.remove("hidden");
    loginForm.classList.add("hidden");
    authMsg.classList.add("hidden");
});

const majVisibiliteResponsableClasse = () => {
    if (registerRole.value === "etudiant") {
        responsableClasseField.classList.remove("hidden");
    } else {
        responsableClasseField.classList.add("hidden");
        registerEstResponsable.checked = false;
        classeField.classList.add("hidden");
    }
};

registerRole.addEventListener("change", majVisibiliteResponsableClasse);
registerEstResponsable.addEventListener("change", () => {
    classeField.classList.toggle("hidden", !registerEstResponsable.checked);
});
majVisibiliteResponsableClasse();

const showAuthMsg = (texte, type) => {
    authMsg.textContent = texte;
    authMsg.className = `msg ${type === "error" ? "msg-error" : "msg-success"}`;
    authMsg.classList.remove("hidden");
};

loginForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    const email = document.querySelector("#loginEmail").value.trim();
    const motDePasse = document.querySelector("#loginPassword").value;

    try {
        const response = await fetch(`${API_URL}/auth/login`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email, motDePasse })
        });
        const data = await response.json();

        if (!response.ok) {
            showAuthMsg(data.message || "Identifiants incorrects.", "error");
            return;
        }

        setToken(data.accessToken);
        localStorage.setItem("salleo_refresh", data.refreshToken);
        localStorage.setItem("salleo_user", JSON.stringify(data.user));
        currentUser = data.user;
        afficherApp();
    } catch (error) {
        showAuthMsg("Impossible de se connecter au serveur.", "error");
    }
});

registerForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    const nom = document.querySelector("#registerNom").value.trim();
    const email = document.querySelector("#registerEmail").value.trim();
    const motDePasse = document.querySelector("#registerPassword").value;
    const role = registerRole.value;
    const departement = document.querySelector("#registerDepartement").value.trim();
    const estResponsableClasse = registerEstResponsable.checked;
    const classe = document.querySelector("#registerClasse").value.trim();

    try {
        const response = await fetch(`${API_URL}/auth/register`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ nom, email, motDePasse, role, departement, estResponsableClasse, classe })
        });
        const data = await response.json();

        if (!response.ok) {
            showAuthMsg(data.message || "Impossible de créer le compte.", "error");
            return;
        }

        setToken(data.accessToken);
        localStorage.setItem("salleo_refresh", data.refreshToken);
        localStorage.setItem("salleo_user", JSON.stringify(data.user));
        currentUser = data.user;
        afficherApp();
    } catch (error) {
        showAuthMsg("Impossible de contacter le serveur.", "error");
    }
});

logoutBtn.addEventListener("click", () => {
    clearSession();
    currentUser = null;
    afficherAuth();
});

const afficherAuth = () => {
    authScreen.classList.remove("hidden");
    appScreen.classList.add("hidden");
};

// Seuls enseignant et étudiant-responsable-de-classe peuvent réserver
const peutReserver = () => {
    return currentUser.role === "enseignant" ||
        (currentUser.role === "etudiant" && currentUser.est_responsable_classe);
};

const afficherApp = () => {
    authScreen.classList.add("hidden");
    appScreen.classList.remove("hidden");
    const badgeResponsable = currentUser.est_responsable_classe ? " · Responsable de classe" : "";
    userNom.textContent = `${currentUser.nom} · ${currentUser.role}${badgeResponsable}`;

    if (peutReserver()) {
        pasAutoriseMsg.classList.add("hidden");
        reservationFormWrapper.classList.remove("hidden");
    } else {
        pasAutoriseMsg.classList.remove("hidden");
        reservationFormWrapper.classList.add("hidden");
    }

    chargerDonnees();
};

// ---------- Chargement des données ----------
const chargerDonnees = async () => {
    try {
        const [resSalles, resReservations] = await Promise.all([
            authFetch(`${API_URL}/salles`),
            authFetch(`${API_URL}/reservations/mes-reservations`)
        ]);
        salles = await resSalles.json();
        mesReservations = await resReservations.json();

        renderSalleSelect();
        appliquerFiltresSalles();
        renderMesReservations();
        updateStatistiques();
    } catch (error) {
        console.error(error);
    }
};

// ---------- Suggestion intelligente de salle ----------
const renderSalleSelect = () => {
    const effectif = Number(effectifInput.value) || 0;
    const valeurActuelle = salleSelect.value;

    let sallesTriees = [...salles];

    if (effectif > 0) {
        sallesTriees.sort((a, b) => {
            const aConvient = a.capacite >= effectif;
            const bConvient = b.capacite >= effectif;
            if (aConvient && !bConvient) return -1;
            if (!aConvient && bConvient) return 1;
            if (aConvient && bConvient) return a.capacite - b.capacite;
            return b.capacite - a.capacite;
        });
    }

    salleSelect.innerHTML = "";
    sallesTriees.forEach((salle, index) => {
        const estRecommandee = effectif > 0 && index === 0 && salle.capacite >= effectif;
        const insuffisante = effectif > 0 && salle.capacite < effectif;
        const label = `${estRecommandee ? "★ Recommandée — " : ""}${salle.nom} (${salle.capacite} places)${insuffisante ? " — capacité insuffisante" : ""}`;
        salleSelect.innerHTML += `<option value="${salle.id}" ${insuffisante ? "disabled" : ""}>${label}</option>`;
    });

    if (valeurActuelle && salles.some((s) => s.id === valeurActuelle)) {
        salleSelect.value = valeurActuelle;
    }
};

effectifInput.addEventListener("input", renderSalleSelect);

const formatType = (type) => type.replaceAll("_", " ").replace(/^./, (l) => l.toUpperCase());

const formatDateFr = (isoDate) => {
    const [annee, mois, jour] = isoDate.split("-");
    return `${jour}/${mois}/${annee}`;
};

const badgeClasse = (statut) => {
    if (statut === "validee") return "badge-validee";
    if (statut === "refusee") return "badge-refusee";
    return "badge-attente";
};

// ---------- Modale : créneaux occupés d'une salle ----------
const fermerDispoModal = () => dispoModal.classList.add("hidden");
dispoModalClose.addEventListener("click", fermerDispoModal);
dispoModal.addEventListener("click", (event) => {
    if (event.target === dispoModal) fermerDispoModal();
});

const ouvrirDisponibilites = async (salle) => {
    dispoModalTitle.textContent = `Créneaux occupés — ${salle.nom}`;
    dispoModalContent.innerHTML = `<div class="empty-state">Chargement...</div>`;
    dispoModal.classList.remove("hidden");

    try {
        const response = await authFetch(`${API_URL}/reservations/salle/${salle.id}`);
        const creneaux = await response.json();

        if (!response.ok) {
            dispoModalContent.innerHTML = `<div class="msg msg-error">${creneaux.message || "Impossible de charger les disponibilités."}</div>`;
            return;
        }

        if (creneaux.length === 0) {
            dispoModalContent.innerHTML = `<div class="empty-state">Aucun créneau occupé à venir pour cette salle.</div>`;
            return;
        }

        dispoModalContent.innerHTML = creneaux.map((creneau) => `
            <div class="reservation-row">
                <div>
                    <strong>${formatDateFr(creneau.date_reservation)}</strong>
                    <div class="details">${creneau.heure_debut.slice(0, 5)} - ${creneau.heure_fin.slice(0, 5)}</div>
                    <span class="badge ${badgeClasse(creneau.statut)}">${creneau.statut.replace("_", " ")}</span>
                </div>
            </div>
        `).join("");
    } catch (error) {
        dispoModalContent.innerHTML = `<div class="msg msg-error">Impossible de charger les disponibilités.</div>`;
    }
};

const renderSalles = (items) => {
    salleGrid.innerHTML = "";

    if (items.length === 0) {
        salleGrid.innerHTML = `<div class="empty-state">Aucune salle ne correspond à ta recherche.</div>`;
        return;
    }

    items.forEach((salle) => {
        const carte = document.createElement("div");
        carte.className = "salle-card";
        carte.innerHTML = `
            <div class="type">${formatType(salle.type)}</div>
            <h3>${salle.nom}</h3>
            <div class="infos">${salle.batiment} · ${salle.capacite} places</div>
            <div class="infos">${(salle.equipements || []).join(", ") || "Aucun équipement listé"}</div>
            <button type="button" class="btn btn-outline btn-dispo" style="width:100%;">Voir les disponibilités</button>
        `;

        // Visible pour tout le monde, y compris les étudiants simples qui ne
        // peuvent pas réserver mais doivent pouvoir consulter l'occupation.
        carte.querySelector(".btn-dispo").addEventListener("click", (event) => {
            event.stopPropagation();
            ouvrirDisponibilites(salle);
        });

        if (peutReserver()) {
            carte.addEventListener("click", () => {
                salleSelect.value = salle.id;
                reservationForm.scrollIntoView({ behavior: "smooth", block: "center" });
            });
        }
        salleGrid.appendChild(carte);
    });
};

const appliquerFiltresSalles = () => {
    const motCle = searchInput.value.trim().toLowerCase();
    const type = typeFilter.value;

    const resultats = salles.filter((salle) => {
        const correspondNom = salle.nom.toLowerCase().includes(motCle);
        const correspondType = type === "all" || salle.type === type;
        return correspondNom && correspondType;
    });

    renderSalles(resultats);
};

const renderMesReservations = () => {
    mesReservationsList.innerHTML = "";

    if (mesReservations.length === 0) {
        mesReservationsList.innerHTML = `<div class="empty-state">Tu n'as encore fait aucune réservation.</div>`;
        return;
    }

    mesReservations.forEach((reservation) => {
        const ligne = document.createElement("div");
        ligne.className = "reservation-row";
        const effectifTxt = reservation.effectif ? ` · ${reservation.effectif} participants` : "";
        ligne.innerHTML = `
            <div>
                <strong>${reservation.salle_nom}</strong>
                <div class="details">${reservation.date_reservation} · ${reservation.heure_debut.slice(0,5)}-${reservation.heure_fin.slice(0,5)}${effectifTxt} · ${reservation.motif}</div>
                <span class="badge ${badgeClasse(reservation.statut)}">${reservation.statut.replace("_", " ")}</span>
            </div>
            <div class="actions">
                ${reservation.statut === "en_attente" ? `<button class="btn btn-outline modifierBtn" data-id="${reservation.id}">Modifier</button>` : ""}
                ${reservation.statut !== "refusee" ? `<button class="btn btn-danger annulerBtn" data-id="${reservation.id}">Annuler</button>` : ""}
            </div>
        `;
        mesReservationsList.appendChild(ligne);
    });

    document.querySelectorAll(".annulerBtn").forEach((btn) => {
        btn.addEventListener("click", () => annulerReservation(btn.dataset.id));
    });

    document.querySelectorAll(".modifierBtn").forEach((btn) => {
        btn.addEventListener("click", () => {
            const reservation = mesReservations.find((r) => r.id === btn.dataset.id);
            if (reservation) ouvrirModifierModal(reservation);
        });
    });
};

const updateStatistiques = () => {
    statDispo.textContent = salles.length;
    statAttente.textContent = mesReservations.filter((r) => r.statut === "en_attente").length;
    statValidees.textContent = mesReservations.filter((r) => r.statut === "validee").length;
};

// ---------- Onglets Salles / Mes réservations ----------
tabSalles.addEventListener("click", () => {
    tabSalles.classList.add("active");
    tabMesReservations.classList.remove("active");
    sallesView.classList.remove("hidden");
    mesReservationsView.classList.add("hidden");
});

tabMesReservations.addEventListener("click", () => {
    tabMesReservations.classList.add("active");
    tabSalles.classList.remove("active");
    mesReservationsView.classList.remove("hidden");
    sallesView.classList.add("hidden");
});

// ---------- Créer une réservation ----------
const showFormMsg = (texte, type) => {
    formMsg.textContent = texte;
    formMsg.className = `msg ${type === "error" ? "msg-error" : "msg-success"}`;
    formMsg.classList.remove("hidden");
};

reservationForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    const body = {
        salleId: salleSelect.value,
        date: document.querySelector("#dateInput").value,
        heureDebut: document.querySelector("#heureDebutInput").value,
        heureFin: document.querySelector("#heureFinInput").value,
        motif: document.querySelector("#motifInput").value.trim(),
        effectif: effectifInput.value ? Number(effectifInput.value) : null
    };

    try {
        const response = await authFetch(`${API_URL}/reservations`, {
            method: "POST",
            body: JSON.stringify(body)
        });
        const data = await response.json();

        if (!response.ok) {
            showFormMsg(data.message || "Impossible d'envoyer la demande.", "error");
            return;
        }

        showFormMsg("Demande envoyée ! En attente de validation.", "success");
        reservationForm.reset();
        renderSalleSelect();
        chargerDonnees();
    } catch (error) {
        showFormMsg("Erreur de connexion au serveur.", "error");
    }
});

const annulerReservation = async (id) => {
    if (!confirm("Annuler cette réservation ?")) return;
    try {
        await authFetch(`${API_URL}/reservations/${id}`, { method: "DELETE" });
        chargerDonnees();
    } catch (error) {
        alert("Impossible d'annuler la réservation.");
    }
};

// ---------- Modale : modification d'une réservation en attente ----------
const fermerModifierModal = () => {
    modifierModal.classList.add("hidden");
    reservationEnCoursDeModif = null;
};

modifierModalClose.addEventListener("click", fermerModifierModal);
modifierModal.addEventListener("click", (event) => {
    if (event.target === modifierModal) fermerModifierModal();
});

const ouvrirModifierModal = (reservation) => {
    reservationEnCoursDeModif = reservation;
    modifierMsg.classList.add("hidden");
    modifierEffectif.value = reservation.effectif || "";
    modifierDate.value = reservation.date_reservation;
    modifierHeureDebut.value = reservation.heure_debut.slice(0, 5);
    modifierHeureFin.value = reservation.heure_fin.slice(0, 5);
    modifierMotif.value = reservation.motif;
    modifierModal.classList.remove("hidden");
};

modifierForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    if (!reservationEnCoursDeModif) return;

    const body = {
        date: modifierDate.value,
        heureDebut: modifierHeureDebut.value,
        heureFin: modifierHeureFin.value,
        motif: modifierMotif.value.trim(),
        effectif: modifierEffectif.value ? Number(modifierEffectif.value) : null
    };

    try {
        const response = await authFetch(`${API_URL}/reservations/${reservationEnCoursDeModif.id}`, {
            method: "PATCH",
            body: JSON.stringify(body)
        });
        const data = await response.json();

        if (!response.ok) {
            modifierMsg.textContent = data.message || "Impossible de modifier la réservation.";
            modifierMsg.className = "msg msg-error";
            modifierMsg.classList.remove("hidden");
            return;
        }

        fermerModifierModal();
        chargerDonnees();
    } catch (error) {
        modifierMsg.textContent = "Erreur de connexion au serveur.";
        modifierMsg.className = "msg msg-error";
        modifierMsg.classList.remove("hidden");
    }
});

// ---------- Filtres ----------
searchInput.addEventListener("input", appliquerFiltresSalles);
typeFilter.addEventListener("change", appliquerFiltresSalles);

// ---------- Démarrage ----------
const init = () => {
    const token = getToken();
    const savedUser = localStorage.getItem("salleo_user");

    if (token && savedUser) {
        currentUser = JSON.parse(savedUser);
        afficherApp();
    } else {
        afficherAuth();
    }
};

init();