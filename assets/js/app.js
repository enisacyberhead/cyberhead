(function () {
  "use strict";

  var DATA = window.PROGRAMMES || [];
  var app = document.getElementById("app");
  var IMAGE = "assets/img/programme.jpg";

  /* ---------- helpers ---------- */
  function esc(s) {
    return String(s == null ? "" : s)
      .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;").replace(/'/g, "&#39;");
  }
  function norm(s) {
    return String(s || "").normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
  }
  // Escape first, then turn plain URLs into working links.
  function linkify(escaped) {
    return escaped.replace(/(https?:\/\/[^\s<]+[^\s<.,;:!?)\]])/g, function (u) {
      return '<a href="' + u + '" target="_blank" rel="noopener noreferrer">' + u + "</a>";
    });
  }
  function paragraphs(text) {
    return text.split(/\n+/).map(function (p) { return p.trim(); }).filter(Boolean)
      .map(function (p) { return "<p>" + linkify(esc(p)) + "</p>"; }).join("");
  }
  function safeUrl(u) { return /^https?:\/\//i.test(u) ? u : ""; }
  function uniqueSorted(key) {
    var seen = {};
    DATA.forEach(function (p) { if (p[key]) seen[p[key]] = 1; });
    return Object.keys(seen).sort(function (a, b) { return a.localeCompare(b); });
  }

  var ICON = {
    lang: '<svg class="icon" viewBox="0 0 24 24" aria-hidden="true"><path d="M11.99 2C6.47 2 2 6.48 2 12s4.47 10 9.99 10C17.52 22 22 17.52 22 12S17.52 2 11.99 2zm6.93 6h-2.95c-.32-1.25-.78-2.45-1.38-3.56 1.84.63 3.37 1.91 4.33 3.56zM12 4.04c.83 1.2 1.48 2.53 1.91 3.96h-3.82c.43-1.43 1.08-2.76 1.91-3.96zM4.26 14C4.1 13.36 4 12.69 4 12s.1-1.36.26-2h3.38c-.08.66-.14 1.32-.14 2 0 .68.06 1.34.14 2H4.26zm.82 2h2.95c.32 1.25.78 2.45 1.38 3.56-1.84-.63-3.37-1.9-4.33-3.56zm2.95-8H5.08c.96-1.66 2.49-2.93 4.33-3.56C8.81 5.55 8.35 6.75 8.03 8zM12 19.96c-.83-1.2-1.48-2.53-1.91-3.96h3.82c-.43 1.43-1.08 2.76-1.91 3.96zM14.34 14H9.66c-.09-.66-.16-1.32-.16-2 0-.68.07-1.35.16-2h4.68c.09.65.16 1.32.16 2 0 .68-.07 1.34-.16 2zm.25 5.56c.6-1.11 1.06-2.31 1.38-3.56h2.95c-.96 1.65-2.49 2.93-4.33 3.56zM16.36 14c.08-.66.14-1.32.14-2 0-.68-.06-1.34-.14-2h3.38c.16.64.26 1.31.26 2s-.1 1.36-.26 2h-3.38z"/></svg>',
    pin: '<svg class="icon" viewBox="0 0 24 24" aria-hidden="true"><path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/></svg>',
    card: '<svg class="icon" viewBox="0 0 24 24" aria-hidden="true"><path d="M20 4H4c-1.11 0-1.99.89-1.99 2L2 18c0 1.11.89 2 2 2h16c1.11 0 2-.89 2-2V6c0-1.11-.89-2-2-2zm0 14H4v-6h16v6zm0-10H4V6h16v2z"/></svg>',
    search: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M15.5 14h-.79l-.28-.27C15.41 12.59 16 11.11 16 9.5 16 5.91 13.09 3 9.5 3S3 5.91 3 9.5 5.91 16 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z"/></svg>',
    back: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M20 11H7.83l5.59-5.59L12 4l-8 8 8 8 1.41-1.41L7.83 13H20v-2z"/></svg>'
  };

  /* ---------- list state (kept while you look at a programme and come back) ---------- */
  var state = { q: "", types: [], deliveries: [], costs: [], language: "", country: "" };
  var listScroll = 0;

  function matches(p) {
    if (state.types.length && state.types.indexOf(p.type) < 0) return false;
    if (state.deliveries.length && state.deliveries.indexOf(p.delivery) < 0) return false;
    if (state.costs.length && state.costs.indexOf(p.cost) < 0) return false;
    if (state.language && p.language !== state.language) return false;
    if (state.country && p.country !== state.country) return false;
    if (state.q) {
      var hay = norm([p.name, p.institution, p.city, p.country, p.language, p.type, p.description].join(" "));
      var words = norm(state.q).split(/\s+/).filter(Boolean);
      for (var i = 0; i < words.length; i++) if (hay.indexOf(words[i]) < 0) return false;
    }
    return true;
  }

  function checkGroup(title, group, values) {
    return '<fieldset><legend>' + esc(title) + '</legend>' + values.map(function (v) {
      var on = state[group].indexOf(v) >= 0 ? " checked" : "";
      return '<label class="check"><input type="checkbox" data-group="' + group + '" value="' + esc(v) + '"' + on + '>' + esc(v) + '</label>';
    }).join("") + '</fieldset>';
  }
  function selectField(id, label, key, values) {
    return '<div class="field"><label class="field-label" for="' + id + '">' + esc(label) + '</label>' +
      '<select id="' + id + '" data-key="' + key + '"><option value=""></option>' +
      values.map(function (v) {
        return '<option value="' + esc(v) + '"' + (state[key] === v ? " selected" : "") + '>' + esc(v) + '</option>';
      }).join("") + '</select></div>';
  }

  function cardHtml(p) {
    return '<a class="card" href="' + detailHash(p) + '">' +
      '<img class="card-img" src="' + IMAGE + '" alt="" loading="lazy" width="259" height="191">' +
      '<div><h2>' + esc(p.name) + '</h2>' +
      '<p class="institution">' + esc(p.institution) + '</p>' +
      '<p class="location">' + ICON.pin + esc(p.city + ", " + p.country) + '</p>' +
      '<span class="tag">' + esc(p.type) + '</span>' +
      '<ul class="meta"><li>' + ICON.lang + esc(p.language) + '</li><li>' + ICON.pin + esc(p.delivery) + '</li><li>' + ICON.card + esc(p.cost) + '</li></ul>' +
      '</div></a>';
  }
  function detailHash(p) {
    return "#/programme/" + p.id + "?programme=" + encodeURIComponent(p.name);
  }

  function renderList() {
    document.title = "CYBERHEAD – Programmes (archive)";
    app.innerHTML =
      '<div class="list-layout">' +
        '<aside class="filters" aria-label="Filters">' +
          '<form class="search" role="search" id="search-form">' +
            '<input type="search" id="q" placeholder="Search" aria-label="Search programmes" value="' + esc(state.q) + '" autocomplete="off">' +
            '<button type="submit" aria-label="Search">' + ICON.search + '</button>' +
          '</form>' +
          checkGroup("Programme type", "types", ["Bachelor Degree", "Master Degree", "Postgraduate Course"]) +
          checkGroup("Programme delivery", "deliveries", ["Online", "Classroom", "Blended"]) +
          checkGroup("Cost", "costs", ["Free", "Charges Apply"]) +
          selectField("language", "Language", "language", uniqueSorted("language")) +
          selectField("country", "Country", "country", uniqueSorted("country")) +
          '<button type="button" class="clear" id="clear">Clear filters</button>' +
        '</aside>' +
        '<section aria-label="Programmes"><h1 class="results-count" id="count"></h1><div id="results"></div></section>' +
      '</div>';

    var results = document.getElementById("results");
    var count = document.getElementById("count");

    function update() {
      var list = DATA.filter(matches);
      count.textContent = list.length + (list.length === 1 ? " Programme" : " Programmes");
      results.innerHTML = list.length
        ? list.map(cardHtml).join("")
        : '<p class="empty">No programmes match your filters. Try removing a filter or searching for something else.</p>';
    }

    document.getElementById("search-form").addEventListener("submit", function (e) {
      e.preventDefault();
      state.q = document.getElementById("q").value.trim();
      update();
    });
    document.getElementById("q").addEventListener("input", function (e) {
      state.q = e.target.value.trim();
      update();
    });
    app.querySelectorAll('input[type="checkbox"]').forEach(function (box) {
      box.addEventListener("change", function () {
        var g = box.getAttribute("data-group");
        var i = state[g].indexOf(box.value);
        if (box.checked && i < 0) state[g].push(box.value);
        if (!box.checked && i >= 0) state[g].splice(i, 1);
        update();
      });
    });
    app.querySelectorAll("select").forEach(function (sel) {
      sel.addEventListener("change", function () {
        state[sel.getAttribute("data-key")] = sel.value;
        update();
      });
    });
    document.getElementById("clear").addEventListener("click", function () {
      state = { q: "", types: [], deliveries: [], costs: [], language: "", country: "" };
      renderList();
    });

    update();
  }

  /* ---------- detail page ---------- */
  var CATS = [
    { key: "security", label: "Security Computing / Engineering", color: "#004087" },
    { key: "law", label: "Law, Ethics, Policy,Cybercrime", color: "#ce1141" },
    { key: "org", label: "Organizational, Risk management, Business compliance", color: "#8dc63f" },
    { key: "internship", label: "Internship", color: "#c2d3e9" },
    { key: "other", label: "Other", color: "#44c8f5" }
  ];

  function pieSvg(ects) {
    var total = ects.total || CATS.reduce(function (s, c) { return s + ects[c.key]; }, 0);
    if (!total) return "";
    var parts = [], angle = -Math.PI / 2, R = 50;
    CATS.forEach(function (c) {
      var v = ects[c.key];
      if (!v) return;
      var frac = v / total, a0 = angle, a1 = angle + frac * 2 * Math.PI;
      angle = a1;
      var pct = (frac * 100).toFixed(1) + "%";
      if (frac >= 0.9999) {
        parts.push('<circle cx="0" cy="0" r="' + R + '" fill="' + c.color + '" stroke="#fff" stroke-width="1"><title>' + esc(c.label) + ": " + v + " ECTS</title></circle>");
      } else {
        var x0 = R * Math.cos(a0), y0 = R * Math.sin(a0), x1 = R * Math.cos(a1), y1 = R * Math.sin(a1);
        parts.push('<path d="M0 0L' + x0.toFixed(3) + " " + y0.toFixed(3) + "A" + R + " " + R + " 0 " + (frac > 0.5 ? 1 : 0) + " 1 " + x1.toFixed(3) + " " + y1.toFixed(3) + 'Z" fill="' + c.color + '" stroke="#fff" stroke-width="1"><title>' + esc(c.label) + ": " + v + " ECTS</title></path>");
      }
      if (frac >= 0.04) {
        var mid = (a0 + a1) / 2, r = frac >= 0.9999 ? 0 : R * 0.68;
        parts.push('<text x="' + (r * Math.cos(mid)).toFixed(2) + '" y="' + (r * Math.sin(mid)).toFixed(2) + '">' + pct + "</text>");
      }
    });
    return '<svg class="pie" viewBox="-51 -51 102 102" role="img" aria-label="Distribution of ECTS credits">' + parts.join("") + "</svg>";
  }

  function renderDetail(id) {
    var p = DATA.filter(function (x) { return x.id === id; })[0];
    if (!p) {
      document.title = "Programme not found – CYBERHEAD (archive)";
      app.innerHTML = '<div class="notfound"><p>We could not find this programme.</p><p><a href="#/programmes">Back to all programmes</a></p></div>';
      return;
    }
    document.title = p.name + " – CYBERHEAD (archive)";
    var url = safeUrl(p.url);
    var here = encodeURIComponent(location.href);
    var shareTitle = encodeURIComponent(p.name + " – " + p.institution);

    var chart = pieSvg(p.ects);
    var legend = CATS.map(function (c) {
      return '<li><span class="swatch" style="background:' + c.color + '"></span>' + esc(c.label) + "</li>";
    }).join("");

    app.innerHTML =
      '<article class="detail">' +
        '<a class="back" href="#/programmes">' + ICON.back + 'All programmes</a>' +
        '<div class="detail-top">' +
          '<img class="detail-img" src="' + IMAGE + '" alt="">' +
          '<div>' +
            '<h1>' + esc(p.name) + '</h1>' +
            '<p class="institution">' + esc(p.institution) + '</p>' +
            '<p class="location">' + ICON.pin + esc(p.city + ", " + p.country) + '</p>' +
            '<span class="tag">' + esc(p.type) + '</span>' +
            '<ul class="meta"><li>' + ICON.lang + esc(p.language) + '</li><li>' + ICON.pin + esc(p.delivery) + '</li><li>' + ICON.card + esc(p.cost) + '</li></ul>' +
            (url
              ? '<a class="btn" href="' + esc(url) + '" target="_blank" rel="noopener noreferrer">Visit Programme\u2019s Website</a>'
              : '<span class="btn disabled">Website not available</span>') +
            '<div class="share"><span>Share on:</span>' +
              '<a class="fb" href="https://www.facebook.com/sharer/sharer.php?u=' + here + '" target="_blank" rel="noopener noreferrer" aria-label="Share on Facebook"><svg viewBox="0 0 24 24"><path d="M9 8H6v4h3v12h5V12h3.642L18 8h-4V6.333C14 5.378 14.192 5 15.115 5H18V0h-3.808C10.596 0 9 1.583 9 4.615V8z"/></svg></a>' +
              '<a class="in" href="https://www.linkedin.com/shareArticle?mini=true&url=' + here + '&title=' + shareTitle + '" target="_blank" rel="noopener noreferrer" aria-label="Share on LinkedIn"><svg viewBox="0 0 24 24"><path d="M4.98 3.5c0 1.381-1.11 2.5-2.48 2.5s-2.48-1.119-2.48-2.5c0-1.38 1.11-2.5 2.48-2.5s2.48 1.12 2.48 2.5zm.02 4.5h-5v16h5v-16zm7.982 0h-4.968v16h4.969v-8.399c0-4.67 6.029-5.052 6.029 0v8.399h4.988v-10.131c0-7.88-8.922-7.593-11.018-3.714v-2.155z"/></svg></a>' +
              '<a class="tw" href="https://twitter.com/intent/tweet?url=' + here + '&text=' + shareTitle + '" target="_blank" rel="noopener noreferrer" aria-label="Share on Twitter"><svg viewBox="0 0 24 24"><path d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723c-.951.555-2.005.959-3.127 1.184a4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z"/></svg></a>' +
            '</div>' +
          '</div>' +
        '</div>' +
        '<div class="panel">' +
          '<div class="chart">' +
            '<p class="chart-title">' + p.ects.total + ' Total ECTS ' +
              '<button type="button" class="info" aria-label="What is ECTS?">i<span class="tip" role="tooltip">ECTS: European Credit Transfer and Accumulation System. Credits show the workload of the programme and how it is split between disciplines.</span></button></p>' +
            chart +
            '<ul class="legend">' + legend + '</ul>' +
          '</div>' +
          '<div class="info-col">' +
            '<h3>Programme Description:</h3><div class="body">' + paragraphs(p.description) + '</div>' +
            (p.established ? '<h3>Established in:</h3><div class="body">' + esc(p.established) + '</div>' : "") +
            (p.certification ? '<h3>Preparation to professional certification:</h3><div class="body">' + paragraphs(p.certification) + '</div>' : "") +
          '</div>' +
        '</div>' +
      '</article>';
  }

  /* ---------- router: #/programmes and #/programme/<id>?programme=<name> ---------- */
  var current = "";
  function route() {
    var hash = location.hash.replace(/^#\/?/, "");
    var path = hash.split("?")[0];
    var parts = path.split("/");

    if (current === "list") listScroll = window.pageYOffset;

    if (parts[0] === "programme" && parts[1]) {
      current = "detail";
      renderDetail(parts[1]);
      window.scrollTo(0, 0);
    } else {
      var comingBack = current === "detail";
      current = "list";
      renderList();
      window.scrollTo(0, comingBack ? listScroll : 0);
    }
  }
  window.addEventListener("hashchange", route);
  route();
})();
