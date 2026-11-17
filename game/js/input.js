// input.js — Emberdrift: mouse + keyboard.
// mouse: posisi kursor dalam koordinat canvas (memperhitungkan skala CSS).
// keys: Set kode tombol yang sedang ditekan. justPressed: tombol yang baru
// ditekan pada frame ini (dibersihkan tiap frame oleh ED.main).
(function () {
  'use strict';

  var ED = window.ED;

  ED.input = {
    mouse: { x: 480, y: 300, down: false, clicked: false },
    keys: new Set(),
    justPressed: new Set(),
    usingMouse: true,

    init: function (canvas) {
      var self = this;

      function toCanvas(e) {
        var rect = canvas.getBoundingClientRect();
        var sx = ED.C.W / rect.width;
        var sy = ED.C.H / rect.height;
        return {
          x: (e.clientX - rect.left) * sx,
          y: (e.clientY - rect.top) * sy
        };
      }

      canvas.addEventListener('mousemove', function (e) {
        var p = toCanvas(e);
        self.mouse.x = p.x;
        self.mouse.y = p.y;
        self.usingMouse = true;
      });

      canvas.addEventListener('mousedown', function (e) {
        var p = toCanvas(e);
        self.mouse.x = p.x;
        self.mouse.y = p.y;
        self.mouse.down = true;
        self.mouse.clicked = true; // edge: dibaca lalu dibersihkan main
        self.usingMouse = true;
        ED.audio.init();
      });

      window.addEventListener('mouseup', function () {
        self.mouse.down = false;
      });

      // Mencegah menu konteks saat klik kanan tidak sengaja.
      canvas.addEventListener('contextmenu', function (e) { e.preventDefault(); });

      window.addEventListener('keydown', function (e) {
        // Space / panah tidak boleh menggeser halaman.
        if (e.code === 'Space' || e.code.indexOf('Arrow') === 0) {
          e.preventDefault();
        }
        if (!e.repeat) { self.justPressed.add(e.code); }
        self.keys.add(e.code);
        if (e.code.indexOf('Arrow') === 0 || e.code.indexOf('Key') === 0) {
          self.usingMouse = false;
        }
        ED.audio.init();
      });

      window.addEventListener('keyup', function (e) {
        self.keys.delete(e.code);
      });

      window.addEventListener('blur', function () {
        self.keys.clear();
        self.mouse.down = false;
      });
    },

    // Dipanggil ED.main di akhir tiap frame.
    endFrame: function () {
      this.justPressed.clear();
      this.mouse.clicked = false;
    },

    pressed: function (code) {
      return this.justPressed.has(code);
    },

    held: function (code) {
      return this.keys.has(code);
    }
  };
})();
