/* =========================================================
   standings.js — Cálculo automático de la clasificación
   ---------------------------------------------------------
   La clasificación NUNCA se edita a mano: se recalcula siempre
   a partir de schedule + results. 3 puntos por victoria.
   Criterio de desempate: puntos > diferencia de juegos > PG.
   ========================================================= */

/**
 * Calcula la tabla de posiciones de un grupo.
 * @param {string[]} teams Nombres de los 10 equipos del grupo
 * @param {Array} rounds Jornadas del grupo (schedule.A o schedule.B)
 * @param {Object} results Objeto global de resultados { "A-0-0": {score1,score2} }
 * @param {string} groupLetter "A" o "B"
 */
function computeStandings(teams, rounds, results, groupLetter) {
  const table = {};
  teams.forEach((t) => {
    table[t] = { team: t, pj: 0, pg: 0, pp: 0, gf: 0, gc: 0, pts: 0 };
  });

  rounds.forEach((pairs, roundIndex) => {
    pairs.forEach((pair, matchIndex) => {
      const key = matchKey(groupLetter, roundIndex, matchIndex);
      const res = results[key];
      if (!res) return; // partido pendiente, no cuenta todavía
      const [t1, t2] = pair;
      const s1 = Number(res.score1);
      const s2 = Number(res.score2);
      if (Number.isNaN(s1) || Number.isNaN(s2) || s1 === s2) return; // resultado incompleto/invalido

      table[t1].pj++; table[t2].pj++;
      table[t1].gf += s1; table[t1].gc += s2;
      table[t2].gf += s2; table[t2].gc += s1;

      if (s1 > s2) {
        table[t1].pg++; table[t1].pts += 3;
        table[t2].pp++;
      } else {
        table[t2].pg++; table[t2].pts += 3;
        table[t1].pp++;
      }
    });
  });

  const rows = Object.values(table).sort((a, b) => {
    if (b.pts !== a.pts) return b.pts - a.pts;
    const diffA = a.gf - a.gc;
    const diffB = b.gf - b.gc;
    if (diffB !== diffA) return diffB - diffA;
    return b.pg - a.pg;
  });

  rows.forEach((row, i) => { row.pos = i + 1; row.classified = i < 4; });
  return rows;
}

/** Devuelve si el resultado de un partido ya fue cargado */
function isMatchPlayed(results, group, roundIndex, matchIndex) {
  const res = results[matchKey(group, roundIndex, matchIndex)];
  return !!res && Number(res.score1) !== Number(res.score2) &&
    !Number.isNaN(Number(res.score1)) && !Number.isNaN(Number(res.score2));
}
