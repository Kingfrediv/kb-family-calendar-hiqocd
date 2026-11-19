// Spanish for sentences that have names, dates and numbers in them. Each rule is [pattern, builder]; the builder gets the
// captured parts. T() translates a part that is itself English text; names and dates are used as they are.

const T = text => tr(text);

// the person a night belongs to, as it reads in Spanish
function esWho(who) {
  if (who === "Unassigned") {
    return "sin asignar";
  }
  if (who === "Together" || who === "Both") {
    return "juntos";
  }
  return "con " + who;
}

// reasons shown for a day: "Base (X)", "X → Y", "Spring Break (2nd Week)", "Thanksgiving Break (Wed–Sun) (X)", ...
function esReason(text) {
  const direct = tr(text, true);
  if (direct !== text) {
    return direct;
  }
  const withLabel = /^(.*) \(([^()]*)\)$/.exec(text);
  if (withLabel) {
    const head = tr(withLabel[1], true);
    if (head !== withLabel[1]) {
      return head + " (" + withLabel[2] + ")";
    }
  }
  return T(text);
}

// the ending of a rule line: "(Calendar uses X on this date)", "(Overrides X)", "— long weekend (Sat–Mon)"
function esRuleTail(tail) {
  return tail
    .replace(/ \(Calendar uses (.+?) on this date\)/g, (m, name) => " (El calendario usa " + T(name) + " en esta fecha)")
    .replace(/ \(Overrides (.+)\)$/, (m, name) => " (Reemplaza " + T(name) + ")")
    .replace(/ — long weekend \(Sat–Mon\)/, " — fin de semana largo (sáb–lun)");
}

ES_RULES.push(
  // ---- a day in the calendar: "Fri, 6 mar: Avery overnight — Base (Avery). Has a note. 1 plan. Press Enter to open this day."
  [
    /^(.+?): (.+?) overnight — (.+)$/,
    (date, who, rest) => {
      let press = false;
      let note = false;
      let plans = 0;
      if (rest.endsWith(". Press Enter to open this day.")) {
        press = true;
        rest = rest.slice(0, -". Press Enter to open this day.".length);
      }
      const p = /\. (\d+) plans?$/.exec(rest);
      if (p) {
        plans = Number(p[1]);
        rest = rest.slice(0, p.index);
      }
      if (rest.endsWith(". Has a note")) {
        note = true;
        rest = rest.slice(0, -". Has a note".length);
      }
      return (
        `${date}: noche ${esWho(who)} — ${esReason(rest)}` +
        (note ? ". Tiene una nota" : "") +
        (plans ? `. ${plans} ${plans === 1 ? "plan" : "planes"}` : "") +
        (press ? ". Pulsa Intro para abrir este día." : "")
      );
    }
  ],
  [/^Base \((.+)\)$/, name => `Base (${name})`],
  [/^(.+) → (.+)$/, (a, b) => `${a} → ${b}`],
  [/^(.+) Summer Time$/, who => `Verano de ${who}`],
  [/^(.+) Summer Week$/, who => `Semana de verano de ${who}`],
  [/^(Thanksgiving Break \(Wed–Sun\)) \((.+)\)$/, (name, who) => `${T(name)} (${who})`],

  // ---- the weekly pattern chips
  [/^([^:]{2,4}): not set$/, d => `${d}: sin definir`],
  [/^([^:]{2,4}): overnight with (.+)$/, (d, who) => `${d}: noche con ${who}`],
  [/^([^:]{2,4}): Full day & overnight with (.+)$/, (d, who) => `${d}: día completo y noche con ${who}`],
  [/^([^:]{2,4}): Morning (.+) → Overnight (.+)$/, (d, a, b) => `${d}: mañana con ${a} → noche con ${b}`],
  [/^Day (\d+): overnight with (.+)$/, (n, who) => `Día ${n}: noche con ${who}`],
  [/^Day (\d+) of the cycle: (.+)$/, (n, who) => `Día ${n} del ciclo: ${who}`],

  // ---- Tonight
  [/^Tonight: (.+)\. Open today\.$/, who => `Esta noche: ${who === "together" ? "juntos" : who}. Abrir hoy.`],

  // ---- the day sheet
  [/^(.+) has the overnight\.$/, who => `${who} tiene la noche.`],
  [/^Set by hand \(the usual schedule gives it to (.+)\)\.$/, who => `Cambiado a mano (el horario habitual se la da a ${who}).`],
  [/^(.+): a holiday or break, which comes before the usual schedule\.$/, name => `${T(name)}: un festivo o vacaciones, que tienen prioridad sobre el horario habitual.`],
  [/^(.+): a school-calendar entry given to (.+)\.$/, (name, who) => `${name}: una fecha del calendario escolar asignada a ${who}.`],
  [/^Summer week chosen by (.+)\.$/, who => `Semana de verano elegida por ${who}.`],
  [/^Summer: weeks (.+) did not pick go to (.+)\.$/, (a, b) => `Verano: las semanas que ${a} no eligió son para ${b}.`],
  [/^Exchange: time not set\.$/, () => "Intercambio: hora sin definir."],
  [/^Exchange: (.+?)(?: at (.+))?\.$/, (when, where) => `Intercambio: ${T(when)}${where ? " en " + where : ""}.`],
  [/^Tomorrow:$/, () => "Mañana:"],
  [/^Next exchange:$/, () => "Próximo intercambio:"],
  [/^Remove plan: (.+)$/, t => `Quitar el plan: ${t}`],
  [/^Remove (.+)$/, t => `Quitar ${t}`],
  [/^Open (.+)$/, t => `Abrir ${t}`],
  [/^(\d+) days? picked: (.+)$/, (n, range) => `${n} ${n === "1" ? "día elegido" : "días elegidos"}: ${range}`],
  [/^(.+) picked\. Tap the last day, or choose now for just this day\.$/, d => `${d} elegido. Toca el último día, o elige ahora solo para este día.`],
  [/^(\d+) days? \((.+)\) set to (.+)\.$/, (n, range, who) => `${n} ${n === "1" ? "día" : "días"} (${range}) cambiados a ${who}.`],
  [/^Change request: (.+)$/, rest => `Solicitud de cambio: ${T(rest)}`],
  [/^Could we change (.+)\?$/, what => `¿Podemos cambiar ${what}?`],
  [/^Message from the sender: “(.+)”$/, text => `Mensaje de quien lo envió: “${text}”`],

  // ---- names in the settings
  [/^Always (.+)$/, who => `Siempre ${who}`],
  [/^No School \(With (.+)\)$/, who => `Sin clases (con ${who})`],
  [/^Alternates \(Even: (.+) \/ Odd: (.+)\)$/, (a, b) => `Alterna (pares: ${a} / impares: ${b})`],
  [/^Assigned (.+)$/, who => `Asignado a ${who}`],
  [/^(?:• )?To (.+):$/, (who, m) => `${/^•/.test(m) ? "• " : ""}A ${who}:`],
  [/^(.+) weekdays, (.+) weekends$/, (a, b) => `${a} entre semana, ${b} fines de semana`],
  [/^Weekend overnights with (.+)$/, who => `Noches de fin de semana con ${who}`],
  [/^(.+) has summer, except the weeks (.+) picks$/, (a, b) => `${a} tiene el verano, salvo las semanas que elige ${b}`],
  [/^Same parent Eve & Day$/, () => "Mismo progenitor en la víspera y el día"],
  [/^(.+) in even years, (.+) in odd years(.*)$/, (a, b, tail) => `${a} en años pares, ${b} en años impares${esRuleTail(tail)}`],
  [/^Custom \((.+) in even years, (.+) in odd years\)$/, (a, b) => `Personalizado (${a} en años pares, ${b} en años impares)`],
  [/^Swap who has (.+) in even and odd years$/, name => `Intercambiar quién tiene ${T(name)} en años pares e impares`],
  [/^Tap to cycle (.+)$/, name => `Toca para cambiar: ${T(name)}`],
  [/^(.+)'s Birthday(?: \((.+)\):)?$/, (name, date) => `Cumpleaños de ${name}${date ? " (" + date + "):" : ""}`],
  [/^\((.+)'s Birthday\)$/, name => `(Cumpleaños de ${name})`],
  [/^🐝 (.+)'s Parenting Schedule$/, name => `🐝 Horario de crianza de ${name}`],
  [/^(\d+) Parenting Calendar \((.+) & (.+)\) • Overnights, Holidays, Breaks & Birthdays$/, (y, a, b) => `Calendario de crianza ${y} (${a} y ${b}) • Noches, festivos, vacaciones y cumpleaños`],
  [/^(.+), signature$/, who => `${who}, firma`],
  [/^Prepared (.+?), (\d{4}) · (.+) schedule for (.+) and (.+)\. A planning calendar; it is not a court order\.$/, (d, y, kind, a, b) => `Preparado el ${d}, ${y} · horario ${kind} para ${a} y ${b}. Un calendario de planificación; no es una orden judicial.`],
  [/^(.+?) (\d+(?:\.\d+)?)n \((\d+)%\) • (.+?) (\d+(?:\.\d+)?)n \((\d+)%\)$/, (a, an, ap, b, bn, bp) => `${a} ${an}n (${ap}%) • ${b} ${bn}n (${bp}%)`],
  [/^Summer now runs (.+) – (.+), matching your school dates\.$/, (a, b) => `El verano ahora va del ${a} al ${b}, igual que tus fechas escolares.`],
  [/^(.+) \((.+)\) · Split (.+) \/ (.+) each$/, (a, b, c, d) => `${a} (${T(b)}) · Reparto ${c} / ${d} cada uno`],
  [/^(.+) · Split (.+) \/ (.+) each$/, (a, c, d) => `${a} · Reparto ${c} / ${d} cada uno`],
  [/^Added school date: (.+)$/, name => `Fecha escolar añadida: ${name}`],
  [/^Added holiday: (.+)$/, name => `Festivo añadido: ${name}`],
  [/^Removed holiday: (.+)$/, name => `Festivo quitado: ${name}`],
  [/^Plan added on (.+): (.+)$/, (d, t) => `Plan añadido el ${d}: ${t}`],
  [/^Note added on (.+)$/, d => `Nota añadida el ${d}`],
  [/^(.+): back to the usual schedule$/, d => `${d}: de vuelta al horario habitual`],
  [/^(.+): together$/, d => `${d}: juntos`],
  [/^Summer week (.+): given to (.+)$/, (w, who) => `Semana de verano ${w}: asignada a ${who}`],
  [/^(\S+, \d+ \S+): (.+)$/, (date, who) => `${date}: ${who}`],
  [/^→ (.+)$/, who => `→ ${who}`],
  [/^(\d+) \+ (\d+) \((.+) \/ (.+)\)$/, (a, b, p, q) => `${a} + ${b} (${p} / ${q})`],
  [/^\. (.+) \((.+)\):$/, (name, date) => `. ${name} (${date}):`],
  [/^Tap a day to see who has it and why, change it, or add a note or plan\. Choose “Select several days” there to give a trip or long weekend to (.+), (.+) or both in one go\.$/, (a, b) => `Toca un día para ver quién lo tiene y por qué, cambiarlo o añadir una nota o un plan. Elige «Elegir varios días» ahí para dar un viaje o un fin de semana largo a ${a}, ${b} o a los dos de una vez.`],
  [/^(.+ \d{4}): (.+)$/, (name, who) => `${T(name)}: ${who}`],
  [/^: (.+?) \(rest with (.+)\)\. Notice by$/, (list, who) => `: ${list} (el resto con ${who}). Aviso antes del`],
  [/^: none selected \(rest with (.+)\)\. Notice by$/, who => `: ninguna elegida (el resto con ${who}). Aviso antes del`],
  [/^— pick a preset or tap a day to give it to (.+)\.$/, who => `— elige un horario predefinido o toca un día para dárselo a ${who}.`],
  [/^Opened (.+)\.$/, name => `Se abrió ${name}.`],
  [/^Deleted (.+)\.$/, name => `Se eliminó ${name}.`],
  [/^e\.g\. (.+)$/, text => `p. ej. ${text}`],
  [/^(.+) (\d{4})$/, (name, y) => `${T(name)} ${y}`],

  // ---- comparing with a link (review) and the change history
  [/^(.+?): (.+) \(now (.+)\)$/, (d, a, b) => `${d}: ${tr(a, true)} (ahora ${b})`],
  [/^(.+?): note removed$/, d => `${d}: nota quitada`],
  [/^(.+?): (.+) removed$/, (d, what) => `${d}: ${tr(what, true)} quitado`],
  [/^(.+?): (.+) \(changed\)$/, (d, what) => `${d}: ${what} (cambiado)`],
  [/^(Holiday|School date): (.+) (added|removed|\(changed\))$/, (word, what, how) => `${T(word)}: ${what} ${how === "added" ? "añadido" : how === "removed" ? "quitado" : "(cambiado)"}`],
  [/^(.+?): given to (.+)$/, (what, who) => `${what}: asignada a ${who}`],
  [/^(.+?): taken off$/, what => `${what}: quitada`],
  [/^(.+): use theirs$/, title => `${T(title)}: usar lo del enlace`],
  [/^(\d+) days changed \((.+)\)$/, (n, range) => `${n} días cambiados (${range})`],
  [/^Note (added|edited|removed) on (.+)$/, (how, d) => `Nota ${how === "added" ? "añadida" : how === "edited" ? "editada" : "quitada"} el ${d}`],
  [/^Plan removed on (.+?): (.+)$/, (d, t) => `Plan quitado el ${d}: ${t}`],
  [/^Added (holiday|school date): (.+)$/, (w, name) => `${w === "holiday" ? "Festivo añadido" : "Fecha escolar añadida"}: ${name}`],
  [/^Removed (holiday|school date): (.+)$/, (w, name) => `${w === "holiday" ? "Festivo quitado" : "Fecha escolar quitada"}: ${name}`],
  [/^Applied (\d+) changes? from a shared link(?:: “(.+)”)?$/, (n, msg) => `Se aplicaron ${n} ${n === "1" ? "cambio" : "cambios"} de un enlace compartido${msg ? ": “" + msg + "”" : ""}`],
  [/^Applied (\d+) changes?\. Send your calendar back so the other parent has it too\.$/, n => `Se ${n === "1" ? "aplicó 1 cambio" : "aplicaron " + n + " cambios"}. Devuelve tu calendario para que el otro progenitor también lo tenga.`],
  [/^(?:Opened|Deleted) (.+)$/, name => name],

  // ---- the phone-calendar file
  [/^Overnight with (.+?)(?: — (.+))?$/, (who, event) => `Noche con ${who}${event ? " — " + T(event) : ""}`],
  [/^Together(?: — (.+))?$/, event => `Juntos${event ? " — " + T(event) : ""}`],
  [/^Exchange to (.+)$/, who => `Intercambio a ${who}`],
  [/^Handoff to (.+)\. Exchange time not set\.$/, who => `Cambio a ${who}. Hora del intercambio sin definir.`],
  [/^Handoff to (.+)\. Time:$/, who => `Cambio a ${who}. Hora:`],
  [/^Overnight: (.+)$/, who => `Noche: ${who}`],
  [/^Plan for (.+)$/, child => `Plan para ${child}`],
  [/^Events:$/, () => "Eventos:"],
  [/^Exchange location:$/, () => "Lugar del intercambio:"],
  [/^Note$/, () => "Nota"],
  [/^Handoff (.+)$/, reason => `Cambio ${esReason(reason)}`],

  // ---- tiles and chips that start with a picture
  [/^((?:\p{Extended_Pictographic}\uFE0F?)+|★) (.+)$/u, (icon, name) => `${icon} ${T(name)}`]
);
