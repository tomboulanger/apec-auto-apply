# 🚀 Auto Apply APEC — Script d’automatisation d’envoi de candidatures

## 🧠 Description

Ce projet est un **script d’automatisation en JavaScript** permettant de **postuler automatiquement sur le site de l’APEC** à l’aide de ton **CV** et d’une **lettre de motivation**.

> 💼 L’objectif : simplifier et accélérer le processus de candidature en ligne  
> en automatisant les tâches répétitives tout en respectant la structure du site.

---

## ⚙️ Fonctionnement

Le script s’appuie sur **[Playwright](https://playwright.dev/)** pour automatiser la navigation et récupérer les informations nécessaires à la connexion (cookies, tokens, etc.).

### 🔁 Étapes principales :
1. 🔐 Connexion automatique à l’APEC via Playwright.  
2. 🍪 Récupération des cookies et jetons d’authentification.  
3. 🧠 Utilisation des **routes API internes** pour soumettre le CV et la lettre de motivation.  
4. 📨 Envoi automatique des candidatures selon les critères configurés (mots-clés, localisation, etc.).

---

## 💡 Pourquoi Playwright ?

> À l’origine, le script utilisait uniquement les **requêtes HTTP directes** vers les API internes.  
> Cependant, **l’APEC a renforcé ses mécanismes anti-bot** : les cookies et tokens changent désormais très fréquemment.  

Playwright permet donc :
- 🎭 De **simuler un vrai navigateur** (Chromium, Firefox, WebKit)  
- 🔁 De **gérer dynamiquement les cookies et tokens** à chaque session  
- ⚙️ De **contourner les changements de session** sans manipuler manuellement les entêtes réseau  

---

## 🧩 Stack technique

| Élément | Description |
|----------|--------------|
| **Langage** | JavaScript (Node.js) |
| **Automatisation navigateur** | Playwright |
| **Gestion des cookies** | Intégrée via le contexte Playwright |
| **Récupération des routes API** | Interception des requêtes réseau |
| **CV / Lettre de motivation** | Fichiers locaux injectés dans les requêtes |

---

## ⚠️ Avertissement

> ⚠️ **Projet à but expérimental et éducatif.**  
> Il montre comment interagir avec un site web de manière automatisée,  
> mais **n’est pas destiné à un usage abusif** ou à contourner les CGU de l’APEC.

L’automatisation de candidatures doit toujours être effectuée  
dans le **respect des conditions d’utilisation** et **des lois en vigueur**.

---

## 🛠️ Installation

```bash
yarn install
