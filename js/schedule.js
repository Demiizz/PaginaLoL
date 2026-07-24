/* =========================================================
   schedule.js — Generación del calendario (todos contra todos)
   ========================================================= */

/**
 * Genera un calendario "round robin" de ida para una lista de
 * equipos (debe tener cantidad par). Devuelve un arreglo de
 * jornadas, cada una con 5 partidos [ [t1,t2], ... ].
 */
function roundRobin(list) {
  const n = list.length;
  let arr = [...list];
  const rounds = [];
  for (let r = 0; r < n - 1; r++) {
    const pairs = [];
    for (let i = 0; i < n / 2; i++) pairs.push([arr[i], arr[n - 1 - i]]);
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
