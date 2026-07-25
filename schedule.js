/* =========================================================
   schedule.js — Generación del calendario (todos contra todos)
   ========================================================= */

/**
 * Genera un calendario "round robin" de ida para una lista de
 * equipos. Funciona con cantidad par o impar: si es impar, se
 * agrega un equipo "fantasma" (bye) y el equipo que le toca
 * enfrentarlo simplemente descansa esa jornada (queda con un
 * partido menos en esa ronda). Devuelve un arreglo de jornadas,
 * cada una con los partidos [ [t1,t2], ... ] de esa ronda.
 */
function roundRobin(list) {
  let arr = [...list];
  if (arr.length % 2 !== 0) arr.push(null); // bye: quien lo enfrenta, descansa
  const n = arr.length;
  const rounds = [];
  for (let r = 0; r < n - 1; r++) {
    const pairs = [];
    for (let i = 0; i < n / 2; i++) {
      const t1 = arr[i], t2 = arr[n - 1 - i];
      if (t1 !== null && t2 !== null) pairs.push([t1, t2]);
    }
    rounds.push(pairs);
    arr = [arr[0], arr[n - 1], ...arr.slice(1, n - 1)];
  }
  return rounds;
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
