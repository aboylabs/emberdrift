/* Emberdrift — ED.fx
 * Partikel, teks melayang, dan screen shake. Tanpa aset, murni canvas.
 * Semua update memakai dt (detik) sehingga framerate-independent.
 */
(function () {
  'use strict';
  var ED = window.ED = window.ED || {};

  function rand(a, b) { return a + Math.random() * (b - a); }

  var fx = {
    particles: [],   // {x,y,vx,vy,life,maxLife,size,color,grav,drag,glow}
    texts: [],       // {x,y,str,color,life,maxLife,size}

    // Ledakan partikel radial. color = warna dasar (string CSS).
    burst: function (x, y, color, n) {
      n = n || 12;
      for (var i = 0; i < n; i++) {
        var a = Math.random() * Math.PI * 2;
        var sp = rand(40, 220);
        this.particles.push({
          x: x, y: y,
          vx: Math.cos(a) * sp,
          vy: Math.sin(a) * sp - rand(0, 60),
          life: 0,
          maxLife: rand(0.35, 0.8),
          size: rand(2, 5.5),
          color: color || '#ff9a3c',
          grav: 160,
          drag: 2.2,
          glow: Math.random() < 0.6
        });
      }
      if (this.particles.length > 400) {
        this.particles.splice(0, this.particles.length - 400);
      }
    },

    // Jejak api kecil (dipakai saat player bergerak / dash).
    trail: function (x, y, color) {
      this.particles.push({
        x: x + rand(-4, 4), y: y + rand(-4, 4),
        vx: rand(-15, 15), vy: rand(-30, -5),
        life: 0, maxLife: rand(0.25, 0.5),
        size: rand(2, 4.5),
        color: color || '#ff9a3c',
        grav: -40, drag: 1.5, glow: true
      });
    },

    // Teks melayang (skor, "+9 api", dsb). Naik lalu memudar.
    text: function (x, y, str, color, size) {
      this.texts.push({
        x: x, y: y, str: String(str),
        color: color || '#ffd166',
        life: 0, maxLife: 1.0,
        size: size || 15
      });
      if (this.texts.length > 40) this.texts.splice(0, this.texts.length - 40);
    },

    // Screen shake: magnitude disimpan di ED.state.shakeMag, dipakai
    // ED.main.render lewat ctx.translate. Decay ditangani di update().
    shake: function (m) {
      if (!ED.state) return;
      ED.state.shakeMag = Math.max(ED.state.shakeMag || 0, m);
    },

    update: function (dt) {
      var i, p;
      for (i = this.particles.length - 1; i >= 0; i--) {
        p = this.particles[i];
        p.life += dt;
        if (p.life >= p.maxLife) { this.particles.splice(i, 1); continue; }
        var d = Math.max(0, 1 - p.drag * dt);
        p.vx *= d; p.vy *= d;
        p.vy += p.grav * dt;
        p.x += p.vx * dt;
        p.y += p.vy * dt;
      }
      for (i = this.texts.length - 1; i >= 0; i--) {
        var t = this.texts[i];
        t.life += dt;
        t.y -= 42 * dt;
        if (t.life >= t.maxLife) this.texts.splice(i, 1);
      }
      if (ED.state && ED.state.shakeMag > 0) {
        ED.state.shakeMag = Math.max(0, ED.state.shakeMag - dt * 26);
      }
    },

    render: function (ctx) {
      var i, p, k;
      // Partikel: mode 'lighter' supaya bara berpendar.
      ctx.save();
      ctx.globalCompositeOperation = 'lighter';
      for (i = 0; i < this.particles.length; i++) {
        p = this.particles[i];
        k = 1 - p.life / p.maxLife;
        ctx.globalAlpha = k * (p.glow ? 0.9 : 0.55);
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.arc(p.x, p.y, Math.max(0.4, p.size * (0.5 + 0.5 * k)), 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.restore();
      // Teks melayang: bayangan gelap + isi terang, memudar di akhir.
      ctx.save();
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      for (i = 0; i < this.texts.length; i++) {
        var t = this.texts[i];
        k = 1 - t.life / t.maxLife;
        ctx.globalAlpha = Math.min(1, k * 1.6);
        ctx.font = 'bold ' + t.size + 'px system-ui, sans-serif';
        ctx.fillStyle = 'rgba(13,11,30,0.85)';
        ctx.fillText(t.str, t.x + 1.5, t.y + 1.5);
        ctx.fillStyle = t.color;
        ctx.fillText(t.str, t.x, t.y);
      }
      ctx.restore();
    },

    clear: function () {
      this.particles.length = 0;
      this.texts.length = 0;
      if (ED.state) ED.state.shakeMag = 0;
    }
  };

  ED.fx = fx;
})();
