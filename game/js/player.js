// player.js — Emberdrift: Pijar, ngengat lentera.
// Gerak: mengikuti kursor mouse (halus, dengan kecepatan maksimum) ATAU
// WASD / panah. Space / klik = dash. Api (flame) adalah nyawa sekaligus
// bahan bakar: terkuras 2,2/dtk, diisi dengan memungut bara.
(function () {
  'use strict';

  var ED = window.ED;
  var util = ED.util;
  var C = ED.C;

  ED.player = {
    x: C.W / 2,
    y: C.H / 2,
    r: 14,
    vx: 0,
    vy: 0,
    flame: C.FLAME_MAX,
    maxFlame: C.FLAME_MAX,
    dashCd: 0,
    dashCdMax: C.DASH_CD,
    dashTime: 0,
    invuln: 0,
    magnet: 90,
    emberValue: 1,
    comboWindow: C.COMBO_WINDOW,
    // Animasi sayap (bukan state permainan).
    wingPhase: 0,
    face: 1, // 1 = menghadap kanan, -1 = kiri

    reset: function () {
      this.x = C.W / 2;
      this.y = C.H / 2;
      this.vx = 0;
      this.vy = 0;
      this.flame = C.FLAME_MAX;
      this.maxFlame = C.FLAME_MAX;
      this.dashCd = 0;
      this.dashTime = 0;
      this.invuln = 0;
      this.magnet = 90;
      this.emberValue = 1;
      this.comboWindow = C.COMBO_WINDOW;
      this.wingPhase = 0;
      this.face = 1;
    },

    // Dash: burst cepat + kebal sebentar. Hanya bila cooldown habis.
    dash: function () {
      if (this.dashCd > 0 || ED.state.mode !== C.STATES.PLAYING) { return false; }
      this.dashTime = C.DASH_TIME;
      this.dashCd = this.dashCdMax;
      this.invuln = Math.max(this.invuln, C.DASH_TIME);
      ED.audio.dash();
      ED.fx.burst(this.x, this.y, C.PALETTE.GOLD, 10);
      return true;
    },

    // Kena hit: -dmg api, combo reset, kebal 1,2 dtk. Api 0 -> kehilangan nyawa.
    hit: function (dmg) {
      if (this.invuln > 0 || ED.state.mode !== C.STATES.PLAYING) { return; }
      this.flame -= dmg;
      ED.state.combo = 1;
      ED.state.comboTimer = 0;
      this.invuln = C.HIT_INVULN;
      ED.fx.shake(7);
      ED.fx.burst(this.x, this.y, C.PALETTE.DANGER, 16);
      ED.audio.hit();
      if (this.flame <= 0) {
        this.flame = 0;
        ED.main.loseLife();
      }
    },

    addFlame: function (n) {
      this.flame = util.clamp(this.flame + n, 0, this.maxFlame);
    },

    update: function (dt) {
      var input = ED.input;
      var speed = 300;
      var tx = 0, ty = 0;

      // --- Arah gerak -------------------------------------------------------
      if (input.usingMouse) {
        // Ikuti kursor: arah ke mouse, kecepatan proporsional jarak (halus).
        var dx = input.mouse.x - this.x;
        var dy = input.mouse.y - this.y;
        var d = Math.sqrt(dx * dx + dy * dy);
        if (d > 4) {
          var sp = Math.min(speed, d * 6);
          tx = (dx / d) * sp;
          ty = (dy / d) * sp;
        }
      } else {
        if (input.held('KeyA') || input.held('ArrowLeft')) { tx -= speed; }
        if (input.held('KeyD') || input.held('ArrowRight')) { tx += speed; }
        if (input.held('KeyW') || input.held('ArrowUp')) { ty -= speed; }
        if (input.held('KeyS') || input.held('ArrowDown')) { ty += speed; }
        if (tx !== 0 && ty !== 0) { tx *= 0.7071; ty *= 0.7071; }
      }

      // --- Dash --------------------------------------------------------------
      if (this.dashTime > 0) {
        this.dashTime -= dt;
        var m = Math.sqrt(tx * tx + ty * ty);
        if (m > 1) { tx = (tx / m) * speed * C.DASH_MULT; ty = (ty / m) * speed * C.DASH_MULT; }
        else if (this.vx !== 0 || this.vy !== 0) {
          var vm = Math.sqrt(this.vx * this.vx + this.vy * this.vy);
          tx = (this.vx / vm) * speed * C.DASH_MULT;
          ty = (this.vy / vm) * speed * C.DASH_MULT;
        } else {
          tx = speed * C.DASH_MULT * this.face; ty = 0;
        }
        // Jejak api saat dash.
        if (Math.random() < 0.7 && ED.fx.trail) {
          ED.fx.trail(this.x, this.y, C.PALETTE.EMBER);
        }
      }

      // Percepatan halus menuju kecepatan target.
      var k = 1 - Math.exp(-12 * dt);
      this.vx = util.lerp(this.vx, tx, k);
      this.vy = util.lerp(this.vy, ty, k);
      this.x = util.clamp(this.x + this.vx * dt, this.r, C.W - this.r);
      this.y = util.clamp(this.y + this.vy * dt, this.r, C.H - this.r);

      if (this.vx > 10) { this.face = 1; }
      else if (this.vx < -10) { this.face = -1; }

      // --- Timer --------------------------------------------------------------
      if (this.dashCd > 0) { this.dashCd -= dt; }
      if (this.invuln > 0) { this.invuln -= dt; }

      // --- Api terkuras -------------------------------------------------------
      this.flame -= C.FLAME_DRAIN * dt;
      if (this.flame <= 0) {
        this.flame = 0;
        ED.main.loseLife();
      }

      // --- Animasi ------------------------------------------------------------
      this.wingPhase += dt * (10 + Math.min(14, Math.abs(this.vx) / 30));

      // Cahaya api: percikan kecil sesekali.
      if (Math.random() < dt * 6 && ED.fx.trail) {
        ED.fx.trail(this.x, this.y + 6, C.PALETTE.GOLD);
      }
    },

    draw: function (ctx) {
      var P = C.PALETTE;
      var blink = this.invuln > 0 && Math.floor(this.invuln * 12) % 2 === 0;
      var glowR = 46 + Math.sin(this.wingPhase * 0.5) * 5 + (this.flame / this.maxFlame) * 14;

      ctx.save();
      if (blink) { ctx.globalAlpha = 0.35; }

      // Cahaya lentera (radial, mode lighter).
      ctx.save();
      ctx.globalCompositeOperation = 'lighter';
      var grad = ctx.createRadialGradient(this.x, this.y, 4, this.x, this.y, glowR);
      grad.addColorStop(0, 'rgba(255, 209, 102, 0.55)');
      grad.addColorStop(0.5, 'rgba(255, 154, 60, 0.22)');
      grad.addColorStop(1, 'rgba(255, 154, 60, 0)');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(this.x, this.y, glowR, 0, util.TAU);
      ctx.fill();
      ctx.restore();

      // Sayap (dua elips yang mengepak, digambar sebelum badan).
      var flap = Math.sin(this.wingPhase) * 0.55;
      ctx.fillStyle = 'rgba(255, 243, 214, 0.92)';
      ctx.strokeStyle = P.EMBER;
      ctx.lineWidth = 1.5;
      // Sayap atas (kiri-kanan relatif arah hadap).
      ctx.save();
      ctx.translate(this.x, this.y - 2);
      ctx.rotate(this.face * flap * 0.6);
      ctx.beginPath();
      ctx.ellipse(-this.face * 4, -8, 13, 7, this.face * -0.5, 0, util.TAU);
      ctx.fill();
      ctx.stroke();
      ctx.beginPath();
      ctx.ellipse(this.face * 4, -8, 13, 7, this.face * 0.5, 0, util.TAU);
      ctx.fill();
      ctx.stroke();
      ctx.restore();
      // Sayap bawah.
      ctx.save();
      ctx.translate(this.x, this.y + 2);
      ctx.rotate(this.face * flap * -0.4);
      ctx.beginPath();
      ctx.ellipse(-this.face * 3, 7, 9, 5, this.face * -0.4, 0, util.TAU);
      ctx.fill();
      ctx.beginPath();
      ctx.ellipse(this.face * 3, 7, 9, 5, this.face * 0.4, 0, util.TAU);
      ctx.fill();
      ctx.restore();

      // Badan ngengat.
      ctx.fillStyle = '#3a2c1e';
      ctx.beginPath();
      ctx.ellipse(this.x, this.y, 6, 11, 0, 0, util.TAU);
      ctx.fill();
      // Kepala + mata.
      ctx.fillStyle = '#241a12';
      ctx.beginPath();
      ctx.arc(this.x + this.face * 3, this.y - 10, 5, 0, util.TAU);
      ctx.fill();
      ctx.fillStyle = P.GOLD;
      ctx.beginPath();
      ctx.arc(this.x + this.face * 5, this.y - 11, 1.6, 0, util.TAU);
      ctx.arc(this.x + this.face * 1, this.y - 11, 1.6, 0, util.TAU);
      ctx.fill();
      // Antena.
      ctx.strokeStyle = P.MOTH;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(this.x + this.face * 2, this.y - 14);
      ctx.quadraticCurveTo(this.x + this.face * 8, this.y - 22, this.x + this.face * 12, this.y - 20);
      ctx.moveTo(this.x + this.face * 4, this.y - 14);
      ctx.quadraticCurveTo(this.x + this.face * 10, this.y - 20, this.x + this.face * 14, this.y - 16);
      ctx.stroke();
      // Api lentera di perut.
      var flameH = 5 + (this.flame / this.maxFlame) * 6;
      ctx.fillStyle = P.EMBER;
      ctx.beginPath();
      ctx.ellipse(this.x, this.y + 4, 3.4, flameH, 0, 0, util.TAU);
      ctx.fill();
      ctx.fillStyle = P.GOLD;
      ctx.beginPath();
      ctx.ellipse(this.x, this.y + 5, 1.8, flameH * 0.6, 0, 0, util.TAU);
      ctx.fill();

      ctx.restore();

      // Ring cooldown dash (tipis, di bawah player).
      if (this.dashCd > 0) {
        var frac = 1 - (this.dashCd / this.dashCdMax);
        ctx.strokeStyle = 'rgba(126, 240, 212, 0.7)';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.r + 7, -Math.PI / 2, -Math.PI / 2 + frac * util.TAU);
        ctx.stroke();
      }
    }
  };
})();
