// ---------------------------------------------------------------------------------------------
// Spanish. English is the source text everywhere in the code; when the language is Spanish a
// dictionary (48-i18n-es.js) and a few patterns for sentences with names and numbers in them
// translate what is on the screen as it is drawn. Anything without a translation stays in English
// (so a gap is never a blank), and typed text (names, notes, plans) is never touched.
// ---------------------------------------------------------------------------------------------

const i18nCache = new Map();
const i18nOutputs = new Set();
const i18nMissing = new Set();
let i18nTrace = !!window.__kbWantTrace;

function i18nCollapse(text) {
  return text.replace(/\s+/g, " ").trim();
}

// numbers inside a sentence become "#", so "152 (41.6% of nights)" and "20 (5.5% of nights)" share one entry
const I18N_NUM = /\d+(?:\.\d+)?/g;

function i18nNumbers(key) {
  const nums = key.match(I18N_NUM);
  if (!nums) {
    return undefined;
  }
  const template = key.replace(I18N_NUM, "#");
  let out = Object.prototype.hasOwnProperty.call(ES_DICT, template) ? ES_DICT[template] : undefined;
  if (out === undefined) {
    return undefined;
  }
  let i = 0;
  out = out.replace(/#/g, () => nums[i++].replace(".", ","));
  return out;
}

function i18nLookup(key) {
  if (Object.prototype.hasOwnProperty.call(ES_DICT, key)) {
    return ES_DICT[key];
  }
  const viaNumbers = i18nNumbers(key);
  if (viaNumbers !== undefined) {
    return viaNumbers;
  }
  for (let i = 0; i < ES_RULES.length; i++) {
    const m = ES_RULES[i][0].exec(key);
    if (m) {
      const out = ES_RULES[i][1](...m.slice(1));
      if (out != null) {
        return out;
      }
    }
  }
  return undefined;
}

// text that needs no translation: times, numbers, time-zone ids, names of months and days
const I18N_PASS = /^(?:[\d\s:.,%/()+\-–—·•→←↔&"'“”’!?…✓×*#]*|\d{1,2}:\d{2}(?:\s?[AP]M)?|[A-Z][A-Za-z_]+(?:\/[A-Za-z_\-+0-9]+)+|UTC|GMT[+-]?\d*)$/;

// Translate one string (a no-op in English)
// text made only of Spanish month and day names, "de" and numbers (a date) needs nothing
const I18N_DATEWORDS = new RegExp(
  "(?<!\\p{L})(?:" + [...MONTH_NAMES, ...MONTH_SHORT, ...DOW_FULL, ...DOW_3].join("|") + "|de|AM|PM)(?!\\p{L})",
  "giu"
);

function tr(text, quiet) {
  if (LANG !== "es" || typeof text !== "string" || !/[A-Za-z]{2}/.test(text)) {
    return text;
  }
  // a text with several lines (notes, tooltips with a note under them) is translated line by line
  if (/\n(?=\S)/.test(text)) {
    return text
      .split("\n")
      .map(line => tr(line, quiet))
      .join("\n");
  }
  const key = i18nCollapse(text);
  if (i18nOutputs.has(key) || I18N_PASS.test(key) || !/[A-Za-z]/.test(key.replace(I18N_DATEWORDS, ""))) {
    return text;
  }
  let out = i18nCache.get(key);
  if (out === undefined) {
    out = i18nLookup(key);
    if (i18nCache.size > 6000) {
      i18nCache.clear();
    }
    i18nCache.set(key, out === undefined ? null : out);
    if (out !== undefined) {
      i18nOutputs.add(out);
    }
  } else if (out === null) {
    out = undefined;
  }
  if (out === undefined) {
    if (i18nTrace && !quiet) {
      i18nMissing.add(key);
    }
    return text;
  }
  const lead = text.slice(0, text.length - text.trimStart().length);
  const trail = text.slice(text.trimEnd().length);
  return lead + out + trail;
}

const I18N_ATTRS = ["placeholder", "aria-label", "title"];

function i18nSkip(el) {
  return el.tagName === "SCRIPT" || el.tagName === "STYLE" || el.tagName === "TEXTAREA" || el.hasAttribute("data-no-tr");
}

function i18nAttrs(el) {
  I18N_ATTRS.forEach(name => {
    const v = el.getAttribute(name);
    if (v) {
      const t = tr(v);
      if (t !== v) {
        el.setAttribute(name, t);
      }
    }
  });
  if (el.tagName === "INPUT" && (el.type === "button" || el.type === "submit") && el.value) {
    const t = tr(el.value);
    if (t !== el.value) {
      el.value = t;
    }
  }
}

function i18nText(node) {
  const v = node.nodeValue;
  if (v && /[A-Za-z]{2}/.test(v)) {
    const t = tr(v);
    if (t !== v) {
      node.nodeValue = t;
    }
  }
}

function i18nTree(root) {
  if (root.nodeType === 3) {
    if (!root.parentNode || !i18nSkip(root.parentNode)) {
      i18nText(root);
    }
    return;
  }
  if (root.nodeType !== 1 || i18nSkip(root)) {
    return;
  }
  i18nAttrs(root);
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_ELEMENT | NodeFilter.SHOW_TEXT, {
    acceptNode(n) {
      if (n.nodeType === 1) {
        if (i18nSkip(n)) {
          return NodeFilter.FILTER_REJECT;
        }
        i18nAttrs(n);
        return NodeFilter.FILTER_SKIP;
      }
      return NodeFilter.FILTER_ACCEPT;
    }
  });
  let n;
  while ((n = walker.nextNode())) {
    i18nText(n);
  }
}

function startTranslator() {
  if (LANG !== "es") {
    return;
  }
  document.documentElement.lang = "es";
  document.title = tr(document.title);
  i18nTree(document.body);
  new MutationObserver(records => {
    records.forEach(r => {
      if (r.type === "childList") {
        r.addedNodes.forEach(i18nTree);
      } else if (r.type === "characterData") {
        if (r.target.parentNode && !i18nSkip(r.target.parentNode)) {
          i18nText(r.target);
        }
      } else if (r.type === "attributes" && !i18nSkip(r.target)) {
        i18nAttrs(r.target);
      }
    });
  }).observe(document.body, {
    childList: true,
    subtree: true,
    characterData: true,
    attributes: true,
    attributeFilter: I18N_ATTRS
  });
}

// the language buttons in the menu (the page reloads in the other language)
document.querySelectorAll("[data-lang-choice]").forEach(button => {
  button.setAttribute("aria-checked", button.dataset.langChoice === LANG ? "true" : "false");
  button.onclick = () => {
    writePref("lang", button.dataset.langChoice);
    location.reload();
  };
});

// a hook so the tests can list what has no translation yet
window.__kbI18n = {
  trace() {
    i18nTrace = true;
  },
  missing() {
    return [...i18nMissing];
  },
  clear() {
    i18nMissing.clear();
  }
};
