// embers.js — Emberdrift: bara yang dikumpulkan.
// Bara biasa: +9 api, nilai 10. Bara besar: +18 api, nilai 25 (muncul ~15%).
// Magnet: bara dalam radius magnet player bergerak ke player; pickup saat
// jarak < player.r + r. Pickup berurutan dalam jendela combo menaikkan
// pengali x1..x8; kena hit mereset combo.
(function () {
  'use strict';

  var ED = window.ED;
  var util = ED.util;
  var C = ED.C;

  ED.embers = {
    list: [],

    clear: function () {
      this.list.length = 0;
    },

    // Buat n bara di posisi acak (tidak terlalu dekat dengan player).
    spawn: function (n) {
      for (var i = 0; i < n; i++) {
        var big = Math.random() < 0.15;
        var x, y, tries = 0;
        do {
          x = util.rand(40, C.W - 40);
          y = util.rand(50, C.H - 40);
          tries++;
        } while (tries < 8 && util.dist(x, y, ED.player.x, ED.player.y) < 120);
        this.list.push({
          x: x, y: y,
          r: big ? 10 : 7,
          value: big ? 25 : 10,
          flame: big ? 18 : 9,
          phase: util.rand(0, util.TAU),
          kind: big ? 'big' : 'normal'
        });
      }
    },

    update: function (dt) {
      var p = ED.player;
      var st = ED.state;

      for (var i = this.list.length - 1; i >= 0; i--) {
        var e = this.list[i];
        e.phase += dt * 3;
        var d = util.dist(e.x, e.y, p.x, p.y);

        // Magnet: bara dalam radius bergerak ke player.
        if (d < p.magnet && d > 1) {
          var pull = 420 * (1 - d / (p.magnet + 60));
          e.x += ((p.x - e.x) / d) * pull * dt;
          e.y += ((p.y - e.y) / d) * pull * dt;
        }

        // Pickup.
        if (d < p.r + e.r) {
          this.list.splice(i, 1);
          this.collect(e);
        }
      }

      // Combo memudar bila jendela habis.
      if (st.comboTimer > 0) {
        st.comboTimer -= dt;
        if (st.comboTimer <= 0) {
          st.combo = 1;
          st.comboTimer = 0;
        }
      }
    },

    collect: function (e) {
      var p = ED.player;
      var st = ED.state;

      // Combo naik bila pickup masih dalam jendela.
      if (st.comboTimer > 0) {
        st.combo = Math.min(C.COMBO_MAX, st.combo + 1);
      } else {
        st.combo = 1;
      }
      st.comboTimer = p.comboWindow;

      var gained = e.value * p.emberValue * st.combo;
      st.score += gained;
      p.addFlame(e.flame);
      st.embersGot += 1;

      ED.fx.burst(e.x, e.y, e.kind === 'big' ? C.PALETTE.GOLD : C.PALETTE.EMBER, e.kind === 'big' ? 16 : 8);
      ED.fx.text(e.x, e.y - 14, '+' + gained, C.PALETTE.GOLD);
      ED.audio.pickup(st.combo);

      // Portal terbuka saat target wave tercapai.
      if (st.embersGot >= st.embersNeed && !ED.waves.portal.open) {
        ED.waves.openPortal();
      }
    },

    render: function (ctx) {
      var P = C.PALETTE;
      for (var i = 0; i < this.list.length; i++) {
        var e = this.list[i];
        var bob = Math.sin(e.phase) * 2;
        var pulse = 0.75 + Math.sin(e.phase * 1.7) * 0.25;

        // Pendar.
        ctx.save();
        ctx.globalCompositeOperation = 'lighter';
        var gr = ctx.createRadialGradient(e.x, e.y + bob, 1, e.x, e.y + bob, e.r * 3);
        var col = e.kind === 'big' ? '255, 209, 102' : '255, 154, 60';
        gr.addColorStop(0, 'rgba(' + col + ', ' + (0.5 * pulse) + ')');
        gr.addColorStop(1, 'rgba(' + col + ', 0)');
        ctx.fillStyle = gr;
        ctx.beginPath();
        ctx.arc(e.x, e.y + bob, e.r * 3, 0, util.TAU);
        ctx.fill();
        ctx.restore();

        // Inti bara (belah ketupat kecil).
        ctx.save();
        ctx.translate(e.x, e.y + bob);
        ctx.rotate(Math.PI / 4);
        ctx.globalAlpha = pulse;
        ctx.fillStyle = e.kind === 'big' ? P.GOLD : P.EMBER;
        var s = e.r * 0.9;
        ctx.fillRect(-s / 2, -s / 2, s, s);
        ctx.fillStyle = 'rgba(255, 243, 214, 0.9)';
        var s2 = s * 0.45;
        ctx.fillRect(-s2 / 2, -s2 / 2, s2, s2);
        ctx.restore();
      }
    }
  };
})();
