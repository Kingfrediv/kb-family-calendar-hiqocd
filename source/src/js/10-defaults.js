function defaultState() {
  return {
    savedAt: 0,
    fileId: "",
    setupComplete: false,
    childName: "",
    p1Name: "Parent 1",
    p2Name: "Parent 2",
    p1Color: "#eab308",
    p2Color: "#16a34a",
    headerColor: "#18181b",
    titleEmoji: "🐝",
    summerEmoji: "🌻",
    schoolEmoji: "📚",
    baseMode: "weekly",
    weekStartsMonday: false,
    scheduleUnset: true,
    baseWeekly: new Array(7).fill(false),
    baseBiweekly: new Array(14).fill(false),
    biweeklyAnchor: "2026-01-04",
    baseMonthly: emptyMonthlyPattern(),
    bdayChildM: null,
    bdayChildD: null,
    bdayP1M: null,
    bdayP1D: null,
    bdayP2M: null,
    bdayP2D: null,
    year: new Date().getFullYear(),
    showSplitDays: true,
    evenGroupAP1: true,
    holidaysOverrideSummer: true,
    summerEnabled: true,
    summerRestP2: false,
    viewMode: "year",
    selectedMonth: 0,
    sidebarHidden: false,
    timeToP1: "",
    timeToP2: "",
    timeHoliday: "",
    exchangeLocation: "",
    summerDeadline: "April 1",
    summerFirstPick: "evenP1",
    summerSelected: emptySummerSelection(),
    schoolEndByYear: {},
    schoolStartByYear: {},
    springBreakByYear: {},
    schoolName: "",
    schoolUrl: "",
    schoolNotes: "",
    schoolCustomEvents: [],
    customHolidays: [],
    disabledHolidays: {
      parentsDay: true,
      juneteenth: true,
      indigenousDay: true
    },
    disabledByYear: {},
    holidayYearOverrides: {},
    overrides: {},
    mothersDayOwner: "skip",
    fathersDayOwner: "skip",
    agreementNotes: "",
    // ---- added in the second release. Defaults here are also what share links assume (see sampleState),
    // ---- so a default must never change once released.
    region: "us",
    longWeekends: false,
    splitChristmas: false,
    holidayFlip: {},
    packs: { jewish: "off", islamic: "off", hindu: "off", chinese: "off" },
    summerStart: "06-01",
    summerEnd: "08-14",
    winterStartDay: 20,
    winterEndDay: 2,
    cycleLength: 14,
    baseCycle: new Array(14).fill(false),
    cycleAnchor: "2026-01-04",
    // ---- third release
    dayNotes: {},
    activities: [],
    showInitials: false
  };
}

function sampleState() {
  return Object.assign(defaultState(), {
    summerEnabled: true,
    summerRestP2: true,
    scheduleUnset: false,
    baseWeekly: [false, false, false, true, true, true, false],
    baseBiweekly: [false, false, false, true, true, true, false, false, false, false, true, true, true, false],
    baseMonthly: sampleMonthlyPattern(),
    bdayChildM: 0,
    bdayChildD: 25,
    bdayP1M: 4,
    bdayP1D: 24,
    bdayP2M: 1,
    bdayP2D: 15,
    timeToP1: "After school (or 9:00 AM on breaks)",
    timeToP2: "6:00 PM",
    timeHoliday: "6:00 PM (or 9:00 AM day-of)",
    exchangeLocation: "School / Receiving parent's home",
    summerSelected: {
      jun1: true,
      jun2: false,
      jun3: true,
      jun4: true,
      jun5: false,
      jul1: false,
      jul2: true,
      jul3: true,
      jul4: true,
      jul5: false,
      aug1: true,
      aug2: false
    },
    agreementNotes: DEFAULT_NOTES
  });
}

// A made-up family for the free demo (?demo). Nothing here is real, and nothing in the demo is saved.
function demoFamilyState() {
  const now = new Date();
  const y = now.getFullYear();
  const ymd = (m, d) => `${y}-${String(m).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
  return {
    year: y,
    selectedMonth: now.getMonth(),
    childName: "Riley",
    p1Name: "Alex",
    p2Name: "Sam",
    setupComplete: true,
    schoolName: "Maple Elementary",
    schoolNotes: "Early release Wednesdays.",
    dayNotes: { [ymd(now.getMonth() + 1, Math.min(now.getDate() + 2, 28))]: "Dentist at 4. Alex brings the insurance card." },
    activities: [
      { id: "demo1", date: ymd(now.getMonth() + 1, Math.min(now.getDate() + 1, 28)), time: "16:30", title: "Soccer practice" },
      { id: "demo2", date: ymd(now.getMonth() + 1, Math.min(now.getDate() + 3, 28)), time: "10:00", title: "Birthday party" }
    ],
    agreementNotes:
      "This is a sample family so you can try the calendar. Tap any day to see who has it and why. Nothing here is saved, and your own calendar needs a license."
  };
}

function mergeStates(_0x47eeff, _0x135a43) {
  const _0x2aa056 = Object.assign({}, _0x47eeff, _0x135a43);
  if (!_0x135a43 || !Object.prototype.hasOwnProperty.call(_0x135a43, "scheduleUnset")) {
    _0x2aa056.scheduleUnset = false;
  }
  delete _0x2aa056.demoSample;
  return _0x2aa056;
}
