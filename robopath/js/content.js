/* Content: loads the JSON files and renders module text (R1.1, R1.3). */
(function (RP) {
  const { esc } = RP.util;
  const C = { modules: [], byId: {}, pathways: [], moduleMeta: {}, stepKinds: [], badges: [], activities: {}, school: null, requirements: null };

  async function load() {
    const files = ["modules", "pathways", "activities", "school", "requirements"];
    const results = await Promise.all(files.map(f => fetch(`data/${f}.json`).then(r => {
      if (!r.ok) throw new Error(`data/${f}.json returned ${r.status}`);
      return r.json();
    })));
    const [modules, pathways, activities, school, requirements] = results;
    C.modules = modules;
    modules.forEach(m => { C.byId[m.moduleId] = m; });
    C.pathways = pathways.pathways;
    C.moduleMeta = pathways.moduleMeta;
    C.stepKinds = pathways.stepKinds;
    C.badges = pathways.badges;
    C.activities = activities;
    C.school = school;
    C.requirements = requirements;
    return C;
  }

  const shortKey = id => id.slice(0, 3);
  const fullId = key => (C.modules.find(m => m.moduleId.startsWith(key)) || {}).moduleId;
  const moduleNumber = id => parseInt(id.slice(1, 3), 10);
  const pathway = pid => C.pathways.find(p => p.pathwayId === pid);
  const pathwayOf = mid => C.pathways.find(p => p.modules.includes(mid));
  const stepNames = mid => (C.moduleMeta[mid] || {}).steps || ["Lesson", "Lesson", "Try it", "Quick check", "Reflect"];
  const minutes = mid => (C.moduleMeta[mid] || {}).minutes || 15;

  function inline(text) {
    return esc(text)
      .replace(/`([^`]+)`/g, "<code>$1</code>")
      .replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>");
  }

  function highlight(code) {
    return esc(code).split("\n").map(line => {
      const i = line.indexOf("//");
      let head = i >= 0 ? line.slice(0, i) : line;
      const tail = i >= 0 ? `<span class="cm">${line.slice(i)}</span>` : "";
      head = head.replace(/\b(let|repeat)\b/g, '<span class="kw">$1</span>');
      return head + tail;
    }).join("\n");
  }

  // Small markdown renderer covering what modules.json uses.
  function markdown(src) {
    const lines = src.split("\n");
    const out = [];
    let i = 0;
    while (i < lines.length) {
      const line = lines[i];
      if (line.startsWith("```")) {
        const buf = [];
        i++;
        while (i < lines.length && !lines[i].startsWith("```")) buf.push(lines[i++]);
        i++;
        out.push(`<pre><code>${highlight(buf.join("\n"))}</code></pre>`);
        continue;
      }
      if (line.startsWith(">")) {
        const buf = [];
        while (i < lines.length && lines[i].startsWith(">")) {
          const t = lines[i].replace(/^>\s?/, "");
          if (t.trim()) buf.push(`<p>${inline(t)}</p>`);
          i++;
        }
        out.push(`<blockquote>${buf.join("")}</blockquote>`);
        continue;
      }
      if (/^- /.test(line)) {
        const buf = [];
        while (i < lines.length && /^- /.test(lines[i])) buf.push(`<li>${inline(lines[i++].slice(2))}</li>`);
        out.push(`<ul>${buf.join("")}</ul>`);
        continue;
      }
      if (/^\d+\. /.test(line)) {
        const buf = [];
        while (i < lines.length && /^\d+\. /.test(lines[i])) buf.push(`<li>${inline(lines[i++].replace(/^\d+\. /, ""))}</li>`);
        out.push(`<ol class="steps-list">${buf.join("")}</ol>`);
        continue;
      }
      if (!line.trim()) { i++; continue; }
      if (/^\*\*[^*]+\*\*$/.test(line.trim())) {
        out.push(`<h4>${esc(line.trim().slice(2, -2))}</h4>`);
        i++;
        continue;
      }
      if (line.startsWith("Ask yourself")) {
        out.push(`<div class="callout callout-accent"><span class="callout-icon" aria-hidden="true">?</span><div><strong class="callout-title">Ask yourself</strong><p>${inline(line.replace(/^Ask yourself:?\s*/, ""))}</p></div></div>`);
        i++;
        continue;
      }
      if (line.startsWith("**Tip:**")) {
        out.push(`<div class="callout"><span class="callout-icon" aria-hidden="true">!</span><div><strong class="callout-title">Tip</strong><p>${inline(line.replace("**Tip:**", "").trim())}</p></div></div>`);
        i++;
        continue;
      }
      out.push(`<p>${inline(line)}</p>`);
      i++;
    }
    return out.join("");
  }

  RP.content = { C, load, shortKey, fullId, moduleNumber, pathway, pathwayOf, stepNames, minutes, markdown, inline };
})(window.RP);
