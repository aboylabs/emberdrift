// util.js — Emberdrift: namespace global, konstanta, state, helper kecil.
// Semua modul lain menempel pada window.ED. Script klasik, tanpa import.
(function () {
  'use strict';

  var ED = window.ED || (window.ED = {});

  // ---- Konstanta -----------------------------------------------------------
  ED.C = {
    W: 960,
    H: 600,
    PALETTE: {
      BG: '#0d0b1e',
      BG2: '#171233',
      EMBER: '#ff9a3c',
      GOLD: '#ffd166',
      MOTH: '#fff3d6',
      WRAITH: '#8b7fa8',
      DANGER: '#ff5a5a',
      PORTAL: '#7ef0d4',
      TEXT: '#f5efe0',
      MUTED: '#9a93b8'
    },
    STATES: {
      TITLE: 'title',
      PLAYING: 'playing',
      UPGRADE: 'upgrade',
      PAUSED: 'paused',
      GAMEOVER: 'gameover',
      VICTORY: 'victory'
    },
    FLAME_DRAIN: 2.2,      // api berkurang per detik
    FLAME_MAX: 100,
    LIVES_START: 3,
    LIVES_MAX: 5,
    WAVES_TOTAL: 10,
    DASH_TIME: 0.18,       // durasi dash (detik)
    DASH_MULT: 3,          // pengali kecepatan saat dash
    DASH_CD: 2.5,          // cooldown dash (detik)
    HIT_INVULN: 1.2,       // kebal setelah kena hit (detik)
    LIFE_LOST_INVULN: 2,   // kebal setelah kehilangan nyawa (detik)
    LIFE_LOST_FLAME: 55,   // api kembali setelah kehilangan nyawa
    COMBO_WINDOW: 3,       // jendela combo (detik)
    COMBO_MAX: 8,
    BEST_KEY: 'emberdrift-best'
  };

  // ---- State permainan ------------------------------------------------------
  ED.state = {
    mode: ED.C.STATES.TITLE,
    wave: 1,
    score: 0,
    best: 0,
    lives: ED.C.LIVES_START,
    combo: 1,
    comboTimer: 0,
    embersGot: 0,
    embersNeed: 10,
    elapsed: 0,
    shakeMag: 0,
    muted: false
  };

  // Muat best score dari localStorage (aman bila storage diblokir).
  try {
    ED.state.best = parseInt(window.localStorage.getItem(ED.C.BEST_KEY), 10) || 0;
  } catch (e) {
    ED.state.best = 0;
  }

  ED.saveBest = function () {
    if (ED.state.score > ED.state.best) {
      ED.state.best = ED.state.score;
      try {
        window.localStorage.setItem(ED.C.BEST_KEY, String(ED.state.best));
      } catch (e) { /* abaikan: storage tidak tersedia */ }
    }
  };

  // ---- Helper ---------------------------------------------------------------
  ED.util = {
    TAU: Math.PI * 2,

    clamp: function (v, lo, hi) {
      return v < lo ? lo : (v > hi ? hi : v);
    },

    lerp: function (a, b, t) {
      return a + (b - a) * t;
    },

    rand: function (lo, hi) {
      return lo + Math.random() * (hi - lo);
    },

    randInt: function (lo, hi) {
      return Math.floor(ED.util.rand(lo, hi + 1));
    },

    pick: function (arr) {
      return arr[Math.floor(Math.random() * arr.length)];
    },

    // Acak tanpa pengulangan: kembalikan n elemen berbeda dari arr.
    sample: function (arr, n) {
      var copy = arr.slice();
      var out = [];
      while (copy.length && out.length < n) {
        out.push(copy.splice(Math.floor(Math.random() * copy.length), 1)[0]);
      }
      return out;
    },

    dist: function (x1, y1, x2, y2) {
      var dx = x2 - x1, dy = y2 - y1;
      return Math.sqrt(dx * dx + dy * dy);
    },

    // Sudut dari (x1,y1) ke (x2,y2).
    angleTo: function (x1, y1, x2, y2) {
      return Math.atan2(y2 - y1, x2 - x1);
    },

    // Format angka dengan pemisah ribuan (mis. 1.250).
    fmt: function (n) {
      return String(Math.floor(n)).replace(/\B(?=(\d{3})+(?!\d))/g, '.');
    }
  };
})();
