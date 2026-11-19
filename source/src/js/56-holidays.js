// ---------------------------------------------------------------------------------------------
// Turns HOLIDAY_DEFS, birthdays, packs and custom holidays into: map (date -> who has it and why)
// and summaryRows (one row per holiday for the table and the tiles).
// ---------------------------------------------------------------------------------------------

// Higher wins when two holidays share a night.
function holidayPriority(kind, owner, alwaysApplies, key) {
  if (kind === "birthday") {
    return 40;
  }
  if (owner === "both") {
    return 30;
  }
  if (alwaysApplies) {
    return 25;
  }
  if (key === "christmas" || key === "xmasEve" || key === "nye" || key === "newyears") {
    return 22;
  }
  if (kind === "holiday") {
    return 20;
  }
  if (kind === "break") {
    return 10;
  }
  return 15;
}

function isHolidayOff(year, key) {
  const id = `${year}:${key}`;
  if (Object.prototype.hasOwnProperty.call(state.disabledByYear || {}, id)) {
    return !!state.disabledByYear[id];
  }
  return kbOffByDefault(key);
}

// Whether a holiday starts out switched off (before the person has tapped its tile for a year).
function kbOffByDefault(key) {
  if (key === "mothersDay") {
    return (state.mothersDayOwner || "skip") === "skip";
  }
  if (key === "fathersDay") {
    return (state.fathersDayOwner || "skip") === "skip";
  }
  const flags = state.disabledHolidays || {};
  if (Object.prototype.hasOwnProperty.call(flags, key)) {
    return !!flags[key];
  }
  const def = defByKey(key);
  return !!(def && def.offByDefault);
}

function appreciationDayDefault(key) {
  const owner = (key === "mothersDay" ? state.mothersDayOwner : state.fathersDayOwner) || "skip";
  return owner === "skip" ? "both" : owner;
}

// ---- alternating holidays ---------------------------------------------------------------------

function rotationGroup(def) {
  const group = def.rotate.group;
  return typeof group === "function" ? group() : group;
}

// Who has an alternating holiday in the given year, after any "swap years" flip.
function rotationDefault(def, year) {
  let owner = rotationOwner(year + (def.rotate.offset || 0), rotationGroup(def));
  if (state.holidayFlip && state.holidayFlip[def.key]) {
    owner = owner === "p1" ? "p2" : "p1";
  }
  return owner;
}

function rotationText(def) {
  return `${ownerLabel(rotationDefault(def, 2026))} in even years, ${ownerLabel(rotationDefault(def, 2027))} in odd years`;
}

function textOrCall(value) {
  return typeof value === "function" ? value() : value;
}

// ---- the builder ------------------------------------------------------------------------------

function buildHolidays(year) {
  const memo = yearMemoFor();
  if (memo.holidays[year]) {
    return memo.holidays[year];
  }
  const map = {};
  const rows = [];
  const p1 = p1Name();
  const p2 = p2Name();

  function add({ key, start, len = 1, defaultOwner, label, shortName, icon, kind, ruleDesc, fixed = false, alwaysApplies = false, rotates = false, flipped = false }) {
    const off = isHolidayOff(year, key);
    const yearOverride = state.holidayYearOverrides[`${year}:${key}`];
    const owner = yearOverride || defaultOwner;
    const priority = holidayPriority(kind, owner, alwaysApplies, key);
    let note = "";
    if (!off) {
      for (let i = 0; i < len; i++) {
        const ds = addDays(start, i);
        if (!ds.startsWith(`${year}-`)) {
          continue;
        }
        const date = parseDateStr(ds);
        const month0 = date.getMonth();
        const day = date.getDate();
        const inSummer = state.summerEnabled && inSummerWindow(month0, day);
        if (inSummer && !state.holidaysOverrideSummer && key === "july4" && summerWeekSelected(month0, day)) {
          note = `(Summer week keeps it: ${ownerLabel("p1")})`;
        } else if (map[ds] && (map[ds].pri || 0) > priority) {
          note += `${note ? " " : ""}(Calendar uses ${map[ds].label} on this date)`;
        } else {
          const displaced = map[ds] ? map[ds].label : "";
          map[ds] = { owner, label, icon, kind, alwaysApplies, pri: priority, displaced };
          if (displaced) {
            note += `${note ? " " : ""}(Overrides ${displaced})`;
          }
        }
      }
    }
    rows.push({
      key,
      name: label,
      shortName: shortName || label,
      icon,
      dates: len > 1 ? `${start} to ${addDays(start, len - 1)}` : start,
      rule: (yearOverride ? `Custom (${ruleDesc})` : ruleDesc) + (note ? " " + note.trim() : ""),
      owner,
      disabled: off,
      fixed,
      defaultOwner,
      conflict: note,
      rotates,
      flipped
    });
  }

  // birthdays always apply and always win
  if (isValidMonthDay(state.bdayChildM, state.bdayChildD)) {
    add({
      key: "bdayChild",
      start: clampedDateStr(year, Number(state.bdayChildM), Number(state.bdayChildD)),
      defaultOwner: "both",
      label: childBirthdayLabel(),
      shortName: childBirthdayLabel(),
      icon: "🎂",
      kind: "birthday",
      ruleDesc: "All Together (Shared)",
      fixed: true,
      alwaysApplies: true
    });
  }
  if (isValidMonthDay(state.bdayP2M, state.bdayP2D)) {
    add({
      key: "bdayP2",
      start: clampedDateStr(year, Number(state.bdayP2M), Number(state.bdayP2D)),
      defaultOwner: "p2",
      label: `${p2}'s Birthday`,
      shortName: `${p2}'s B-Day`,
      icon: "🎁",
      kind: "birthday",
      ruleDesc: `Always ${p2}`,
      fixed: true,
      alwaysApplies: true
    });
  }
  if (isValidMonthDay(state.bdayP1M, state.bdayP1D)) {
    add({
      key: "bdayP1",
      start: clampedDateStr(year, Number(state.bdayP1M), Number(state.bdayP1D)),
      defaultOwner: "p1",
      label: `${p1}'s Birthday`,
      shortName: `${p1}'s B-Day`,
      icon: "🎉",
      kind: "birthday",
      ruleDesc: `Always ${p1}`,
      fixed: true,
      alwaysApplies: true
    });
  }

  HOLIDAY_DEFS.forEach(def => {
    if (def.regions && def.regions.indexOf(state.region) < 0) {
      return;
    }
    let start = def.date(year);
    if (!start) {
      return;
    }
    let len = textOrCall(def.len) || 1;
    const longWeekend = !!(def.monday && state.longWeekends);
    if (longWeekend) {
      start = addDays(start, -2);
      len = 3;
    }
    let defaultOwner;
    let ruleDesc;
    if (def.rotate) {
      defaultOwner = rotationDefault(def, year);
      ruleDesc = rotationText(def);
    } else if (def.owner === "mothers" || def.owner === "fathers") {
      defaultOwner = appreciationDayDefault(def.owner === "mothers" ? "mothersDay" : "fathersDay");
      ruleDesc = defaultOwner === "both" ? "Together" : `Assigned ${ownerLabel(defaultOwner)}`;
    } else {
      defaultOwner = def.owner || "both";
      ruleDesc = def.rule || "Together";
    }
    add({
      key: def.key,
      start,
      len,
      defaultOwner,
      label: textOrCall(def.label),
      shortName: textOrCall(def.short),
      icon: def.icon,
      kind: def.kind,
      ruleDesc: ruleDesc + (longWeekend ? " — long weekend (Sat–Mon)" : ""),
      alwaysApplies: !!def.alwaysApplies,
      rotates: !!def.rotate,
      flipped: !!(state.holidayFlip && state.holidayFlip[def.key])
    });
  });

  // moving-date packs: how each is shared is a setting (alternate, always one parent, together)
  PACK_NAMES.forEach(pack => {
    const how = (state.packs || {})[pack] || "off";
    if (how === "off") {
      return;
    }
    PACK_DEFS[pack].items.forEach((item, index) => {
      packInstances(item, year).forEach((start, n) => {
        const key = `${pack}_${item.id}` + (n ? `_${n + 1}` : "");
        const def = { key, rotate: { group: index % 2 === 0 ? "A" : "B", offset: 0 } };
        let defaultOwner;
        let ruleDesc;
        if (how === "alt") {
          defaultOwner = rotationDefault(def, year);
          ruleDesc = rotationText(def);
        } else if (how === "both") {
          defaultOwner = "both";
          ruleDesc = "Together (50/50)";
        } else {
          defaultOwner = how;
          ruleDesc = `Always ${ownerLabel(how)}`;
        }
        add({
          key,
          start,
          len: item.len || 1,
          defaultOwner,
          label: item.label,
          shortName: item.short,
          icon: item.icon,
          kind: "holiday",
          ruleDesc,
          rotates: how === "alt",
          flipped: !!(state.holidayFlip && state.holidayFlip[key])
        });
      });
    });
  });

  (state.customHolidays || []).forEach(custom => {
    let defaultOwner = "both";
    let ruleDesc = "Together (50/50)";
    let rotates = false;
    const key = "cust_" + custom.id;
    if (custom.rule === "p1") {
      defaultOwner = "p1";
      ruleDesc = `Always ${p1}`;
    } else if (custom.rule === "p2") {
      defaultOwner = "p2";
      ruleDesc = `Always ${p2}`;
    } else if (custom.rule === "altA" || custom.rule === "altB") {
      const def = { key, rotate: { group: custom.rule === "altA" ? "A" : "B", offset: 0 } };
      defaultOwner = rotationDefault(def, year);
      ruleDesc = rotationText(def);
      rotates = true;
    }
    add({
      key,
      start: clampedDateStr(year, Number(custom.m), Number(custom.d)),
      defaultOwner,
      label: custom.name,
      shortName: custom.name,
      icon: (custom.emoji || "✨").trim() || "✨",
      kind: "holiday",
      ruleDesc,
      rotates,
      flipped: !!(state.holidayFlip && state.holidayFlip[key])
    });
  });

  const built = { map, summaryRows: rows };
  memo.holidays[year] = built;
  return built;
}
