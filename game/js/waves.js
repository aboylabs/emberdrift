// waves.js — Emberdrift: 10 wave, portal, dan alur antar wave.
// Tiap wave: butuh bara = 8 + wave*2 (w1: 10, w10: 28). Saat target tercapai
// portal terbuka di tengah arena; terbang ke portal -> wave selesai.
// Bonus clear wave = 100 x nomor wave. Wave 10 selesai -> victory.
(function () {
  'use strict';

  var ED = window.ED;
  var util = ED.util;
  var C = ED.C;

  ED.waves = {
    defs: [],
    spawnTimer: 0,
    emberTimer: 0,
    portal: { x: C.W / 2, y: C.H / 2, r: 34, open: false, phase: 0 },

    // Bangun 10 config wave dari rumus kontrak.
    init: function () {
      this.defs = [];
      for (var w = 1; w <= C.WAVES_TOTAL; w++) {
        this.defs.push({
          wave: w,
          need: 8 + w * 2,
          spawnInterval: Math.max(0.5, 2.2 - w * 0.15),
          maxAlive: 4 + w
        });
      }
    },

    def: function (wave) {
      return this.defs[wave - 1];
    },

    start: function (w) {
      var d = this.def(w);
      ED.state.wave = w;
      ED.state.embersGot = 0;
      ED.state.embersNeed = d.need;
      ED.state.combo = 1;
      ED.state.comboTimer = 0;
      this.spawnTimer = 1.2;
      this.emberTimer = 0;
      this.portal.open = false;
      this.portal.phase = 0;
      ED.enemies.clear();
      ED.embers.clear();
      ED.enemies.spawnWave(w);
      ED.embers.spawn(d.need + 4);
      ED.hud.banner('WAVE ' + w + ' — Kumpulkan ' + d.need + ' bara');
      ED.hud.update();
    },

    openPortal: function () {
      this.portal.open = true;
      this.portal.phase = 0;
      ED.hud.banner('PORTAL TERBUKA — Terbang ke tengah!');
      ED.audio.clear();
      ED.fx.burst(this.portal.x, this.portal.y, C.PALETTE.PORTAL, 24);
    },

    update: function (dt) {
      var d = this.def(ED.state.wave);
      this.portal.phase += dt;

      // Spawn musuh berkala sampai batas hidup.
      this.spawnTimer -= dt;
      if (this.spawnTimer <= 0) {
        this.spawnTimer = d.spawnInterval;
        if (ED.enemies.list.length < d.maxAlive) {
          ED.enemies.spawnOne(ED.state.wave);
        }
      }

      // Jaga stok bara di arena: minimal need+2 tersisa (belum dipungut).
      this.emberTimer -= dt;
      if (this.emberTimer <= 0) {
        this.emberTimer = 1.5;
        var want = Math.max(0, (d.need + 2) - ED.state.embersGot - ED.embers.list.length);
        if (want > 0 && !this.portal.open) {
          ED.embers.spawn(Math.min(want, 4));
        }
      }

      // Portal: player masuk -> wave selesai.
      if (this.portal.open) {
        var p = ED.player;
        if (util.dist(p.x, p.y, this.portal.x, this.portal.y) < this.portal.r + p.r * 0.5) {
          this.clearWave();
        }
      }
    },

    clearWave: function () {
      var w = ED.state.wave;
      var bonus = 100 * w;
      ED.state.score += bonus;
      ED.fx.burst(this.portal.x, this.portal.y, C.PALETTE.PORTAL, 30);
      ED.fx.text(this.portal.x, this.portal.y - 44, 'WAVE ' + w + ' CLEAR  +' + bonus, C.PALETTE.PORTAL);
      this.portal.open = false;
      ED.enemies.clear();
      ED.embers.clear();

      if (w >= C.WAVES_TOTAL) {
        ED.main.victory();
      } else {
        ED.main.toUpgrade();
      }
    },

    render: function (ctx) {
      if (!this.portal.open) { return; }
      var pt = this.portal;
      var pulse = 1 + Math.sin(pt.phase * 3) * 0.08;

      // Cincin portal berputar.
      ctx.save();
      ctx.translate(pt.x, pt.y);
      ctx.globalCompositeOperation = 'lighter';
      var gr = ctx.createRadialGradient(0, 0, 4, 0, 0, pt.r * 1.8);
      gr.addColorStop(0, 'rgba(126, 240, 212, 0.5)');
      gr.addColorStop(0.6, 'rgba(126, 240, 212, 0.15)');
      gr.addColorStop(1, 'rgba(126, 240, 212, 0)');
      ctx.fillStyle = gr;
      ctx.beginPath();
      ctx.arc(0, 0, pt.r * 1.8 * pulse, 0, util.TAU);
      ctx.fill();
      ctx.globalCompositeOperation = 'source-over';

      ctx.strokeStyle = C.PALETTE.PORTAL;
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(0, 0, pt.r * pulse, 0, util.TAU);
      ctx.stroke();
      // Busur berputar (arah masuk).
      ctx.strokeStyle = 'rgba(245, 239, 224, 0.9)';
      ctx.lineWidth = 2;
      for (var i = 0; i < 3; i++) {
        var a0 = pt.phase * 1.5 + i * (util.TAU / 3);
        ctx.beginPath();
        ctx.arc(0, 0, pt.r * 0.7, a0, a0 + 0.9);
        ctx.stroke();
      }
      // Inti portal.
      ctx.fillStyle = 'rgba(126, 240, 212, 0.85)';
      ctx.beginPath();
      ctx.arc(0, 0, 10 + Math.sin(pt.phase * 4) * 2, 0, util.TAU);
      ctx.fill();
      ctx.restore();

      // Label.
      ctx.save();
      ctx.textAlign = 'center';
      ctx.font = 'bold 13px system-ui, sans-serif';
      ctx.fillStyle = C.PALETTE.PORTAL;
      ctx.fillText('PORTAL', pt.x, pt.y - pt.r - 12);
      ctx.restore();
    }
  };

  ED.waves.init();
})();
