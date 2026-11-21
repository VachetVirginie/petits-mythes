# Les Petits Mythes

[Lire l’histoire du jour](https://vachetvirginie.github.io/petits-mythes/)

Un mythe du monde raconté en français, à lire à voix haute dès 4 ans. Chaque récit est une adaptation libre sourcée de 350 à 550 mots, conçue pour environ quatre à six minutes de lecture à voix haute. Chaque conte installe le lieu, les relations entre les personnages et le problème qui met l’aventure en mouvement. Les rencontres et les dialogues font avancer ce problème vers un dénouement. À sa première apparition, chaque divinité ou personnage central est présenté dans le récit avec son rôle, son pouvoir ou son lien avec les autres personnages.

GitHub Actions lance la publication tous les jours à **8 h, heure de Paris**. Le workflow enregistre une histoire en Markdown dans `publications/` et déploie le site. Un second lancement le même jour conserve la publication déjà enregistrée.

Le premier passage publie les seize récits préparés. Ensuite, la moins récemment publiée revient comme relecture. Tout nouveau récit ajouté à `histoires.json` passe avant les relectures.

Avec Node.js 24, construire le site avec `node scripts/site.mjs`. Pour enregistrer le récit du jour, utiliser `node scripts/site.mjs --publish`. Servir le dossier `dist` pour consulter le résultat.
