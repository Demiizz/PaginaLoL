/* =========================================================
   schedule.js — Generación y edición del calendario
   ---------------------------------------------------------
   El calendario de un grupo es un objeto:
     { teams: [...], roundsCount: N, matches: [ {id,t1,t2,round,time}, ... ] }

   Cada PARTIDO es una entidad independiente con:
     - id     → estable, asignado una sola vez (nunca se reutiliza ni cambia).
                Es lo que usan results{} para no perder el resultado cargado
                aunque el admin edite el partido después.
     - t1, t2 → nombres de los equipos (editables a mano).
     - round  → número de jornada a la que pertenece (editable: así se
                "mueve" un partido de una jornada a otra).
     - time   → hora/fecha libre de ESE partido puntual (ej "Sábado 20:00hs").

   "Generar calendario" arma este objeto automáticamente con un round-robin
   equilibrado (soporta cualquier cantidad de equipos, con "descanso"
   rotativo si es impar). Después, el admin puede:
     - Cambiar qué equipos juegan en un partido (selects).
     - Mover un partido a otra jornada (select de jornada).
     - Agregar partidos sueltos o jornadas nuevas.
     - Eliminar partidos.
   Todo eso sin afectar los resultados de los demás partidos, porque cada
   uno vive y se identifica por su propio id.
   ========================================================= */

const BYE = null;

/**
 * Genera un calendario "round robin" de ida para una lista de equipos
 * (cualquier cantidad). Devuelve un arreglo de jornadas, cada una con los
 * partidos [ [t1,t2], ... ] de esa jornada (si la cantidad de equipos es
 * impar, cada jornada tiene un partido menos porque un equipo descansa).
 * Es la base automática; después se puede editar a mano libremente.
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

/** Arma el calendario de UN grupo: aplana el round-robin en partidos
 *  individuales, cada uno con id estable y su jornada (round) asignada. */
function buildGroupSchedule(group, teams) {
  const rounds = roundRobin(teams);
  const matches = [];
  let counter = 0;
  rounds.forEach((pairs, roundIndex) => {
    pairs.forEach(([t1, t2]) => {
      matches.push({ id: group + "-m" + counter, t1, t2, round: roundIndex, time: "" });
      counter++;
    });
  });
  return { teams: [...teams], roundsCount: rounds.length, matches, nextMatchNum: counter };
}

/** Genera el calendario completo (grupo A y grupo B) a partir de los grupos ya sorteados */
function generateFullSchedule(groups) {
  return {
    A: buildGroupSchedule("A", groups.A),
    B: buildGroupSchedule("B", groups.B),
  };
}

/** Clave única para identificar un partido dentro de results{}. Usa el id
 *  ESTABLE del partido, así que mover/editar el partido no pierde su resultado. */
function matchKey(group, matchId) {
  return group + "-" + matchId;
}

/** Partidos de una jornada puntual de un grupo (mismas referencias de objeto:
 *  editar un campo de un partido devuelto acá modifica el calendario real). */
function matchesInRound(groupSchedule, roundIndex) {
  return groupSchedule.matches.filter((m) => m.round === roundIndex);
}

/** Equipos del grupo que no tienen ningún partido cargado en esa jornada
 *  (con edición manual puede haber más de uno, o ninguno). */
function teamsRestingInRound(groupSchedule, roundIndex) {
  const present = new Set();
  matchesInRound(groupSchedule, roundIndex).forEach((m) => { present.add(m.t1); present.add(m.t2); });
  return groupSchedule.teams.filter((t) => !present.has(t));
}

/** Genera el próximo id de partido único para un grupo (no se reutilizan). */
function nextMatchId(groupSchedule, group) {
  const n = groupSchedule.nextMatchNum != null ? groupSchedule.nextMatchNum : groupSchedule.matches.length;
  groupSchedule.nextMatchNum = n + 1;
  return group + "-m" + n;
}
