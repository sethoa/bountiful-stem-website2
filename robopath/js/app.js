/* App: boot, role-based routing and the app shell (R6.5). */
(function (RP) {
  const { esc, icons, initials } = RP.util;
  const ui = { classId: null };
  let cur = { name: null, params: {} };
  let cleanup = null;

  const NAV = {
    student: [["home", "Home"], ["pathways", "Pathways"], ["progress", "My progress"]],
    teacher: [["dashboard", "Class dashboard"], ["assign", "Assign pathways"], ["preview", "Preview content"]],
    admin: [["users", "Users & roles"], ["courses", "Courses"], ["report", "System report"], ["dashboard", "Class dashboard"]]
  };
  const ACTIVE = { module: "pathways", complete: "pathways", previewModule: "preview" };

  const ROUTES = {
    home: { roles: ["student"], view: (el, p) => RP.student.home(el, p) },
    pathways: { roles: ["student"], view: (el, p) => RP.student.pathways(el, p) },
    module: { roles: ["student"], view: (el, p) => RP.student.module(el, p) },
    complete: { roles: ["student"], view: (el, p) => RP.student.complete(el, p) },
    progress: { roles: ["student"], view: (el, p) => RP.student.progress(el, p) },
    dashboard: { roles: ["teacher", "admin"], view: el => RP.teacher.dashboard(el) },
    assign: { roles: ["teacher"], view: el => RP.teacher.assign(el) },
    preview: { roles: ["teacher", "admin"], view: el => RP.teacher.preview(el) },
    previewModule: { roles: ["teacher", "admin"], view: (el, p) => RP.student.module(el, { ...p, preview: true }) },
    users: { roles: ["admin"], view: el => RP.admin.users(el) },
    courses: { roles: ["admin"], view: el => RP.admin.courses(el) },
    report: { roles: ["admin"], view: el => RP.admin.report(el) },
    requirements: { roles: ["student", "teacher", "admin"], view: el => RP.requirements.render(el) }
  };
  const HOME = { student: "home", teacher: "dashboard", admin: "users" };

  function home() {
    const u = RP.store.currentUser();
    go(u ? HOME[u.role] : "signin");
  }

  function shell(u) {
    const root = document.getElementById("app");
    if (root.dataset.shell === u.userId) return root.querySelector("#view-host");
    root.dataset.shell = u.userId;
    root.innerHTML = `
      <header class="app-header">
        <div class="brand"><span class="brand-mark">${icons.robot}</span>
          <div style="min-width:0"><div class="brand-name">RoboPath</div><div class="brand-school">${esc(RP.content.C.school.school.name)}</div></div></div>
        <div class="who"><span class="avatar">${esc(initials(u.name))}</span><span class="who-name">${esc(u.name)}</span><span class="role-pill">${esc(u.role)}</span>
          <button class="btn btn-sm btn-ghost" type="button" data-signout>Sign out</button></div>
      </header>
      <div class="shell">
        <nav class="side-nav" aria-label="Main">
          ${NAV[u.role].map(([k, l]) => `<button class="nav-item" type="button" data-nav="${k}"><span class="dot" aria-hidden="true"></span>${esc(l)}</button>`).join("")}
          <div class="side-foot"><button class="nav-item" type="button" data-nav="requirements">Requirements map</button></div>
        </nav>
        <main class="main" id="main"><div class="main-inner" id="view-host"></div></main>
      </div>`;
    root.onclick = e => {
      const n = e.target.closest("[data-nav]");
      if (n) go(n.dataset.nav);
      if (e.target.closest("[data-signout]")) { RP.store.signOut(); RP.ui.closeDialog(); go("signin"); }
    };
    return root.querySelector("#view-host");
  }

  function go(name, params) {
    if (cleanup) { try { cleanup(); } catch (e) { console.error(e); } cleanup = null; }
    RP.ui.closeDialog();
    const u = RP.store.currentUser();
    const root = document.getElementById("app");
    params = params || {};

    if (!u || name === "signin") {
      if (u && name === "signin") RP.store.signOut();
      root.dataset.shell = "";
      if (name === "requirements") {
        cur = { name, params };
        root.innerHTML = `<main class="main"><div class="main-inner" id="view-host"></div></main>`;
        RP.requirements.render(root.querySelector("#view-host"));
        return;
      }
      cur = { name: "signin", params: {} };
      RP.auth.render(root);
      document.title = "RoboPath";
      return;
    }
    const route = ROUTES[name];
    if (!route || !route.roles.includes(u.role)) { name = HOME[u.role]; params = {}; }
    cur = { name, params };
    const host = shell(u);
    const view = document.createElement("div");
    view.className = "view";
    host.replaceChildren(view);
    host.closest(".app").querySelectorAll("[data-nav]").forEach(b => {
      if (b.dataset.nav === (ACTIVE[name] || name)) b.setAttribute("aria-current", "page"); else b.removeAttribute("aria-current");
    });
    window.scrollTo(0, 0);
    cleanup = ROUTES[name].view(view, params) || null;
  }

  async function boot() {
    const root = document.getElementById("app");
    try {
      await RP.content.load();
    } catch (e) {
      root.innerHTML = `<div class="signin"><div class="card stack"><h1 class="page-title">RoboPath couldn't load its content</h1>
        <p>The data files in <code>data/</code> did not load (${esc(e.message)}). Browsers block these files when the page is opened straight from disk.
        Start a local server in the project folder, for example <code>python3 -m http.server 8000</code>, then open <code>http://localhost:8000</code>.</p></div></div>`;
      return;
    }
    RP.store.init(RP.content.C);
    window.addEventListener("beforeunload", () => { if (cleanup) cleanup(); });
    home();
  }

  RP.app = { go, home, boot, ui, current: () => cur };
  document.addEventListener("DOMContentLoaded", boot);
})(window.RP);
