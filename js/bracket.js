/* =========================================================
   bracket.js — Fase final (Top 8) totalmente automática
   ---------------------------------------------------------
   No hay selección manual: se toman los 4 primeros de cada
   grupo (según standings.js) y se cruzan así:
     A1 vs B4
     A2 vs B3
     B1 vs A4
     B2 vs A3
   Al elegir un ganador en cuartos, avanza solo a semifinal,
   y así hasta la final / campeón.
   ========================================================= */

/** Arma el bracket inicial a partir de las clasificaciones ya calculadas */
function buildBracketFromStandings(standingsA, standingsB) {
  const a = standingsA.filter((r) => r.classified).map((r) => r.team);
  const b = standingsB.filter((r) => r.classified).map((r) => r.team);
  if (a.length < 4 || b.length < 4) return null;

  const qf = [
    [a[0], b[3]], // A1 vs B4
    [a[1], b[2]], // A2 vs B3
    [b[0], a[3]], // B1 vs A4
    [b[1], a[2]], // B2 vs A3
  ];

  return {
    qf: qf,
    winners: { qf: [null, null, null, null], sf: [null, null], final: null },
    scores: {}, // { "qf-0": {score1,score2}, "sf-0":..., "final":... }
  };
}

/** Devuelve los enfrentamientos de semifinal según los ganadores de cuartos */
function getSemifinalPairs(bracket) {
  return [
    [bracket.winners.qf[0], bracket.winners.qf[1]],
    [bracket.winners.qf[2], bracket.winners.qf[3]],
  ];
}

/** Devuelve el enfrentamiento de la final según los ganadores de semifinal */
function getFinalPair(bracket) {
  return [bracket.winners.sf[0], bracket.winners.sf[1]];
}

/**
 * Registra el ganador (y opcionalmente el marcador) de un partido de bracket,
 * limpiando las rondas siguientes si correspondía recalcular.
 */
function setBracketWinner(bracket, round, matchIndex, team, score1, score2) {
  const key = round === "final" ? "final" : round + "-" + matchIndex;
  if (score1 !== undefined && score2 !== undefined) {
    bracket.scores[key] = { score1, score2 };
  }
  if (round === "qf") {
    bracket.winners.qf[matchIndex] = team;
    bracket.winners.sf = [null, null];
    bracket.winners.final = null;
  } else if (round === "sf") {
    bracket.winners.sf[matchIndex] = team;
    bracket.winners.final = null;
  } else if (round === "final") {
    bracket.winners.final = team;
  }
}
