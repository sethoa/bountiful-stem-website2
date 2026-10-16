/* Shared helpers: escaping, dates, icons, seeded randomness. */
window.RP = window.RP || {};
(function (RP) {
  const DAY = 86400000;

  function esc(value) {
    return String(value == null ? "" : value)
      .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;").replace(/'/g, "&#39;");
  }

  function initials(name) {
    return String(name || "?").split(/\s+/).filter(Boolean).slice(0, 2).map(p => p[0].toUpperCase()).join("");
  }

  function startOfDay(ts) {
    const d = new Date(ts);
    d.setHours(0, 0, 0, 0);
    return d.getTime();
  }

  function daysBetween(a, b) {
    return Math.round((startOfDay(b) - startOfDay(a)) / DAY);
  }

  function fmtDate(value, opts) {
    const d = typeof value === "string" ? parseISODate(value) : new Date(value);
    return d.toLocaleDateString("en-US", opts || { month: "short", day: "numeric" });
  }

  function fmtLongDate(ts) {
    return new Date(ts).toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" });
  }

  function parseISODate(iso) {
    const [y, m, d] = iso.split("-").map(Number);
    return new Date(y, m - 1, d);
  }

  function toISODate(ts) {
    const d = new Date(ts);
    const pad = n => String(n).padStart(2, "0");
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
  }

  function relDays(ts) {
    if (!ts) return "Never";
    const n = daysBetween(ts, Date.now());
    if (n <= 0) return "Today";
    if (n === 1) return "Yesterday";
    return `${n} days ago`;
  }

  function pct(n) {
    return n == null || isNaN(n) ? "–" : `${Math.round(n)}%`;
  }

  // Mulberry32: small deterministic PRNG so seeded demo data is stable.
  function seeded(seed) {
    let a = seed >>> 0;
    return function () {
      a |= 0; a = (a + 0x6D2B79F5) | 0;
      let t = Math.imul(a ^ (a >>> 15), 1 | a);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  function hashStr(s) {
    let h = 2166136261;
    for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); }
    return h >>> 0;
  }

  function uid(prefix) {
    return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`;
  }

  const icons = {
    play: '<svg viewBox="0 0 16 16" aria-hidden="true"><path d="M4 2.5v11l9-5.5z" fill="currentColor"/></svg>',
    reset: '<svg viewBox="0 0 16 16" aria-hidden="true"><path d="M3 8a5 5 0 1 0 1.6-3.7" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/><path d="M3 2.5v3h3" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg>',
    check: '<svg viewBox="0 0 16 16" aria-hidden="true"><path d="M3.5 8.5l3 3 6-7" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/></svg>',
    cross: '<svg viewBox="0 0 16 16" aria-hidden="true"><path d="M4 4l8 8M12 4l-8 8" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>',
    arrowL: '<svg viewBox="0 0 16 16" aria-hidden="true"><path d="M10 3L5 8l5 5" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>',
    arrowR: '<svg viewBox="0 0 16 16" aria-hidden="true"><path d="M6 3l5 5-5 5" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>',
    up: '<svg viewBox="0 0 16 16" aria-hidden="true"><path d="M3.5 10L8 5.5 12.5 10" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>',
    down: '<svg viewBox="0 0 16 16" aria-hidden="true"><path d="M3.5 6L8 10.5 12.5 6" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>',
    flag: '<svg viewBox="0 0 16 16" aria-hidden="true"><path d="M4 14V2" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/><path d="M4.5 2.5h8l-2 3 2 3h-8z" fill="currentColor"/></svg>',
    calendar: '<svg viewBox="0 0 16 16" aria-hidden="true" width="16" height="16"><rect x="2" y="3" width="12" height="11" rx="2" fill="none" stroke="currentColor" stroke-width="1.6"/><path d="M2 6.5h12M5 1.5v3M11 1.5v3" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/></svg>',
    google: '<svg viewBox="0 0 18 18" aria-hidden="true"><path d="M17.6 9.2c0-.6-.1-1.2-.2-1.7H9v3.3h4.8a4.1 4.1 0 0 1-1.8 2.7v2.2h2.9c1.7-1.6 2.7-3.9 2.7-6.5z" fill="#4285F4"/><path d="M9 18c2.4 0 4.5-.8 6-2.2l-2.9-2.2c-.8.5-1.8.9-3.1.9-2.4 0-4.4-1.6-5.1-3.8H.9v2.3A9 9 0 0 0 9 18z" fill="#34A853"/><path d="M3.9 10.7a5.4 5.4 0 0 1 0-3.4V5H.9a9 9 0 0 0 0 8z" fill="#FBBC05"/><path d="M9 3.6c1.3 0 2.5.5 3.5 1.4L15 2.4A9 9 0 0 0 .9 5l3 2.3C4.6 5.2 6.6 3.6 9 3.6z" fill="#EA4335"/></svg>',
    robot: '<svg viewBox="0 0 20 20" aria-hidden="true"><rect x="3" y="6" width="14" height="10" rx="2.5" fill="currentColor"/><path d="M10 2.5V6" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/><circle cx="10" cy="2.5" r="1.4" fill="currentColor"/><circle cx="7.3" cy="11" r="1.4" fill="var(--primary)"/><circle cx="12.7" cy="11" r="1.4" fill="var(--primary)"/></svg>'
  };

  RP.util = { DAY, esc, initials, startOfDay, daysBetween, fmtDate, fmtLongDate, parseISODate, toISODate, relDays, pct, seeded, hashStr, uid, icons };
})(window.RP);
