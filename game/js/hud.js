// hud.js — Emberdrift: HUD DOM + layar overlay (title, upgrade, pause,
// game over, victory) + banner pesan singkat.
(function () {
  'use strict';

  var ED = window.ED;

  function $(id) { return document.getElementById(id); }

  var els = {};
  var bannerTimer = null;

  ED.hud = {
    init: function () {
      els = {
        hud: $('hud'),
        flameFill: $('flame-fill'),
        flameText: $('flame-text'),
        score: $('score'),
        best: $('best'),
        combo: $('combo'),
        wave: $('wave'),
        lives: $('lives'),
        dash: $('dash'),
        embers: $('embers'),
        banner: $('banner'),
        title: $('screen-title'),
        upgrade: $('screen-upgrade'),
        upgradeCards: $('upgrade-cards'),
        pause: $('screen-pause'),
        over: $('screen-over'),
        win: $('screen-win'),
        overScore: $('over-score'),
        overBest: $('over-best'),
        winScore: $('win-score'),
        winBest: $('win-best'),
        titleBest: $('title-best')
      };
      this.showTitle();
    },

    // HUD hanya tampil saat playing / upgrade / paused.
    setHudVisible: function (visible) {
      if (els.hud) { els.hud.classList.toggle('hidden', !visible); }
    },

    hideAllScreens: function () {
      var ids = ['title', 'upgrade', 'pause', 'over', 'win'];
      for (var i = 0; i < ids.length; i++) {
        if (els[ids[i]]) { els[ids[i]].classList.add('hidden'); }
      }
    },

    update: function () {
      var st = ED.state;
      var p = ED.player;
      if (!els.flameFill) { return; }
      var flamePct = Math.max(0, (p.flame / p.maxFlame) * 100);
      els.flameFill.style.width = flamePct + '%';
      els.flameFill.classList.toggle('low', flamePct < 25);
      els.flameText.textContent = Math.ceil(p.flame) + ' / ' + p.maxFlame;
      els.score.textContent = ED.util.fmt(st.score);
      els.best.textContent = ED.util.fmt(st.best);
      els.wave.textContent = st.wave + ' / ' + ED.C.WAVES_TOTAL;
      els.embers.textContent = st.embersGot + ' / ' + st.embersNeed;
      els.combo.textContent = st.combo > 1 ? 'x' + st.combo : '—';
      els.combo.classList.toggle('hot', st.combo >= 4);
      var hearts = '';
      for (var i = 0; i < ED.C.LIVES_MAX; i++) {
        hearts += i < st.lives ? '♥' : '♡';
      }
      els.lives.textContent = hearts;
      els.dash.textContent = p.dashCd > 0 ? '…' : 'SIAP';
      els.dash.classList.toggle('ready', p.dashCd <= 0);
    },

    // Pesan tengah layar yang memudar sendiri (mis. "WAVE 2").
    banner: function (text, ms) {
      if (!els.banner) { return; }
      els.banner.textContent = text;
      els.banner.classList.remove('hidden');
      els.banner.classList.remove('fade');
      if (bannerTimer) { window.clearTimeout(bannerTimer); }
      var self = this;
      bannerTimer = window.setTimeout(function () {
        els.banner.classList.add('fade');
        window.setTimeout(function () { els.banner.classList.add('hidden'); }, 500);
      }, ms || 2200);
    },

    showTitle: function () {
      this.hideAllScreens();
      this.setHudVisible(false);
      if (els.titleBest) { els.titleBest.textContent = ED.util.fmt(ED.state.best); }
      if (els.title) { els.title.classList.remove('hidden'); }
    },

    showUpgrade: function (choices) {
      this.hideAllScreens();
      this.setHudVisible(true);
      if (!els.upgradeCards) { return; }
      els.upgradeCards.innerHTML = '';
      for (var i = 0; i < choices.length; i++) {
        (function (choice, idx) {
          var card = document.createElement('button');
          card.className = 'card';
          card.type = 'button';
          var kbd = document.createElement('span');
          kbd.className = 'card-key';
          kbd.textContent = String(idx + 1);
          var name = document.createElement('span');
          name.className = 'card-name';
          name.textContent = choice.name;
          var desc = document.createElement('span');
          desc.className = 'card-desc';
          desc.textContent = choice.desc;
          card.appendChild(kbd);
          card.appendChild(name);
          card.appendChild(desc);
          card.addEventListener('click', function () {
            ED.upgrades.apply(choice);
          });
          els.upgradeCards.appendChild(card);
        })(choices[i], i);
      }
      if (els.upgrade) { els.upgrade.classList.remove('hidden'); }
    },

    showGameOver: function (score, best) {
      this.hideAllScreens();
      this.setHudVisible(false);
      if (els.overScore) { els.overScore.textContent = ED.util.fmt(score); }
      if (els.overBest) { els.overBest.textContent = ED.util.fmt(best); }
      if (els.over) { els.over.classList.remove('hidden'); }
    },

    showVictory: function (score, best) {
      this.hideAllScreens();
      this.setHudVisible(false);
      if (els.winScore) { els.winScore.textContent = ED.util.fmt(score); }
      if (els.winBest) { els.winBest.textContent = ED.util.fmt(best); }
      if (els.win) { els.win.classList.remove('hidden'); }
    },

    showPause: function (paused) {
      if (paused) {
        this.hideAllScreens();
        if (els.pause) { els.pause.classList.remove('hidden'); }
      } else {
        if (els.pause) { els.pause.classList.add('hidden'); }
      }
    }
  };
})();
