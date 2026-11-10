/* Learning store: roster, assignments, progress and analytics events, saved to the browser (R2.1, R4.1).
   In production this maps to a learning database (progress rows) and an analytics event stream. */
(function (RP) {
  const { DAY, seeded, hashStr, uid, startOfDay } = RP.util;
  const KEY = "robopath.v1";
  let S = null;
  let C = null;

  function emptyProgress() {
    return {
      stepsDone: [],
      current: 1,
      activity: { passed: false, runs: 0, fails: 0, program: null, variable: null, loopCount: null, order: null, match: null },
      quiz: { answers: {}, checked: {}, firstTry: {}, attempts: {}, submitted: false, score: null },
      reflection: "",
      draft: "",
      startedAt: null,
      completedAt: null,
      lastAt: null,
      timeMs: 0
    };
  }

  function read() {
    try {
      const raw = localStorage.getItem(KEY);
      return raw ? JSON.parse(raw) : null;
    } catch (e) { return null; }
  }

  function save() {
    try { localStorage.setItem(KEY, JSON.stringify(S)); } catch (e) { /* storage blocked: keep working in memory */ }
  }

  function init(content) {
    C = content;
    const saved = read();
    S = saved && saved.version === 1 ? saved : seed();
    if (!saved) save();
    return S;
  }

  function reset() {
    S = seed();
    save();
  }

  /* ---------- Seed: expand school.json's compact seed into progress + events ---------- */
  function seed() {
    const school = C.school;
    const now = Date.now();
    const state = {
      version: 1,
      seededAt: now,
      session: null,
      users: school.users.map(u => ({ ...u })),
      classes: school.classes.map(c => ({ ...c })),
      published: Object.fromEntries(C.pathways.map(p => [p.pathwayId, !!p.defaultPublished])),
      assignments: school.assignments.map(a => ({
        assignmentId: a.assignmentId, classId: a.classId, pathwayId: a.pathwayId,
        due: a.due, note: a.note, createdAt: now - a.createdDaysAgo * DAY, createdBy: "u-dana"
      })),
      progress: {},
      events: []
    };

    Object.entries(school.seed).forEach(([userId, spec]) => {
      const user = state.users.find(u => u.userId === userId);
      if (!user) return;
      const rnd = seeded(hashStr(userId));
      const keys = Object.keys(spec.modules);
      state.progress[userId] = {};
      keys.forEach((key, k) => {
        const mid = RP.content.fullId(key);
        const mod = C.byId[mid];
        const m = spec.modules[key];
        const dayOffset = spec.lastActiveDaysAgo + (keys.length - 1 - k) * 2 + (k < keys.length - 1 ? Math.floor(rnd() * 2) : 0);
        const p = emptyProgress();
        const evs = [];
        let t = 0;
        const push = (type, extra) => { t += 3 + Math.floor(rnd() * 5); evs.push({ type, userId, classId: user.classId, moduleId: mid, minute: t, ...extra }); };

        push("sign_in", { moduleId: null });
        const done = Math.min(5, m.stepsDone);
        for (let step = 1; step <= done; step++) {
          if (step === 3) {
            const fails = Math.floor(rnd() * 3);
            for (let f = 0; f < fails; f++) push("activity_run", { step, result: f % 2 ? "short" : "crash", detail: "Seeded try" });
            push("activity_run", { step, result: "pass", detail: "Reached the goal" });
            p.activity.passed = true;
            p.activity.runs = fails + 1;
            p.activity.fails = fails;
          }
          if (step === 4) {
            const score = m.quiz != null ? m.quiz : 67;
            const nRight = Math.round(score / 100 * mod.quizBank.length);
            mod.quizBank.forEach((q, qi) => {
              const right = qi < nRight;
              if (right) {
                push("quiz_check", { step, questionId: q.questionId, correct: true, firstTry: true });
              } else {
                push("quiz_check", { step, questionId: q.questionId, correct: false, firstTry: true });
                push("quiz_check", { step, questionId: q.questionId, correct: true, firstTry: false });
              }
              p.quiz.answers[q.questionId] = q.correctAnswer;
              p.quiz.checked[q.questionId] = true;
              p.quiz.firstTry[q.questionId] = right;
              p.quiz.attempts[q.questionId] = right ? 1 : 2;
            });
            p.quiz.submitted = true;
            p.quiz.score = Math.round(nRight / mod.quizBank.length * 100);
            push("quiz_submit", { step, score: p.quiz.score });
          }
          if (step === 5) {
            p.reflection = school.seedReflections[key] || "";
            push("reflection_submit", { step, length: p.reflection.length });
          }
          push("step_complete", { step });
          p.stepsDone.push(step);
        }
        if (done === 5) push("module_complete", {});
        const isLast = k === keys.length - 1;
        if (isLast && spec.failStreak) {
          const step = done + 1;
          for (let f = 0; f < spec.failStreak; f++) {
            push("activity_run", { step, result: f % 2 ? "short" : "crash", detail: "Seeded try" });
          }
          p.activity.runs += spec.failStreak;
          p.activity.fails += spec.failStreak;
        }
        p.current = Math.min(5, done + 1);
        p.timeMs = (t + 4) * 60000;

        // Place the session on its day. Today's session ends a few minutes before now.
        const base = dayOffset === 0
          ? now - (t + 5) * 60000
          : startOfDay(now - dayOffset * DAY) + (9 + Math.floor(rnd() * 5)) * 3600000 + Math.floor(rnd() * 50) * 60000;
        evs.forEach(e => {
          const ts = base + e.minute * 60000;
          delete e.minute;
          state.events.push({ eventId: `ev-${state.events.length + 1}`, ts, ...e });
        });
        p.startedAt = base;
        p.lastAt = base + t * 60000;
        if (done === 5) p.completedAt = p.lastAt;
        state.progress[userId][mid] = p;
      });
    });
    state.events.sort((a, b) => a.ts - b.ts);
    return state;
  }

  /* ---------- Accessors ---------- */
  const users = () => S.users;
  const user = id => S.users.find(u => u.userId === id);
  const userByEmail = email => S.users.find(u => u.email.toLowerCase() === String(email).trim().toLowerCase());
  const currentUser = () => (S.session ? user(S.session.userId) : null);
  const classes = () => S.classes;
  const classById = id => S.classes.find(c => c.classId === id);
  const classesForTeacher = tid => S.classes.filter(c => c.teacherId === tid);
  const students = classId => S.users.filter(u => u.role === "student" && u.classId === classId);
  const isPublished = pid => !!S.published[pid];
  const assignments = classId => S.assignments.filter(a => a.classId === classId);
  const events = () => S.events;

  function progress(userId, mid, create) {
    const byUser = S.progress[userId] || (create ? (S.progress[userId] = {}) : null);
    if (!byUser) return null;
    if (!byUser[mid] && create) byUser[mid] = emptyProgress();
    return byUser[mid] || null;
  }

  function signIn(userId) {
    S.session = { userId, at: Date.now() };
    const u = user(userId);
    log({ type: "sign_in", userId, classId: u.classId, moduleId: null });
    save();
  }

  function signOut() {
    S.session = null;
    save();
  }

  function log(ev) {
    S.events.push({ eventId: uid("ev"), ts: Date.now(), ...ev });
    save();
  }

  /* ---------- Mutations used by teacher and admin screens ---------- */
  function addAssignment(a) {
    S.assignments.push({ assignmentId: uid("as"), createdAt: Date.now(), ...a });
    save();
  }
  function removeAssignment(id) {
    S.assignments = S.assignments.filter(a => a.assignmentId !== id);
    save();
  }
  function setPublished(pid, on) {
    S.published[pid] = !!on;
    save();
  }
  function updateUser(id, patch) {
    Object.assign(user(id), patch);
    save();
  }
  function addUser(u) {
    const rec = { userId: uid("u"), active: true, ...u };
    S.users.push(rec);
    save();
    return rec;
  }

  // Rows the learning database would hold: one per user, class, assignment, module progress record,
  // quiz answer and reflection.
  function learningRows() {
    let rows = S.users.length + S.classes.length + S.assignments.length;
    Object.values(S.progress).forEach(byMod => Object.values(byMod).forEach(p => {
      rows += 1 + Object.keys(p.quiz.answers).length + (p.reflection ? 1 : 0);
    }));
    return rows;
  }

  RP.store = {
    init, reset, save, emptyProgress,
    get state() { return S; },
    users, user, userByEmail, currentUser, classes, classById, classesForTeacher, students,
    isPublished, assignments, events, progress, signIn, signOut, log,
    addAssignment, removeAssignment, setPublished, updateUser, addUser, learningRows
  };
})(window.RP);
