/* =========================================================
   draw.js — Motor del sorteo (animación + sonido)
   ---------------------------------------------------------
   Mantiene EXACTAMENTE la lógica original: 20 equipos, dos
   grupos de 10, revelación una por una alternando A/B, con
   "parpadeo" de nombres al azar antes de fijar el definitivo.
   No maneja el DOM directamente: admin.js le pasa callbacks
   para pintar cada paso, así queda reutilizable y testeable.
   ========================================================= */

function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

const Draw = {
  soundOn: true,
  audioCtx: null,
  teams: [],
  drawOrder: [],
  revealIndex: 0,
  slots: { A: Array(10).fill(null), B: Array(10).fill(null) },
  nextSlotIndex: { A: 0, B: 0 },
  drawing: false,

  /** Arranca un sorteo nuevo con los 20 equipos cargados */
  init(teams) {
    this.teams = teams;
    this.drawOrder = shuffle(teams);
    this.revealIndex = 0;
    this.slots = { A: Array(10).fill(null), B: Array(10).fill(null) };
    this.nextSlotIndex = { A: 0, B: 0 };
    this.drawing = false;
  },

  isFinished() {
    return this.revealIndex >= 20;
  },

  toggleSound() {
    this.soundOn = !this.soundOn;
    return this.soundOn;
  },

  playTick(final) {
    if (!this.soundOn) return;
    try {
      if (!this.audioCtx) this.audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      const osc = this.audioCtx.createOscillator();
      const gain = this.audioCtx.createGain();
      osc.type = "square";
      osc.frequency.value = final ? 620 : 340;
      gain.gain.setValueAtTime(0.06, this.audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.audioCtx.currentTime + (final ? 0.12 : 0.04));
      osc.connect(gain);
      gain.connect(this.audioCtx.destination);
      osc.start();
      osc.stop(this.audioCtx.currentTime + (final ? 0.12 : 0.04));
    } catch (e) { /* audio no disponible, seguimos en silencio */ }
  },

  /**
   * Revela el siguiente equipo con animación de parpadeo.
   * callbacks: { onFlicker(group, slotIdx, randomName), onLocked(group, slotIdx, finalName), onComplete() }
   */
  revealNext(callbacks) {
    if (this.drawing || this.isFinished()) return;
    this.drawing = true;

    const group = this.revealIndex % 2 === 0 ? "A" : "B";
    const slotIdx = this.nextSlotIndex[group];
    const finalName = this.drawOrder[this.revealIndex];
    const pool = this.teams;

    let f = 0;
    const flickersTotal = 60;
    const flickerMs = 40;

    const flickerInterval = setInterval(() => {
      const flickerName = pool[Math.floor(Math.random() * pool.length)];
      this.playTick(false);
      callbacks.onFlicker(group, slotIdx, flickerName);
      f++;
      if (f >= flickersTotal) {
        clearInterval(flickerInterval);
        this.slots[group][slotIdx] = { name: finalName, locked: true };
        this.playTick(true);
        callbacks.onLocked(group, slotIdx, finalName);
        this.nextSlotIndex[group]++;
        this.revealIndex++;
        this.drawing = false;

        if (this.isFinished()) {
          callbacks.onComplete();
        }
      }
    }, flickerMs);
  },

  /** Devuelve { A:[10 nombres], B:[10 nombres] } una vez terminado el sorteo */
  getGroups() {
    return {
      A: this.slots.A.map((s) => s.name),
      B: this.slots.B.map((s) => s.name),
    };
  },
};
