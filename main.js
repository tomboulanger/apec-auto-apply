require("dotenv").config();
const { chromium } = require("playwright");
const fs = require("fs").promises;

const LOGIN = process.env.APEC_LOGIN || null;
const PASSWORD = process.env.APEC_PASSWORD || null;
const HEADLESS = (process.env.HEADLESS || "true") === "true";
const MANUAL_LOGIN_TIMEOUT = parseInt(process.env.MANUAL_LOGIN_TIMEOUT || "120000", 10);
const ID_LM = process.env.ID_LM;
const ID_CV = process.env.ID_CV;
const ID_CADRE = process.env.ID_CADRE;

const APEC_POST_URL = "https://www.apec.fr/cms/webservices/candidature/avecCompte";
const APEC_SEARCH_URL = "https://www.apec.fr/cms/webservices/rechercheOffre";
const postulatsFile = "postulats.json";

const basePayload = {
  idCadre: ID_CADRE,
  idCv: ID_CV,
  idProfil: null,
  idLm: null,
  stockerCvFichier: false,
  stockerLmFichier: null,
  lmTexteSaisie: null,
  nomCvFichier: null,
  nomLmFichier: null,
  cvPieceJointe: null,
  lmPieceJointe: null,
  messageCadre: null,
  icIdNomFormationNature: 20009,
  icIdNomFormationDiscipline: 30016,
  icIdNomFormationNiveau: 20019,
  icDateObtentionFormation: "2024-12-31T23:00:00.000Z",
  icIdNomExperienceMetier: null,
  icIdNomExperienceFonction: null,
  icIdNomExperienceSecteur: "",
  icIdNomSouhaitFonction: 101809,
  icIdNomSouhaitMetier: 600042,
  icIdNomSouhaitSecteur: 101569,
  icIdNomSouhaitLieu: 564326,
};

// Fonctions utilitaires
function getTimestamp() {
  return new Date().toISOString();
}

async function loadPostulats() {
  try {
    const data = await fs.readFile(postulatsFile, "utf-8");
    return JSON.parse(data);
  } catch {
    return [];
  }
}

async function savePostulats(postulats) {
  await fs.writeFile(postulatsFile, JSON.stringify(postulats, null, 2), "utf-8");
}

function cookiesArrayToHeader(cookies) {
  return cookies.map((c) => `${c.name}=${c.value}`).join("; ");
}

async function fetchAllOffres(cookieHeader) {
  const headers = {
    Accept: "application/json, text/plain, */*",
    "Content-Type": "application/json",
    Origin: "https://www.apec.fr",
    "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36",
    Cookie: cookieHeader,
  };

  const range = 100;
  let startIndex = 0;
  let totalCount = null;
  let allOffers = [];

  do {
    const body = {
      lieux: [],
      typesContrat: ["101888"],
      typesConvention: ["143684", "143685", "143686", "143687", "143706"],
      typeClient: "CADRE",
      sorts: [{ type: "DATE", direction: "DESCENDING" }],
      pagination: { range, startIndex },
      activeFiltre: true,
      motsCles:
        "(JS OU REACT OU node OU angular OU python) ET NON (ADMINISTRATEUR OU EXPERT OU DEVOPS OU SECURITE OU CHEF OU RESPONSABLE OU PRODUCT OU MANAGER OU LEAD OU SYSTEME)",
      salaireMinimum: "35",
      salaireMaximum: "200",
    };

    console.log(`[${getTimestamp()}] Fetching offres: startIndex ${startIndex}`);
    const response = await fetch(APEC_SEARCH_URL, {
      method: "POST",
      headers,
      body: JSON.stringify(body),
    });

    const data = await response.json();

    if (totalCount === null) {
      totalCount = data.totalCount;
      console.log(`[${getTimestamp()}] Total offres à récupérer: ${totalCount}`);
    }

    allOffers = allOffers.concat(data.resultats);
    startIndex += range;
  } while (startIndex < totalCount);

  console.log(`[${getTimestamp()}] Nombre total d'offres récupérées: ${allOffers.length}`);
  return allOffers;
}

async function postCandidature(offer, cookieHeader, postulats) {
  const payload = {
    ...basePayload,
    idOffre: offer.id,
  };

  const headers = {
    "Content-Type": "application/json",
    Accept: "application/json, text/plain, */*",
    Origin: "https://www.apec.fr",
    Referer: "https://www.apec.fr/candidat/recherche-emploi/postuler-a-une-offre.html",
    "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36",
    Cookie: cookieHeader,
  };

  async function sendRequest(payloadToSend) {
    const response = await fetch(APEC_POST_URL, {
      method: "POST",
      headers,
      body: JSON.stringify(payloadToSend),
    });

    const text = await response.text();
    let json = null;
    try {
      json = JSON.parse(text);
    } catch (e) {}

    return { response, json: json || text };
  }

  try {
    let { response, json } = await sendRequest(payload);
    let responseBody = json;

    if (response.status === 400 && json && json.candidatureLM === "obligatoire") {
      console.log(`\x1b[33m[${getTimestamp()}] ⚠️  LM obligatoire pour : ${offer.intitule} chez ${offer.nomCommercial} - Retry avec idLm...\x1b[0m`);

      const payloadWithLM = {
        ...payload,
        idLm: parseInt(ID_LM, 10),
      };

      const retry = await sendRequest(payloadWithLM);
      response = retry.response;
      responseBody = retry.json;
    }

    if (!response.ok) {
      if (response.status === 400) {
        if (!postulats.includes(offer.id)) {
          postulats.push(offer.id);
          await savePostulats(postulats);
        }
        console.error(`\x1b[31m[${getTimestamp()}] ❌ [400] Mauvaise requête : ${offer.intitule} chez ${offer.nomCommercial} [${offer.id}]\x1b[0m`);
        console.error(`[${getTimestamp()}] Response body:`, responseBody);
        return;
      } else if (response.status === 401) {
        throw new Error(`[401] Non autorisé : vérifie tes cookies/session. Response: ${JSON.stringify(responseBody)}`);
      } else if (response.status === 403) {
        throw new Error(`[403] Accès refusé : droits insuffisants. Response: ${JSON.stringify(responseBody)}`);
      } else if (response.status === 404) {
        throw new Error(`[404] Offre introuvable. Response: ${JSON.stringify(responseBody)}`);
      } else {
        throw new Error(`[${response.status}] Erreur inattendue. Response: ${JSON.stringify(responseBody)}`);
      }
    }

    if (!postulats.includes(offer.id)) {
      postulats.push(offer.id);
      await savePostulats(postulats);
    }

    console.log(`\x1b[32m[${getTimestamp()}] ✅ Candidature envoyée : ${offer.nomCommercial} | ${offer.intitule} | ${offer.salaireTexte || "N/A"}\x1b[0m`);
    console.log(`[${getTimestamp()}] Response body:`, responseBody);
  } catch (e) {
    console.error(`\x1b[31m[${getTimestamp()}] ❌ Erreur lors de la candidature : ${e.message}\x1b[0m`);
  }
}

(async () => {
  const browser = await chromium.launch({
    headless: HEADLESS,
    args: ["--disable-blink-features=AutomationControlled"],
  });
  const context = await browser.newContext({
    userAgent: "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36",
    viewport: { width: 1920, height: 1080 },
    extraHTTPHeaders: {
      "Accept-Language": "fr-FR,fr;q=0.9,en-US;q=0.8,en;q=0.7",
    },
  });
  const page = await context.newPage();

  page.setDefaultTimeout(60000);
  page.setDefaultNavigationTimeout(60000);

  try {
    console.log(`[${getTimestamp()}] Navigation vers la page candidat...`);
    await page.goto("https://www.apec.fr/candidat.html", {
      waitUntil: "domcontentloaded",
      timeout: 60000,
    });
    await page.waitForTimeout(3000);

    try {
      await page.waitForSelector("#onetrust-accept-btn-handler", { timeout: 5000 });
      console.log(`[${getTimestamp()}] Bannière cookies détectée → acceptation...`);
      await page.click("#onetrust-accept-btn-handler");
      await page.waitForTimeout(2000);
    } catch (e) {
      console.log(`[${getTimestamp()}] Pas de bannière cookies détectée (ou déjà acceptée).`);
    }

    // Login automatique ou manuel
    if (LOGIN && PASSWORD) {
      console.log(`[${getTimestamp()}] Tentative de login automatique...`);
      try {
        await page.waitForSelector("a.nav-link-espace", { timeout: 10000 });
        await page.click("a.nav-link-espace");
        await page.waitForSelector("#emailid", { timeout: 10000 });
        await page.fill("#emailid", LOGIN);
        await page.fill("#password", PASSWORD);
        await page.click("button.popin-btn-primary");
        await page.waitForTimeout(8000);
        console.log(`[${getTimestamp()}] Connexion effectuée ou tentative terminée.`);
      } catch (e) {
        console.error(`[${getTimestamp()}] Erreur lors du login automatique : ${e.message}`);
        throw e;
      }
    } else {
      if (!HEADLESS) {
        console.log(`[${getTimestamp()}] Mode manuel : connecte-toi manuellement. Timeout = ${MANUAL_LOGIN_TIMEOUT / 1000}s`);
        await page.click("a.nav-link-espace");
        const start = Date.now();
        while (Date.now() - start < MANUAL_LOGIN_TIMEOUT) {
          const cookiesNow = await context.cookies();
          if (cookiesNow.some((c) => c.name.includes("apec_activity_cookie"))) {
            console.log(`[${getTimestamp()}] cookie apec_activity_cookie détecté → connexion réussie.`);
            break;
          }
          await new Promise((r) => setTimeout(r, 1000));
        }
      } else {
        console.log(`[${getTimestamp()}] [error] Headless=true mais aucun identifiant fourni → impossible de continuer.`);
        await browser.close();
        return;
      }
    }

    const cookies = await context.cookies();
    const cookieHeader = cookiesArrayToHeader(cookies);
    console.log(`[${getTimestamp()}] Cookies récupérés :`, cookies.map((c) => c.name).join(", "));
    const postulats = await loadPostulats();
    console.log(`[${getTimestamp()}] ${postulats.length} candidatures déjà envoyées`);
    const allOffers = await fetchAllOffres(cookieHeader);

    for (const offer of allOffers) {
      if (!postulats.includes(offer.id)) {
        await postCandidature(offer, cookieHeader, postulats);
        await new Promise((r) => setTimeout(r, 10000));
      } else {
        console.log(`[${getTimestamp()}] Offre déjà postulée: ${offer.id} - ${offer.intitule}`);
      }
    }

    console.log(`\x1b[32m[${getTimestamp()}] ✅ Traitement terminé !\x1b[0m`);
  } catch (err) {
    console.error(`\x1b[31m[${getTimestamp()}] [error] Exception : ${err}\x1b[0m`);
  } finally {
    await browser.close();
  }
})();
