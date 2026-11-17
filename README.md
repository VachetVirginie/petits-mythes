# Les Petits Mythes

[Lire l’histoire du jour](https://vachetvirginie.github.io/petits-mythes/)

Un mythe du monde raconté en français, à lire à voix haute dès 4 ans. Chaque récit est une adaptation libre sourcée de 230 à 330 mots, conçue pour environ trois minutes de lecture à voix haute.

GitHub Actions lance la publication tous les jours à **8 h, heure de Paris**. Le workflow enregistre une histoire en Markdown dans `publications/` et déploie le site. Un second lancement le même jour conserve la publication déjà enregistrée.

Le premier passage publie les quatorze récits préparés. Ensuite, la moins récemment publiée revient comme relecture. Tout nouveau récit ajouté à `histoires.json` passe avant les relectures.

Avec Node.js 24, construire le site avec `node scripts/site.mjs`. Pour enregistrer le récit du jour, utiliser `node scripts/site.mjs --publish`. Servir le dossier `dist` pour consulter le résultat.
