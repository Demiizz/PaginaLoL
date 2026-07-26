/* =========================================================
   admin.js — Controlador del panel de administrador
   ---------------------------------------------------------
   Único lugar donde se puede escribir en el torneo. Todo se
   guarda en localStorage en cada cambio, y desde acá se
   exporta el data.json que alimenta al sitio público.
   ========================================================= */

const DEFAULT_TEAMS = [
  "ImNotCuteAnymore","Mi gente apretada","Espadas del Ocaso","Mamitas Club",
  "Bizcochitos de Biboo","Cuyos Tilteados","Tepigod","Destructores de tetas y qlos",
  "TTV (Travestis Traviesas Veracruzanas)","Six Or Seven Devil's (SSD)","Mondongos","Vanity",
  "Los Mas Penudos","taiwan forever","MINITAS A MI MD","LosPapusKarp_2.0",
  "Its Over Reborn","FF AL 15","La Minita es SUPPORT","T2","Drogos","Alopecios"
];

let data = getEmptyTournament(); // se reemplaza en boot() antes de dibujar nada
let resView = { group: "A", round: 0 };

const el = (id) => document.getElementById(id);
function escapeHtml(str) {
  const d = document.createElement("div");
  d.textContent = str;
  return d.innerHTML;
}

/** Cantidad mínima de equipos para poder armar 2 grupos con Top 4 clasificable cada uno. */
function isValidTeamCount(n) {
  return n >= 4;
}

/** Jornadas que necesita un grupo de "size" equipos (impar = una jornada más, por el descanso rotativo). */
function jornadasPara(size) {
  return size % 2 === 0 ? size - 1 : size;
}

/** Guarda siempre local (rápido, funciona offline) y además
 *  intenta sincronizar a la nube si hay key configurada. */
function persist() {
  saveTournamentLocal(data);
  syncToCloud();
}

async function syncToCloud() {
  if (!isCloudConfigured() || !getJsonbinMasterKey()) { updateCloudStatus("local"); return; }
  updateCloudStatus("syncing");
  const result = await saveTournamentCloud(data);
  updateCloudStatus(result.ok ? "synced" : "error");
}

function updateCloudStatus(state) {
  const badge = el("cloudStatus");
  if (!badge) return;
  const map = {
    local: { text: "Sin nube (solo local)", cls: "" },
    syncing: { text: "Sincronizando…", cls: "" },
    synced: { text: "☁️ Sincronizado", cls: "" },
    error: { text: "⚠️ Error al sincronizar", cls: "" },
    "no-config": { text: "Sin nube (falta Bin ID)", cls: "" },
  };
  badge.textContent = map[state] ? map[state].text : "Modo admin";
}

function renderCloudPanel() {
  const sub = el("cloudSub");
  const keyInput = el("jsonbinKeyInput");
  if (!isCloudConfigured()) {
    sub.textContent = "Todavía no configuraste JSONBIN_ID en js/config.js. Sin eso, esta sección no hace nada y el panel sigue funcionando solo con localStorage/export manual.";
    keyInput.disabled = true;
    updateCloudStatus("no-config");
    return;
  }
  keyInput.disabled = false;
  const key = getJsonbinMasterKey();
  if (key) {
    keyInput.value = key;
    sub.textContent = "Conectado a tu bin de JSONBin. Cada cambio se guarda acá y se sincroniza solo.";
    updateCloudStatus("synced");
  } else {
    sub.textContent = "Bin ID configurado, pero falta tu Master Key para poder escribir. Pegala abajo.";
    updateCloudStatus("local");
  }
}

el("saveKeyBtn").addEventListener("click", () => {
  const v = el("jsonbinKeyInput").value.trim();
  if (!v) { alert("Pegá tu Master Key primero."); return; }
  setJsonbinMasterKey(v);
  renderCloudPanel();
  syncToCloud();
});
el("clearKeyBtn").addEventListener("click", () => {
  clearJsonbinMasterKey();
  el("jsonbinKeyInput").value = "";
  renderCloudPanel();
});

/* ---------- Barra de pasos ---------- */
function renderSteps() {
  const steps = [
    { label: "Equipos", done: isValidTeamCount(data.teams.length) },
    { label: "Sorteo", done: !!data.groups },
    { label: "Resultados", done: !!data.schedule },
    { label: "Clasificación", done: !!data.schedule },
    { label: "Bracket", done: !!data.bracket },
    { label: "Publicar", done: false },
  ];
  el("stepsBar").innerHTML = steps.map((s) =>
    '<span class="admin-step ' + (s.done ? "done" : "") + '">' + s.label + (s.done ? " ✓" : "") + "</span>"
  ).join("");
}

/* ============================================================
   PASO 1 — Equipos
   ============================================================ */
const teamsInput = el("teamsInput");

function currentTeamsFromInput() {
  return teamsInput.value.split("\n").map((t) => t.trim()).filter(Boolean);
}

function updateTeamCount() {
  const t = currentTeamsFromInput();
  const count = el("teamCount");
  const valid = isValidTeamCount(t.length);
  let msg = t.length + " equipo" + (t.length === 1 ? "" : "s") + " cargado" + (t.length === 1 ? "" : "s");
  if (t.length > 0) {
    if (t.length < 4) {
      msg += " — cargá al menos 4 (2 por grupo)";
    } else {
      const sizeA = Math.ceil(t.length / 2);
      const sizeB = Math.floor(t.length / 2);
      if (sizeA === sizeB) {
        msg += " → " + sizeA + " por grupo, " + jornadasPara(sizeA) + " jornadas";
      } else {
        msg += " → Grupo A: " + sizeA + " (" + jornadasPara(sizeA) + " jornadas), Grupo B: " + sizeB + " (" + jornadasPara(sizeB) + " jornadas)";
      }
    }
  }
  count.textContent = msg;
  count.className = "count-line " + (valid ? "ok" : "bad");
  el("drawStartBtn").disabled = !valid;
}
teamsInput.addEventListener("input", updateTeamCount);

el("drawStartBtn").addEventListener("click", () => {
  const teams = currentTeamsFromInput();
  if (!isValidTeamCount(teams.length)) return;

  const hasProgress = !!data.groups;
  if (hasProgress) {
    const ok = confirm("Ya existe un sorteo (y posiblemente calendario/resultados/bracket). Empezar de nuevo los va a borrar. ¿Continuar?");
    if (!ok) return;
  }

  data = getEmptyTournament();
  data.teams = teams;
  persist();

  Draw.init(teams);
  el("panelTeams").style.display = "none";
  el("panelDraw").style.display = "block";
  el("panelResults").style.display = "none";
  el("panelStandings").style.display = "none";
  el("panelBracket").style.display = "none";
  el("genScheduleBtn").style.display = "none";
  el("revealBtn").style.display = "inline-block";
  el("revealBtn").disabled = false;
  el("drawStatus").textContent = "Quedan " + teams.length + " equipos por sortear.";
  renderDrawSlots();
  renderSteps();
});

el("editTeamsBtn").addEventListener("click", () => {
  el("panelTeams").style.display = "block";
  window.scrollTo({ top: el("panelTeams").offsetTop - 20, behavior: "smooth" });
});

/* ============================================================
   PASO 2b — Asignación manual de grupos (alternativa al sorteo)
   ---------------------------------------------------------
   Permite elegir a mano quién va en cada grupo, en vez de
   dejarlo al azar. Reusa los mismos slots visuales que el
   sorteo (ya bloqueados, sin animación) y el mismo data.groups,
   así el resto del flujo (calendario, resultados, bracket) no
   se entera de si el sorteo fue random o manual.
   ============================================================ */
function parseManualList(textareaEl) {
  return textareaEl.value.split("\n").map((t) => t.trim()).filter(Boolean);
}

/** Valida lo cargado en las dos cajas contra la lista de equipos y pinta el estado.
 *  Devuelve { A, B } si es válido, o null si falta corregir algo. */
function updateManualStatus() {
  const teams = currentTeamsFromInput();
  const a = parseManualList(el("manualGroupA"));
  const b = parseManualList(el("manualGroupB"));
  const combined = [...a, ...b];
  const statusEl = el("manualStatus");

  const counts = {};
  combined.forEach((t) => { counts[t] = (counts[t] || 0) + 1; });
  const dupes = Object.keys(counts).filter((t) => counts[t] > 1);
  const known = new Set(teams);
  const unknown = combined.filter((t) => !known.has(t));
  const missing = teams.filter((t) => !combined.includes(t));

  let msg = "Grupo A: " + a.length + " · Grupo B: " + b.length;
  let ok = true;

  if (a.length < 2 || b.length < 2) {
    msg += " — cada grupo necesita al menos 2 equipos";
    ok = false;
  }
  if (dupes.length) {
    msg += " — repetido: " + dupes.join(", ");
    ok = false;
  }
  if (unknown.length) {
    msg += " — no está en la lista de equipos: " + unknown.join(", ");
    ok = false;
  }
  if (missing.length) {
    msg += " — todavía falta ubicar: " + missing.join(", ");
    ok = false;
  }

  statusEl.textContent = msg;
  statusEl.className = "count-line " + (ok ? "ok" : "bad");
  el("manualConfirmBtn").disabled = !ok;
  return ok ? { A: a, B: b } : null;
}

/** Abre el panel manual. Si se pasan grupos existentes, los precarga
 *  (para editar un sorteo ya hecho); si no, reparte los equipos por mitad
 *  como punto de partida y el admin los reordena a gusto. */
function openManualPanel(prefillGroups) {
  el("panelTeams").style.display = "none";
  el("panelDraw").style.display = "none";
  el("panelManual").style.display = "block";

  let groupA, groupB;
  if (prefillGroups) {
    groupA = prefillGroups.A;
    groupB = prefillGroups.B;
  } else {
    const teams = currentTeamsFromInput();
    const sizeA = Math.ceil(teams.length / 2);
    groupA = teams.slice(0, sizeA);
    groupB = teams.slice(sizeA);
  }
  el("manualGroupA").value = groupA.join("\n");
  el("manualGroupB").value = groupB.join("\n");
  updateManualStatus();
  window.scrollTo({ top: el("panelManual").offsetTop - 20, behavior: "smooth" });
}

el("manualGroupA").addEventListener("input", updateManualStatus);
el("manualGroupB").addEventListener("input", updateManualStatus);

el("manualStartBtn").addEventListener("click", () => {
  const teams = currentTeamsFromInput();
  if (!isValidTeamCount(teams.length)) return;

  const hasProgress = !!data.groups;
  if (hasProgress) {
    const ok = confirm("Ya existe un sorteo (y posiblemente calendario/resultados/bracket). Elegir los grupos a mano los va a borrar. ¿Continuar?");
    if (!ok) return;
  }

  data = getEmptyTournament();
  data.teams = teams;
  persist();
  openManualPanel(null);
  renderSteps();
});

el("manualEditTeamsBtn").addEventListener("click", () => {
  el("panelManual").style.display = "none";
  el("panelTeams").style.display = "block";
  window.scrollTo({ top: el("panelTeams").offsetTop - 20, behavior: "smooth" });
});

el("editGroupsManualBtn").addEventListener("click", () => {
  openManualPanel(data.groups);
});

el("manualConfirmBtn").addEventListener("click", () => {
  const result = updateManualStatus();
  if (!result) return;

  data.groups = result;
  persist();

  el("panelManual").style.display = "none";
  el("panelTeams").style.display = "none";
  el("panelDraw").style.display = "block";
  el("revealBtn").style.display = "none";
  el("drawStatus").textContent = "¡Grupos completos!";
  ["A", "B"].forEach((g) => {
    const container = el("slots" + g);
    container.innerHTML = data.groups[g].map((name, i) => slotHtml(g, i, { name, locked: true })).join("");
  });
  el("genScheduleBtn").style.display = data.schedule ? "none" : "inline-block";
  renderSteps();
});

/* ============================================================
   PASO 2 — Sorteo en vivo
   ============================================================ */
function slotHtml(group, i, slotData) {
  const cls = "slot" + (slotData ? (slotData.locked ? " locked " + group + " pop" : " flicker") : "");
  const name = slotData ? escapeHtml(slotData.name) : "—";
  return '<div class="' + cls + '" id="slot-' + group + "-" + i + '">' +
    '<span class="slot-num">' + (i + 1) + '</span>' +
    '<span class="slot-name" title="' + name + '">' + name + "</span>" +
  "</div>";
}

function renderDrawSlots() {
  ["A", "B"].forEach((g) => {
    const container = el("slots" + g);
    container.innerHTML = "";
    for (let i = 0; i < Draw.slots[g].length; i++) {
      container.innerHTML += slotHtml(g, i, Draw.slots[g][i]);
    }
  });
}

el("revealBtn").addEventListener("click", () => {
  el("revealBtn").disabled = true;
  Draw.revealNext({
    onFlicker(group, slotIdx, name) {
      const slotEl = el("slot-" + group + "-" + slotIdx);
      slotEl.className = "slot flicker";
      slotEl.querySelector(".slot-name").textContent = name;
    },
    onLocked(group, slotIdx, name) {
      const slotEl = el("slot-" + group + "-" + slotIdx);
      slotEl.className = "slot locked " + group + " pop";
      slotEl.querySelector(".slot-name").textContent = name;
      slotEl.querySelector(".slot-name").title = name;
      el("revealBtn").disabled = false;
      const remaining = Draw.teams.length - Draw.revealIndex;
      el("drawStatus").textContent = remaining > 0 ? "Quedan " + remaining + " equipos por sortear." : "¡Grupos completos!";
    },
    onComplete() {
      data.groups = Draw.getGroups();
      persist();
      el("revealBtn").style.display = "none";
      el("genScheduleBtn").style.display = "inline-block";
      renderSteps();
    },
  });
});

el("muteBtn").addEventListener("click", () => {
  const on = Draw.toggleSound();
  el("muteBtn").textContent = on ? "🔊" : "🔇";
});

el("genScheduleBtn").addEventListener("click", () => {
  data.schedule = generateFullSchedule(data.groups);
  data.results = {};
  data.bracket = null;
  persist();
  el("genScheduleBtn").style.display = "none";
  el("panelResults").style.display = "block";
  el("panelStandings").style.display = "block";
  el("panelBracket").style.display = "block";
  resView = { group: "A", round: 0 };
  renderResults();
  renderStandingsAdmin();
  renderBracketPanel();
  renderSteps();
});

el("regenScheduleBtn").addEventListener("click", () => {
  if (!data.groups) return;
  const ok = confirm(
    "Esto vuelve a armar el calendario (Grupo A y B) usando los mismos equipos ya sorteados, con la lógica corregida (antes generaba partidos duplicados y equipos contra sí mismos si la cantidad por grupo era impar). " +
    "Los resultados y el bracket cargados se van a borrar. ¿Continuar?"
  );
  if (!ok) return;
  data.schedule = generateFullSchedule(data.groups);
  data.results = {};
  data.bracket = null;
  persist();
  resView = { group: "A", round: 0 };
  renderResults();
  renderStandingsAdmin();
  renderBracketPanel();
  renderSteps();
});

/* ============================================================
   PASO 3 — Resultados
   ============================================================ */
function renderResultsTabs() {
  el("resTabA").className = "tab" + (resView.group === "A" ? " active-A" : "");
  el("resTabB").className = "tab" + (resView.group === "B" ? " active-B" : "");

  const rounds = data.schedule[resView.group];
  el("resRoundTabs").innerHTML = rounds.map((_, i) =>
    '<button class="tab round-tab' + (resView.round === i ? " active" : "") + '" data-round="' + i + '">Jornada ' + (i + 1) + "</button>"
  ).join("");
  el("resRoundTabs").querySelectorAll("button").forEach((btn) => {
    btn.addEventListener("click", () => {
      resView.round = Number(btn.dataset.round);
      renderResults();
    });
  });
}

function renderResults() {
  renderResultsTabs();
  const rounds = data.schedule[resView.group][resView.round];
  const list = el("resultsList");
  list.innerHTML = "";

  const byeTeam = getByeTeam(data.groups[resView.group], rounds);
  if (byeTeam) {
    const notice = document.createElement("div");
    notice.className = "field-hint";
    notice.style.marginBottom = "10px";
    notice.textContent = "😴 Descansa esta jornada: " + byeTeam;
    list.appendChild(notice);
  }

  rounds.forEach((pair, matchIndex) => {
    const key = matchKey(resView.group, resView.round, matchIndex);
    const res = data.results[key] || {};
    const row = document.createElement("div");
    row.className = "result-row " + resView.group;
    row.innerHTML =
      '<span class="result-team right">' + escapeHtml(pair[0]) + "</span>" +
      '<input type="number" min="0" class="score1" value="' + (res.score1 ?? "") + '" />' +
      '<span class="result-vs">VS</span>' +
      '<input type="number" min="0" class="score2" value="' + (res.score2 ?? "") + '" />' +
      '<span class="result-team">' + escapeHtml(pair[1]) + "</span>" +
      '<button class="btn btn-secondary result-save">Guardar</button>';

    const s1 = row.querySelector(".score1");
    const s2 = row.querySelector(".score2");
    row.querySelector(".result-save").addEventListener("click", () => {
      const v1 = s1.value.trim();
      const v2 = s2.value.trim();
      if (v1 === "" || v2 === "") { alert("Cargá ambos marcadores."); return; }
      if (Number(v1) === Number(v2)) { alert("En LoL no hay empates: el marcador no puede ser igual."); return; }
      data.results[key] = { score1: Number(v1), score2: Number(v2) };
      persist();
      renderStandingsAdmin();
    });
    list.appendChild(row);
  });
}

el("resTabA").addEventListener("click", () => { resView = { group: "A", round: 0 }; renderResults(); });
el("resTabB").addEventListener("click", () => { resView = { group: "B", round: 0 }; renderResults(); });

/* ============================================================
   PASO 4 — Clasificación (solo lectura, automática)
   ============================================================ */
function renderStandingsAdmin() {
  const wrap = el("standingsAdminWrap");
  wrap.innerHTML = ["A", "B"].map((g) => {
    const rows = computeStandings(data.groups[g], data.schedule[g], data.results, g);
    const body = rows.map((r) =>
      '<tr class="' + (r.classified ? "classified" : "") + '">' +
        "<td>" + r.pos + "</td>" +
        '<td class="team-cell">' + escapeHtml(r.team) + "</td>" +
        "<td>" + r.pj + "</td><td>" + r.pg + "</td><td>" + r.pp + "</td>" +
        '<td class="pts-cell">' + r.pts + "</td>" +
      "</tr>"
    ).join("");
    return '<div class="group-card ' + g + '">' +
      '<div class="gc-head">Grupo ' + g + '</div>' +
      '<table class="standings-table"><thead><tr><th>Pos</th><th>Equipo</th><th>PJ</th><th>PG</th><th>PP</th><th>Pts</th></tr></thead>' +
      "<tbody>" + body + "</tbody></table></div>";
  }).join("");
}

/* ============================================================
   PASO 5 — Bracket (Top 8 automático)
   ============================================================ */
function renderBracketPanel() {
  if (data.bracket) {
    el("genBracketBtn").style.display = "none";
    el("rebuildBracketBtn").style.display = "inline-block";
    el("bracketNotice").textContent = "";
    renderBracketTree();
  } else {
    el("genBracketBtn").style.display = "inline-block";
    el("rebuildBracketBtn").style.display = "none";
    el("championBannerAdmin").style.display = "none";
    el("bracketAdminWrap").innerHTML = "";
    const standingsA = computeStandings(data.groups.A, data.schedule.A, data.results, "A");
    const standingsB = computeStandings(data.groups.B, data.schedule.B, data.results, "B");
    const ready = standingsA.filter((r) => r.classified).length === 4 && standingsB.filter((r) => r.classified).length === 4;
    el("bracketNotice").textContent = ready
      ? "Listo para generar con la clasificación actual."
      : "Se puede generar en cualquier momento: toma el Top 4 actual de cada grupo (aunque falten partidos).";
  }
}

function buildBracketNow() {
  const standingsA = computeStandings(data.groups.A, data.schedule.A, data.results, "A");
  const standingsB = computeStandings(data.groups.B, data.schedule.B, data.results, "B");
  const bracket = buildBracketFromStandings(standingsA, standingsB);
  if (!bracket) { alert("Todavía no hay 4 equipos definidos en algún grupo."); return; }
  data.bracket = bracket;
  persist();
  renderBracketPanel();
}

el("genBracketBtn").addEventListener("click", buildBracketNow);
el("rebuildBracketBtn").addEventListener("click", () => {
  const ok = confirm("Esto rearma el bracket desde cero con la clasificación actual y borra los avances ya elegidos. ¿Continuar?");
  if (!ok) return;
  buildBracketNow();
});

function bracketTeamButton(team, round, matchIndex, winner) {
  const btn = document.createElement("button");
  if (!team) {
    btn.className = "bracket-team tbd";
    btn.textContent = "Por definir";
    btn.disabled = true;
    return btn;
  }
  const isWinner = winner === team;
  const hasWinner = !!winner;
  btn.className = "bracket-team" + (isWinner ? " winner" : hasWinner ? " loser" : "");
  btn.title = team;
  btn.textContent = team;
  btn.addEventListener("click", () => {
    setBracketWinner(data.bracket, round, matchIndex, team);
    persist();
    renderBracketTree();
  });
  return btn;
}

function renderBracketTree() {
  const bracket = data.bracket;
  const wrap = el("bracketAdminWrap");
  wrap.innerHTML = "";

  const sfPairs = getSemifinalPairs(bracket);
  const finalPair = getFinalPair(bracket);
  const champion = bracket.winners.final;

  const rounds = [
    { label: "Cuartos de final", pairs: bracket.qf, key: "qf", winners: bracket.winners.qf },
    { label: "Semifinal", pairs: sfPairs, key: "sf", winners: bracket.winners.sf },
    { label: "Final", pairs: [finalPair], key: "final", winners: [champion] },
  ];

  const bracketDiv = document.createElement("div");
  bracketDiv.className = "bracket";

  rounds.forEach((r) => {
    const col = document.createElement("div");
    col.className = "bracket-round";
    const label = document.createElement("div");
    label.className = "bracket-round-label";
    label.textContent = r.label;
    col.appendChild(label);

    r.pairs.forEach((pair, i) => {
      const winner = r.key === "final" ? champion : r.winners[i];
      const matchBox = document.createElement("div");
      matchBox.className = "bracket-match";
      matchBox.appendChild(bracketTeamButton(pair[0], r.key, i, winner));
      matchBox.appendChild(bracketTeamButton(pair[1], r.key, i, winner));
      col.appendChild(matchBox);
    });
    bracketDiv.appendChild(col);
  });

  wrap.appendChild(bracketDiv);

  if (champion) {
    el("championBannerAdmin").style.display = "block";
    el("championBannerAdmin").innerHTML = '<div class="cb-label">Campeón del torneo</div><div class="cb-name">' + escapeHtml(champion) + "</div>";
  } else {
    el("championBannerAdmin").style.display = "none";
  }
}

/* ============================================================
   PASO 6 — Publicar / importar / reiniciar
   ============================================================ */
el("exportBtn").addEventListener("click", () => exportTournamentJSON(data));

el("importInput").addEventListener("change", (e) => {
  const file = e.target.files[0];
  if (!file) return;
  importTournamentJSON(file, (loaded) => {
    data = loaded;
    bootFromData();
    syncToCloud();
    alert("Datos importados correctamente.");
  });
  e.target.value = "";
});

el("resetAllBtn").addEventListener("click", async () => {
  const ok = confirm("Esto borra TODO el progreso del torneo (sorteo, calendario, resultados, bracket). ¿Confirmás?");
  if (!ok) return;
  clearTournamentLocal();
  data = getEmptyTournament();
  if (isCloudConfigured() && getJsonbinMasterKey()) {
    await saveTournamentCloud(data); // si no hacemos esto, al recargar volvería a traer los datos viejos de la nube
  }
  location.reload();
});

/* ============================================================
   Arranque: reconstruye la UI según el estado guardado
   ============================================================ */
function bootFromData() {
  teamsInput.value = data.teams.length > 0 ? data.teams.join("\n") : DEFAULT_TEAMS.join("\n");
  renderCloudPanel();
  updateTeamCount();
  renderSteps();

  if (data.groups) {
    // Ya hay un sorteo guardado: mostramos los slots ya bloqueados sin animación
    el("panelTeams").style.display = "none";
    el("panelDraw").style.display = "block";
    el("revealBtn").style.display = "none";
    el("drawStatus").textContent = "¡Grupos completos!";
    ["A", "B"].forEach((g) => {
      const container = el("slots" + g);
      container.innerHTML = data.groups[g].map((name, i) =>
        slotHtml(g, i, { name, locked: true })
      ).join("");
    });
    el("genScheduleBtn").style.display = data.schedule ? "none" : "inline-block";
  } else {
    el("panelTeams").style.display = "block";
    el("panelDraw").style.display = "none";
  }

  if (data.schedule) {
    el("panelResults").style.display = "block";
    el("panelStandings").style.display = "block";
    el("panelBracket").style.display = "block";
    resView = { group: "A", round: 0 };
    renderResults();
    renderStandingsAdmin();
    renderBracketPanel();
  } else {
    el("panelResults").style.display = "none";
    el("panelStandings").style.display = "none";
    el("panelBracket").style.display = "none";
  }
}

(async function boot() {
  if (isCloudConfigured() && getJsonbinMasterKey()) {
    const cloud = await loadTournamentCloud();
    data = cloud || loadTournamentLocal();
  } else {
    data = loadTournamentLocal();
  }
  bootFromData();
})();
