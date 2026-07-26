/* =========================================================
   schedule.js — Generación del calendario (todos contra todos)
   ---------------------------------------------------------
   Soporta CUALQUIER cantidad de equipos por grupo (par o impar).
   Con cantidad impar, cada jornada un equipo distinto descansa
   ("bye"): por eso hacen falta tantas jornadas como equipos,
   no una menos (con 11 equipos son 11 jornadas, cada equipo
   juega 10 partidos en total).
   ========================================================= */

const BYE = null;

/**
 * Genera un calendario "round robin" de ida para una lista de
 * equipos (cualquier cantidad). Devuelve un arreglo de jornadas,
 * cada una con los partidos [ [t1,t2], ... ] de esa jornada (si
 * la cantidad de equipos es impar, cada jornada tiene un partido
 * menos porque un equipo descansa).
 */
function roundRobin(list) {
  let arr = [...list];
  if (arr.length % 2 !== 0) arr = [...arr, BYE]; // equipo fantasma = "descansa"
  const n = arr.length;
  const rounds = [];
  for (let r = 0; r < n - 1; r++) {
    const pairs = [];
    for (let i = 0; i < n / 2; i++) {
      const t1 = arr[i];
      const t2 = arr[n - 1 - i];
      if (t1 !== BYE && t2 !== BYE) pairs.push([t1, t2]);
    }
    rounds.push(pairs);
    arr = [arr[0], arr[n - 1], ...arr.slice(1, n - 1)];
  }
  return rounds;
}

/** Devuelve el equipo que descansa en una jornada (o null si la cantidad de equipos es par) */
function getByeTeam(teams, roundPairs) {
  if (teams.length % 2 === 0) return null;
  const present = new Set();
  roundPairs.forEach(([t1, t2]) => { present.add(t1); present.add(t2); });
  return teams.find((t) => !present.has(t)) || null;
}

/** Genera el calendario completo (grupo A y grupo B) a partir de los grupos ya sorteados */
function generateFullSchedule(groups) {
  return {
    A: roundRobin(groups.A),
    B: roundRobin(groups.B),
  };
}

/** Clave única para identificar un partido dentro de results{} */
function matchKey(group, roundIndex, matchIndex) {
  return group + "-" + roundIndex + "-" + matchIndex;
}
