/* Interactive steps: robot grid, ordering, matching (step 3) and the quick check quiz (step 4).
   Instant feedback for every run and every answer (R3.2–R3.6); each action is logged (R4.1). */
(function (RP) {
  const { esc, icons } = RP.util;
  const { inline } = RP.content;
  const robot = RP.robot;

  /* ---------------- Robot grid ---------------- */
  function grid(el, ctx, cfg) {
    const a = ctx.prog.activity;
    let program = Array.isArray(a.program) ? a.program.slice() : (cfg.starterProgram || []).slice();
    let variable = a.variable != null ? a.variable : cfg.variable ? cfg.variable.initial : null;
    let loopCount = a.loopCount != null ? a.loopCount : cfg.loop ? cfg.loop.initial : null;
    let cancel = null;
    let running = false;

    el.innerHTML = `
      <div class="activity">
        <div>${robot.matHTML(cfg)}</div>
        <div class="prog-panel">
          <div class="row-between">
            <h3 class="card-title">Your program</h3>
            <span class="pill pill-warn num" data-count></span>
          </div>
          <div data-program></div>
          ${cfg.variable ? `<div class="stepper-num" role="group" aria-label="Variable ${esc(cfg.variable.name)}">
              <span class="lbl">let ${esc(cfg.variable.name)} =</span>
              <button type="button" data-var="-1" aria-label="Decrease ${esc(cfg.variable.name)}">–</button>
              <output data-var-out aria-live="polite"></output>
              <button type="button" data-var="1" aria-label="Increase ${esc(cfg.variable.name)}">+</button>
            </div>` : ""}
          <div class="stack" style="gap:8px">
            <span class="sub-label">Blocks · tap to add</span>
            <div class="palette" data-palette>
              ${cfg.palette.map(b => `<button type="button" data-add="${esc(b)}">${blockLabel(b)}</button>`).join("")}
            </div>
          </div>
          <div class="ctrl-row">
            <button type="button" class="btn btn-primary btn-lg" data-run>${icons.play} Run program</button>
            <button type="button" class="btn btn-lg" data-reset>${icons.reset} Reset robot</button>
            <button type="button" class="btn btn-lg btn-ghost" data-clear>Clear</button>
          </div>
          <div data-feedback aria-live="polite"></div>
        </div>
      </div>`;

    const mat = el.querySelector(".mat");
    const progEl = el.querySelector("[data-program]");
    const fb = el.querySelector("[data-feedback]");
    robot.resetMat(mat, cfg);

    function persist() {
      a.program = program.slice();
      a.variable = variable;
      a.loopCount = loopCount;
      ctx.save();
    }

    function drawProgram() {
      const blocks = program.map((b, i) => `<span class="block" data-i="${i}">${blockLabel(b)}<button type="button" class="x" data-del="${i}" aria-label="Remove ${esc(b)}, block ${i + 1}">×</button></span>`).join("")
        || `<span class="placeholder">Tap a block below to add it.</span>`;
      if (cfg.loop) {
        progEl.className = "program is-loop";
        progEl.innerHTML = `
          <div class="loop-head">repeat
            <span class="stepper-num" role="group" aria-label="Repeat count">
              <button type="button" data-loop="-1" aria-label="Fewer repeats">–</button>
              <output data-loop-out aria-live="polite">${loopCount}</output>
              <button type="button" data-loop="1" aria-label="More repeats">+</button>
            </span> {</div>
          <div class="loop-body">${blocks}</div>
          <div class="loop-close">}</div>`;
      } else {
        progEl.className = "program";
        progEl.innerHTML = blocks;
      }
      el.querySelector("[data-count]").textContent = `${program.length} / ${cfg.blockLimit} blocks`;
      const full = program.length >= cfg.blockLimit;
      el.querySelectorAll("[data-add]").forEach(b => { b.disabled = full || running; });
      const out = el.querySelector("[data-var-out]");
      if (out) out.textContent = variable;
      el.querySelectorAll("[data-var]").forEach(b => {
        const d = +b.dataset.var;
        b.disabled = running || (d < 0 ? variable <= cfg.variable.min : variable >= cfg.variable.max);
      });
      el.querySelectorAll("[data-loop]").forEach(b => {
        const d = +b.dataset.loop;
        b.disabled = running || (d < 0 ? loopCount <= cfg.loop.min : loopCount >= cfg.loop.max);
      });
      el.querySelector("[data-run]").disabled = running;
      el.querySelector("[data-clear]").disabled = running || !program.length;
      el.querySelectorAll("[data-del]").forEach(b => { b.disabled = running; });
    }

    function show(kind, title, text) {
      fb.innerHTML = `<div class="feedback ${kind}"><div class="feedback-title">${kind === "good" ? icons.check : kind === "bad" ? icons.cross : ""}<span>${esc(title)}</span></div>${text ? `<p>${inline(text)}</p>` : ""}</div>`;
    }

    function run() {
      if (!program.length) { show("info", "Add at least one block first.", "Tap a block under Blocks to put it in your program."); return; }
      if (cancel) cancel();
      robot.resetMat(mat, cfg);
      fb.innerHTML = "";
      running = true;
      drawProgram();
      const instrs = robot.expand(program, { variable, loopCount });
      const sim = robot.simulate(cfg, instrs);
      cancel = robot.animate(mat, sim, f => {
        progEl.querySelectorAll(".block").forEach(b => b.classList.toggle("active", +b.dataset.i === f.block));
      }, result => {
        running = false;
        progEl.querySelectorAll(".block").forEach(b => b.classList.remove("active"));
        drawProgram();
        finish(result, instrs.length);
      });
    }

    function finish(r, moves) {
      a.runs = (a.runs || 0) + 1;
      let detail = "";
      if (r.kind === "pass") {
        a.passed = true;
        let note = "";
        if (cfg.variable && program.some(b => b === "forward(steps)")) note = `\`${cfg.variable.name} = ${variable}\` was the right value.`;
        if (cfg.loop) note = `The loop ran ${moves} instructions: ${program.length} blocks × ${loopCount} repeats.`;
        show("good", `Flag reached in ${program.length} block${program.length === 1 ? "" : "s"}!`, note);
        detail = `Reached ${cfg.goal}`;
      } else {
        a.fails = (a.fails || 0) + 1;
        if (r.kind === "crash") {
          show("bad", `Bonk! Shelf at ${r.at} on move ${r.move}.`, `Trace the program one move at a time up to move ${r.move}. The mistake is usually the turn or the count just before it.`);
          detail = `Shelf at ${r.at} on move ${r.move}`;
        } else if (r.kind === "edge") {
          show("bad", `Bonk! The robot hit the edge of the mat at ${r.at} on move ${r.move}.`, "Turns are from the robot's point of view. Check which way it faces before that move.");
          detail = `Edge at ${r.at} on move ${r.move}`;
        } else {
          const tip = cfg.variable && program.includes("forward(steps)")
            ? `Count the squares to the first turn, then change \`${cfg.variable.name}\` and run again.`
            : cfg.loop ? "Is the problem the loop body or the repeat count? Change one of them, not both." : "Change one thing and run again.";
          show("bad", `The robot stopped on ${r.at}. The flag is on ${cfg.goal}.`, tip);
          detail = `Stopped on ${r.at}`;
        }
      }
      persist();
      ctx.log({ type: "activity_run", step: 3, result: r.kind, detail, blocks: program.length });
      ctx.onChange();
    }

    el.addEventListener("click", e => {
      const t = e.target.closest("button");
      if (!t || running) return;
      if (t.dataset.add != null) { if (program.length < cfg.blockLimit) { program.push(t.dataset.add); persist(); drawProgram(); } }
      else if (t.dataset.del != null) { program.splice(+t.dataset.del, 1); persist(); drawProgram(); }
      else if (t.dataset.var) { variable = Math.max(cfg.variable.min, Math.min(cfg.variable.max, variable + +t.dataset.var)); persist(); drawProgram(); }
      else if (t.dataset.loop) { loopCount = Math.max(cfg.loop.min, Math.min(cfg.loop.max, loopCount + +t.dataset.loop)); persist(); drawProgram(); }
      else if (t.hasAttribute("data-run")) run();
      else if (t.hasAttribute("data-reset")) { if (cancel) cancel(); robot.resetMat(mat, cfg); fb.innerHTML = ""; }
      else if (t.hasAttribute("data-clear")) { program = []; persist(); drawProgram(); robot.resetMat(mat, cfg); fb.innerHTML = ""; }
    });

    drawProgram();
    if (a.passed) show("good", "You already reached the flag.", "Run it again any time, or press Next.");
    return () => { if (cancel) cancel(); };
  }

  function blockLabel(b) {
    if (b.startsWith("forward")) return `↑ ${esc(b)}`;
    if (b === "turnLeft()") return `↺ ${esc(b)}`;
    return `↻ ${esc(b)}`;
  }

  /* ---------------- Ordering (modules 3 and 6) ---------------- */
  function order(el, ctx, cfg) {
    const a = ctx.prog.activity;
    let ord = Array.isArray(a.order) ? a.order.slice() : cfg.shuffled.slice();
    let checked = !!a.passed;

    function draw(marks) {
      el.innerHTML = `
        <ol class="order-list" aria-label="Steps in order">
          ${ord.map((idx, pos) => {
            const it = cfg.items[idx];
            const mark = marks ? (idx === pos ? "is-right" : "is-wrong") : "";
            return `<li class="order-item ${mark}">
              <span class="pos">${pos + 1}</span>
              <span class="txt">${esc(it.text)}${checked ? `<small>${esc(it.why)}</small>` : ""}${marks && idx !== pos ? `<small>Not in the right place yet.</small>` : ""}</span>
              ${checked ? `<span class="pill pill-good">${icons.check}</span>` : `<span class="moves">
                <button type="button" class="btn btn-sm" data-up="${pos}" ${pos === 0 ? "disabled" : ""} aria-label="Move “${esc(it.text)}” up">${icons.up}</button>
                <button type="button" class="btn btn-sm" data-down="${pos}" ${pos === ord.length - 1 ? "disabled" : ""} aria-label="Move “${esc(it.text)}” down">${icons.down}</button>
              </span>`}
            </li>`;
          }).join("")}
        </ol>
        <div class="row">${checked ? "" : `<button type="button" class="btn btn-primary btn-lg" data-check>${icons.check} Check order</button>`}</div>
        <div data-feedback aria-live="polite"></div>`;
    }

    function show(kind, title, text) {
      el.querySelector("[data-feedback]").innerHTML = `<div class="feedback ${kind}"><div class="feedback-title">${kind === "good" ? icons.check : icons.cross}<span>${esc(title)}</span></div>${text ? `<p>${esc(text)}</p>` : ""}</div>`;
    }

    el.addEventListener("click", e => {
      const t = e.target.closest("button");
      if (!t || checked) return;
      if (t.dataset.up != null || t.dataset.down != null) {
        const i = +(t.dataset.up != null ? t.dataset.up : t.dataset.down);
        const j = t.dataset.up != null ? i - 1 : i + 1;
        [ord[i], ord[j]] = [ord[j], ord[i]];
        a.order = ord.slice();
        ctx.save();
        draw();
        const btn = el.querySelector(`[data-${t.dataset.up != null ? "up" : "down"}="${j}"]`) || el.querySelector(`[data-up="${j}"], [data-down="${j}"]`);
        if (btn && !btn.disabled) btn.focus();
      } else if (t.hasAttribute("data-check")) {
        const right = ord.filter((idx, pos) => idx === pos).length;
        a.runs = (a.runs || 0) + 1;
        if (right === ord.length) {
          a.passed = true;
          checked = true;
          draw(true);
          show("good", "Every step is in a working order.", "Read why each step comes where it does.");
          ctx.log({ type: "activity_run", step: 3, result: "pass", detail: "Correct order" });
        } else {
          a.fails = (a.fails || 0) + 1;
          draw(true);
          show("bad", `${right} of ${ord.length} steps are in the right place.`, "For each step ask: what has to happen before this can work? Move one step and check again.");
          ctx.log({ type: "activity_run", step: 3, result: "wrong", detail: `${right}/${ord.length} in place` });
        }
        ctx.save();
        ctx.onChange();
      }
    });
    draw(checked);
    if (checked) show("good", "Every step is in a working order.", "");
  }

  /* ---------------- Matching (module 4) ---------------- */
  function match(el, ctx, cfg) {
    const a = ctx.prog.activity;
    const picks = a.match ? { ...a.match } : {};
    let checked = !!a.passed;

    function draw(marks) {
      el.innerHTML = `
        <div class="match-grid">
          ${cfg.jobs.map((j, i) => {
            const mark = marks ? (picks[i] === j.answer ? "is-right" : "is-wrong") : "";
            return `<div class="match-row ${mark}">
              <label for="match-${i}"><strong>${esc(j.job)}</strong>${checked ? `<small>${esc(j.why)}</small>` : ""}${marks && picks[i] !== j.answer ? `<small>${picks[i] ? "Not the best fit. What do you need to know for this job?" : "Pick a sensor."}</small>` : ""}</label>
              <select class="select" id="match-${i}" data-job="${i}" ${checked ? "disabled" : ""}>
                <option value="">Choose a sensor</option>
                ${cfg.options.map(o => `<option ${picks[i] === o ? "selected" : ""}>${esc(o)}</option>`).join("")}
              </select>
            </div>`;
          }).join("")}
        </div>
        <div class="row">${checked ? "" : `<button type="button" class="btn btn-primary btn-lg" data-check>${icons.check} Check matches</button>`}</div>
        <div data-feedback aria-live="polite"></div>`;
    }
    function show(kind, title, text) {
      el.querySelector("[data-feedback]").innerHTML = `<div class="feedback ${kind}"><div class="feedback-title">${kind === "good" ? icons.check : icons.cross}<span>${esc(title)}</span></div>${text ? `<p>${esc(text)}</p>` : ""}</div>`;
    }
    el.addEventListener("change", e => {
      const s = e.target.closest("[data-job]");
      if (!s) return;
      picks[s.dataset.job] = s.value;
      a.match = { ...picks };
      ctx.save();
    });
    el.addEventListener("click", e => {
      if (!e.target.closest("[data-check]") || checked) return;
      const right = cfg.jobs.filter((j, i) => picks[i] === j.answer).length;
      a.runs = (a.runs || 0) + 1;
      if (right === cfg.jobs.length) {
        a.passed = true;
        checked = true;
        draw(true);
        show("good", "Every job has the right sensor.", "The sensor follows from the question: how far, how bright, touching, or how much turn.");
        ctx.log({ type: "activity_run", step: 3, result: "pass", detail: "All matched" });
      } else {
        a.fails = (a.fails || 0) + 1;
        draw(true);
        show("bad", `${right} of ${cfg.jobs.length} jobs have the right sensor.`, "Name the thing each job needs to know first, then pick the sensor that measures it.");
        ctx.log({ type: "activity_run", step: 3, result: "wrong", detail: `${right}/${cfg.jobs.length} matched` });
      }
      ctx.save();
      ctx.onChange();
    });
    draw(checked);
    if (checked) show("good", "Every job has the right sensor.", "");
  }

  function activity(el, ctx) {
    const cfg = RP.content.C.activities[ctx.mid];
    if (!cfg) { el.innerHTML = `<p class="muted">No activity is set up for this module yet.</p>`; return null; }
    if (cfg.type === "grid") return grid(el, ctx, cfg);
    if (cfg.type === "order") return order(el, ctx, cfg);
    if (cfg.type === "match") return match(el, ctx, cfg);
    return null;
  }

  /* ---------------- Quick check quiz ---------------- */
  function quiz(el, ctx) {
    const mod = ctx.mod;
    const q = ctx.prog.quiz;
    const letters = "ABCD";
    const pending = {};
    const showHint = {};

    function hintFor(item) {
      return item.feedback.incorrect.replace(/^Not quite\.\s*/, "");
    }

    function draw() {
      const left = mod.quizBank.filter(it => !(q.attempts[it.questionId] > 0)).length;
      el.innerHTML = `
        <div class="quiz-grid">
          ${mod.quizBank.map((it, n) => {
            const id = it.questionId;
            const solved = q.answers[id] === it.correctAnswer && q.attempts[id] > 0;
            const lastWrong = !solved && q.attempts[id] > 0 && q.answers[id];
            const sel = pending[id] != null ? pending[id] : (solved ? q.answers[id] : null);
            return `<fieldset class="q-card" data-q="${esc(id)}" style="margin:0">
              <legend class="sr-only">Question ${n + 1}</legend>
              <h3>Q${n + 1}. ${inline(it.prompt)}</h3>
              <div class="stack" style="gap:8px" role="radiogroup" aria-label="Answers for question ${n + 1}">
                ${it.options.map((o, k) => {
                  let cls = "";
                  let mark = "";
                  if (solved && o === it.correctAnswer) { cls = "is-right"; mark = "Correct"; }
                  else if (lastWrong && o === q.answers[id] && pending[id] == null) { cls = "is-wrong"; mark = "Not this one"; }
                  return `<button type="button" class="opt ${cls}" role="radio" aria-checked="${sel === o && !solved}" data-opt="${esc(o)}" ${solved || q.submitted ? "disabled" : ""}>
                    <span class="key">${letters[k]}</span><span>${inline(o)}</span>${mark ? `<span class="mark">${mark}</span>` : ""}</button>`;
                }).join("")}
              </div>
              ${solved ? `<div class="feedback good" aria-live="polite"><div class="feedback-title">${icons.check}<span>Correct</span></div><p>${inline(it.feedback.correct)}</p>${q.firstTry[id] === false ? `<p class="muted">Counted as a second try.</p>` : ""}</div>`
                : lastWrong && pending[id] == null ? `<div class="feedback bad" aria-live="polite"><div class="feedback-title">${icons.cross}<span>Not quite</span></div><p>${inline(hintFor(it))}</p><p class="muted">Pick another answer and check again.</p></div>` : ""}
              ${!solved && !q.submitted ? `<div class="row">
                <button type="button" class="btn" data-check ${sel == null ? "disabled" : ""}>Check answer</button>
                <button type="button" class="link-btn" data-hint aria-expanded="${!!showHint[id]}">${showHint[id] ? "▾ Hide hint" : "▸ Need a hint?"}</button>
              </div>${showHint[id] ? `<p class="hint">${inline(hintFor(it))}</p>` : ""}` : ""}
            </fieldset>`;
          }).join("")}
        </div>
        <div class="row">
          ${q.submitted
            ? `<div class="feedback ${q.score >= 67 ? "good" : "warn"}" style="flex:1"><div class="feedback-title">${icons.check}<span>Quiz submitted: ${q.score}% on first tries</span></div><p>${mod.quizBank.filter(it => q.firstTry[it.questionId]).length} of ${mod.quizBank.length} answered correctly the first time. Press Next to reflect.</p></div>`
            : `<button type="button" class="btn btn-primary btn-lg" data-submit ${left ? "disabled" : ""}>Submit quiz</button>
               <span class="muted small" aria-live="polite">${left ? `${left} question${left === 1 ? "" : "s"} left to check` : "All questions checked. Submit when ready."}</span>`}
        </div>`;
    }

    el.addEventListener("click", e => {
      const t = e.target.closest("button");
      if (!t || q.submitted) return;
      if (t.hasAttribute("data-submit")) {
        const right = mod.quizBank.filter(it => q.firstTry[it.questionId]).length;
        q.submitted = true;
        q.score = Math.round(right / mod.quizBank.length * 100);
        ctx.log({ type: "quiz_submit", step: 4, score: q.score });
        ctx.save();
        draw();
        ctx.onChange();
        RP.ui.announce(`Quiz submitted. ${q.score} percent.`);
        return;
      }
      const card = t.closest("[data-q]");
      if (!card) return;
      const id = card.dataset.q;
      const item = mod.quizBank.find(x => x.questionId === id);
      if (t.dataset.opt != null) {
        pending[id] = t.dataset.opt;
        draw();
        const again = el.querySelector(`[data-q="${CSS.escape(id)}"] [data-opt="${CSS.escape(t.dataset.opt)}"]`);
        if (again) again.focus();
      } else if (t.hasAttribute("data-hint")) {
        showHint[id] = !showHint[id];
        draw();
        const h = el.querySelector(`[data-q="${CSS.escape(id)}"] [data-hint]`);
        if (h) h.focus();
      } else if (t.hasAttribute("data-check")) {
        const choice = pending[id];
        if (choice == null) return;
        const correct = choice === item.correctAnswer;
        const first = !(q.attempts[id] > 0);
        q.attempts[id] = (q.attempts[id] || 0) + 1;
        q.answers[id] = choice;
        if (first) q.firstTry[id] = correct;
        q.checked[id] = true;
        delete pending[id];
        ctx.log({ type: "quiz_check", step: 4, questionId: id, correct, firstTry: first });
        ctx.save();
        draw();
        RP.ui.announce(correct ? "Correct." : "Not quite. Try another answer.");
        const next = el.querySelector(`[data-q="${CSS.escape(id)}"] .opt:not(:disabled)`) || el.querySelector("[data-submit]:not(:disabled)");
        if (next) next.focus();
      }
    });
    draw();
  }

  RP.activities = { activity, quiz };
})(window.RP);
