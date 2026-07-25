/* =========================================================
   data.js — Capa de datos compartida (sin backend)
   ---------------------------------------------------------
   Todo el estado del torneo vive en un solo objeto JS que se
   guarda en localStorage (para editar en vivo desde admin.html)
   y se puede EXPORTAR a un archivo data.json.

   Flujo real de publicación (sin servidor):
   1. El admin sortea, carga resultados, arma el bracket.
   2. El admin hace click en "Exportar data.json".
   3. Ese archivo se sube/reemplaza en el repo de GitHub Pages.
   4. index.html hace fetch('data.json') y lo muestra a cualquiera,
      sin depender del localStorage de cada visitante.

   Si no existe data.json todavía (primer uso), index.html cae
   a localStorage como respaldo, útil mientras probás en tu propio
   navegador antes de publicar.
   ========================================================= */

const STORAGE_KEY = "lolTournamentData";

/** Estructura vacía por defecto del torneo */
function getEmptyTournament() {
  return {
    version: 1,
    updatedAt: null,
    teams: [],           // lista cruda de nombres cargados en el sorteo (TEAM_COUNT)
    groups: null,        // { A: [10 nombres], B: [10 nombres] }
    schedule: null,      // { A: [ [ [t1,t2], ... ] x9 ], B: [...] }
    results: {},         // { "A-0-0": { score1, score2 } }
    bracket: null        // ver estructura en bracket.js
  };
}

/** Lee el torneo desde localStorage (uso interno del admin) */
function loadTournamentLocal() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return getEmptyTournament();
    const parsed = JSON.parse(raw);
    return Object.assign(getEmptyTournament(), parsed);
  } catch (e) {
    console.error("No se pudo leer el torneo guardado:", e);
    return getEmptyTournament();
  }
}

/** Guarda el torneo en localStorage */
function saveTournamentLocal(data) {
  data.updatedAt = new Date().toISOString();
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch (e) {
    console.error("No se pudo guardar el torneo:", e);
  }
}

/* =========================================================
   JSONBin.io — almacenamiento en la nube gratis
   ---------------------------------------------------------
   JSONBIN_ID viene de config.js (público). La Master Key solo
   se guarda en el localStorage del navegador de admin.html,
   nunca se sube al repo.
   ========================================================= */
const JSONBIN_KEY_STORAGE = "jsonbinMasterKey";
const JSONBIN_API = "https://api.jsonbin.io/v3/b/";

function isCloudConfigured() {
  return typeof JSONBIN_ID === "string" && JSONBIN_ID.trim() !== "";
}

function getJsonbinMasterKey() {
  return localStorage.getItem(JSONBIN_KEY_STORAGE) || "";
}
function setJsonbinMasterKey(key) {
  localStorage.setItem(JSONBIN_KEY_STORAGE, key.trim());
}
function clearJsonbinMasterKey() {
  localStorage.removeItem(JSONBIN_KEY_STORAGE);
}

/** Lee el torneo desde JSONBin. Devuelve null si no está configurado o falla. */
async function loadTournamentCloud() {
  if (!isCloudConfigured()) return null;
  try {
    const headers = {};
    const key = getJsonbinMasterKey();
    if (key) headers["X-Master-Key"] = key; // hace falta si el bin NO es público
    const res = await fetch(JSONBIN_API + JSONBIN_ID + "/latest", { headers, cache: "no-store" });
    if (!res.ok) return null;
    const json = await res.json();
    return Object.assign(getEmptyTournament(), json.record);
  } catch (e) {
    console.error("No se pudo leer JSONBin:", e);
    return null;
  }
}

/** Escribe el torneo en JSONBin (requiere Master Key guardada en admin.html) */
async function saveTournamentCloud(data) {
  if (!isCloudConfigured()) return { ok: false, reason: "no-config" };
  const key = getJsonbinMasterKey();
  if (!key) return { ok: false, reason: "no-key" };
  try {
    const res = await fetch(JSONBIN_API + JSONBIN_ID, {
      method: "PUT",
      headers: { "Content-Type": "application/json", "X-Master-Key": key },
      body: JSON.stringify(data),
    });
    if (!res.ok) return { ok: false, reason: "http-" + res.status };
    return { ok: true };
  } catch (e) {
    return { ok: false, reason: "network" };
  }
}

/**
 * Carga el torneo para la página PÚBLICA.
 * Orden de prioridad: JSONBin (si está configurado) → data.json
 * (respaldo publicado a mano) → localStorage (solo para pruebas
 * locales en el mismo navegador que usaste en admin.html).
 */
async function loadTournamentPublic() {
  const cloud = await loadTournamentCloud();
  if (cloud) return cloud;

  try {
    const res = await fetch("data.json", { cache: "no-store" });
    if (res.ok) {
      const parsed = await res.json();
      return Object.assign(getEmptyTournament(), parsed);
    }
  } catch (e) {
    /* data.json no existe todavía o falló el fetch (ej: abriendo el
       archivo con file:// en vez de un servidor). Caemos a localStorage. */
  }
  return loadTournamentLocal();
}

/** Dispara la descarga de data.json con el estado actual */
function exportTournamentJSON(data) {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "data.json";
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/** Permite importar un data.json existente al panel admin (continuar editando) */
function importTournamentJSON(file, onLoaded) {
  const reader = new FileReader();
  reader.onload = () => {
    try {
      const parsed = JSON.parse(reader.result);
      const data = Object.assign(getEmptyTournament(), parsed);
      saveTournamentLocal(data);
      onLoaded(data);
    } catch (e) {
      alert("El archivo no es un data.json válido.");
    }
  };
  reader.readAsText(file);
}

/** Borra todo el progreso guardado (reinicio total) */
function clearTournamentLocal() {
  localStorage.removeItem(STORAGE_KEY);
}
