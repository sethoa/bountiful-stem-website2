/* Student screens: 02 Home, Pathways, 03–05b Module steps, END Module complete, 06 My progress.
   The module view also runs teacher preview (R8) with saving and logging switched off. */
(function (RP) {
  const { esc, icons, fmtLongDate, fmtDate, parseISODate, daysBetween, pct } = RP.util;
  const { C, markdown, inline, pathway, pathwayOf, stepNames, minutes } = RP.content;
  const store = RP.store;
  const A = RP.analytics;
  const ui = RP.ui;
  const go = (...a) => RP.app.go(...a);

  /* ---------- small shared pieces ---------- */
  function miniMat(cfg, route) {
    const s = 24, n = 6, pad = 2;
    const shelves = new Set(cfg.shelves);
    const xy = cell => ({ x: "ABCDEF".indexOf(cell[0]), y: +cell.slice(1) - 1 });
    const cx = x => pad + x * s + s / 2, cy = y => pad + (n - 1 - y) * s + s / 2;
    let out = `<svg viewBox="0 0 ${n * s + pad * 2} ${n * s + pad * 2}" role="img" aria-label="Mat: start ${cfg.start}, flag ${cfg.goal}">`;
    for (let y = 0; y < n; y++) for (let x = 0; x < n; x++) {
      const name = "ABCDEF"[x] + (y + 1);
      out += `<rect x="${pad + x * s}" y="${pad + (n - 1 - y) * s}" width="${s}" height="${s}" fill="${shelves.has(name) ? "var(--line-soft)" : "var(--surface)"}" stroke="var(--line)" stroke-width="1"/>`;
    }
    out += `<rect x="${pad}" y="${pad}" width="${n * s}" height="${n * s}" fill="none" stroke="var(--ink)" stroke-width="2" rx="3"/>`;
    if (route) {
      const pts = route.map(c => { const p = xy(c); return `${cx(p.x)},${cy(p.y)}`; }).join(" ");
      out += `<polyline points="${pts}" fill="none" stroke="var(--accent)" stroke-width="2.5" stroke-dasharray="4 3" stroke-linecap="round" stroke-linejoin="round"/>`;
    }
    const g = xy(cfg.goal), st = xy(cfg.start);
    out += `<path d="M${cx(g.x) - 5} ${cy(g.y) + 8}V${cy(g.y) - 8}h10l-3 4 3 4h-10" fill="var(--accent)" stroke="var(--ink)" stroke-width="1.2" stroke-linejoin="round"/>`;
    out += `<rect x="${cx(st.x) - 7}" y="${cy(st.y) - 6}" width="14" height="12" rx="3" fill="var(--primary)"/>`;
    return out + "</svg>";
  }

  function dueState(a, uid) {
    if (A.pathwayDone(uid, a.pathwayId)) return { cls: "pill-good", text: "Finished" };
    const d = daysBetween(Date.now(), parseISODate(a.due).getTime());
    if (d < 0) return { cls: "pill-bad", text: `Overdue · was due ${fmtDate(a.due)}` };
    if (d <= 3) return { cls: "pill-accent", text: d === 0 ? "Due today" : `Due ${fmtDate(a.due)} · ${d} day${d === 1 ? "" : "s"} left` };
    return { cls: "pill-accent", text: `Due ${fmtDate(a.due)}` };
  }

  function moduleRow(uid, mid) {
    const mod = C.byId[mid];
    const s = A.moduleState(uid, mid);
    let meta, btn;
    if (s.state === "done") {
      meta = `Done${s.p.quiz.score != null ? ` · Quiz ${s.p.quiz.score}%` : ""}`;
      btn = `<button class="btn btn-sm" type="button" data-open="${mid}" data-step="1">Review</button>`;
    } else if (s.state === "doing") {
      meta = `Step ${s.p.current} of 5: ${esc(stepNames(mid)[s.p.current - 1])}`;
      btn = `<button class="btn btn-sm btn-primary" type="button" data-open="${mid}" data-step="${s.p.current}">Continue</button>`;
    } else {
      meta = `${minutes(mid)} min · 5 steps`;
      btn = `<button class="btn btn-sm" type="button" data-open="${mid}" data-step="1">Start</button>`;
    }
    return `<div class="mod-row">${ui.statusDot(s.state, s.pct)}<div class="meta"><strong>${esc(mod.title)}</strong><span>${meta}</span></div>${btn}</div>`;
  }

  function pathwayCard(uid, pw) {
    return `<article class="pathway-card">
      <div class="pathway-top">${ui.ring(A.pathwayPct(uid, pw.pathwayId))}
        <div style="min-width:0"><h3>${esc(pw.title)}</h3><p>${esc(pw.summary)}</p></div></div>
      ${pw.modules.map(mid => moduleRow(uid, mid)).join("")}
    </article>`;
  }

  function bindOpen(el) {
    el.addEventListener("click", e => {
      const b = e.target.closest("[data-open]");
      if (b) go("module", { mid: b.dataset.open, step: +b.dataset.step });
    });
  }

  /* ---------- 02 Student home ---------- */
  function home(el) {
    const u = store.currentUser();
    const first = u.name.split(" ")[0];
    const target = A.resumeTarget(u);
    const asg = store.assignments(u.classId).filter(a => store.isPublished(a.pathwayId));
    const assignedIds = asg.map(a => a.pathwayId);
    let pws = A.studentPathways(u).filter(pw => assignedIds.includes(pw.pathwayId) || pw.modules.some(m => A.moduleState(u.userId, m).state !== "new"));
    if (pws.length < 2) A.studentPathways(u).forEach(pw => { if (pws.length < 2 && !pws.includes(pw)) pws.push(pw); });
    pws = pws.slice(0, 2);

    let resume = "";
    if (target) {
      const pw = pathway(target.pid);
      const step = target.state === "doing" ? target.p.current : 1;
      resume = `<section class="resume" aria-label="Pick up where you left off">
        <div style="min-width:0">
          <div class="eyebrow">${target.state === "doing" ? "Pick up where you left off" : "Start something new"} · ${esc(pw.title)}</div>
          <h2>${esc(C.byId[target.mid].title)}</h2>
          <p>Step ${step} of 5: ${esc(stepNames(target.mid)[step - 1])}</p>
          ${ui.bar([{ value: target.pct }], `${target.pct}% of this module done`)}
        </div>
        <button class="btn btn-lg" type="button" data-open="${target.mid}" data-step="${step}">${icons.play} ${target.state === "doing" ? "Continue" : "Start"}</button>
      </section>`;
    } else {
      resume = `<section class="resume"><div><div class="eyebrow">All caught up</div><h2>You finished every published module.</h2><p>Open My progress to see your build log.</p></div><button class="btn btn-lg" type="button" data-go="progress">My progress</button></section>`;
    }

    el.innerHTML = `
      <div class="page-head"><div>
        <div class="eyebrow">${esc(fmtLongDate(Date.now()))}</div>
        <h1 class="page-title">Hi ${esc(first)}, ready to build?</h1>
      </div></div>
      ${resume}
      ${asg.map(a => {
        const pw = pathway(a.pathwayId);
        const d = dueState(a, u.userId);
        return `<div class="assign-banner">
          <span class="assign-icon">${icons.calendar}</span>
          <div class="meta"><strong>${esc(pw.title)} · assigned by your teacher</strong>
          <span>${a.note ? esc(a.note) : `${pw.modules.length} module${pw.modules.length === 1 ? "" : "s"} · ${Math.round(A.pathwayPct(u.userId, pw.pathwayId))}% done`}</span></div>
          <span class="pill ${d.cls}">${esc(d.text)}</span>
        </div>`;
      }).join("")}
      <div class="row-between"><h2 style="font-size:var(--fs-xl)">Your pathways</h2><button class="link-btn" type="button" data-go="pathways">See all →</button></div>
      <div class="pathway-grid">${pws.map(pw => pathwayCard(u.userId, pw)).join("")}</div>`;
    bindOpen(el);
    el.addEventListener("click", e => { const g = e.target.closest("[data-go]"); if (g) go(g.dataset.go); });
  }

  /* ---------- Pathways list ---------- */
  function pathways(el) {
    const u = store.currentUser();
    const pws = A.studentPathways(u);
    el.innerHTML = `
      <div class="page-head"><div><div class="eyebrow">Pathways</div><h1 class="page-title">Pick a pathway</h1>
      <p class="page-lede">Each module takes about 15 minutes: two short lessons, a robot activity, a quick check and a reflection.</p></div></div>
      <div class="stack" style="gap:18px">${pws.map(pw => pathwayCard(u.userId, pw)).join("") || `<div class="card empty">No pathways are published yet. Your teacher will let you know when one is ready.</div>`}</div>`;
    bindOpen(el);
  }

  /* ---------- 03–05b Module ---------- */
  const previewProgress = {};

  function module(el, params) {
    const mid = params.mid;
    const mod = C.byId[mid];
    const preview = !!params.preview;
    const u = store.currentUser();
    const pw = pathwayOf(mid);
    if (!mod) { el.innerHTML = `<div class="card empty">That module could not be found.</div>`; return; }
    if (!preview && !store.isPublished(pw.pathwayId)) { el.innerHTML = `<div class="card empty">This module is not available right now.</div>`; return; }

    const prog = preview
      ? (previewProgress[mid] = previewProgress[mid] || store.emptyProgress())
      : store.progress(u.userId, mid, true);
    const names = stepNames(mid);
    const maxOpen = () => preview ? 5 : Math.min(5, contiguousDone() + 1);
    function contiguousDone() { let n = 0; while (prog.stepsDone.includes(n + 1)) n++; return n; }

    let step = Math.max(1, Math.min(params.step || prog.current || 1, maxOpen()));
    const enteredAt = Date.now();
    let cleanupStep = null;

    const ctx = {
      uid: u.userId, mid, mod, prog, preview,
      save() { if (preview) return; prog.lastAt = Date.now(); store.save(); },
      log(ev) { if (preview) return; store.log({ userId: u.userId, classId: u.classId, moduleId: mid, ...ev }); },
      onChange() { drawFoot(); drawHead(); }
    };
    if (!preview && !prog.startedAt) { prog.startedAt = Date.now(); ctx.save(); }

    function completeStep(n) {
      if (preview || prog.stepsDone.includes(n)) return;
      prog.stepsDone.push(n);
      prog.stepsDone.sort((a, b) => a - b);
      ctx.log({ type: "step_complete", step: n });
      if (prog.stepsDone.length === 5 && !prog.completedAt) {
        prog.completedAt = Date.now();
        ctx.log({ type: "module_complete" });
      }
      ctx.save();
    }

    el.innerHTML = `
      ${preview ? `<div class="preview-banner" role="status"><strong>Preview</strong> You are seeing what students see. Nothing you do here is saved or sent to the dashboard.</div>` : ""}
      <nav class="crumbs" aria-label="Breadcrumb"><button type="button" data-crumb>← ${preview ? "Preview content" : "Pathways"}</button><span aria-hidden="true">/</span><span>${esc(pw.title)}</span></nav>
      <div class="page-head" style="align-items:center">
        <div><div class="eyebrow">${esc(pw.title)} · ${minutes(mid)} min</div><h1 class="page-title">${esc(mod.title)}</h1></div>
        <span class="pill pill-accent num" data-done-pill></span>
      </div>
      <ol class="stepper" data-stepper aria-label="Module steps"></ol>
      <section class="step-card" aria-live="off">
        <div class="step-body" data-body></div>
        <div class="step-foot" data-foot></div>
      </section>`;

    const bodyEl = el.querySelector("[data-body]");
    const footEl = el.querySelector("[data-foot]");

    function drawHead() {
      el.querySelector("[data-done-pill]").textContent = `${prog.stepsDone.length} of 5 steps done`;
      el.querySelector("[data-stepper]").innerHTML = names.map((nm, i) => {
        const n = i + 1;
        const done = prog.stepsDone.includes(n);
        const cls = n === step ? "current" : done ? "done" : "";
        const locked = n > maxOpen();
        return `<li><button type="button" class="step-chip ${cls}" data-step-go="${n}" ${locked ? "disabled" : ""} aria-current="${n === step ? "step" : "false"}" aria-label="Step ${n}: ${esc(nm)}${done ? ", done" : locked ? ", locked" : ""}">
          <span class="n">${done && n !== step ? icons.check : n}</span><span class="lbl">${esc(nm)}</span></button></li>`;
      }).join("");
    }

    function canAdvance() {
      if (preview) return true;
      if (step === 3) return !!prog.activity.passed;
      if (step === 4) return !!prog.quiz.submitted;
      return true;
    }

    function drawFoot() {
      const kind = C.stepKinds[step - 1];
      if (kind === "reflect") {
        footEl.innerHTML = `<button class="btn" type="button" data-back>${icons.arrowL} Back</button><span class="foot-note">${preview ? "Finishing is off in preview." : ""}</span>
          <button class="btn btn-primary" type="button" data-finish ${preview ? "disabled" : ""}>Finish module ${icons.arrowR}</button>`;
        updateFinish();
        return;
      }
      const ok = canAdvance();
      const note = !ok ? (step === 3 ? "Reach the goal to unlock Next." : "Submit the quiz to unlock Next.") : "";
      footEl.innerHTML = `<button class="btn" type="button" data-back>${icons.arrowL} Back</button>
        <span class="foot-note">${note}</span>
        <button class="btn btn-primary" type="button" data-next ${ok ? "" : "disabled"}>Next ${icons.arrowR}</button>`;
    }

    function updateFinish() {
      const b = footEl.querySelector("[data-finish]");
      const ta = bodyEl.querySelector("#reflection");
      if (b && ta && !preview) b.disabled = ta.value.trim().length < 20;
    }

    function keyIdea() {
      const cfg = C.activities[mid];
      const visual = cfg && cfg.type === "grid" ? miniMat(cfg) : "";
      return `<aside class="key-idea" aria-label="Key idea">
        ${visual}
        <div><h3>By the end you can</h3>
        <ul>${mod.learningOutcomes.map(o => `<li>${inline(o.replace(/^Learners will be able to /, "").replace(/^./, c => c.toUpperCase()))}</li>`).join("")}</ul></div>
      </aside>`;
    }

    function drawBody() {
      if (cleanupStep) { cleanupStep(); cleanupStep = null; }
      const kind = C.stepKinds[step - 1];
      const tags = { lesson: ["R1", "R2"], activity: ["R3", "R4"], quiz: ["R3", "R4"], reflect: ["R1", "R4"] }[kind];
      const label = { lesson: "Lesson", activity: "Activity", quiz: "Quiz", reflect: "Reflect" }[kind];
      const head = `<div class="step-kind"><span class="eyebrow">${label} · Step ${step} of 5</span>${tags.map(t => `<span class="req-tag" title="Requirement ${t}">${t}</span>`).join("")}</div>`;
      if (kind === "lesson") {
        const sec = mod.sections[step - 1];
        bodyEl.innerHTML = `${head}<h2>${esc(sec.heading)}</h2>
          <div class="lesson-grid"><div class="prose">${markdown(sec.body)}</div>${keyIdea()}</div>`;
      } else if (kind === "activity") {
        const cfg = C.activities[mid];
        bodyEl.innerHTML = `${head}<h2>${esc(cfg ? cfg.title : "Try it")}</h2><p class="muted" style="max-width:70ch">${esc(cfg ? cfg.brief : "")}</p><div data-activity></div>`;
        cleanupStep = RP.activities.activity(bodyEl.querySelector("[data-activity]"), ctx);
      } else if (kind === "quiz") {
        bodyEl.innerHTML = `${head}<h2>Quick check</h2><p class="muted">Check each answer to see feedback. Your score counts first tries.</p><div data-quiz class="stack" style="gap:18px"></div>`;
        RP.activities.quiz(bodyEl.querySelector("[data-quiz]"), ctx);
      } else {
        const asg = mod.assignments[0];
        const text = prog.reflection || prog.draft || "";
        bodyEl.innerHTML = `${head}<h2>Reflect: ${esc(asg.title)}</h2>
          <div class="lesson-grid">
            <div class="prose">${markdown(asg.instructions)}</div>
            <div class="field">
              <label for="reflection">Your reflection</label>
              <textarea class="textarea" id="reflection" rows="8" placeholder="Answer the questions your teacher will read: what you tried, what went wrong, what you changed." ${preview ? "disabled" : ""}>${esc(text)}</textarea>
              <span class="field-hint" data-chars></span>
            </div>
          </div>`;
        const ta = bodyEl.querySelector("#reflection");
        const chars = bodyEl.querySelector("[data-chars]");
        let t = null;
        const upd = () => {
          const n = ta.value.trim().length;
          chars.textContent = preview ? "Reflections are off in preview." : n < 20 ? `Write at least ${20 - n} more character${20 - n === 1 ? "" : "s"} to finish.` : prog.reflection ? "Saved. Your teacher can read this." : "Draft saved as you type.";
          updateFinish();
        };
        ta.addEventListener("input", () => {
          clearTimeout(t);
          t = setTimeout(() => { prog.draft = ta.value; ctx.save(); }, 300);
          upd();
        });
        upd();
      }
    }

    function show(n) {
      step = n;
      if (!preview) { prog.current = n; ctx.save(); }
      drawHead(); drawBody(); drawFoot();
      window.scrollTo({ top: 0, behavior: "auto" });
      const h = bodyEl.querySelector("h2");
      if (h) { h.setAttribute("tabindex", "-1"); h.focus({ preventScroll: true }); }
    }

    el.addEventListener("click", e => {
      const t = e.target.closest("button");
      if (!t) return;
      if (t.hasAttribute("data-crumb")) go(preview ? "preview" : "pathways");
      else if (t.dataset.stepGo) show(+t.dataset.stepGo);
      else if (t.hasAttribute("data-back")) { if (step > 1) show(step - 1); else go(preview ? "preview" : "pathways"); }
      else if (t.hasAttribute("data-next")) { completeStep(step); show(step + 1); }
      else if (t.hasAttribute("data-finish")) {
        const ta = bodyEl.querySelector("#reflection");
        const text = ta.value.trim();
        if (text.length < 20) return;
        const before = A.badges(u.userId);
        prog.reflection = text;
        prog.draft = "";
        ctx.log({ type: "reflection_submit", step: 5, length: text.length });
        completeStep(5);
        const after = A.badges(u.userId);
        go("complete", { mid, newBadges: [...after].filter(b => !before.has(b)) });
      }
    });

    show(step);
    return () => {
      if (cleanupStep) cleanupStep();
      if (!preview) {
        prog.timeMs = (prog.timeMs || 0) + Math.min(Date.now() - enteredAt, 20 * 60000);
        store.save();
      }
    };
  }

  /* ---------- END Module complete ---------- */
  function nextModuleFor(u, mid) {
    const pw = pathwayOf(mid);
    const i = pw.modules.indexOf(mid);
    for (const m of pw.modules.slice(i + 1)) if (A.moduleState(u.userId, m).state !== "done") return m;
    const t = A.resumeTarget(u);
    return t ? t.mid : null;
  }

  function complete(el, params) {
    const u = store.currentUser();
    const mod = C.byId[params.mid];
    const p = store.progress(u.userId, params.mid);
    const next = nextModuleFor(u, params.mid);
    const nb = (params.newBadges || []).map(id => C.badges.find(b => b.badgeId === id)).filter(Boolean);
    el.innerHTML = `
      <section class="card complete">
        <span class="pill pill-good">${icons.check} Module complete</span>
        <h2>${esc(mod.title)}</h2>
        <p class="muted">Your reflection is saved and your teacher can see your progress.</p>
        <div class="complete-stats">
          <div><strong class="num">5 / 5</strong><span>Steps</span></div>
          <div><strong class="num">${pct(p.quiz.score)}</strong><span>Quick check</span></div>
          <div><strong class="num">${Math.max(1, Math.round((p.timeMs || 0) / 60000))} min</strong><span>Time building</span></div>
        </div>
        ${nb.length ? `<div class="stack" style="align-items:center"><span class="eyebrow">New badge${nb.length > 1 ? "s" : ""}</span><div class="row">${nb.map(b => `<span class="pill pill-ink">${esc(b.title)}</span>`).join("")}</div></div>` : ""}
        <div class="row">
          ${next ? `<button class="btn btn-primary btn-lg" type="button" data-next>Next module: ${esc(C.byId[next].title)} ${icons.arrowR}</button>` : ""}
          <button class="btn btn-lg" type="button" data-home>Back to home</button>
          <button class="btn btn-lg btn-ghost" type="button" data-prog>See my progress</button>
        </div>
      </section>`;
    el.addEventListener("click", e => {
      if (e.target.closest("[data-next]")) go("module", { mid: next, step: 1 });
      if (e.target.closest("[data-home]")) go("home");
      if (e.target.closest("[data-prog]")) go("progress");
    });
  }

  /* ---------- 06 My progress ---------- */
  const badgeGlyph = {
    "first-run": '<path class="glyph" d="M16 15l10 7-10 7z"/>',
    "flag-finder": '<path class="glyph" d="M15 31V13M15 14h11l-3 4 3 4H15"/>',
    "bug-squasher": '<path class="glyph" d="M14 22l4 4 8-9"/>',
    "sharp-eye": '<path class="glyph" d="M11 22s4-6 10-6 10 6 10 6-4 6-10 6-10-6-10-6z"/><circle class="glyph" cx="21" cy="22" r="2.5"/>',
    "pathway-complete": '<path class="glyph" d="M21 13l2.6 5.4 5.9.8-4.3 4.1 1 5.8-5.2-2.8-5.2 2.8 1-5.8-4.3-4.1 5.9-.8z"/>'
  };

  function progress(el) {
    const u = store.currentUser();
    const st = A.studentStats(u.userId);
    const earned = A.badges(u.userId);
    const mods = [];
    A.visiblePathways().forEach(pw => pw.modules.forEach(m => mods.push({ m, pw })));
    el.innerHTML = `
      <div class="page-head"><div><div class="eyebrow">My progress</div><h1 class="page-title">Your build log</h1>
      <p class="page-lede">Everything you finish is saved here. Your teacher sees the same numbers.</p></div></div>
      <div class="tiles">
        <div class="tile"><span class="tile-label">Modules done</span><span class="tile-value">${st.modulesDone} / ${st.modulesTotal}</span></div>
        <div class="tile"><span class="tile-label">Quiz average</span><span class="tile-value">${pct(st.quizAvg)}</span><span class="tile-note">${st.quizCount} quick check${st.quizCount === 1 ? "" : "s"}</span></div>
        <div class="tile"><span class="tile-label">Time building</span><span class="tile-value">${st.timeMin} min</span></div>
        <div class="tile"><span class="tile-label">Steps finished</span><span class="tile-value">${st.stepsFinished}</span></div>
      </div>
      <h2 style="font-size:var(--fs-xl)">Badges</h2>
      <div class="badge-grid">${C.badges.map(b => {
        const has = earned.has(b.badgeId);
        return `<div class="badge ${has ? "earned" : ""}">
          <svg viewBox="0 0 42 46" aria-hidden="true"><path class="hex" d="M21 2l18 10v22L21 44 3 34V12z"/>${badgeGlyph[b.badgeId] || ""}</svg>
          <div><strong>${esc(b.title)}</strong><span>${has ? "Earned. " : "To earn: "}${esc(b.description)}</span></div></div>`;
      }).join("")}</div>
      <h2 style="font-size:var(--fs-xl)">Module log</h2>
      <div class="log-list">${mods.map(({ m, pw }) => {
        const s = A.moduleState(u.userId, m);
        const mod = C.byId[m];
        let meta = `${esc(pw.title)} · `;
        if (s.state === "done") meta += `Finished ${fmtDate(s.p.completedAt)} · Quiz ${pct(s.p.quiz.score)} · ${Math.max(1, Math.round(s.p.timeMs / 60000))} min`;
        else if (s.state === "doing") meta += `Step ${s.p.current} of 5 · ${s.done} done`;
        else meta += "Not started";
        const btn = s.state === "done" ? "Review" : s.state === "doing" ? "Continue" : "Start";
        return `<div class="log-row">${ui.statusDot(s.state, s.pct)}<div style="min-width:0"><strong>${esc(mod.title)}</strong><span>${meta}</span></div>
          <button class="btn btn-sm${s.state === "doing" ? " btn-primary" : ""}" type="button" data-open="${m}" data-step="${s.state === "doing" ? s.p.current : 1}">${btn}</button></div>`;
      }).join("")}</div>`;
    bindOpen(el);
  }

  RP.student = { home, pathways, module, complete, progress, miniMat, moduleRow };
})(window.RP);
