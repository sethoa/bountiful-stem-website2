/* Teacher screens: 07 Class dashboard, 08 Student detail, 09 Assign pathways, Preview content (R5, R7, R8). */
(function (RP) {
  const { esc, icons, initials, fmtDate, relDays, pct, toISODate, parseISODate, DAY } = RP.util;
  const { C, pathway } = RP.content;
  const store = RP.store;
  const A = RP.analytics;
  const ui = RP.ui;
  const go = (...a) => RP.app.go(...a);

  function myClasses() {
    const u = store.currentUser();
    return u.role === "admin" ? store.classes() : store.classesForTeacher(u.userId);
  }
  function currentClass() {
    const list = myClasses();
    const pick = list.find(c => c.classId === RP.app.ui.classId) || list[0];
    if (pick) RP.app.ui.classId = pick.classId;
    return pick;
  }
  function classSelect(id) {
    const list = myClasses();
    const cur = currentClass();
    return `<div class="field" style="min-width:200px"><label for="${id}">Class</label>
      <select class="select" id="${id}" data-class-select>${list.map(c => `<option value="${esc(c.classId)}" ${c.classId === cur.classId ? "selected" : ""}>${esc(c.label)} · ${esc(c.term)}</option>`).join("")}</select></div>`;
  }
  function bindClassSelect(el, rerender) {
    const s = el.querySelector("[data-class-select]");
    if (s) s.addEventListener("change", () => { RP.app.ui.classId = s.value; rerender(); });
  }

  /* ---------- 07 Class dashboard ---------- */
  function chartSVG(buckets) {
    const W = 520, H = 210, L = 30, R = 8, T = 12, B = 26;
    const max = Math.max(4, ...buckets.map(b => b.count));
    const step = max <= 10 ? 2 : max <= 25 ? 5 : max <= 50 ? 10 : 20;
    const top = Math.ceil(max / step) * step;
    const iw = W - L - R, ih = H - T - B;
    const bw = iw / buckets.length;
    const y = v => T + ih - (v / top) * ih;
    let g = "";
    for (let v = 0; v <= top; v += step) {
      g += `<line class="${v === 0 ? "axis-line" : "grid-line"}" x1="${L}" x2="${W - R}" y1="${y(v)}" y2="${y(v)}"/>`;
      g += `<text x="${L - 6}" y="${y(v) + 4}" text-anchor="end">${v}</text>`;
    }
    buckets.forEach((b, i) => {
      const x = L + i * bw + bw * 0.18;
      const w = bw * 0.64;
      const today = i === buckets.length - 1;
      const label = `${fmtDate(b.day, { weekday: "short", month: "short", day: "numeric" })}: ${b.count} event${b.count === 1 ? "" : "s"}`;
      g += `<rect class="bar-hit" x="${L + i * bw}" y="${T}" width="${bw}" height="${ih}" tabindex="0" role="img" aria-label="${esc(label)}" data-label="${esc(label)}"/>`;
      g += `<rect class="bar-rect${today ? " today" : ""}" x="${x}" y="${y(b.count)}" width="${w}" height="${Math.max(0, T + ih - y(b.count))}" rx="2" pointer-events="none"/>`;
      if (i % 2 === buckets.length % 2 || today) {
        g += `<text x="${L + i * bw + bw / 2}" y="${H - 8}" text-anchor="middle">${today ? "Today" : fmtDate(b.day, { day: "numeric" })}</text>`;
      }
    });
    return `<svg class="chart" viewBox="0 0 ${W} ${H}" aria-label="Events per day, last 14 days">${g}</svg>`;
  }

  let sortState = { key: "name", dir: 1 };

  function dashboard(el) {
    const cls = currentClass();
    if (!cls) { el.innerHTML = `<div class="card empty">You do not have a class yet. Ask your admin to set one up.</div>`; return; }
    const st = A.classStats(cls.classId);
    const days = A.activityByDay(cls.classId, 14);
    const mp = A.moduleProgress(cls.classId);
    const kids = store.students(cls.classId);
    const total = days.reduce((n, d) => n + d.count, 0);

    el.innerHTML = `
      <div class="page-head">
        <div><div class="eyebrow">Class dashboard</div><h1 class="page-title">Who needs a hand?</h1></div>
        ${classSelect("dash-class")}
      </div>
      <div class="tiles">
        <div class="tile"><span class="tile-label">Participating</span><span class="tile-value">${st.participating} / ${st.size}</span>${ui.bar([{ value: st.size ? st.participating / st.size * 100 : 0 }], "Participating")}<span class="tile-note">Active in the last 7 days</span></div>
        <div class="tile"><span class="tile-label">Progressing</span><span class="tile-value">${pct(st.progressing)}</span>${ui.bar([{ value: st.progressing }], "Progressing")}<span class="tile-note">Of assigned pathways</span></div>
        <div class="tile"><span class="tile-label">Quiz average</span><span class="tile-value">${pct(st.quizAvg)}</span>${ui.bar([{ value: st.quizAvg || 0 }], "Quiz average")}<span class="tile-note">First tries</span></div>
        <div class="tile ${st.support.length ? "is-alert" : ""}"><span class="tile-label">Needs support</span><span class="tile-value">${st.support.length}</span>${ui.bar([{ value: st.size ? st.support.length / st.size * 100 : 0, cls: "accent" }], "Needs support")}<span class="tile-note">Quiz &lt;50%, 3+ fails, or 7 days idle</span></div>
      </div>
      <div class="dash-grid">
        <section class="card">
          <div class="card-head"><h2 class="card-title">Who needs support</h2><span class="pill ${st.support.length ? "pill-accent" : "pill-good"}">${st.support.length ? `${st.support.length} flagged` : "All on track"}</span></div>
          ${st.support.length ? st.support.map(s => `<div class="support-row">
              <span class="avatar">${esc(initials(s.user.name))}</span>
              <div class="meta"><strong>${esc(s.user.name)}</strong><span>${s.reasons.map(r => esc(r.text)).join(" · ")}</span></div>
              <button class="btn btn-sm" type="button" data-view="${s.user.userId}">View</button></div>`).join("")
            : `<p class="empty">Nobody is flagged right now. Students show up here when their quiz average drops under 50%, they fail 3 tries in a row, or they go 7 days without activity.</p>`}
        </section>
        <section class="card">
          <div class="card-head"><h2 class="card-title">Class activity</h2><span class="card-sub num">${total} events · last 14 days</span></div>
          ${chartSVG(days)}
          <p class="chart-readout" data-readout aria-live="polite">Hover or tab to a bar to see the count.</p>
        </section>
      </div>
      <section class="card">
        <div class="card-head"><h2 class="card-title">Progress by module</h2>
          <div class="legend"><span><i style="background:var(--ink)"></i>Done</span><span><i style="background:var(--accent)"></i>In progress</span></div></div>
        ${mp.map(m => `<div class="modprog"><span class="name" title="${esc(m.title)}">${esc(m.title)}</span>
          ${ui.bar([{ value: m.size ? m.done / m.size * 100 : 0, cls: "ink" }, { value: m.size ? m.doing / m.size * 100 : 0, cls: "accent" }], `${m.done} done, ${m.doing} in progress of ${m.size}`)}
          <span class="count">${m.done}/${m.size}</span></div>`).join("")}
      </section>
      <section class="stack">
        <div class="row-between"><h2 style="font-size:var(--fs-xl)">Roster</h2><span class="muted small">Select a column to sort. Select a student for details.</span></div>
        <div class="table-wrap" data-roster></div>
      </section>`;

    function drawRoster() {
      const rows = kids.map(k => {
        const s = A.studentStats(k.userId);
        const pids = store.assignments(cls.classId).map(a => a.pathwayId).filter(store.isPublished);
        const prog = pids.length ? pids.reduce((n, p) => n + A.pathwayPct(k.userId, p), 0) / pids.length : 0;
        return { k, s, prog, reasons: A.supportReasons(k.userId) };
      });
      const val = r => ({ name: r.k.name, progress: r.prog, quiz: r.s.quizAvg == null ? -1 : r.s.quizAvg, last: r.s.lastActive || 0, status: r.reasons.length })[sortState.key];
      rows.sort((a, b) => { const x = val(a), y = val(b); return (typeof x === "string" ? x.localeCompare(y) : x - y) * sortState.dir; });
      const th = (key, label, num) => `<th class="${num ? "num" : ""}" aria-sort="${sortState.key === key ? (sortState.dir > 0 ? "ascending" : "descending") : "none"}"><button class="sort-btn" type="button" data-sort="${key}" ${sortState.key === key ? "aria-sort" : ""}>${label}${sortState.key === key ? (sortState.dir > 0 ? " ↑" : " ↓") : ""}</button></th>`;
      el.querySelector("[data-roster]").innerHTML = `<table class="table">
        <thead><tr>${th("name", "Student")}${th("progress", "Assigned progress", true)}${th("quiz", "Quiz avg", true)}${th("last", "Last active")}${th("status", "Status")}</tr></thead>
        <tbody>${rows.map(r => `<tr class="clickable" data-view="${r.k.userId}" tabindex="0" aria-label="Open ${esc(r.k.name)}">
          <td><span class="person"><span class="avatar">${esc(initials(r.k.name))}</span>${esc(r.k.name)}</span></td>
          <td class="num">${pct(r.prog)}</td>
          <td class="num">${pct(r.s.quizAvg)}</td>
          <td>${relDays(r.s.lastActive)}</td>
          <td>${r.reasons.length ? `<span class="pill pill-accent">Needs support</span>` : `<span class="pill pill-good">On track</span>`}${r.k.active ? "" : ` <span class="pill">Turned off</span>`}</td>
        </tr>`).join("")}</tbody></table>`;
    }
    drawRoster();

    const readout = el.querySelector("[data-readout]");
    el.querySelectorAll(".bar-hit").forEach(h => {
      const showIt = () => { readout.textContent = h.dataset.label; };
      h.addEventListener("mouseenter", showIt);
      h.addEventListener("focus", showIt);
    });
    el.addEventListener("click", e => {
      const s = e.target.closest("[data-sort]");
      if (s) { const k = s.dataset.sort; sortState = { key: k, dir: sortState.key === k ? -sortState.dir : 1 }; drawRoster(); el.querySelector(`[data-sort="${k}"]`).focus(); return; }
      const v = e.target.closest("[data-view]");
      if (v) detail(v.dataset.view);
    });
    el.addEventListener("keydown", e => {
      const v = e.target.closest("tr[data-view]");
      if (v && (e.key === "Enter" || e.key === " ")) { e.preventDefault(); detail(v.dataset.view); }
    });
    bindClassSelect(el, () => go("dashboard"));
  }

  /* ---------- 08 Student detail ---------- */
  function detail(userId) {
    const u = store.user(userId);
    const st = A.studentStats(userId);
    const reasons = A.supportReasons(userId);
    const mods = [];
    A.visiblePathways().forEach(pw => pw.modules.forEach(m => mods.push(m)));
    const refl = C.modules.map(m => ({ m, p: store.progress(userId, m.moduleId) })).filter(x => x.p && x.p.reflection);
    const statusPill = s => s.state === "done" ? `<span class="pill pill-good">Done</span>` : s.state === "doing" ? `<span class="pill pill-warn">In progress · step ${s.p.current}</span>` : `<span class="pill">Not started</span>`;
    ui.dialog({
      title: u.name,
      avatar: initials(u.name),
      body: `
        <div class="chips">
          ${reasons.length ? `<span class="pill pill-bad">Needs support</span>` : `<span class="pill pill-good">On track</span>`}
          ${reasons.map(r => `<span class="pill pill-warn">${esc(r.text)}</span>`).join("")}
          <span class="pill">Last active: ${esc(relDays(st.lastActive))}</span>
          <span class="pill">Quiz average ${pct(st.quizAvg)}</span>
        </div>
        <div class="table-wrap"><table class="table">
          <thead><tr><th>Module</th><th>Status</th><th class="num">Quiz</th></tr></thead>
          <tbody>${mods.map(m => { const s = A.moduleState(userId, m); return `<tr><td>${esc(C.byId[m].title)}</td><td>${statusPill(s)}</td><td class="num">${s.p && s.p.quiz.submitted ? s.p.quiz.score + "%" : "–"}</td></tr>`; }).join("")}</tbody>
        </table></div>
        <div class="stack"><h3 style="font-size:var(--fs-lg)">Reflections</h3>
          ${refl.length ? refl.map(x => `<div class="reflection"><strong>${esc(x.m.title)}</strong>${esc(x.p.reflection)}</div>`).join("") : `<div class="reflection">No reflections yet. They appear when ${esc(u.name.split(" ")[0])} finishes a module.</div>`}
        </div>
        <div class="stack"><h3 style="font-size:var(--fs-md)">Suggested next step</h3>
          ${A.suggestion(u).map(t => `<p class="next-step">${esc(t)}</p>`).join("")}
        </div>`
    });
  }

  /* ---------- 09 Assign pathways ---------- */
  let pendingRemove = null;

  function assign(el) {
    const cls = currentClass();
    if (!cls) { el.innerHTML = `<div class="card empty">You do not have a class yet.</div>`; return; }
    const list = store.assignments(cls.classId);
    const assigned = list.map(a => a.pathwayId);
    const options = A.visiblePathways();
    const firstFree = options.find(p => !assigned.includes(p.pathwayId));
    const defDue = toISODate(Date.now() + 7 * DAY);

    el.innerHTML = `
      <div class="page-head">
        <div><div class="eyebrow">${esc(cls.label)}</div><h1 class="page-title">Assign pathways</h1>
        <p class="page-lede">Students see assigned pathways first on their home screen, with the due date and your note.</p></div>
        ${classSelect("assign-class")}
      </div>
      <div class="two-col">
        <section class="card">
          <h2 class="card-title" style="margin-bottom:16px">New assignment</h2>
          <form class="form-grid" data-form novalidate>
            <div class="field"><label for="as-path">Pathway</label>
              <select class="select" id="as-path" name="pathway">${options.map(p => `<option value="${p.pathwayId}" ${firstFree && p.pathwayId === firstFree.pathwayId ? "selected" : ""}>${esc(p.title)} (${p.modules.length} module${p.modules.length === 1 ? "" : "s"})${assigned.includes(p.pathwayId) ? " · already assigned" : ""}</option>`).join("")}</select>
              <span class="field-hint">Only published pathways are listed. Your admin controls publishing.</span></div>
            <div class="field"><label for="as-due">Due date</label>
              <input class="input" type="date" id="as-due" name="due" value="${defDue}" min="${toISODate(Date.now())}"></div>
            <div class="field"><label for="as-note">Note to students</label>
              <input class="input" type="text" id="as-note" name="note" maxlength="140" placeholder="e.g. Finish before Thursday's build day"></div>
            <p class="field-error" data-err role="alert"></p>
            <div><button class="btn btn-primary btn-lg" type="submit">+ Assign to ${esc(cls.label)}</button></div>
          </form>
        </section>
        <section class="card">
          <h2 class="card-title" style="margin-bottom:4px">Current assignments</h2>
          ${list.length ? list.map(a => {
            const pw = pathway(a.pathwayId);
            const f = A.assignmentFinished(a);
            const hidden = !store.isPublished(a.pathwayId);
            return `<div class="assign-row">
              <div class="meta">
                <strong>${esc(pw.title)}</strong>
                <span class="small muted">Due ${fmtDate(a.due, { month: "short", day: "numeric", year: "numeric" })}${a.note ? ` · “${esc(a.note)}”` : ""}</span>
                ${hidden ? `<span class="pill pill-warn" style="align-self:flex-start">Hidden by admin · students can't see it</span>` : ""}
                <div class="row" style="gap:10px">${ui.bar([{ value: f.size ? f.done / f.size * 100 : 0 }], `${f.done} of ${f.size} finished`)}<span class="xsmall muted num">${f.done}/${f.size} finished</span></div>
              </div>
              ${pendingRemove === a.assignmentId
                ? `<div class="confirm-box"><span>Remove?</span><button class="btn btn-sm btn-danger" type="button" data-confirm="${a.assignmentId}">Remove</button><button class="btn btn-sm btn-ghost" type="button" data-cancel>Cancel</button></div>`
                : `<button class="btn btn-sm" type="button" data-remove="${a.assignmentId}">Remove</button>`}
            </div>`;
          }).join("") : `<p class="empty">Nothing assigned to ${esc(cls.label)} yet.</p>`}
        </section>
      </div>`;

    const form = el.querySelector("[data-form]");
    form.addEventListener("submit", e => {
      e.preventDefault();
      const err = el.querySelector("[data-err]");
      const pid = form.pathway.value;
      const due = form.due.value;
      if (!pid) { err.textContent = "Choose a pathway."; return; }
      if (assigned.includes(pid)) { err.textContent = `${pathway(pid).title} is already assigned to ${cls.label}. Remove it first to change the due date.`; return; }
      if (!due) { err.textContent = "Pick a due date."; form.due.focus(); return; }
      if (parseISODate(due).getTime() < parseISODate(toISODate(Date.now())).getTime()) { err.textContent = "The due date is in the past. Pick today or later."; form.due.focus(); return; }
      store.addAssignment({ classId: cls.classId, pathwayId: pid, due, note: form.note.value.trim(), createdBy: store.currentUser().userId });
      ui.toast(`Assigned ${pathway(pid).title} to ${cls.label}`);
      go("assign");
    });
    el.addEventListener("click", e => {
      const t = e.target.closest("button");
      if (!t) return;
      if (t.dataset.remove) { pendingRemove = t.dataset.remove; go("assign"); document.querySelector("[data-cancel]")?.focus(); }
      else if (t.hasAttribute("data-cancel")) { pendingRemove = null; go("assign"); }
      else if (t.dataset.confirm) {
        const a = store.assignments(cls.classId).find(x => x.assignmentId === t.dataset.confirm);
        store.removeAssignment(t.dataset.confirm);
        pendingRemove = null;
        ui.toast(`Removed ${pathway(a.pathwayId).title}`);
        go("assign");
      }
    });
    bindClassSelect(el, () => go("assign"));
  }

  /* ---------- Preview content ---------- */
  function preview(el) {
    el.innerHTML = `
      <div class="page-head"><div><div class="eyebrow">Preview content</div><h1 class="page-title">See what students see</h1>
      <p class="page-lede">Open any step of any module. Preview never saves progress or sends events to the dashboard.</p></div></div>
      <div class="stack" style="gap:18px">${C.pathways.map(pw => `
        <article class="pathway-card">
          <div class="pathway-top"><div style="min-width:0;flex:1"><h3>${esc(pw.title)}</h3><p>${esc(pw.summary)}</p></div>
            ${store.isPublished(pw.pathwayId) ? `<span class="pill pill-good">Published</span>` : `<span class="pill pill-warn">Hidden from students</span>`}</div>
          ${pw.modules.map(mid => `<div class="mod-row pv">
            <span class="course-icon">${RP.content.moduleNumber(mid)}</span>
            <div class="meta"><strong>${esc(C.byId[mid].title)}</strong><span>${RP.content.stepNames(mid).map((s, i) => `${i + 1}. ${esc(s)}`).join(" · ")}</span></div>
            <button class="btn btn-sm" type="button" data-pv="${mid}" data-step="1">Lesson</button>
            <button class="btn btn-sm" type="button" data-pv="${mid}" data-step="3">Activity</button>
            <button class="btn btn-sm" type="button" data-pv="${mid}" data-step="4">Quiz</button>
          </div>`).join("")}
        </article>`).join("")}</div>`;
    el.addEventListener("click", e => {
      const b = e.target.closest("[data-pv]");
      if (b) go("previewModule", { mid: b.dataset.pv, step: +b.dataset.step, preview: true });
    });
  }

  RP.teacher = { dashboard, detail, assign, preview };
})(window.RP);
