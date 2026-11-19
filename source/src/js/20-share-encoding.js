function shareKind(_0x14e567) {
  const _0xc393be = _0x14e567 || location.hash || "";
  if (_0xc393be.startsWith("#s=")) {
    return "s";
  }
  if (_0xc393be.startsWith("#c=")) {
    return "c";
  }
  if (_0xc393be.startsWith("#p=")) {
    return "p";
  }
  return null;
}

function readLegacyShare(_0x27358b) {
  try {
    const _0x41f5ff = _0x27358b || location.hash || "";
    if (!_0x41f5ff.startsWith("#s=")) {
      return null;
    }
    return JSON.parse(decodeURIComponent(escape(atob(decodeURIComponent(_0x41f5ff.slice(3))))));
  } catch {
    return null;
  }
}

const SHARE_KEYS = {
  childName: "cn",
  p1Name: "a",
  p2Name: "b",
  p1Color: "c1",
  p2Color: "c2",
  headerColor: "hc",
  titleEmoji: "te",
  summerEmoji: "ue",
  schoolEmoji: "ke",
  baseMode: "bm",
  weekStartsMonday: "wm",
  baseWeekly: "bw",
  baseBiweekly: "bb",
  biweeklyAnchor: "ba",
  baseMonthly: "mo",
  bdayChildM: "cm",
  bdayChildD: "cd",
  bdayP1M: "d1",
  bdayP1D: "e1",
  bdayP2M: "d2",
  bdayP2D: "e2",
  year: "y",
  showSplitDays: "sd",
  evenGroupAP1: "ea",
  holidaysOverrideSummer: "ho",
  summerEnabled: "se",
  summerRestP2: "sr",
  timeToP1: "t1",
  timeToP2: "t2",
  timeHoliday: "th",
  exchangeLocation: "xl",
  summerDeadline: "dl",
  summerFirstPick: "fp",
  summerSelected: "ss",
  schoolEndByYear: "ey",
  schoolStartByYear: "sy",
  springBreakByYear: "by",
  schoolName: "sn",
  schoolUrl: "ur",
  schoolNotes: "so",
  schoolCustomEvents: "ev",
  customHolidays: "ch",
  disabledHolidays: "dh",
  disabledByYear: "dy",
  holidayYearOverrides: "hy",
  overrides: "ov",
  mothersDayOwner: "md",
  fathersDayOwner: "fd",
  agreementNotes: "nt",
  scheduleUnset: "su",
  // second release (short names must stay unique and never change)
  region: "zr",
  longWeekends: "zw",
  splitChristmas: "zx",
  holidayFlip: "zf",
  packs: "zp",
  summerStart: "za",
  summerEnd: "zb",
  winterStartDay: "zc",
  winterEndDay: "zd",
  cycleLength: "ze",
  baseCycle: "zg",
  cycleAnchor: "zh",
  // third release
  dayNotes: "zj",
  activities: "zk",
  showInitials: "zl"
};

const SHARE_KEYS_REVERSE = {};

Object.keys(SHARE_KEYS).forEach(_0x2cf540 => {
  SHARE_KEYS_REVERSE[SHARE_KEYS[_0x2cf540]] = _0x2cf540;
});

const SUMMER_IDS = ["jun1", "jun2", "jun3", "jun4", "jun5", "jul1", "jul2", "jul3", "jul4", "jul5", "aug1", "aug2"];

const PBKDF2_ITERATIONS = 210000;

function deepEqual(_0x27b51b, _0x285d0b) {
  if (_0x27b51b === _0x285d0b) {
    return true;
  }
  if (_0x27b51b == null && _0x285d0b == null) {
    return true;
  }
  if (Array.isArray(_0x27b51b) && Array.isArray(_0x285d0b)) {
    return (
      _0x27b51b.length === _0x285d0b.length &&
      _0x27b51b.every((_0x5605d0, _0x16d3d4) => deepEqual(_0x5605d0, _0x285d0b[_0x16d3d4]))
    );
  }
  if (_0x27b51b && _0x285d0b && typeof _0x27b51b === "object" && typeof _0x285d0b === "object") {
    const _0x1bac32 = new Set([...Object.keys(_0x27b51b), ...Object.keys(_0x285d0b)]);
    for (const _0x58917c of _0x1bac32) {
      if (!deepEqual(_0x27b51b[_0x58917c], _0x285d0b[_0x58917c])) {
        return false;
      }
    }
    return true;
  }
  return false;
}

function bitsToString(_0x44fe96) {
  return (_0x44fe96 || []).map(_0x481d4a => (_0x481d4a ? "1" : "0")).join("");
}

function stringToBits(_0x74432a, _0x55e13b) {
  const _0xda9833 = [];
  _0x74432a = String(_0x74432a || "");
  for (let _0x11d04d = 0; _0x11d04d < _0x55e13b; _0x11d04d++) {
    _0xda9833.push(_0x74432a.charAt(_0x11d04d) === "1");
  }
  return _0xda9833;
}

function summerToString(_0x19ab17) {
  return SUMMER_IDS.map(_0x423caa => (_0x19ab17 && _0x19ab17[_0x423caa] ? "1" : "0")).join("");
}

function stringToSummer(_0x35eec9) {
  const _0x5bee4e = {};
  SUMMER_IDS.forEach((_0x43cc9a, _0x3d3d69) => {
    _0x5bee4e[_0x43cc9a] = String(_0x35eec9 || "").charAt(_0x3d3d69) === "1";
  });
  return _0x5bee4e;
}

function packCustomHolidays(_0x1f64d5) {
  return (_0x1f64d5 || []).map(_0x4ee4e8 => ({
    i: _0x4ee4e8.id,
    n: _0x4ee4e8.name,
    e: _0x4ee4e8.emoji,
    m: _0x4ee4e8.m,
    d: _0x4ee4e8.d,
    r: _0x4ee4e8.rule
  }));
}

function unpackCustomHolidays(_0x516747) {
  return (Array.isArray(_0x516747) ? _0x516747 : [])
    .filter(e => e && typeof e === "object")
    .map(_0x549e3e => ({
      id: _0x549e3e.i || _0x549e3e.id,
      name: _0x549e3e.n || _0x549e3e.name,
      emoji: _0x549e3e.e || _0x549e3e.emoji,
      m: _0x549e3e.m,
      d: _0x549e3e.d,
      rule: _0x549e3e.r || _0x549e3e.rule
    }));
}

function packSchoolEvents(_0x3a3ecb) {
  return (_0x3a3ecb || []).map(_0x3959d8 => ({
    i: _0x3959d8.id,
    s: _0x3959d8.startDate,
    e: _0x3959d8.endDate,
    t: _0x3959d8.title,
    k: _0x3959d8.kind
  }));
}

function unpackSchoolEvents(_0x3e29c6) {
  return (Array.isArray(_0x3e29c6) ? _0x3e29c6 : [])
    .filter(e => e && typeof e === "object")
    .map(_0x3800b7 => ({
      id: _0x3800b7.i || _0x3800b7.id,
      startDate: _0x3800b7.s || _0x3800b7.startDate,
      endDate: _0x3800b7.e || _0x3800b7.endDate,
      title: _0x3800b7.t || _0x3800b7.title,
      kind: _0x3800b7.k || _0x3800b7.kind
    }));
}

function packShareValue(_0x447674, _0x3edb5c) {
  if (_0x447674 === "baseWeekly" || _0x447674 === "baseBiweekly" || _0x447674 === "baseMonthly" || _0x447674 === "baseCycle") {
    return bitsToString(_0x3edb5c);
  }
  if (_0x447674 === "summerSelected") {
    return summerToString(_0x3edb5c);
  }
  if (_0x447674 === "activities") {
    return (_0x3edb5c || []).map(a => [a.id, a.date, a.time, a.title]);
  }
  if (_0x447674 === "customHolidays") {
    return packCustomHolidays(_0x3edb5c);
  }
  if (_0x447674 === "schoolCustomEvents") {
    return packSchoolEvents(_0x3edb5c);
  }
  return _0x3edb5c;
}

function unpackShareValue(_0x2e89b1, _0x58a4ae) {
  if (_0x2e89b1 === "baseWeekly") {
    return stringToBits(_0x58a4ae, 7);
  }
  if (_0x2e89b1 === "baseBiweekly") {
    return stringToBits(_0x58a4ae, 14);
  }
  if (_0x2e89b1 === "baseMonthly") {
    return stringToBits(_0x58a4ae, 35);
  }
  if (_0x2e89b1 === "baseCycle") {
    const text = String(_0x58a4ae || "").slice(0, 28);
    return stringToBits(text, text.length);
  }
  if (_0x2e89b1 === "summerSelected") {
    return stringToSummer(_0x58a4ae);
  }
  if (_0x2e89b1 === "activities") {
    return (Array.isArray(_0x58a4ae) ? _0x58a4ae : [])
      .filter(Array.isArray)
      .map(a => ({ id: a[0], date: a[1], time: a[2], title: a[3] }));
  }
  if (_0x2e89b1 === "customHolidays") {
    return unpackCustomHolidays(_0x58a4ae);
  }
  if (_0x2e89b1 === "schoolCustomEvents") {
    return unpackSchoolEvents(_0x58a4ae);
  }
  return _0x58a4ae;
}

// A calendar as the short object that goes into a share link: only what differs from the sample calendar.
function stateToShareObject(source, note) {
  const sample = sampleState();
  const out = { y: source.year };
  if (note) {
    out.sn = String(note).slice(0, 200);
  }
  Object.keys(SHARE_KEYS).forEach(key => {
    if (key === "year") {
      return;
    }
    if (!deepEqual(source[key], sample[key])) {
      out[SHARE_KEYS[key]] = packShareValue(key, source[key]);
    }
  });
  // summer weeks outside the original June to mid-August window (ids such as "may3") travel as a list
  const extra = Object.keys(source.summerSelected || {})
    .filter(id => source.summerSelected[id] && SUMMER_IDS.indexOf(id) < 0)
    .sort();
  if (extra.length) {
    out.zi = extra.join(",");
  }
  return out;
}

function shareObjectToState(share) {
  const out = {};
  if (!share || typeof share !== "object") {
    return out;
  }
  Object.keys(share).forEach(shortKey => {
    const key = SHARE_KEYS_REVERSE[shortKey];
    if (!key) {
      return;
    }
    out[key] = unpackShareValue(key, share[shortKey]);
  });
  if (typeof share.sn === "string") {
    out.shareNote = share.sn.slice(0, 200);
  }
  if (typeof share.zi === "string") {
    const base = out.summerSelected || Object.assign({}, sampleState().summerSelected);
    share.zi
      .slice(0, 200)
      .split(",")
      .forEach(id => {
        if (isSummerWeekId(id)) {
          base[id] = true;
        }
      });
    out.summerSelected = base;
  }
  return out;
}

function isSummerWeekId(id) {
  return typeof id === "string" && /^(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[1-5]$/.test(id);
}

function bytesToBase64Url(_0x182926) {
  let _0x3e3738 = "";
  const _0x530e0f = 32768;
  for (let _0x343758 = 0; _0x343758 < _0x182926.length; _0x343758 += _0x530e0f) {
    _0x3e3738 += String.fromCharCode.apply(null, _0x182926.subarray(_0x343758, _0x343758 + _0x530e0f));
  }
  return btoa(_0x3e3738).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function base64UrlToBytes(_0x2cdbbb) {
  _0x2cdbbb = String(_0x2cdbbb || "")
    .replace(/-/g, "+")
    .replace(/_/g, "/");
  while (_0x2cdbbb.length % 4) {
    _0x2cdbbb += "=";
  }
  const _0x279237 = atob(_0x2cdbbb);
  const _0x32af6d = new Uint8Array(_0x279237.length);
  for (let _0x236c47 = 0; _0x236c47 < _0x279237.length; _0x236c47++) {
    _0x32af6d[_0x236c47] = _0x279237.charCodeAt(_0x236c47);
  }
  return _0x32af6d;
}

async function deflateBytes(_0x495f04) {
  const _0x3c0e46 = new Blob([_0x495f04]).stream().pipeThrough(new CompressionStream("deflate-raw"));
  return new Uint8Array(await new Response(_0x3c0e46).arrayBuffer());
}

async function inflateBytes(_0x71f5b2) {
  const _0x407902 = new Blob([_0x71f5b2]).stream().pipeThrough(new DecompressionStream("deflate-raw"));
  return new Uint8Array(await new Response(_0x407902).arrayBuffer());
}

function utf8Encode(_0x473192) {
  return new TextEncoder().encode(_0x473192);
}

function utf8Decode(_0x449877) {
  return new TextDecoder().decode(_0x449877);
}

async function compressState(_0x51499b, note) {
  const _0x54a515 = JSON.stringify(stateToShareObject(_0x51499b, note));
  return deflateBytes(utf8Encode(_0x54a515));
}

async function decompressState(_0x26e879) {
  const _0x4aaffe = utf8Decode(await inflateBytes(_0x26e879));
  return shareObjectToState(JSON.parse(_0x4aaffe));
}

async function makeCompressedHash(_0x5c33d6, note) {
  const _0x4e7c72 = await compressState(_0x5c33d6, note);
  return "#c=" + bytesToBase64Url(_0x4e7c72);
}

async function readCompressedHash(_0x5ba85c) {
  const _0x47e2d1 = _0x5ba85c || location.hash || "";
  if (!_0x47e2d1.startsWith("#c=")) {
    throw new Error("not compressed");
  }
  return decompressState(base64UrlToBytes(_0x47e2d1.slice(3)));
}

async function deriveKey(_0x298dda, _0x471e5b, _0xf5f8ef) {
  const _0x47ad15 = await crypto.subtle.importKey(
    "raw",
    utf8Encode(_0x298dda),
    {
      name: "PBKDF2"
    },
    false,
    ["deriveKey"]
  );
  return crypto.subtle.deriveKey(
    {
      name: "PBKDF2",
      salt: _0x471e5b,
      iterations: _0xf5f8ef,
      hash: "SHA-256"
    },
    _0x47ad15,
    {
      name: "AES-GCM",
      length: 256
    },
    false,
    ["encrypt", "decrypt"]
  );
}

async function encryptBytes(_0x3bfab1, _0x7387f1) {
  const _0x4c7f19 = crypto.getRandomValues(new Uint8Array(16));
  const _0x5d7d55 = crypto.getRandomValues(new Uint8Array(12));
  const _0x1f9cf9 = await deriveKey(_0x7387f1, _0x4c7f19, PBKDF2_ITERATIONS);
  const _0x39defb = new Uint8Array(
    await crypto.subtle.encrypt(
      {
        name: "AES-GCM",
        iv: _0x5d7d55
      },
      _0x1f9cf9,
      _0x3bfab1
    )
  );
  const _0x2463bd = new Uint8Array(33 + _0x39defb.length);
  _0x2463bd[0] = 1;
  new DataView(_0x2463bd.buffer).setUint32(1, PBKDF2_ITERATIONS);
  _0x2463bd.set(_0x4c7f19, 5);
  _0x2463bd.set(_0x5d7d55, 21);
  _0x2463bd.set(_0x39defb, 33);
  return _0x2463bd;
}

async function decryptBytes(_0x10b2d5, _0x3602f9) {
  if (!_0x10b2d5 || _0x10b2d5.length < 34) {
    throw new Error("bad-link");
  }
  if (_0x10b2d5[0] !== 1) {
    throw new Error("bad-link");
  }
  const _0x2a7a72 = new DataView(_0x10b2d5.buffer, _0x10b2d5.byteOffset, _0x10b2d5.byteLength).getUint32(1);
  if (_0x2a7a72 < 200000 || _0x2a7a72 > 5000000) {
    throw new Error("bad-link");
  }
  const _0x4aae4c = _0x10b2d5.slice(5, 21);
  const _0x400e53 = _0x10b2d5.slice(21, 33);
  const _0x1d580e = _0x10b2d5.slice(33);
  const _0x3b4a4c = await deriveKey(_0x3602f9, _0x4aae4c, _0x2a7a72);
  try {
    return new Uint8Array(
      await crypto.subtle.decrypt(
        {
          name: "AES-GCM",
          iv: _0x400e53
        },
        _0x3b4a4c,
        _0x1d580e
      )
    );
  } catch {
    const _0x19aa64 = new Error("wrong-passcode");
    _0x19aa64.code = "wrong-passcode";
    throw _0x19aa64;
  }
}

async function makeLockedHash(_0x4d7d2c, _0x55addc, note) {
  const _0x26e9d9 = await encryptBytes(await compressState(_0x4d7d2c, note), _0x55addc);
  return "#p=" + bytesToBase64Url(_0x26e9d9);
}

async function readLockedHash(_0x109ec8, _0x569f2c) {
  const _0x167d32 = _0x109ec8 || location.hash || "";
  if (!_0x167d32.startsWith("#p=")) {
    throw new Error("not locked");
  }
  return decompressState(await decryptBytes(base64UrlToBytes(_0x167d32.slice(3)), _0x569f2c));
}
