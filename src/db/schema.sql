CREATE EXTENSION IF NOT EXISTS "pgcrypto";

CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nom VARCHAR(100) NOT NULL,
    email VARCHAR(150) UNIQUE NOT NULL,
    mot_de_passe VARCHAR(255) NOT NULL,
    role VARCHAR(30) NOT NULL CHECK (role IN ('etudiant', 'enseignant', 'administratif', 'responsable_departement', 'admin')),
    departement VARCHAR(100),
    created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS salles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nom VARCHAR(100) NOT NULL,
    type VARCHAR(30) NOT NULL CHECK (type IN ('salle_de_classe', 'amphitheatre', 'salle_de_reunion', 'laboratoire')),
    batiment VARCHAR(100) NOT NULL,
    capacite INTEGER NOT NULL CHECK (capacite > 0),
    equipements TEXT[] DEFAULT '{}',
    active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS reservations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    salle_id UUID NOT NULL REFERENCES salles(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    date_reservation DATE NOT NULL,
    heure_debut TIME NOT NULL,
    heure_fin TIME NOT NULL,
    motif VARCHAR(255) NOT NULL,
    statut VARCHAR(20) NOT NULL DEFAULT 'en_attente' CHECK (statut IN ('en_attente', 'validee', 'refusee')),
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    CONSTRAINT heure_valide CHECK (heure_fin > heure_debut)
);

CREATE INDEX IF NOT EXISTS idx_reservations_salle_date ON reservations(salle_id, date_reservation);
CREATE INDEX IF NOT EXISTS idx_reservations_user ON reservations(user_id);
CREATE INDEX IF NOT EXISTS idx_users_departement ON users(departement);