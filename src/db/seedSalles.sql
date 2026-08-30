-- Jeu de données initial pour les salles (à exécuter après la migration)
INSERT INTO salles (nom, type, batiment, capacite, equipements) VALUES
('Salle B101', 'salle_de_classe', 'Bâtiment B', 25, ARRAY['Tableau', 'Vidéoprojecteur']),
('Salle B102', 'salle_de_classe', 'Bâtiment B', 35, ARRAY['Tableau', 'Vidéoprojecteur']),
('Salle B203', 'salle_de_classe', 'Bâtiment B', 40, ARRAY['Tableau', 'Vidéoprojecteur', 'Climatisation']),
('Salle B204', 'salle_de_classe', 'Bâtiment B', 50, ARRAY['Tableau', 'Vidéoprojecteur']),
('Salle C110', 'salle_de_classe', 'Bâtiment C', 30, ARRAY['Tableau']),
('Salle C205', 'salle_de_classe', 'Bâtiment C', 45, ARRAY['Tableau', 'Vidéoprojecteur']),

('Amphi A', 'amphitheatre', 'Bâtiment A', 100, ARRAY['Micro', 'Vidéoprojecteur', 'Sono']),
('Amphi B', 'amphitheatre', 'Bâtiment A', 150, ARRAY['Micro', 'Vidéoprojecteur', 'Sono']),
('Grand Amphi', 'amphitheatre', 'Bâtiment A', 300, ARRAY['Micro', 'Vidéoprojecteur', 'Sono', 'Enregistrement']),

('Salle de réunion C1', 'salle_de_reunion', 'Bâtiment C', 8, ARRAY['Écran', 'Visioconférence']),
('Salle de réunion C2', 'salle_de_reunion', 'Bâtiment C', 12, ARRAY['Écran', 'Visioconférence']),
('Salle de réunion Direction', 'salle_de_reunion', 'Bâtiment A', 20, ARRAY['Écran', 'Visioconférence', 'Climatisation']),

('Labo Info D1', 'laboratoire', 'Bâtiment D', 20, ARRAY['Ordinateurs', 'Réseau']),
('Labo Info D2', 'laboratoire', 'Bâtiment D', 25, ARRAY['Ordinateurs', 'Réseau', 'Climatisation']),
('Labo Réseaux D3', 'laboratoire', 'Bâtiment D', 30, ARRAY['Ordinateurs', 'Switchs', 'Baies de brassage']);
