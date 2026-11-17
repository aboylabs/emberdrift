// upgrades.js — Emberdrift: 6 upgrade, dipilih 1 dari 3 kartu acak berbeda
// di jeda antar wave (kecuali setelah wave 10 -> victory).
(function () {
  'use strict';

  var ED = window.ED;

  ED.upgrades = {
    pool: [
      {
        id: 'long-burn',
        name: 'Long Burn',
        desc: '+25 api maksimum dan +25 api sekarang. Apimu menyala lebih lama.',
        apply: function () {
          var p = ED.player;
          p.maxFlame += 25;
          p.addFlame(25);
        }
      },
      {
        id: 'wide-wings',
        name: 'Wide Wings',
        desc: 'Jangkauan magnet +60. Bara tertarik dari lebih jauh.',
        apply: function () {
          ED.player.magnet += 60;
        }
      },
      {
        id: 'swift-dash',
        name: 'Swift Dash',
        desc: 'Cooldown dash -30%. Meluncur lebih sering.',
        apply: function () {
          var p = ED.player;
          p.dashCdMax = Math.max(0.8, p.dashCdMax * 0.7);
        }
      },
      {
        id: 'ember-heart',
        name: 'Ember Heart',
        desc: '+1 nyawa (maks 5). Satu kesempatan lagi.',
        apply: function () {
          ED.state.lives = Math.min(ED.C.LIVES_MAX, ED.state.lives + 1);
        }
      },
      {
        id: 'combo-charm',
        name: 'Combo Charm',
        desc: 'Jendela combo +1,5 detik. Pengali naik lebih mudah.',
        apply: function () {
          ED.player.comboWindow += 1.5;
        }
      },
      {
        id: 'twin-spark',
        name: 'Twin Spark',
        desc: 'Nilai bara +1. Setiap bara bernilai lebih.',
        apply: function () {
          ED.player.emberValue += 1;
        }
      }
    ],

    // 3 upgrade acak berbeda.
    offer: function () {
      return ED.util.sample(this.pool, 3);
    },

    // Terapkan pilihan, lalu lanjut ke wave berikutnya.
    apply: function (choice) {
      if (!choice || typeof choice.apply !== 'function') { return; }
      choice.apply();
      ED.audio.click();
      ED.fx.burst(ED.player.x, ED.player.y, ED.C.PALETTE.GOLD, 18);
      ED.main.nextWave();
    }
  };
})();
