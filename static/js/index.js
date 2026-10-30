// OSMA-Bench project page.
// Opens a toggle when an in-page link or the URL hash points into it, and copies the BibTeX.

(function () {
  // Open every <details> around the element with this id; return the element.
  function reveal(id) {
    var el = id ? document.getElementById(id) : null;
    for (var d = el && el.closest('details'); d; d = d.parentElement.closest('details')) {
      d.open = true;
    }
    return el;
  }

  document.querySelectorAll('a[href^="#"]').forEach(function (a) {
    a.addEventListener('click', function (e) {
      var id = a.getAttribute('href').slice(1);
      var el = reveal(id);
      if (!el) return;
      e.preventDefault();
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
      history.replaceState(null, '', '#' + id);
    });
  });

  if (location.hash) reveal(decodeURIComponent(location.hash.slice(1)));
  window.addEventListener('hashchange', function () {
    reveal(decodeURIComponent(location.hash.slice(1)));
  });

  // navigator.clipboard needs a secure context, so plain-http previews fall back to execCommand.
  var button = document.getElementById('copy-bibtex');
  var code = document.querySelector('#citation pre code');
  if (!button || !code) return;
  function copied() {
    button.textContent = 'Copied';
    setTimeout(function () { button.textContent = 'Copy'; }, 1500);
  }
  button.addEventListener('click', function () {
    if (navigator.clipboard && window.isSecureContext) {
      navigator.clipboard.writeText(code.textContent).then(copied);
      return;
    }
    var range = document.createRange();
    range.selectNodeContents(code);
    var selection = window.getSelection();
    selection.removeAllRanges();
    selection.addRange(range);
    try {
      if (document.execCommand('copy')) copied();
    } catch (err) {
      // Leave the text selected so the reader can copy it by hand.
      return;
    }
    selection.removeAllRanges();
  });
})();

// Results library: builds the policy, model and cell buttons from library.json and swaps the clip.
// Without the manifest (or without JS) the first clip stays on its own.
(function () {
  var lib = document.querySelector('.lib');
  if (!lib || !window.fetch) return;
  var controls = lib.querySelector('.lib-controls');
  var video = lib.querySelector('video');
  var out = lib.querySelector('.lib-out');
  var v = '?v=' + lib.dataset.version;
  var dir = lib.dataset.manifest.replace(/[^/]*$/, '');
  var TIER = { Low: 'low', Moderate: 'mod', High: 'high' };

  // "π0.5-OpenTau" is written π<sub>0.5</sub>-OpenTau, as in the rest of the page.
  function label(el, text) {
    var m = /^π([\d.]+)(.*)$/.exec(text);
    if (!m) {
      el.textContent = text;
      return el;
    }
    var sub = document.createElement('sub');
    sub.textContent = m[1];
    el.append('π', sub, m[2]);
    return el;
  }

  function row(name) {
    var k = document.createElement('span');
    k.className = 'lib-k';
    k.textContent = name;
    var chips = document.createElement('div');
    chips.className = 'chips';
    chips.setAttribute('role', 'group');
    chips.setAttribute('aria-label', name);
    controls.append(k, chips);
    return chips;
  }

  fetch(lib.dataset.manifest + v).then(function (r) {
    if (!r.ok) throw new Error(r.status);
    return r.json();
  }).then(function (manifest) {
    var clips = {}, cells = {}, names = {};
    manifest.clips.forEach(function (c) { clips[c.policy + '|' + c.model + '|' + c.cell] = c; });
    manifest.cells.forEach(function (c) { cells[c.id] = c; });
    manifest.policies.forEach(function (p) { names[p.id] = p; });
    var state = {
      policy: manifest.policies[0].id,
      model: manifest.policies[0].models[0],
      cell: manifest.cells[0].id
    };
    var rows = { policy: row('Policy'), model: row('Model'), cell: row('Cell') };

    function clip(policy, model, cell) { return clips[policy + '|' + model + '|' + cell]; }

    // Keep the model and the cell if the policy has that clip; otherwise take the first that exists.
    function settle() {
      var models = [state.model].concat(names[state.policy].models);
      var ids = [state.cell].concat(manifest.cells.map(function (c) { return c.id; }));
      for (var i = 0; i < models.length; i++) {
        for (var j = 0; j < ids.length; j++) {
          if (clip(state.policy, models[i], ids[j])) {
            state.model = models[i];
            state.cell = ids[j];
            return;
          }
        }
      }
    }

    function chip(parent, key, value, text, available) {
      var b = document.createElement('button');
      b.type = 'button';
      b.className = 'chip';
      b.disabled = !available;
      b.setAttribute('aria-pressed', String(state[key] === value));
      label(b, text);
      b.addEventListener('click', function () {
        state[key] = value;
        settle();
        render();
        show();
      });
      parent.append(b);
      return b;
    }

    function render() {
      Object.keys(rows).forEach(function (k) { rows[k].replaceChildren(); });
      manifest.policies.forEach(function (p) {
        var b = chip(rows.policy, 'policy', p.id, p.name, true);
        b.classList.add('policy');
        b.style.setProperty('--c', 'var(--' + p.id + ')');
      });
      names[state.policy].models.forEach(function (m) {
        chip(rows.model, 'model', m, m, !!clip(state.policy, m, state.cell));
      });
      manifest.cells.forEach(function (c) {
        chip(rows.cell, 'cell', c.id, 'Layout ' + c.layout + ' · Route ' + c.route,
             !!clip(state.policy, state.model, c.id));
      });
    }

    function show() {
      var c = clip(state.policy, state.model, state.cell);
      if (!c) return;
      var cell = cells[state.cell];
      video.width = cell.width;
      video.height = cell.height;
      video.poster = dir + c.poster + v;
      video.src = dir + c.video + v;
      var obstacles = c.panels.map(function (p) { return p.obstacle.toLowerCase(); });
      video.setAttribute('aria-label', names[state.policy].name + ' with ' + c.model + ' on Layout ' +
        cell.layout + ', Route ' + cell.route + ', with a ' + obstacles.slice(0, -1).join(', a ') +
        ' and a ' + obstacles[obstacles.length - 1] + ' as the obstacle.');
      var playing = video.play();
      if (playing && playing.catch) playing.catch(function () {});

      out.replaceChildren();
      var k = document.createElement('span');
      k.className = 'lib-k';
      k.textContent = 'Min clearance';
      out.append(k);
      c.panels.forEach(function (p) {
        var item = document.createElement('span');
        item.className = 'lib-item';
        var tier = document.createElement('span');
        tier.className = 'tl ' + TIER[p.tier];
        tier.textContent = p.tier;
        var value = document.createElement('b');
        value.textContent = p.collision ? 'collision' : Math.max(p.min_clearance, 0).toFixed(2) + ' m';
        if (p.collision) value.className = 'hit';
        item.append(p.obstacle + ' ', tier, ' ', value);
        out.append(item);
      });
    }

    settle();
    render();
    show();
    controls.hidden = false;
  }).catch(function () {
    // Keep the first clip as it is in the HTML.
  });
})();
