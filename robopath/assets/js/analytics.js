/* Analytics: turns progress records and events into the numbers on My progress,
   the class dashboard and the system report (R2.3, R2.4, R5.1–R5.6, R10.3). */
(function (RP) {
  const { DAY, startOfDay, daysBetween } = RP.util;
  const store = RP.store;
  const content = RP.content;
  const STEPS = 5;
  const SUPPORT = { quizBelow: 50, failStreak: 3, inactiveDays: 7 };

  const C = () => content.C;
  const visiblePathways = () => C().pathways.filter(p => store.isPublished(p.pathwayId));

  function moduleState(uid, mid) {
    const p = store.progress(uid, mid);
    const done = p ? p.stepsDone.length : 0;
    const state = done >= STEPS ? "done" : (p && (done > 0 || p.activity.runs > 0)) ? "doing" : "new";
    return { state, done, pct: Math.round(done / STEPS * 100), p };
  }

  function pathwayPct(uid, pid) {
    const pw = content.pathway(pid);
    if (!pw) return 0;
    const done = pw.modules.reduce((n, mid) => n + moduleState(uid, mid).done, 0);
    return done / (pw.modules.length * STEPS) * 100;
  }

  function pathwayDone(uid, pid) {
    const pw = content.pathway(pid);
    return !!pw && pw.modules.every(mid => moduleState(uid, mid).state === "done");
  }

  function studentPathways(u) {
    const assigned = store.assignments(u.classId).map(a => a.pathwayId);
    return visiblePathways().slice().sort((a, b) => (assigned.includes(b.pathwayId) ? 1 : 0) - (assigned.includes(a.pathwayId) ? 1 : 0));
  }

  // Where "Pick up where you left off" sends the student (R2.2).
  function resumeTarget(u) {
    const pws = studentPathways(u);
    let best = null;
    pws.forEach(pw => pw.modules.forEach(mid => {
      const s = moduleState(u.userId, mid);
      if (s.state === "doing" && (!best || (s.p.lastAt || 0) > (best.p.lastAt || 0))) best = { mid, pid: pw.pathwayId, ...s };
    }));
    if (best) return best;
    for (const pw of pws) {
      for (const mid of pw.modules) {
        const s = moduleState(u.userId, mid);
        if (s.state === "new") return { mid, pid: pw.pathwayId, ...s };
      }
    }
    return null;
  }

  function userEvents(uid) {
    return store.events().filter(e => e.userId === uid);
  }

  function failStreak(uid) {
    const evs = userEvents(uid).filter(e => e.type === "activity_run" || e.type === "quiz_check");
    let n = 0;
    for (let i = evs.length - 1; i >= 0; i--) {
      const e = evs[i];
      const ok = e.type === "activity_run" ? e.result === "pass" : e.correct;
      if (ok) break;
      n++;
    }
    return n;
  }

  function lastActive(uid) {
    const evs = userEvents(uid);
    return evs.length ? evs[evs.length - 1].ts : null;
  }

  function studentStats(uid) {
    let modulesDone = 0, steps = 0, time = 0;
    const scores = [];
    C().modules.forEach(m => {
      const s = moduleState(uid, m.moduleId);
      if (s.state === "done") modulesDone++;
      steps += s.done;
      if (s.p) {
        time += s.p.timeMs || 0;
        if (s.p.quiz.submitted && s.p.quiz.score != null) scores.push(s.p.quiz.score);
      }
    });
    return {
      modulesDone,
      modulesTotal: C().modules.length,
      stepsFinished: steps,
      timeMin: Math.round(time / 60000),
      quizAvg: scores.length ? scores.reduce((a, b) => a + b, 0) / scores.length : null,
      quizCount: scores.length,
      lastActive: lastActive(uid),
      failStreak: failStreak(uid)
    };
  }

  function supportReasons(uid) {
    const st = studentStats(uid);
    const out = [];
    if (st.quizAvg != null && st.quizAvg < SUPPORT.quizBelow) out.push({ code: "quiz", text: `Quiz average ${Math.round(st.quizAvg)}%` });
    if (st.failStreak >= SUPPORT.failStreak) out.push({ code: "fails", text: `${st.failStreak} failed tries in a row` });
    if (!st.lastActive) out.push({ code: "never", text: "Has not started yet" });
    else {
      const idle = daysBetween(st.lastActive, Date.now());
      if (idle >= SUPPORT.inactiveDays) out.push({ code: "idle", text: `No activity for ${idle} days` });
    }
    return out;
  }

  function badges(uid) {
    const evs = userEvents(uid);
    const runs = evs.filter(e => e.type === "activity_run");
    const earned = new Set();
    if (runs.length) earned.add("first-run");
    const gridPass = runs.some(e => e.result === "pass" && RP.content.C.activities[e.moduleId] && RP.content.C.activities[e.moduleId].type === "grid");
    if (gridPass) earned.add("flag-finder");
    for (let i = 1; i < runs.length; i++) {
      if (runs[i].result === "pass" && runs[i - 1].result !== "pass" && runs[i].moduleId === runs[i - 1].moduleId) { earned.add("bug-squasher"); break; }
    }
    if (C().modules.some(m => { const p = store.progress(uid, m.moduleId); return p && p.quiz.submitted && p.quiz.score === 100; })) earned.add("sharp-eye");
    if (C().pathways.some(p => pathwayDone(uid, p.pathwayId))) earned.add("pathway-complete");
    return earned;
  }

  /* ---------- Class level (screen 07) ---------- */
  function classPathwayIds(classId) {
    const ids = store.assignments(classId).map(a => a.pathwayId).filter(store.isPublished);
    return ids.length ? ids : visiblePathways().map(p => p.pathwayId);
  }

  function classStats(classId) {
    const kids = store.students(classId);
    const now = Date.now();
    const pids = classPathwayIds(classId);
    let participating = 0, progSum = 0;
    const quiz = [];
    const support = [];
    kids.forEach(k => {
      const st = studentStats(k.userId);
      if (st.lastActive && now - st.lastActive < SUPPORT.inactiveDays * DAY) participating++;
      const total = pids.reduce((n, pid) => n + content.pathway(pid).modules.length * STEPS, 0);
      const done = pids.reduce((n, pid) => n + content.pathway(pid).modules.reduce((m, mid) => m + moduleState(k.userId, mid).done, 0), 0);
      progSum += total ? done / total * 100 : 0;
      if (st.quizAvg != null) quiz.push(st.quizAvg);
      const reasons = supportReasons(k.userId);
      if (reasons.length) support.push({ user: k, reasons, stats: st });
    });
    support.sort((a, b) => b.reasons.length - a.reasons.length || a.user.name.localeCompare(b.user.name));
    return {
      size: kids.length,
      participating,
      progressing: kids.length ? progSum / kids.length : 0,
      quizAvg: quiz.length ? quiz.reduce((a, b) => a + b, 0) / quiz.length : null,
      support
    };
  }

  function activityByDay(classId, days) {
    const ids = new Set(store.students(classId).map(s => s.userId));
    const today = startOfDay(Date.now());
    const buckets = Array.from({ length: days }, (_, i) => ({ day: today - (days - 1 - i) * DAY, count: 0 }));
    store.events().forEach(e => {
      if (!ids.has(e.userId)) return;
      const idx = days - 1 - Math.round((today - startOfDay(e.ts)) / DAY);
      if (idx >= 0 && idx < days) buckets[idx].count++;
    });
    return buckets;
  }

  function moduleProgress(classId) {
    const kids = store.students(classId);
    const mids = [];
    classPathwayIds(classId).forEach(pid => content.pathway(pid).modules.forEach(m => { if (!mids.includes(m)) mids.push(m); }));
    return mids.map(mid => {
      let done = 0, doing = 0;
      kids.forEach(k => { const s = moduleState(k.userId, mid).state; if (s === "done") done++; else if (s === "doing") doing++; });
      return { mid, title: C().byId[mid].title, done, doing, size: kids.length };
    });
  }

  function assignmentFinished(a) {
    const kids = store.students(a.classId);
    return { done: kids.filter(k => pathwayDone(k.userId, a.pathwayId)).length, size: kids.length };
  }

  // Rule-based suggested next step for the teacher (R5.6).
  function suggestion(u) {
    const st = studentStats(u.userId);
    const first = u.name.split(" ")[0];
    let low = null;
    C().modules.forEach(m => {
      const p = store.progress(u.userId, m.moduleId);
      if (p && p.quiz.submitted && (low === null || p.quiz.score < low.score)) low = { m, score: p.quiz.score };
    });
    const stuck = C().modules.map(m => ({ m, s: moduleState(u.userId, m.moduleId) })).find(x => x.s.state === "doing");
    const parts = [];
    if (st.failStreak >= SUPPORT.failStreak && stuck) {
      const step = RP.content.stepNames(stuck.m.moduleId)[stuck.s.p.current - 1];
      parts.push(`${first} is stuck on “${step}” in ${stuck.m.title} (step ${stuck.s.p.current} of 5). Sit with them for one run: ask them to trace the program one move at a time and say what the robot should do before pressing Run.`);
    }
    if (low && low.score < SUPPORT.quizBelow) {
      parts.push(`Re-teach ${low.m.title}: ${first} scored ${low.score}% on the quick check. Focus on “${low.m.learningOutcomes[0].replace(/^Learners will be able to /, "").replace(/\.$/, "")}”.`);
    }
    if (!st.lastActive) parts.push(`${first} has not signed in yet. Check they can reach their @students.lincolnms.org account.`);
    else if (daysBetween(st.lastActive, Date.now()) >= SUPPORT.inactiveDays) {
      const next = stuck ? `${stuck.m.title}, step ${stuck.s.p.current}` : "their next module";
      parts.push(`Check in: no activity for ${daysBetween(st.lastActive, Date.now())} days. Point ${first} to ${next}.`);
    }
    if (!parts.length) {
      parts.push(stuck ? `On track. Next up: ${stuck.m.title}, step ${stuck.s.p.current} of 5.` : `On track. ${first} is ready for the next pathway.`);
    }
    return parts;
  }

  function eventsByType() {
    const counts = {};
    store.events().forEach(e => { counts[e.type] = (counts[e.type] || 0) + 1; });
    return Object.entries(counts).sort((a, b) => b[1] - a[1]);
  }

  RP.analytics = {
    STEPS, SUPPORT, visiblePathways, moduleState, pathwayPct, pathwayDone, studentPathways, resumeTarget,
    studentStats, supportReasons, badges, classStats, activityByDay, moduleProgress, assignmentFinished,
    suggestion, eventsByType, failStreak, lastActive
  };
})(window.RP);
