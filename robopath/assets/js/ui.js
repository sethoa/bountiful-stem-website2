/* UI primitives: toasts, screen-reader announcements, dialogs with focus trap (R12.1, R12.2). */
(function (RP) {
  const { esc } = RP.util;

  function toast(message) {
    const host = document.getElementById("toasts");
    if (!host) return;
    const el = document.createElement("div");
    el.className = "toast";
    el.textContent = message;
    host.appendChild(el);
    announce(message);
    setTimeout(() => el.remove(), 3200);
  }

  function announce(message) {
    const live = document.getElementById("live");
    if (!live) return;
    live.textContent = "";
    setTimeout(() => { live.textContent = message; }, 30);
  }

  let openDialog = null;

  function dialog({ title, avatar, body, onClose }) {
    closeDialog();
    const returnFocus = document.activeElement;
    const scrim = document.createElement("div");
    scrim.className = "dialog-scrim";
    scrim.innerHTML = `
      <div class="dialog" role="dialog" aria-modal="true" aria-labelledby="dlg-title">
        <div class="dialog-head">
          ${avatar ? `<span class="avatar avatar-lg">${esc(avatar)}</span>` : ""}
          <h2 id="dlg-title">${esc(title)}</h2>
          <button class="icon-btn" type="button" data-close aria-label="Close">×</button>
        </div>
        <div class="dialog-body">${body}</div>
      </div>`;
    document.body.appendChild(scrim);
    const box = scrim.querySelector(".dialog");

    function close() {
      scrim.remove();
      document.removeEventListener("keydown", onKey);
      openDialog = null;
      if (returnFocus && returnFocus.focus) returnFocus.focus();
      if (onClose) onClose();
    }
    function onKey(e) {
      if (e.key === "Escape") { e.preventDefault(); close(); }
      if (e.key === "Tab") {
        const f = [...box.querySelectorAll("button, [href], input, select, textarea, [tabindex]:not([tabindex='-1'])")].filter(x => !x.disabled);
        if (!f.length) return;
        const first = f[0], last = f[f.length - 1];
        if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
        else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
      }
    }
    scrim.addEventListener("click", e => { if (e.target === scrim || e.target.closest("[data-close]")) close(); });
    document.addEventListener("keydown", onKey);
    scrim.querySelector("[data-close]").focus();
    openDialog = { close };
    return { el: box, close };
  }

  function closeDialog() {
    if (openDialog) openDialog.close();
  }

  function ring(percent, size) {
    const r = 22, c = 2 * Math.PI * r;
    const p = Math.max(0, Math.min(100, percent || 0));
    return `<div class="ring" style="${size ? `width:${size}px;height:${size}px` : ""}" role="img" aria-label="${Math.round(p)}% complete">
      <svg viewBox="0 0 56 56"><circle class="track" cx="28" cy="28" r="${r}" fill="none" stroke-width="6"/>
      <circle class="fill" cx="28" cy="28" r="${r}" fill="none" stroke-width="6" stroke-linecap="${p > 0 && p < 100 ? "round" : "butt"}" stroke-dasharray="${c.toFixed(2)}" stroke-dashoffset="${(c * (1 - p / 100)).toFixed(2)}"/></svg>
      <span>${Math.round(p)}%</span></div>`;
  }

  function statusDot(state, label) {
    if (state === "done") return `<span class="status-dot done" aria-label="Done">${RP.util.icons.check}</span>`;
    if (state === "doing") return `<span class="status-dot doing" aria-label="In progress, ${label}%">${label}</span>`;
    return `<span class="status-dot" aria-label="Not started"></span>`;
  }

  function bar(parts, label) {
    return `<div class="bar" role="img" aria-label="${esc(label || "")}">${parts.map(p => `<span class="${p.cls || ""}" style="width:${Math.max(0, Math.min(100, p.value))}%"></span>`).join("")}</div>`;
  }

  RP.ui = { toast, announce, dialog, closeDialog, ring, statusDot, bar };
})(window.RP);
