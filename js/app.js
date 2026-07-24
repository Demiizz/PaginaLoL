/* =========================================================
   app.js — Lógica de la página pública (SOLO LECTURA)
   ---------------------------------------------------------
   Lee el torneo (data.json o localStorage de respaldo) y
   pinta grupos, calendario, clasificación y bracket.
   No hay ningún botón que modifique datos en esta página.
   ========================================================= */

let publicData = null;
let scheduleView = { group: "A", round: 0 };

function escapeHtml(str) {
  const d = document.createElement("div");
  d.textContent = str;
  return d.innerHTML;
}

/* ---------- Menú móvil ---------- */
document.getElementById("navToggle").addEventListener("click", () => {
  document.getElementById("navLinks").classList.toggle("open");
});
document.querySelectorAll(".nav-links a").forEach((a) => {
  a.addEventListener("click", () => document.getElementById("navLinks").classList.remove("open"));
});

/* ---------- Carga inicial ---------- */
(async function init() {
  publicData = await loadTournamentPublic();
  renderGroups();
  renderSchedule();
  renderStandings();
  renderBracket();
})();

/* ---------- Grupos ---------- */
function renderGroups() {
  const wrap = document.getElementById("groupsWrap");
  if (!publicData.groups) {
    wrap.innerHTML = '<div class="empty-state">El sorteo todavía no se realizó. Volvé a consultar más tarde.</div>';
    return;
  }
  wrap.innerHTML = '<div class="groups-grid">' +
    ["A", "B"].map((g) => renderGroupCard(g)).join("") +
    "</div>";
}

function renderGroupCard(group) {
  const teams = publicData.groups[group];
  const items = teams.map((name, i) =>
    '<li><span class="idx">' + (i + 1) + '</span><span>' + escapeHtml(name) + "</span></li>"
  ).join("");
  return '<div class="group-card ' + group + '">' +
    '<div class="gc-head">Grupo ' + group + '</div>' +
    '<ul class="group-list">' + items + "</ul>" +
    "</div>";
}

/* ---------- Calendario ---------- */
function renderSchedule() {
  const wrap = document.getElementById("scheduleWrap");
  if (!publicData.schedule) {
    wrap.innerHTML = '<div class="empty-state">El calendario se publicará apenas se complete el sorteo.</div>';
    return;
  }

  const rounds = publicData.schedule[scheduleView.group];
  const groupToggle = ["A", "B"].map((g) =>
    '<button class="group-toggle-btn' + (scheduleView.group === g ? " active " + g : "") + '" data-group="' + g + '">Grupo ' + g + "</button>"
  ).join("");

  const roundTabs = rounds.map((_, i) =>
    '<button class="round-tab-btn' + (scheduleView.round === i ? " active" : "") + '" data-round="' + i + '">Jornada ' + (i + 1) + "</button>"
  ).join("");

  const matches = rounds[scheduleView.round].map((pair, matchIndex) =>
    renderMatchCard(scheduleView.group, scheduleView.round, matchIndex, pair)
  ).join("");

  wrap.innerHTML =
    '<div class="group-toggle">' + groupToggle + "</div>" +
    '<div class="round-tabs">' + roundTabs + "</div>" +
    '<div id="matchesList">' + matches + "</div>";

  wrap.querySelectorAll(".group-toggle-btn").forEach((btn) => {
    btn.addEventListener("click", () => {
      scheduleView.group = btn.dataset.group;
      scheduleView.round = 0;
      renderSchedule();
    });
  });
  wrap.querySelectorAll(".round-tab-btn").forEach((btn) => {
    btn.addEventListener("click", () => {
      scheduleView.round = Number(btn.dataset.round);
      renderSchedule();
    });
  });
}

function renderMatchCard(group, roundIndex, matchIndex, pair) {
  const [t1, t2] = pair;
  const key = matchKey(group, roundIndex, matchIndex);
  const res = publicData.results[key];
  const played = res && Number(res.score1) !== Number(res.score2) &&
    !Number.isNaN(Number(res.score1)) && !Number.isNaN(Number(res.score2));

  let center;
  let statusHtml;
  if (played) {
    center = '<span class="match-score">' + res.score1 + " - " + res.score2 + "</span>";
    statusHtml = '<span class="match-status done">Finalizado</span>';
  } else if (res && (res.score1 !== undefined || res.score2 !== undefined)) {
    center = '<span class="match-vs">VS</span>';
    statusHtml = '<span class="match-status live">En juego</span>';
  } else {
    center = '<span class="match-vs">VS</span>';
    statusHtml = '<span class="match-status pending">Pendiente</span>';
  }

  return '<div class="match-card ' + group + '">' +
    '<span class="match-team right">' + escapeHtml(t1) + "</span>" +
    '<span class="match-center">' + center + statusHtml + "</span>" +
    '<span class="match-team">' + escapeHtml(t2) + "</span>" +
    "</div>";
}

/* ---------- Clasificación ---------- */
function renderStandings() {
  const wrap = document.getElementById("standingsWrap");
  if (!publicData.schedule) {
    wrap.innerHTML = '<div class="empty-state">La clasificación se calcula automáticamente una vez que arranca la fase de grupos.</div>';
    return;
  }
  wrap.innerHTML = '<div class="groups-grid">' +
    ["A", "B"].map((g) => renderStandingsTable(g)).join("") +
    "</div>";
}

function renderStandingsTable(group) {
  const rows = computeStandings(publicData.groups[group], publicData.schedule[group], publicData.results, group);
  const body = rows.map((r) =>
    '<tr class="' + (r.classified ? "classified" : "") + '">' +
      "<td>" + r.pos + "</td>" +
      '<td class="team-cell">' + escapeHtml(r.team) + "</td>" +
      "<td>" + r.pj + "</td>" +
      "<td>" + r.pg + "</td>" +
      "<td>" + r.pp + "</td>" +
      '<td class="pts-cell">' + r.pts + "</td>" +
    "</tr>"
  ).join("");

  return '<div class="group-card ' + group + '">' +
    '<div class="gc-head">Grupo ' + group + '</div>' +
    '<table class="standings-table">' +
      "<thead><tr><th>Pos</th><th>Equipo</th><th>PJ</th><th>PG</th><th>PP</th><th>Pts</th></tr></thead>" +
      "<tbody>" + body + "</tbody>" +
    "</table>" +
  "</div>";
}

/* ---------- Bracket ---------- */
function renderBracket() {
  const wrap = document.getElementById("bracketWrap");
  if (!publicData.bracket) {
    wrap.innerHTML = '<div class="empty-state">La llave se arma automáticamente con el Top 4 de cada grupo al cerrar la fase de grupos.</div>';
    return;
  }

  const bracket = publicData.bracket;
  const sfPairs = getSemifinalPairs(bracket);
  const finalPair = getFinalPair(bracket);
  const champion = bracket.winners.final;

  let html = "";
  if (champion) {
    html += '<div class="champion-banner"><div class="cb-label">Campeón del torneo</div><div class="cb-name">' + escapeHtml(champion) + "</div></div>";
  }

  const rounds = [
    { label: "Cuartos de final", pairs: bracket.qf, key: "qf", winners: bracket.winners.qf },
    { label: "Semifinal", pairs: sfPairs, key: "sf", winners: bracket.winners.sf },
    { label: "Final", pairs: [finalPair], key: "final", winners: [champion] },
  ];

  html += '<div class="bracket-scroll"><div class="bracket">';
  rounds.forEach((r) => {
    html += '<div class="bracket-round"><div class="bracket-round-label">' + r.label + "</div>";
    r.pairs.forEach((pair, i) => {
      const winner = r.key === "final" ? champion : r.winners[i];
      const scoreKey = r.key === "final" ? "final" : r.key + "-" + i;
      const scores = bracket.scores ? bracket.scores[scoreKey] : null;
      html += '<div class="bracket-match">' +
        bracketTeamHtml(pair[0], winner, scores ? scores.score1 : null) +
        bracketTeamHtml(pair[1], winner, scores ? scores.score2 : null) +
      "</div>";
    });
    html += "</div>";
  });
  html += "</div></div>";

  wrap.innerHTML = html;
}

function bracketTeamHtml(team, winner, score) {
  if (!team) return '<div class="bracket-team tbd">Por definir</div>';
  const isWinner = winner === team;
  const hasWinner = !!winner;
  const cls = isWinner ? "winner" : hasWinner ? "loser" : "";
  const scoreHtml = score !== null && score !== undefined ? '<span class="bt-score">' + score + "</span>" : "";
  return '<div class="bracket-team ' + cls + '" title="' + escapeHtml(team) + '">' +
    '<span>' + escapeHtml(team) + "</span>" + scoreHtml +
  "</div>";
}
