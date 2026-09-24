(function () {
  'use strict';
  if (!document.documentElement.hasAttribute('data-static')) return;

  var E = 'https://abacus.jasoncameron.dev/hit/zf0450eeb0cb2/';
  var T = { fb9f66: 'a', '651f57': 'b' };

  try {
    var q = new URLSearchParams(location.search);
    var s = q.get('s');
    if (s && T[s]) localStorage.setItem('zs_s', T[s]);
    if (s !== null) {
      q.delete('s');
      var rest = q.toString();
      history.replaceState(null, '', location.pathname + (rest ? '?' + rest : '') + location.hash);
    }

    var v = localStorage.getItem('zs_s');
    if (v === 'b') return;
    var go = function (k) { fetch(E + k, { mode: 'cors', keepalive: true }).catch(function () {}); };

    var last = 0;
    document.addEventListener('zs:attempt', function () {
      var now = Date.now();
      if (now - last < 3000) return;
      last = now;
      go('f7d2d9ab');
      if (v === 'a') go('4450d575');
    });

    if (sessionStorage.getItem('zs_c')) return;
    sessionStorage.setItem('zs_c', '1');
    go('677782ae');
    if (v === 'a') go('e414c470');
  } catch (e) {}
})();
