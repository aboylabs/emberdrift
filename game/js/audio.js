/* Emberdrift — ED.audio
 * Semua suara disintesis dengan WebAudio, tanpa aset eksternal.
 * init() dipanggil pada gesture pertama (klik / tombol). Semua method
 * aman dipanggil sebelum init (no-op) dan tidak pernah throw.
 */
(function () {
  'use strict';
  var ED = window.ED = window.ED || {};

  var ctx = null;        // AudioContext
  var master = null;     // GainNode utama
  var muted = false;
  var noiseBuf = null;

  function ensureCtx() {
    if (ctx) {
      if (ctx.state === 'suspended') ctx.resume();
      return ctx;
    }
    var AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return null;
    try {
      ctx = new AC();
      master = ctx.createGain();
      master.gain.value = muted ? 0 : 0.45;
      master.connect(ctx.destination);
      // Buffer noise putih sekali pakai untuk whoosh / ledakan.
      var len = ctx.sampleRate * 0.5;
      noiseBuf = ctx.createBuffer(1, len, ctx.sampleRate);
      var d = noiseBuf.getChannelData(0);
      for (var i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
    } catch (e) { ctx = null; }
    return ctx;
  }

  // Nada oscillator sederhana dengan envelope attack/decay.
  // opts: {type, vol, slideTo, delay, attack}
  function tone(freq, dur, opts) {
    if (!ensureCtx()) return;
    opts = opts || {};
    try {
      var t0 = ctx.currentTime + (opts.delay || 0);
      var osc = ctx.createOscillator();
      var g = ctx.createGain();
      osc.type = opts.type || 'sine';
      osc.frequency.setValueAtTime(Math.max(1, freq), t0);
      if (opts.slideTo) {
        osc.frequency.exponentialRampToValueAtTime(Math.max(1, opts.slideTo), t0 + dur);
      }
      var vol = opts.vol != null ? opts.vol : 0.5;
      var atk = opts.attack || 0.005;
      g.gain.setValueAtTime(0.0001, t0);
      g.gain.exponentialRampToValueAtTime(vol, t0 + atk);
      g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
      osc.connect(g); g.connect(master);
      osc.start(t0); osc.stop(t0 + dur + 0.05);
    } catch (e) { /* abaikan kegagalan audio */ }
  }

  // Semburan noise dengan bandpass filter (whoosh / ledakan).
  function noise(dur, opts) {
    if (!ensureCtx()) return;
    opts = opts || {};
    try {
      var t0 = ctx.currentTime + (opts.delay || 0);
      var src = ctx.createBufferSource();
      src.buffer = noiseBuf; src.loop = true;
      var bp = ctx.createBiquadFilter();
      bp.type = 'bandpass';
      bp.frequency.setValueAtTime(opts.freq || 1200, t0);
      if (opts.slideTo) bp.frequency.exponentialRampToValueAtTime(opts.slideTo, t0 + dur);
      bp.Q.value = opts.q || 1.0;
      var g = ctx.createGain();
      var vol = opts.vol != null ? opts.vol : 0.4;
      g.gain.setValueAtTime(0.0001, t0);
      g.gain.exponentialRampToValueAtTime(vol, t0 + 0.01);
      g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
      src.connect(bp); bp.connect(g); g.connect(master);
      src.start(t0); src.stop(t0 + dur + 0.05);
    } catch (e) { /* abaikan */ }
  }

  // Tangga pentatonik mayor C: combo tinggi -> nada makin tinggi.
  var PENTA = [0, 2, 4, 7, 9, 12, 14, 16, 19, 21, 24];
  function comboFreq(combo) {
    var step = PENTA[Math.min(Math.max(combo || 1, 1), PENTA.length) - 1];
    return 523.25 * Math.pow(2, step / 12); // C5 naik tangga
  }

  ED.audio = {
    init: function () {
      ensureCtx();
      if (ED.state) ED.state.muted = muted;
    },

    setMuted: function (b) {
      muted = !!b;
      if (ED.state) ED.state.muted = muted;
      if (master) master.gain.value = muted ? 0 : 0.45;
    },
    isMuted: function () { return muted; },

    // Bara diambil: denting naik mengikuti combo (x1..x8).
    pickup: function (combo) {
      if (muted) return;
      var f = comboFreq(combo);
      tone(f, 0.16, { type: 'sine', vol: 0.5 });
      tone(f * 2, 0.12, { type: 'triangle', vol: 0.18, delay: 0.02 });
      if ((combo || 1) >= 4) tone(f * 1.5, 0.14, { type: 'sine', vol: 0.25, delay: 0.04 });
    },

    // Dash: whoosh naik + nada geser cepat.
    dash: function () {
      if (muted) return;
      noise(0.22, { freq: 500, slideTo: 3200, vol: 0.35, q: 1.4 });
      tone(220, 0.18, { type: 'sawtooth', vol: 0.12, slideTo: 660 });
    },

    // Kena wraith: dentuman rendah + dengung disonan.
    hit: function () {
      if (muted) return;
      tone(110, 0.28, { type: 'sawtooth', vol: 0.5, slideTo: 55 });
      tone(116.5, 0.28, { type: 'square', vol: 0.22, slideTo: 58 });
      noise(0.18, { freq: 300, slideTo: 120, vol: 0.35 });
    },

    // Wave clear: arpeggio naik C-E-G-C (delay pakai audio clock, bukan setTimeout).
    clear: function () {
      if (muted) return;
      var notes = [523.25, 659.25, 783.99, 1046.5];
      for (var i = 0; i < notes.length; i++) {
        tone(notes[i], 0.22, { type: 'triangle', vol: 0.4, delay: i * 0.09 });
      }
      tone(2093, 0.4, { type: 'sine', vol: 0.12, delay: 0.38 });
    },

    // Victory: fanfare C-E-G-C-E-G naik, dua oktaf.
    victory: function () {
      if (muted) return;
      var notes = [523.25, 659.25, 783.99, 1046.5, 783.99, 1046.5, 1318.5, 1568];
      for (var i = 0; i < notes.length; i++) {
        tone(notes[i], 0.3, { type: 'triangle', vol: 0.42, delay: i * 0.11 });
      }
      tone(261.6, 0.9, { type: 'sine', vol: 0.2, delay: 0.1 });
    },

    // Game over: turun minor A-F-D-A rendah.
    gameover: function () {
      if (muted) return;
      var notes = [440, 349.23, 293.66, 220];
      for (var i = 0; i < notes.length; i++) {
        tone(notes[i], 0.42, { type: 'sawtooth', vol: 0.22, delay: i * 0.22 });
      }
      tone(110, 1.0, { type: 'sine', vol: 0.25, delay: 0.2 });
    },

    // Klik UI / pilih kartu: blip pendek.
    click: function () {
      if (muted) return;
      tone(880, 0.07, { type: 'square', vol: 0.18 });
      tone(1320, 0.06, { type: 'sine', vol: 0.15, delay: 0.03 });
    }
  };
})();
