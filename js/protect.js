/* Content protection for the public site.
   These are deterrents: a browser page cannot fully stop OS-level screenshots or a camera. */
(function () {
  'use strict';

  var root = document.documentElement;
  root.classList.add('protected');

  function isEditable(el) {
    return el && el.closest && el.closest('input, textarea, select, [contenteditable="true"]');
  }

  // Right-click menu, copy, cut, text selection and dragging.
  ['contextmenu', 'copy', 'cut', 'selectstart', 'dragstart'].forEach(function (type) {
    document.addEventListener(type, function (e) {
      if (!isEditable(e.target)) e.preventDefault();
    });
  });

  // Keyboard shortcuts for copying, saving, printing, viewing source and developer tools.
  document.addEventListener('keydown', function (e) {
    var key = (e.key || '').toLowerCase();
    var mod = e.ctrlKey || e.metaKey;
    var editable = isEditable(e.target);
    var blocked =
      (mod && !editable && (key === 'c' || key === 'x' || key === 'a')) ||
      (mod && (key === 's' || key === 'u' || key === 'p')) ||
      (mod && e.shiftKey && (key === 'i' || key === 'j' || key === 'c' || key === 's')) ||
      key === 'f12';
    if (blocked) {
      e.preventDefault();
      e.stopPropagation();
    }
  }, true);

  // Print Screen: hide the page briefly and clear whatever landed on the clipboard.
  var shieldTimer;
  function shield(ms) {
    root.classList.add('shielded');
    clearTimeout(shieldTimer);
    if (ms) shieldTimer = setTimeout(function () { root.classList.remove('shielded'); }, ms);
  }
  function attempt() {
    document.dispatchEvent(new CustomEvent('zs:attempt'));
  }
  document.addEventListener('keyup', function (e) {
    if (e.key === 'PrintScreen') {
      shield(1500);
      try { navigator.clipboard.writeText(''); } catch (err) {}
      attempt();
    }
  });

  // Win+Shift+S (Snipping Tool) and Cmd+Shift+3/4/5 (macOS) start with the system key plus Shift.
  var metaDown = false;
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Meta' || e.key === 'OS') metaDown = true;
    if ((metaDown || e.metaKey) && e.shiftKey) {
      shield(0);
      attempt();
      metaDown = false;
    }
  }, true);
  document.addEventListener('keyup', function (e) {
    if (e.key === 'Meta' || e.key === 'OS') metaDown = false;
  }, true);

  // Screenshot tools (Snipping Tool, Win+Shift+S, Cmd+Shift+4…) take focus from the page first.
  window.addEventListener('blur', function () {
    // Clicking into the embedded map also moves focus; don't hide the page for that.
    setTimeout(function () {
      if (document.activeElement && document.activeElement.tagName === 'IFRAME') return;
      if (!document.hasFocus()) shield(0);
    }, 0);
  });
  window.addEventListener('focus', function () { root.classList.remove('shielded'); });
  document.addEventListener('visibilitychange', function () {
    if (document.hidden) shield(0); else root.classList.remove('shielded');
  });
})();
