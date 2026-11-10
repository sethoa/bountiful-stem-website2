/* 01 Sign in: role toggle, school-domain check, roster and active check, role routing (R6). */
(function (RP) {
  const { esc, icons, initials } = RP.util;
  const { C } = RP.content;
  const store = RP.store;
  let tab = "student";

  // Returns { user } or { error: { title, text } }.
  function check(emailRaw, which) {
    const sch = C.school.school;
    const email = String(emailRaw || "").trim().toLowerCase();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return { error: { title: "Enter your school email", text: `Type the Google account you use at ${sch.name}, then continue.` } };
    }
    const domain = email.split("@")[1];
    if (which === "staff" && domain !== sch.staffDomain) {
      if (domain === sch.studentDomain) return { error: { title: "This is a student account", text: `${email} is a student account. Switch to Student to sign in.` } };
      return { error: { title: "Sign-in refused", text: `${email} is not a ${sch.name} account. Staff must use their school Google Workspace account (@${sch.staffDomain}).` } };
    }
    if (which === "student" && domain !== sch.studentDomain) {
      if (domain === sch.staffDomain) return { error: { title: "This is a staff account", text: `${email} is a staff account. Switch to Teacher or admin to sign in.` } };
      return { error: { title: "Sign-in refused", text: `${email} is not a ${sch.name} student account. Students sign in with their @${sch.studentDomain} Google account.` } };
    }
    const u = store.userByEmail(email);
    if (!u) return { error: { title: "Not on the roster yet", text: `We couldn't find ${email} on the RoboPath roster. Ask your admin (${sch.adminContact}) to add you.` } };
    if (!u.active) return { error: { title: "Account turned off", text: `${email} is turned off in RoboPath. Ask your admin (${sch.adminContact}) to turn it back on.` } };
    if (which === "student" && u.role !== "student") return { error: { title: "Use Teacher or admin", text: `${u.name} is a ${u.role}. Switch to Teacher or admin.` } };
    if (which === "staff" && u.role === "student") return { error: { title: "This is a student account", text: "Switch to Student to sign in." } };
    return { user: u };
  }

  function render(host) {
    const el = document.createElement("div");
    host.replaceChildren(el);
    const sch = C.school.school;
    const m01 = C.activities["m01-variables-robot-memory"];
    const demo = tab === "student"
      ? store.users().filter(u => u.role === "student").slice(0, 3).concat(store.users().filter(u => u.role === "student" && !u.active).slice(0, 1))
      : store.users().filter(u => u.role !== "student").slice(0, 3).concat([{ name: "Personal Gmail", email: "dana.home@gmail.com", role: "not a school account", fake: true }]);
    el.innerHTML = `
      <div class="signin">
        <section>
          <div class="hero-kicker"><span class="brand-mark">${icons.robot}</span>RoboPath · ${esc(sch.grades)}</div>
          <h1 class="hero-title">Code it. Build it.<span>Watch it move.</span></h1>
          <p class="hero-copy">Short robotics modules for ${esc(sch.name)}. Read a lesson, program a robot on the mat, check what you learned, and see your progress grow.</p>
          <div class="hero-chips"><span class="req-tag">R1 Lessons</span><span class="req-tag">R2 Saved progress</span><span class="req-tag">R3 Instant feedback</span></div>
          <div class="hero-visual">
            ${RP.student.miniMat(m01, ["A1", "A5", "E5"])}
            <div class="hero-code" aria-label="Example program"><span class="kw">let</span> steps = 4 <span class="cm">// robot memory</span><br>forward(steps)<br>turnRight()<br>forward(steps) <span class="cm">// flag on E5</span></div>
          </div>
        </section>
        <section class="signin-card" aria-labelledby="si-title">
          <div><h2 id="si-title">Sign in to RoboPath</h2><p class="muted small" style="margin-top:6px">Use your ${esc(sch.name)} Google account.</p></div>
          <div class="segmented" role="group" aria-label="I am a">
            <button type="button" data-tab="student" aria-pressed="${tab === "student"}">Student</button>
            <button type="button" data-tab="staff" aria-pressed="${tab === "staff"}">Teacher or admin</button>
          </div>
          <div data-error aria-live="assertive"></div>
          <form class="form-grid" data-form novalidate>
            <div class="field"><label for="si-email">School email</label>
              <input class="input" id="si-email" name="email" type="email" autocomplete="username" placeholder="${tab === "student" ? `name@${sch.studentDomain}` : `name@${sch.staffDomain}`}">
              <span class="field-hint">${tab === "student" ? `Students: @${esc(sch.studentDomain)}` : `Teachers and admins: @${esc(sch.staffDomain)}`}</span></div>
            <button class="google-btn" type="submit">${icons.google} Continue with Google</button>
          </form>
          <div class="stack" style="gap:8px">
            <span class="sub-label">Demo accounts · select one to try it</span>
            <div class="demo-list">${demo.map(u => `<button type="button" class="demo-acct" data-email="${esc(u.email)}">
              <span class="avatar">${u.fake ? "@" : esc(initials(u.name))}</span>
              <span class="meta"><div>${esc(u.name)}</div><span>${esc(u.email)}</span></span>
              <span class="pill ${u.fake || u.active === false ? "pill-warn" : ""}">${u.fake ? "refused" : u.active === false ? "turned off" : esc(u.role)}</span>
            </button>`).join("")}</div>
          </div>
          <div class="signin-foot"><button type="button" class="link-btn" data-req>Requirements map</button></div>
        </section>
      </div>`;

    const errBox = el.querySelector("[data-error]");
    const form = el.querySelector("[data-form]");
    function attempt(email) {
      const r = check(email, tab);
      if (r.error) {
        errBox.innerHTML = `<div class="feedback bad" role="alert"><div class="feedback-title">${esc(r.error.title)}</div><p>${esc(r.error.text)}</p></div>`;
        form.email.setAttribute("aria-invalid", "true");
        return;
      }
      store.signIn(r.user.userId);
      RP.app.home();
    }
    form.addEventListener("submit", e => { e.preventDefault(); attempt(form.email.value); });
    el.addEventListener("click", e => {
      const t = e.target.closest("button");
      if (!t) return;
      if (t.dataset.tab) { tab = t.dataset.tab; render(host); host.querySelector(`[data-tab="${tab}"]`).focus(); }
      else if (t.dataset.email) { form.email.value = t.dataset.email; attempt(t.dataset.email); }
      else if (t.hasAttribute("data-req")) RP.app.go("requirements");
    });
  }

  RP.auth = { render, check };
})(window.RP);
