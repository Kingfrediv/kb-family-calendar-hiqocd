const GUMROAD_PRODUCT_ID = "ny82-fb3rtC1iKNmDvO7bQ==";

const BUY_URL = "https://maysiv.gumroad.com/l/cihrf";

const MAX_DEVICES = 3;

const LICENSE_STORAGE_KEY = "kb_license_v1";

const LICENSE_RECHECK_MS = 604800000;

const GUMROAD_VERIFY_URL = "https://api.gumroad.com/v2/licenses/verify";

const MONTH_NAMES = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December"
];

const MONTH_SHORT = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

const DOW_2 = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];

const DOW_3 = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

const DOW_FULL = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

const DEFAULT_NOTES =
  "• Phone / Video Chat: Reasonable daily call or video chat on non-custodial evenings.\n• Snow Days & Teacher Workdays: Follow the regular overnight schedule unless agreed otherwise.\n• Travel Notice: At least 14 days' notice with itinerary if traveling out of state.\n• Right of First Refusal: Offer the other parent the first option before using a babysitter for 4+ hours.";

function emptyMonthlyPattern() {
  return new Array(35).fill(false);
}

function sampleMonthlyPattern() {
  const _0x3ca284 = [];
  for (let _0x41883f = 0; _0x41883f < 5; _0x41883f++) {
    for (let _0x3e358a = 0; _0x3e358a < 7; _0x3e358a++) {
      _0x3ca284.push(_0x3e358a === 3 || _0x3e358a === 4 || _0x3e358a === 5);
    }
  }
  return _0x3ca284;
}

function emptySummerSelection() {
  return {
    jun1: false,
    jun2: false,
    jun3: false,
    jun4: false,
    jun5: false,
    jul1: false,
    jul2: false,
    jul3: false,
    jul4: false,
    jul5: false,
    aug1: false,
    aug2: false
  };
}

function isValidMonthDay(_0x1eb760, _0x3e6d31) {
  return (
    _0x1eb760 != null &&
    _0x3e6d31 != null &&
    _0x1eb760 !== "" &&
    _0x3e6d31 !== "" &&
    Number.isFinite(Number(_0x1eb760)) &&
    Number.isFinite(Number(_0x3e6d31)) &&
    Number(_0x3e6d31) >= 1
  );
}

function formatMonthDay(_0x275dcc, _0x1f4eb5) {
  if (isValidMonthDay(_0x275dcc, _0x1f4eb5)) {
    return `${MONTH_SHORT[Number(_0x275dcc)]} ${Number(_0x1f4eb5)}`;
  } else {
    return "";
  }
}

// ---- storage keys and file formats added after the first release (all constants live here so they exist before anything runs)
const PROFILES_KEY = "kb_profiles_v1";
const ACTIVE_CALENDAR_KEY = "kb_active_v1";
const PREFS_KEY = "kb_prefs_v1";
const LAST_BACKUP_KEY = "kb_last_backup_v1";
const PRE_RESTORE_KEY = "kb_pre_restore_v1";
const BACKUP_APP = "kb-parenting-calendar";
const BACKUP_FORMAT = 1;
const MAX_CALENDARS = 12;
