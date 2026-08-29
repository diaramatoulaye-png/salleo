const API_URL = `${window.location.origin}/api`;

const authScreen = document.querySelector("#authScreen");
const appScreen = document.querySelector("#appScreen");
const authMsg = document.querySelector("#authMsg");
const loginForm = document.querySelector("#loginForm");
const userNom = document.querySelector("#userNom");
const logoutBtn = document.querySelector("#logoutBtn");

const statAttente = document.querySelector("#statAttente");
const statValidees = document.querySelector("#statValidees");
const statRefusees = document.querySelector("#statRefusees");
const statSalles = document.querySelector("#statSalles");

const statutFilter = document.querySelector("#statutFilter");
const reservationList = document.querySelector("#reservationList");

const salleForm = document.querySelector("#salleForm");
const salleMsg = document.querySelector("#salleMsg");
const salleAdminList = document.querySelector("#salleAdminList");

let reservations = [];
let salles = [];
let currentUser = null;

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
        throw new Error("Session expirée");
    }
    return response;
};

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

        if (!["administratif", "admin"].includes(data.user.role)) {
            showAuthMsg("Accès réservé au personnel administratif.", "error");
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

logoutBtn.addEventListener("click", () => {
    clearSession();
    currentUser = null;
    afficherAuth();
});

const afficherAuth = () => {
    authScreen.classList.remove("hidden");
    appScreen.classList.add("hidden");
};

const afficherApp = () => {
    authScreen.classList.add("hidden");
    appScreen.classList.remove("hidden");
    userNom.textContent = `${currentUser.nom} · ${currentUser.role}`;
    chargerDonnees();
};

const chargerDonnees = async () => {
    try {
        const [resReservations, resSalles] = await Promise.all([
            authFetch(`${API_URL}/reservations`),
            authFetch(`${API_URL}/salles`)
        ]);
        reservations = await resReservations.json();
        salles = await resSalles.json();
        appliquerFiltre();
        renderSallesAdmin();
        updateStatistiques();
    } catch (error) {
        console.error(error);
    }
};

const badgeClasse = (statut) => {
    if (statut === "validee") return "badge-validee";
    if (statut === "refusee") return "badge-refusee";
    return "badge-attente";
};

const renderReservations = (items) => {
    reservationList.innerHTML = "";

    if (items.length === 0) {
        reservationList.innerHTML = `<div class="empty-state">Aucune réservation trouvée.</div>`;
        return;
    }

    items.forEach((reservation) => {
        const ligne = document.createElement("div");
        ligne.className = "reservation-row";
        ligne.innerHTML = `
            <div>
                <strong>${reservation.salle_nom}</strong>
                <div class="details">${reservation.user_nom} · ${reservation.date_reservation} · ${reservation.heure_debut.slice(0,5)}-${reservation.heure_fin.slice(0,5)}</div>
                <div class="details">${reservation.motif}</div>
                <span class="badge ${badgeClasse(reservation.statut)}">${reservation.statut.replace("_", " ")}</span>
            </div>
            <div class="actions">
                ${reservation.statut === "en_attente" ? `
                    <button class="btn btn-primary validerBtn" data-id="${reservation.id}">Valider</button>
                    <button class="btn btn-danger refuserBtn" data-id="${reservation.id}">Refuser</button>
                ` : ""}
            </div>
        `;
        reservationList.appendChild(ligne);
    });

    document.querySelectorAll(".validerBtn").forEach((btn) => {
        btn.addEventListener("click", () => changerStatut(btn.dataset.id, "valider"));
    });
    document.querySelectorAll(".refuserBtn").forEach((btn) => {
        btn.addEventListener("click", () => changerStatut(btn.dataset.id, "refuser"));
    });
};

const changerStatut = async (id, action) => {
    try {
        const response = await authFetch(`${API_URL}/reservations/${id}/${action}`, { method: "PATCH" });
        const data = await response.json();
        if (!response.ok) {
            alert(data.message || "Action impossible.");
            return;
        }
        chargerDonnees();
    } catch (error) {
        alert("Impossible de mettre à jour la réservation.");
    }
};

const appliquerFiltre = () => {
    const statut = statutFilter.value;
    const resultats = statut === "all" ? reservations : reservations.filter((r) => r.statut === statut);
    renderReservations(resultats);
};

const updateStatistiques = () => {
    statAttente.textContent = reservations.filter((r) => r.statut === "en_attente").length;
    statValidees.textContent = reservations.filter((r) => r.statut === "validee").length;
    statRefusees.textContent = reservations.filter((r) => r.statut === "refusee").length;
    statSalles.textContent = salles.length;
};

const renderSallesAdmin = () => {
    salleAdminList.innerHTML = "";
    salles.forEach((salle) => {
        const ligne = document.createElement("div");
        ligne.className = "reservation-row";
        ligne.innerHTML = `
            <div>
                <strong>${salle.nom}</strong>
                <div class="details">${salle.batiment} · ${salle.capacite} places</div>
            </div>
            <div class="actions">
                <button class="btn btn-danger supprimerBtn" data-id="${salle.id}">Supprimer</button>
            </div>
        `;
        ligne.querySelector(".supprimerBtn").addEventListener("click", () => supprimerSalle(salle.id));
        salleAdminList.appendChild(ligne);
    });
};

const supprimerSalle = async (id) => {
    if (!confirm("Désactiver cette salle ?")) return;
    try {
        await authFetch(`${API_URL}/salles/${id}`, { method: "DELETE" });
        chargerDonnees();
    } catch (error) {
        alert("Impossible de supprimer la salle.");
    }
};

const showSalleMsg = (texte, type) => {
    salleMsg.textContent = texte;
    salleMsg.className = `msg ${type === "error" ? "msg-error" : "msg-success"}`;
    salleMsg.classList.remove("hidden");
};

salleForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    const body = {
        nom: document.querySelector("#nomInput").value.trim(),
        type: document.querySelector("#typeInput").value,
        batiment: document.querySelector("#batimentInput").value.trim(),
        capacite: Number(document.querySelector("#capaciteInput").value),
        equipements: []
    };

    try {
        const response = await authFetch(`${API_URL}/salles`, {
            method: "POST",
            body: JSON.stringify(body)
        });
        const data = await response.json();

        if (!response.ok) {
            showSalleMsg(data.message || "Impossible d'ajouter la salle.", "error");
            return;
        }

        showSalleMsg("Salle ajoutée avec succès.", "success");
        salleForm.reset();
        chargerDonnees();
    } catch (error) {
        showSalleMsg("Erreur de connexion au serveur.", "error");
    }
});

statutFilter.addEventListener("change", appliquerFiltre);

const init = () => {
    const token = getToken();
    const savedUser = localStorage.getItem("salleo_user");

    if (token && savedUser) {
        currentUser = JSON.parse(savedUser);
        if (!["administratif", "admin"].includes(currentUser.role)) {
            clearSession();
            afficherAuth();
            return;
        }
        afficherApp();
    } else {
        afficherAuth();
    }
};

init();
