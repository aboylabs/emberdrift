// main.js — Emberdrift: game loop, state machine, render, debug hooks.
// Urutan render: background gradient + mote melayang -> portal -> embers
// -> enemies -> player -> partikel -> teks melayang; shake via ctx.translate.
(function () {
  'use strict';

  var ED = window.ED;
  var util = ED.util;
  var C = ED.C;

  var canvas = null;
  var ctx = null;
  var lastTs = 0;
  var motes = [];

  // Mote latar: titik cahaya yang melayang pelan (hiasan, bukan gameplay).
  function initMotes() {
    motes = [];
    for (var i = 0; i < 60; i++) {
      motes.push({
        x: util.rand(0, C.W),
        y: util.rand(0, C.H),
        r: util.rand(0.8, 2.4),
        vy: util.rand(-12, -3),
        vx: util.rand(-6, 6),
        a: util.rand(0.15, 0.55),
        tw: util.rand(0, util.TAU)
      });
    }
  }

  function drawBackground(dt) {
    var P = C.PALETTE;
    var g = ctx.createLinearGradient(0, 0, 0, C.H);
    g.addColorStop(0, P.BG);
    g.addColorStop(1, P.BG2);
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, C.W, C.H);

    // Mote melayang.
    ctx.save();
    for (var i = 0; i < motes.length; i++) {
      var m = motes[i];
      m.y += m.vy * dt;
      m.x += m.vx * dt + Math.sin(m.tw) * 4 * dt;
      m.tw += dt;
      if (m.y < -4) { m.y = C.H + 4; m.x = util.rand(0, C.W); }
      if (m.x < -4) { m.x = C.W + 4; }
      if (m.x > C.W + 4) { m.x = -4; }
      ctx.globalAlpha = m.a * (0.7 + 0.3 * Math.sin(m.tw * 2));
      ctx.fillStyle = P.EMBER;
      ctx.beginPath();
      ctx.arc(m.x, m.y, m.r, 0, util.TAU);
      ctx.fill();
    }
    ctx.restore();

    // Vignette halus di tepi arena.
    var v = ctx.createRadialGradient(C.W / 2, C.H / 2, C.H * 0.42, C.W / 2, C.H / 2, C.H * 0.85);
    v.addColorStop(0, 'rgba(13, 11, 30, 0)');
    v.addColorStop(1, 'rgba(5, 4, 14, 0.55)');
    ctx.fillStyle = v;
    ctx.fillRect(0, 0, C.W, C.H);
  }

  ED.main = {
    start: function () {
      ED.audio.init();
      ED.audio.click();
      var st = ED.state;
      st.mode = C.STATES.PLAYING;
      st.score = 0;
      st.lives = C.LIVES_START;
      st.elapsed = 0;
      st.combo = 1;
      st.comboTimer = 0;
      ED.player.reset();
      ED.fx.clear();
      ED.hud.hideAllScreens();
      ED.hud.setHudVisible(true);
      ED.waves.start(1);
    },

    restart: function () {
      this.start();
    },

    togglePause: function () {
      var st = ED.state;
      if (st.mode === C.STATES.PLAYING) {
        st.mode = C.STATES.PAUSED;
        ED.hud.showPause(true);
      } else if (st.mode === C.STATES.PAUSED) {
        st.mode = C.STATES.PLAYING;
        ED.hud.showPause(false);
      }
    },

    // Api habis: nyawa -1, api kembali 55, kebal 2 dtk. Nyawa 0 -> game over.
    loseLife: function () {
      var st = ED.state;
      if (st.mode !== C.STATES.PLAYING) { return; }
      st.lives -= 1;
      ED.fx.shake(10);
      ED.fx.burst(ED.player.x, ED.player.y, C.PALETTE.DANGER, 24);
      if (st.lives <= 0) {
        st.lives = 0;
        this.gameOver();
      } else {
        ED.player.flame = C.LIFE_LOST_FLAME;
        ED.player.invuln = Math.max(ED.player.invuln, C.LIFE_LOST_INVULN);
        ED.hud.banner('Api padam! Nyawa tersisa: ' + st.lives);
        ED.audio.hit();
      }
      ED.hud.update();
    },

    gameOver: function () {
      var st = ED.state;
      st.mode = C.STATES.GAMEOVER;
      ED.fx.clear(); // hapus teks/partikel agar tidak menembus overlay
      ED.saveBest();
      ED.audio.gameover();
      ED.hud.showGameOver(st.score, st.best);
      ED.hud.update();
    },

    victory: function () {
      var st = ED.state;
      // Bonus victory: sisa api x 10.
      var bonus = Math.floor(ED.player.flame) * 10;
      st.score += bonus;
      st.mode = C.STATES.VICTORY;
      ED.fx.clear(); // hapus teks "WAVE 10 CLEAR" agar tidak menembus overlay
      ED.saveBest();
      ED.audio.victory();
      ED.fx.burst(ED.player.x, ED.player.y, C.PALETTE.GOLD, 40);
      ED.hud.showVictory(st.score, st.best);
      ED.hud.update();
    },

    // Masuk layar upgrade setelah wave selesai (bukan wave 10).
    toUpgrade: function () {
      var st = ED.state;
      st.mode = C.STATES.UPGRADE;
      ED.fx.clear(); // hapus teks "WAVE X CLEAR" agar tidak menembus overlay
      var choices = ED.upgrades.offer();
      this._pendingChoices = choices;
      ED.hud.showUpgrade(choices);
      ED.hud.update();
    },

    nextWave: function () {
      var st = ED.state;
      st.mode = C.STATES.PLAYING;
      ED.hud.hideAllScreens();
      ED.hud.setHudVisible(true);
      ED.waves.start(st.wave + 1);
    },

    _pendingChoices: null,

    update: function (dt) {
      var st = ED.state;
      if (st.mode !== C.STATES.PLAYING) { return; }
      st.elapsed += dt;

      // Tombol: Space / klik = dash. (P = pause dan M = mute ditangani
      // di loop() agar tidak tertukar dua kali dalam satu frame.)
      var input = ED.input;
      if (input.pressed('Space') || input.mouse.clicked) {
        ED.player.dash();
      }

      ED.player.update(dt);
      if (st.mode !== C.STATES.PLAYING) { return; } // loseLife bisa mengubah mode
      ED.embers.update(dt);
      ED.enemies.update(dt);
      ED.waves.update(dt);
      ED.fx.update(dt);
      ED.hud.update();
    },

    render: function (dt) {
      var st = ED.state;
      ctx.save();
      // Shake layar.
      if (st.shakeMag > 0) {
        var s = st.shakeMag;
        ctx.translate(util.rand(-s, s), util.rand(-s, s));
      }

      drawBackground(dt);
      ED.waves.render(ctx);
      ED.embers.render(ctx);
      ED.enemies.render(ctx);
      if (st.mode !== C.STATES.TITLE) {
        ED.player.draw(ctx);
      }
      ED.fx.render(ctx);
      ctx.restore();
    },

    loop: function (ts) {
      var dt = Math.min(0.05, (ts - lastTs) / 1000 || 0.016);
      lastTs = ts;

      var st = ED.state;
      var input = ED.input;

      // Input global (berlaku di semua mode).
      if (input.pressed('Enter')) {
        if (st.mode === C.STATES.TITLE || st.mode === C.STATES.GAMEOVER || st.mode === C.STATES.VICTORY) {
          ED.main.start();
        }
      }
      if (input.pressed('KeyP') && (st.mode === C.STATES.PLAYING || st.mode === C.STATES.PAUSED)) {
        ED.main.togglePause();
      }
      if (input.pressed('KeyM')) {
        ED.audio.setMuted(!st.muted);
      }
      // Pilih kartu upgrade dengan tombol 1/2/3.
      if (st.mode === C.STATES.UPGRADE && ED.main._pendingChoices) {
        if (input.pressed('Digit1')) { ED.upgrades.apply(ED.main._pendingChoices[0]); }
        else if (input.pressed('Digit2')) { ED.upgrades.apply(ED.main._pendingChoices[1]); }
        else if (input.pressed('Digit3')) { ED.upgrades.apply(ED.main._pendingChoices[2]); }
      }

      if (st.mode === C.STATES.PLAYING) {
        ED.main.update(dt);
      } else {
        // Di luar permainan: mote tetap bergerak, partikel memudar.
        ED.fx.update(dt);
      }

      ED.main.render(dt);
      input.endFrame();
      window.requestAnimationFrame(ED.main.loop);
    },

    boot: function () {
      canvas = document.getElementById('game');
      ctx = canvas.getContext('2d');
      initMotes();
      ED.input.init(canvas);
      ED.hud.init();
      // Tombol-tombol overlay.
      var bind = function (id, fn) {
        var el = document.getElementById(id);
        if (el) { el.addEventListener('click', fn); }
      };
      bind('btn-start', function () { ED.main.start(); });
      bind('btn-restart-over', function () { ED.main.start(); });
      bind('btn-restart-win', function () { ED.main.start(); });
      bind('btn-resume', function () { ED.main.togglePause(); });
      bind('btn-title', function () {
        ED.state.mode = C.STATES.TITLE;
        ED.hud.showTitle();
      });
      bind('btn-mute', function () {
        ED.audio.setMuted(!ED.state.muted);
        var b = document.getElementById('btn-mute');
        if (b) { b.textContent = ED.state.muted ? '🔇 Suara' : '🔊 Suara'; }
      });
      window.requestAnimationFrame(ED.main.loop);
    },

    // ---- Hook test saja (debug) -------------------------------------------
    // Dipakai untuk menguji alur tanpa bermain penuh. Tidak berpengaruh pada
    // permainan normal: tidak dipanggil dari kode game manapun.
    debug: {
      // Set api player (0..maxFlame).
      setFlame: function (n) {
        ED.player.flame = util.clamp(n, 0, ED.player.maxFlame);
      },
      // Lompat ke wave n (1..10); mereset arena wave itu.
      setWave: function (n) {
        ED.waves.start(util.clamp(Math.floor(n), 1, C.WAVES_TOTAL));
        ED.state.mode = C.STATES.PLAYING;
        ED.hud.hideAllScreens();
        ED.hud.setHudVisible(true);
      },
      // Beri n bara (seolah sudah dipungut) — memicu portal bila mencapai target.
      giveEmbers: function (n) {
        ED.state.embersGot += n;
        if (ED.state.embersGot >= ED.state.embersNeed && !ED.waves.portal.open) {
          ED.waves.openPortal();
        }
        ED.hud.update();
      },
      // Langsung ke layar victory (memberi bonus victory dari api saat ini).
      skipToVictory: function () {
        ED.state.wave = C.WAVES_TOTAL;
        ED.main.victory();
      }
    }
  };

  // Boot saat DOM siap.
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function () { ED.main.boot(); });
  } else {
    ED.main.boot();
  }
})();
