// enemies.js — Emberdrift: wraith abu dan variannya.
// 'wraith'  : mengejar player, speed 40 + wave*4, dmg 14.
// 'fiend'   : cepat (90 + wave*5), gerak sinus menyamping, dmg 14 (wave 3+).
// 'brume'   : besar (r 26), lambat (25), dmg 22 (wave 6+).
// Tabrakan dengan player: player.hit(dmg) + musuh terpental sedikit.
(function () {
  'use strict';

  var ED = window.ED;
  var util = ED.util;
  var C = ED.C;

  function makeEnemy(type, wave) {
    // Spawn di tepi arena, jauh dari player.
    var side = util.randInt(0, 3);
    var x, y;
    if (side === 0) { x = util.rand(30, C.W - 30); y = 24; }
    else if (side === 1) { x = util.rand(30, C.W - 30); y = C.H - 24; }
    else if (side === 2) { x = 24; y = util.rand(30, C.H - 30); }
    else { x = C.W - 24; y = util.rand(30, C.H - 30); }

    var base = { x: x, y: y, vx: 0, vy: 0, type: type, hp: 1, phase: util.rand(0, util.TAU) };
    if (type === 'fiend') {
      base.r = 13;
      base.speed = 90 + wave * 5;
      base.dmg = 14;
    } else if (type === 'brume') {
      base.r = 26;
      base.speed = 25;
      base.dmg = 22;
    } else {
      base.r = 16;
      base.speed = 40 + wave * 4;
      base.dmg = 14;
    }
    return base;
  }

  ED.enemies = {
    list: [],

    clear: function () {
      this.list.length = 0;
    },

    // Spawn satu musuh sesuai wave; jenis dipilih dari peluang wave.
    spawnOne: function (wave) {
      var roll = Math.random();
      var type = 'wraith';
      if (wave >= 6 && roll < 0.18) {
        type = 'brume';
      } else if (wave >= 3 && roll < 0.45) {
        type = 'fiend';
      }
      this.list.push(makeEnemy(type, wave));
    },

    // Spawn awal wave: beberapa wraith langsung di arena.
    spawnWave: function (wave) {
      var n = Math.min(2 + wave, 8);
      for (var i = 0; i < n; i++) {
        this.spawnOne(wave);
      }
    },

    update: function (dt) {
      var p = ED.player;
      for (var i = this.list.length - 1; i >= 0; i--) {
        var e = this.list[i];
        e.phase += dt * 2;
        var dx = p.x - e.x;
        var dy = p.y - e.y;
        var d = Math.sqrt(dx * dx + dy * dy) || 1;
        var nx = dx / d, ny = dy / d;

        if (e.type === 'fiend') {
          // Gerak sinus: kejar player + goyangan tegak lurus.
          var px = -ny, py = nx;
          var sway = Math.sin(e.phase * 3) * 0.7;
          e.vx = (nx + px * sway) * e.speed;
          e.vy = (ny + py * sway) * e.speed;
        } else {
          e.vx = nx * e.speed;
          e.vy = ny * e.speed;
        }
        e.x += e.vx * dt;
        e.y += e.vy * dt;
        // Tetap di dalam arena.
        e.x = util.clamp(e.x, e.r, C.W - e.r);
        e.y = util.clamp(e.y, e.r, C.H - e.r);

        // Tabrakan dengan player.
        if (d < p.r + e.r - 2) {
          if (p.invuln <= 0 && p.dashTime <= 0) {
            p.hit(e.dmg);
          }
          // Terpental menjauhi player agar tidak menempel.
          var push = (p.r + e.r - d) + 6;
          e.x -= nx * push;
          e.y -= ny * push;
        }
      }
    },

    render: function (ctx) {
      var P = C.PALETTE;
      for (var i = 0; i < this.list.length; i++) {
        var e = this.list[i];
        var wob = Math.sin(e.phase * 2) * 2;
        ctx.save();
        ctx.translate(e.x, e.y + wob);

        if (e.type === 'brume') {
          // Kabut besar: lingkaran berlapis transparan + mata merah.
          ctx.globalAlpha = 0.5;
          ctx.fillStyle = P.WRAITH;
          ctx.beginPath(); ctx.arc(0, 0, e.r + 8, 0, util.TAU); ctx.fill();
          ctx.globalAlpha = 0.75;
          ctx.beginPath(); ctx.arc(0, 0, e.r, 0, util.TAU); ctx.fill();
          ctx.globalAlpha = 1;
          ctx.fillStyle = P.DANGER;
          ctx.beginPath(); ctx.arc(-8, -4, 3, 0, util.TAU); ctx.arc(8, -4, 3, 0, util.TAU); ctx.fill();
          ctx.fillStyle = '#2a2140';
          ctx.beginPath(); ctx.arc(-8, 8, 6, 0, Math.PI); ctx.arc(8, 8, 6, 0, Math.PI); ctx.fill();
        } else if (e.type === 'fiend') {
          // Fiend: bentuk tajam (belah ketupat) ungu kemerahan + mata.
          ctx.rotate(Math.sin(e.phase) * 0.3);
          ctx.fillStyle = '#b06a9e';
          ctx.beginPath();
          ctx.moveTo(0, -e.r - 4);
          ctx.lineTo(e.r, 0);
          ctx.lineTo(0, e.r + 4);
          ctx.lineTo(-e.r, 0);
          ctx.closePath();
          ctx.fill();
          ctx.fillStyle = P.DANGER;
          ctx.beginPath(); ctx.arc(-4, -2, 2.4, 0, util.TAU); ctx.arc(5, -2, 2.4, 0, util.TAU); ctx.fill();
        } else {
          // Wraith: gumpalan abu berdenyut + mata pucat.
          var r = e.r + Math.sin(e.phase * 3) * 1.5;
          ctx.globalAlpha = 0.9;
          ctx.fillStyle = P.WRAITH;
          ctx.beginPath(); ctx.arc(0, 0, r, 0, util.TAU); ctx.fill();
          ctx.globalAlpha = 0.5;
          ctx.beginPath(); ctx.arc(-r * 0.4, r * 0.5, r * 0.55, 0, util.TAU); ctx.fill();
          ctx.globalAlpha = 1;
          ctx.fillStyle = '#e8e2f5';
          ctx.beginPath(); ctx.arc(-5, -3, 2.6, 0, util.TAU); ctx.arc(5, -3, 2.6, 0, util.TAU); ctx.fill();
          ctx.fillStyle = '#241a35';
          ctx.beginPath(); ctx.arc(-5, -3, 1.2, 0, util.TAU); ctx.arc(5, -3, 1.2, 0, util.TAU); ctx.fill();
        }
        ctx.restore();
      }
    }
  };
})();
