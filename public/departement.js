const API_URL = `${window.location.origin}/api`;

const authScreen = document.querySelector("#authScreen");
const appScreen = document.querySelector("#appScreen");
const authMsg = document.querySelector("#authMsg");
const loginForm = document.querySelector("#loginForm");
const userNom = document.querySelector("#userNom");
const logoutBtn = document.querySelector("#logoutBtn");
const departementLabel = document.querySelector("#departementLabel");

const statTotal = document.querySelector("#statTotal");
const statAttente = document.querySelector("#statAttente");
const statValidees = document.querySelector("#statValidees");
const statRefusees = document.querySelector("#statRefusees");
const reservationList = document.querySelector("#reservationList");

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

        if (!["responsable_departement", "admin"].includes(data.user.role)) {
            showAuthMsg("Accès réservé aux responsables de département.", "error");
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
    userNom.textContent = currentUser.nom;
    chargerDonnees();
};

const badgeClasse = (statut) => {
    if (statut === "validee") return "badge-validee";
    if (statut === "refusee") return "badge-refusee";
    return "badge-attente";
};

const chargerDonnees = async () => {
    try {
        const response = await authFetch(`${API_URL}/reservations/mon-departement`);
        const data = await response.json();

        if (!response.ok) {
            departementLabel.textContent = data.message || "Erreur de chargement.";
            return;
        }

        departementLabel.textContent = `Département : ${data.departement}`;
        renderReservations(data.reservations);
        updateStatistiques(data.reservations);
    } catch (error) {
        console.error(error);
    }
};

const renderReservations = (items) => {
    reservationList.innerHTML = "";

    if (items.length === 0) {
        reservationList.innerHTML = `<div class="empty-state">Aucune réservation pour ce département.</div>`;
        return;
    }

    items.forEach((r) => {
        const ligne = document.createElement("div");
        ligne.className = "reservation-row";
        ligne.innerHTML = `
            <div>
                <strong>${r.salle_nom}</strong> · ${r.batiment}
                <div class="details">${r.user_nom} (${r.user_role}) · ${r.date_reservation} · ${r.heure_debut.slice(0,5)}-${r.heure_fin.slice(0,5)}</div>
                <div class="details">${r.motif}</div>
                <span class="badge ${badgeClasse(r.statut)}">${r.statut.replace("_", " ")}</span>
            </div>
        `;
        reservationList.appendChild(ligne);
    });
};

const updateStatistiques = (items) => {
    statTotal.textContent = items.length;
    statAttente.textContent = items.filter((r) => r.statut === "en_attente").length;
    statValidees.textContent = items.filter((r) => r.statut === "validee").length;
    statRefusees.textContent = items.filter((r) => r.statut === "refusee").length;
};

const init = () => {
    const token = getToken();
    const savedUser = localStorage.getItem("salleo_user");

    if (token && savedUser) {
        currentUser = JSON.parse(savedUser);
        if (!["responsable_departement", "admin"].includes(currentUser.role)) {
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