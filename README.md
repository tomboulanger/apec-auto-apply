🚀 Auto Apply APEC — Script d’automatisation d’envoi de candidatures
🧠 Description

Ce projet est un script d’automatisation en JavaScript permettant de postuler automatiquement sur le site de l’APEC à l’aide de son CV et d’une lettre de motivation.

L’objectif est de simplifier et d’accélérer le processus de candidature en ligne en automatisant les tâches répétitives tout en respectant la structure du site et les bonnes pratiques techniques.

⚙️ Fonctionnement

Le script s’appuie sur Playwright
 pour automatiser la navigation et récupérer les informations nécessaires à la connexion (cookies, tokens, etc.).

Étapes principales :

Connexion automatique à l’APEC via Playwright.

Récupération des cookies et jetons d’authentification utilisés pour les requêtes internes.

Utilisation des routes API internes pour soumettre automatiquement le CV et la lettre de motivation.

Envoi automatique des candidatures selon les critères configurés (mots-clés, localisation, etc.).

💡 Pourquoi Playwright ?

À l’origine, le script utilisait uniquement les requêtes HTTP directes vers les API internes.
Cependant, l’APEC a renforcé ses mécanismes anti-bot : les cookies et jetons changent désormais très fréquemment, ce qui empêche une approche 100 % API.

Playwright permet donc :

De simuler un vrai navigateur (Chromium, Firefox, WebKit) ;

De gérer dynamiquement les cookies et tokens à chaque session ;

De contourner les changements fréquents de session sans manipuler manuellement les entêtes réseau.

🧩 Stack technique

Langage : JavaScript (Node.js)

Automatisation navigateur : Playwright

Gestion des cookies : intégrée via le contexte Playwright

Récupération des routes API : interception des requêtes réseau

CV / Lettre de motivation : fichiers locaux injectés dans les requêtes

⚠️ Avertissement

Ce projet a un but expérimental et éducatif.
Il montre comment interagir avec un site web de manière automatisée, mais il n’est pas destiné à un usage abusif ou à contourner les conditions d’utilisation du site APEC.

L’automatisation de candidatures sur des plateformes tierces doit toujours être effectuée dans le respect des CGU et des lois en vigueur.

🛠️ Installation

yarn install

▶️ Utilisation

yarn start

-> dans la fonction fetchAllOffres ligne 65, vous pourrez modifier les filtres des offres recherchées.
-> une fois que le script a candidaté, il va sauvegarder l'id de l'offre pour éviter de re-candidater dessus dans le fichier : postulats.json