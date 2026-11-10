/* Admin screens: 10 Users & roles, 11 Courses and System report (R9, R10). */
(function (RP) {
  const { esc, initials } = RP.util;
  const { C } = RP.content;
  const store = RP.store;
  const A = RP.analytics;
  const ui = RP.ui;
  const go = (...a) => RP.app.go(...a);

  const domainFor = role => role === "student" ? C.school.school.studentDomain : C.school.school.staffDomain;

  /* ---------- 10 Users & roles ---------- */
  function users(el) {
    const me = store.currentUser();
    const classes = store.classes();
    const list = store.users().slice().sort((a, b) => ({ admin: 0, teacher: 1, student: 2 })[a.role] - ({ admin: 0, teacher: 1, student: 2 })[b.role] || a.name.localeCompare(b.name));
    el.innerHTML = `
      <div class="page-head"><div><div class="eyebrow">Administration</div><h1 class="page-title">Users &amp; roles</h1>
      <p class="page-lede">Only people on this roster can sign in. Changes save as soon as you make them.</p></div>
      <span class="pill num">${list.length} users</span></div>
      <div class="table-wrap"><table class="table">
        <thead><tr><th>Name</th><th>School email</th><th>Role</th><th>Class</th><th>Active</th></tr></thead>
        <tbody>${list.map(u => {
          const self = u.userId === me.userId;
          return `<tr>
            <td><span class="person"><span class="avatar">${esc(initials(u.name))}</span>${esc(u.name)}${self ? ' <span class="pill">You</span>' : ""}</span></td>
            <td class="small muted">${esc(u.email)}</td>
            <td><select class="select" style="min-width:120px" data-role="${u.userId}" aria-label="Role for ${esc(u.name)}" ${self ? "disabled title=\"You can't change your own role\"" : ""}>
              ${["student", "teacher", "admin"].map(r => `<option ${u.role === r ? "selected" : ""}>${r}</option>`).join("")}</select></td>
            <td>${u.role === "admin" ? "—" : `<select class="select" style="min-width:100px" data-cls="${u.userId}" aria-label="Class for ${esc(u.name)}">${classes.map(c => `<option ${u.classId === c.classId ? "selected" : ""}>${esc(c.classId)}</option>`).join("")}</select>`}</td>
            <td><label class="switch"><input type="checkbox" data-active="${u.userId}" ${u.active ? "checked" : ""} ${self ? "disabled" : ""} aria-label="${esc(u.name)} can sign in"><span class="track"></span></label></td>
          </tr>`;
        }).join("")}</tbody></table></div>
      <section class="card">
        <h2 class="card-title" style="margin-bottom:14px">Add a user</h2>
        <form data-add novalidate class="stack" style="gap:16px">
          <div class="add-user-grid">
            <div class="field"><label for="nu-name">Full name</label><input class="input" id="nu-name" name="name" placeholder="e.g. Jordan Lee" autocomplete="off"></div>
            <div class="field"><label for="nu-email">School email</label><input class="input" id="nu-email" name="email" type="email" placeholder="j.lee@lincolnms.org" autocomplete="off"></div>
            <div class="field"><label for="nu-role">Role</label><select class="select" id="nu-role" name="role"><option>teacher</option><option>student</option><option>admin</option></select></div>
            <div class="field"><label for="nu-class">Class</label><select class="select" id="nu-class" name="cls">${classes.map(c => `<option>${esc(c.classId)}</option>`).join("")}</select></div>
          </div>
          <div class="row-between">
            <span class="field-hint" data-hint>Teachers and admins use @${esc(C.school.school.staffDomain)}. Students use @${esc(C.school.school.studentDomain)}.</span>
            <button class="btn btn-primary btn-lg" type="submit">+ Add user</button>
          </div>
          <p class="field-error" data-err role="alert"></p>
        </form>
      </section>`;

    el.addEventListener("change", e => {
      const t = e.target;
      if (t.dataset.role) {
        const u = store.user(t.dataset.role);
        store.updateUser(u.userId, { role: t.value, classId: t.value === "admin" ? null : (u.classId || classes[0].classId) });
        ui.toast(`${u.name} is now ${t.value === "admin" ? "an" : "a"} ${t.value}`);
        go("users");
      } else if (t.dataset.cls) {
        const u = store.user(t.dataset.cls);
        store.updateUser(u.userId, { classId: t.value });
        ui.toast(`${u.name} moved to ${t.value}`);
      } else if (t.dataset.active) {
        const u = store.user(t.dataset.active);
        store.updateUser(u.userId, { active: t.checked });
        ui.toast(t.checked ? `${u.name} can sign in` : `${u.name} can no longer sign in`);
      }
    });

    const form = el.querySelector("[data-add]");
    const err = el.querySelector("[data-err]");
    form.role.addEventListener("change", () => {
      form.email.placeholder = form.role.value === "student" ? `j.lee@${C.school.school.studentDomain}` : `j.lee@${C.school.school.staffDomain}`;
      form.cls.disabled = form.role.value === "admin";
    });
    form.addEventListener("submit", e => {
      e.preventDefault();
      const name = form.name.value.trim();
      const email = form.email.value.trim().toLowerCase();
      const role = form.role.value;
      [form.name, form.email].forEach(f => f.removeAttribute("aria-invalid"));
      if (name.split(/\s+/).length < 2) { err.textContent = "Enter a first and last name."; form.name.setAttribute("aria-invalid", "true"); form.name.focus(); return; }
      const dom = domainFor(role);
      if (!/^[^\s@]+@[^\s@]+$/.test(email) || email.split("@")[1] !== dom) {
        err.textContent = `${email || "That email"} can't be used for a ${role}. ${role === "student" ? "Students" : "Teachers and admins"} need an @${dom} address.`;
        form.email.setAttribute("aria-invalid", "true"); form.email.focus(); return;
      }
      if (store.userByEmail(email)) { err.textContent = `${email} is already on the roster.`; form.email.setAttribute("aria-invalid", "true"); form.email.focus(); return; }
      store.addUser({ name, email, role, classId: role === "admin" ? null : form.cls.value });
      ui.toast(`Added ${name}. They can sign in now.`);
      go("users");
    });
  }

  /* ---------- 11 Courses & system report ---------- */
  function courses(el) {
    el.innerHTML = `
      <div class="page-head"><div><div class="eyebrow">Administration</div><h1 class="page-title">Courses</h1>
      <p class="page-lede">Hidden courses disappear for students and can't be assigned. Existing assignments stay and are flagged for the teacher.</p></div></div>
      <div class="card" style="padding:0">${C.pathways.map(pw => {
        const on = store.isPublished(pw.pathwayId);
        return `<div class="course-row">
          <span class="course-icon">${esc(initials(pw.title))}</span>
          <div class="meta"><strong>${esc(pw.title)}</strong><span>${pw.modules.length} module${pw.modules.length === 1 ? "" : "s"}: ${pw.modules.map(m => esc(C.byId[m].title)).join(", ")}</span></div>
          <label class="switch"><span class="state">${on ? "Published" : "Hidden"}</span><input type="checkbox" data-pub="${pw.pathwayId}" ${on ? "checked" : ""} aria-label="Publish ${esc(pw.title)}"><span class="track"></span></label>
        </div>`;
      }).join("")}</div>
      <div data-report></div>`;
    report(el.querySelector("[data-report]"), true);
    el.addEventListener("change", e => {
      const t = e.target.closest("[data-pub]");
      if (!t) return;
      store.setPublished(t.dataset.pub, t.checked);
      ui.toast(`${RP.content.pathway(t.dataset.pub).title} is ${t.checked ? "published" : "hidden"}`);
      go("courses");
    });
  }

  function report(el, embedded) {
    const pub = C.pathways.filter(p => store.isPublished(p.pathwayId)).length;
    const byType = A.eventsByType();
    const max = Math.max(1, ...byType.map(x => x[1]));
    const roles = ["student", "teacher", "admin"].map(r => [r, store.users().filter(u => u.role === r).length]);
    el.innerHTML = `
      ${embedded ? `<h2 style="font-size:var(--fs-xl);margin-bottom:14px">System report</h2>` : `<div class="page-head"><div><div class="eyebrow">Administration</div><h1 class="page-title">System report</h1><p class="page-lede">Totals across the whole platform, updated as people use it.</p></div></div>`}
      <div class="stack" style="gap:18px">
        <div class="tiles">
          <div class="tile"><span class="tile-label">Users</span><span class="tile-value">${store.users().length}</span><span class="tile-note">${roles.map(r => `${r[1]} ${r[0]}${r[1] === 1 ? "" : "s"}`).join(" · ")}</span></div>
          <div class="tile"><span class="tile-label">Learning DB rows</span><span class="tile-value">${store.learningRows().toLocaleString()}</span><span class="tile-note">Roster, progress, answers, reflections</span></div>
          <div class="tile"><span class="tile-label">Analytics events</span><span class="tile-value">${store.events().length.toLocaleString()}</span><span class="tile-note">Since the term started</span></div>
          <div class="tile"><span class="tile-label">Published</span><span class="tile-value">${pub} / ${C.pathways.length}</span><span class="tile-note">Courses visible to students</span></div>
        </div>
        <section class="card">
          <div class="card-head"><h3 class="card-title">Events by type</h3><span class="card-sub">What students and staff did</span></div>
          ${byType.map(([t, n]) => `<div class="hbar"><span class="mono xsmall">${esc(t)}</span>${ui.bar([{ value: n / max * 100 }], `${t}: ${n}`)}<span class="count">${n.toLocaleString()}</span></div>`).join("")}
        </section>
        <section class="card row-between">
          <div style="min-width:0;flex:1 1 300px"><h3 class="card-title">Demo data</h3><p class="small muted">Put the roster, progress and events back to the starting demo. Everything saved in this browser is replaced.</p></div>
          <div data-reset-box><button class="btn" type="button" data-reset>Reset demo data</button></div>
        </section>
      </div>`;
    el.addEventListener("click", e => {
      if (e.target.closest("[data-reset]")) {
        el.querySelector("[data-reset-box]").innerHTML = `<div class="confirm-box"><span>Replace all saved data?</span><button class="btn btn-sm btn-danger" type="button" data-reset-yes>Reset</button><button class="btn btn-sm btn-ghost" type="button" data-reset-no>Cancel</button></div>`;
        el.querySelector("[data-reset-no]").focus();
      } else if (e.target.closest("[data-reset-no]")) {
        el.querySelector("[data-reset-box]").innerHTML = `<button class="btn" type="button" data-reset>Reset demo data</button>`;
      } else if (e.target.closest("[data-reset-yes]")) {
        const me = store.currentUser();
        store.reset();
        if (me) store.signIn(me.userId);
        ui.toast("Demo data reset");
        RP.app.go(RP.app.current().name);
      }
    });
  }

  RP.admin = { users, courses, report: el => report(el, false) };
})(window.RP);
