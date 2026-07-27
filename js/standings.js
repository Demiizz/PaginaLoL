/* =========================================================
   standings.js — Cálculo automático de la clasificación
   ---------------------------------------------------------
   La clasificación NUNCA se edita a mano: se recalcula siempre
   a partir de schedule + results. 3 puntos por victoria.
   Criterio de desempate: puntos > diferencia de juegos > PG.
   ========================================================= */

/**
 * Calcula la tabla de posiciones de un grupo.
 * @param {string[]} teams Nombres de los equipos del grupo
 * @param {Object} groupSchedule Calendario del grupo: { teams, roundsCount, matches }
 * @param {Object} results Objeto global de resultados { "A-A-m0": {score1,score2} }
 * @param {string} groupLetter "A" o "B"
 */
function computeStandings(teams, groupSchedule, results, groupLetter) {
  const table = {};
  teams.forEach((t) => {
    table[t] = { team: t, pj: 0, pg: 0, pp: 0, gf: 0, gc: 0, pts: 0 };
  });

  (groupSchedule.matches || []).forEach((match) => {
    const t1 = match.t1, t2 = match.t2;
    if (!t1 || !t2 || !table[t1] || !table[t2]) return; // partido incompleto o con equipo editado/eliminado
    const key = matchKey(groupLetter, match.id);
    const res = results[key];
    if (!res) return; // partido pendiente, no cuenta todavía
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
function isMatchPlayed(results, group, matchId) {
  const res = results[matchKey(group, matchId)];
  return !!res && Number(res.score1) !== Number(res.score2) &&
    !Number.isNaN(Number(res.score1)) && !Number.isNaN(Number(res.score2));
}
