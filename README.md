# Fortnite Tracker

1. Installe Node.js 18 ou plus.
2. Crée un compte sur fortnite-api.com et récupère ta clé API (Dashboard).
3. Dans ce dossier : `FORTNITE_API_KEY=ta_cle node server.js`
   (Windows PowerShell : `$env:FORTNITE_API_KEY="ta_cle"; node server.js`)
4. Ouvre http://localhost:3000

Pour le mettre en ligne : héberge le dossier sur Render, Railway ou un VPS,
avec la variable d’environnement FORTNITE_API_KEY.
Les stats ne marchent que pour les profils publics (réglage Fortnite : « Afficher les stats de jeu »).
Si la boutique est vide, vérifie la doc de l’API : l’adresse /v2/shop peut avoir changé.

