/* Requirements map: renders data/requirements.json as a navigable page (processes, requirements, screens, events, rules). */
(function (RP) {
  const { esc } = RP.util;
  let tab = "flow";

  function flowSVG() {
    const lanes = [
      { label: "STUDENT", y: 20, nodes: [["01", "Sign in"], ["02", "Student home"], ["03", "Lesson"], ["04", "Robot activity"], ["05", "Quiz"], ["05b", "Reflect"], ["END", "Module complete"], ["06", "My progress"]] },
      { label: "TEACHER", y: 200, nodes: [["01", "Sign in"], ["07", "Class dashboard"], ["08", "Student detail"], ["09", "Assign pathways"], ["03–05", "Preview content"]] },
      { label: "ADMIN", y: 350, nodes: [["01", "Sign in"], ["10", "Users & roles"], ["11", "Courses & report"], ["07", "Class dashboard"]] }
    ];
    const W = 1240, nodeW = 132, nodeH = 52, gap = 22, x0 = 20;
    let s = `<svg class="flow-svg" viewBox="0 0 ${W} 480" role="img" aria-label="RoboPath user flow for students, teachers and admins">
      <defs><marker id="fa" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto"><path class="arrow" d="M0 0L10 5L0 10z"/></marker>
      <marker id="fb" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto"><path class="arrow-accent" d="M0 0L10 5L0 10z"/></marker></defs>`;
    const pos = {};
    lanes.forEach((ln, li) => {
      const h = li === 0 ? 150 : 120;
      s += `<rect class="lane" x="0" y="${ln.y}" width="${W}" height="${h}" rx="10"/><text class="lane-label" x="${x0}" y="${ln.y + 22}">${ln.label}</text>`;
      ln.nodes.forEach((n, i) => {
        const x = x0 + i * (nodeW + gap), y = ln.y + 40;
        pos[`${li}-${i}`] = { x, y };
        s += `<rect class="node" x="${x}" y="${y}" width="${nodeW}" height="${nodeH}" rx="7"/>
          <text class="nid" x="${x + 12}" y="${y + 20}">${esc(n[0])}</text><text x="${x + 12}" y="${y + 39}">${esc(n[1])}</text>`;
        if (i > 0) s += `<path class="edge" d="M${x - gap} ${y + nodeH / 2}H${x - 2}" marker-end="url(#fa)"/>`;
      });
    });
    const end = pos["0-6"], home = pos["0-1"];
    s += `<path class="edge" d="M${end.x + nodeW / 2} ${end.y + nodeH}V${end.y + nodeH + 26}H${home.x + nodeW / 2}V${home.y + nodeH + 3}" marker-end="url(#fa)"/>
      <text class="lane-label" x="${(end.x + home.x) / 2 + 60}" y="${end.y + nodeH + 20}">NEXT MODULE</text>`;
    const act = pos["0-3"], dash = pos["1-1"];
    s += `<path class="data" d="M${act.x + nodeW / 2} ${act.y + nodeH}V${act.y + nodeH + 50}H${dash.x + nodeW / 2}V${dash.y - 3}" marker-end="url(#fb)"/>
      <text class="note" x="${act.x + nodeW / 2 + 8}" y="${act.y + nodeH + 44}">activity + quiz events (R4) → dashboard (R5)</text>`;
    const users = pos["2-1"], signin = pos["2-0"];
    s += `<path class="data" d="M${users.x + nodeW / 2} ${users.y + nodeH}V${users.y + nodeH + 18}H${signin.x + nodeW / 2}V${signin.y + nodeH + 3}" marker-end="url(#fb)"/>
      <text class="note" x="${signin.x + nodeW / 2 + 8}" y="${users.y + nodeH + 32}">adding someone lets them sign in (R6.4)</text>`;
    const d7 = pos["1-1"], d9 = pos["1-3"], d35 = pos["1-4"];
    s += `<path class="edge" d="M${d7.x + nodeW / 2} ${d7.y + nodeH}V${d7.y + nodeH + 16}H${d35.x + nodeW / 2}V${d35.y + nodeH + 3}" marker-end="url(#fa)"/>
      <path class="edge" d="M${d9.x + nodeW / 2} ${d7.y + nodeH + 16}V${d9.y + nodeH + 3}" marker-end="url(#fa)"/>`;
    return s + "</svg>";
  }

  function render(el) {
    const R = RP.content.C.requirements;
    const signedIn = !!RP.store.currentUser();
    const total = R.requirements.reduce((n, r) => n + r.items.length, 0);
    const tabs = [["flow", "Overview"], ["processes", `Processes (${R.processes.length})`], ["reqs", `Requirements (${total})`], ["screens", `Screens (${R.screens.length})`], ["events", "Events & rules"]];
    let body = "";
    if (tab === "flow") {
      body = `
        <section class="card stack"><h2 class="card-title">What RoboPath does</h2><p style="max-width:72ch">${esc(R.product.goal)}</p>
          <p class="small muted">Audience: ${esc(R.product.audience)}. Sources: ${R.product.sources.map(esc).join("; ")}.</p></section>
        <section class="card stack"><div class="card-head"><h2 class="card-title">User flow</h2><span class="card-sub">Numbers match the screens. Dashed lines are data flowing between roles, not navigation.</span></div>
          <div class="flow-wrap">${flowSVG()}</div></section>
        <div class="dash-grid" style="grid-template-columns:repeat(auto-fit,minmax(260px,1fr))">${R.roles.map(r => `<section class="card stack" style="gap:8px">
          <h3 class="card-title">${esc(r.role)}</h3><p class="xsmall muted">${esc(r.signIn)}</p>
          <ul class="small" style="margin:0;padding-left:1.1rem;display:flex;flex-direction:column;gap:4px">${r.can.map(c => `<li>${esc(c)}</li>`).join("")}</ul></section>`).join("")}</div>`;
    } else if (tab === "processes") {
      body = R.processes.map(p => `<section class="card proc">
        <div class="card-head" style="margin:0"><h2 class="card-title"><span class="mono" style="color:var(--accent-ink)">${p.id}</span> ${esc(p.name)}</h2><span class="pill">${esc(p.actor)}</span></div>
        <p class="small muted">Trigger: ${esc(p.trigger)}</p>
        <ol class="proc-steps">${p.steps.map(s => `<li><span class="scr">${esc(s.screen)}</span><span>${esc(s.action)}</span><span class="muted">${esc(s.system)}</span><span class="reqs">${s.req.map(r => `<span class="req-tag">${r}</span>`).join("")}</span></li>`).join("")}</ol>
        <p class="small"><strong>Outcome:</strong> ${esc(p.outcome)}</p></section>`).join("");
    } else if (tab === "reqs") {
      body = R.requirements.map(r => `<section class="card req-block">
        <div class="card-head" style="margin:0"><h2 class="card-title"><span class="mono" style="color:var(--accent-ink)">${r.id}</span> ${esc(r.title)}</h2>
          <div class="row" style="gap:6px"><span class="pill ${r.priority === "Must" ? "pill-ink" : ""}">${r.priority}</span>${r.screens.map(s => `<span class="req-tag">Screen ${esc(s)}</span>`).join("")}</div></div>
        <p class="small muted">${esc(r.summary)}</p>
        <div>${r.items.map(i => `<div class="req-item"><span class="rid">${i.id}</span><div><div>${esc(i.text)}</div><div class="acc">Accept when: ${esc(i.acceptance)}</div></div><div class="impl-col"><span class="pill pill-good">Built</span><div class="impl">${esc(i.impl)}</div></div></div>`).join("")}</div>
      </section>`).join("");
    } else if (tab === "screens") {
      body = `<div class="table-wrap"><table class="table"><thead><tr><th>Screen</th><th>Name</th><th>Role</th><th>Wireframe callouts</th></tr></thead>
        <tbody>${R.screens.map(s => `<tr><td class="mono">${esc(s.id)}</td><td><strong>${esc(s.name)}</strong></td><td>${esc(s.role)}</td><td class="small">${s.notes.map(esc).join(" · ")}</td></tr>`).join("")}</tbody></table></div>`;
    } else {
      body = `
        <section class="stack"><h2 style="font-size:var(--fs-xl)">Analytics events (R4)</h2>
          <div class="table-wrap"><table class="table"><thead><tr><th>Event</th><th>When</th><th>Fields</th></tr></thead>
          <tbody>${R.events.map(e => `<tr><td class="mono">${esc(e.type)}</td><td>${esc(e.when)}</td><td class="small muted">${esc(e.fields)}</td></tr>`).join("")}</tbody></table></div></section>
        <section class="stack"><h2 style="font-size:var(--fs-xl)">Business rules</h2>
          <div class="table-wrap"><table class="table"><tbody>${R.rules.map(r => `<tr><td><strong>${esc(r.name)}</strong></td><td>${esc(r.rule)}</td></tr>`).join("")}</tbody></table></div></section>
        <section class="stack"><h2 style="font-size:var(--fs-xl)">Data files</h2>
          <div class="table-wrap"><table class="table"><tbody>${R.data.map(d => `<tr><td class="mono">${esc(d.file)}</td><td>${esc(d.holds)}</td></tr>`).join("")}</tbody></table></div></section>`;
    }
    el.innerHTML = `
      ${signedIn ? "" : `<div><button class="btn" type="button" data-back>← Back to sign in</button></div>`}
      <div class="page-head"><div><div class="eyebrow">RoboPath ${esc(R.product.version)}</div><h1 class="page-title">Requirements map</h1>
        <p class="page-lede">Every process from the wireframes, the requirement behind each step, and where it is built.</p></div>
        <span class="pill pill-good">${total} of ${total} built</span></div>
      <div class="req-nav" role="group" aria-label="Section">${tabs.map(([k, l]) => `<button type="button" data-rtab="${k}" aria-pressed="${tab === k}">${l}</button>`).join("")}</div>
      ${body}`;
    el.onclick = e => {
      const t = e.target.closest("[data-rtab]");
      if (t) { tab = t.dataset.rtab; render(el); el.querySelector(`[data-rtab="${tab}"]`).focus(); }
      if (e.target.closest("[data-back]")) RP.app.go("signin");
    };
  }

  RP.requirements = { render };
})(window.RP);
