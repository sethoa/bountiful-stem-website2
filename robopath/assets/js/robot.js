/* Robot grid engine: 6 x 6 mat, columns A–F left to right, rows 1–6 bottom to top (R3.1, R3.3). */
(function (RP) {
  const COLS = "ABCDEF";
  const SIZE = 6;
  const DIRS = { N: [0, 1], E: [1, 0], S: [0, -1], W: [-1, 0] };
  const RIGHT = { N: "E", E: "S", S: "W", W: "N" };
  const LEFT = { N: "W", W: "S", S: "E", E: "N" };
  const ANGLE = { E: 0, S: 90, W: 180, N: -90 };

  const parse = cell => ({ x: COLS.indexOf(cell[0]), y: parseInt(cell.slice(1), 10) - 1 });
  const name = (x, y) => `${COLS[x]}${y + 1}`;

  // Turn blocks into single instructions. Moves are numbered 1..n the way the feedback names them.
  function expand(blocks, opts) {
    const value = opts.variable;
    const body = blocks.map((b, i) => {
      if (b === "turnLeft()") return { op: "L", block: i };
      if (b === "turnRight()") return { op: "R", block: i };
      const n = b === "forward(steps)" ? value : parseInt(b.match(/\d+/)[0], 10);
      return { op: "F", n, block: i };
    });
    const reps = opts.loopCount || 1;
    const out = [];
    for (let r = 0; r < reps; r++) body.forEach(ins => out.push({ ...ins, pass: r }));
    return out.map((ins, i) => ({ ...ins, move: i + 1 }));
  }

  function simulate(cfg, instrs) {
    const shelves = new Set(cfg.shelves);
    const start = parse(cfg.start);
    let x = start.x, y = start.y, dir = cfg.facing, angle = ANGLE[dir];
    const frames = [{ x, y, angle, move: 0, block: -1 }];
    const trail = [name(x, y)];
    for (const ins of instrs) {
      if (ins.op === "L") { dir = LEFT[dir]; angle -= 90; frames.push({ x, y, angle, move: ins.move, block: ins.block }); continue; }
      if (ins.op === "R") { dir = RIGHT[dir]; angle += 90; frames.push({ x, y, angle, move: ins.move, block: ins.block }); continue; }
      for (let s = 0; s < ins.n; s++) {
        const nx = x + DIRS[dir][0], ny = y + DIRS[dir][1];
        if (nx < 0 || ny < 0 || nx >= SIZE || ny >= SIZE) {
          frames.push({ x, y, angle, move: ins.move, block: ins.block, bump: true });
          return { frames, trail, result: { kind: "edge", at: name(x, y), move: ins.move, dir } };
        }
        if (shelves.has(name(nx, ny))) {
          frames.push({ x, y, angle, move: ins.move, block: ins.block, bump: true });
          return { frames, trail, result: { kind: "crash", at: name(nx, ny), from: name(x, y), move: ins.move } };
        }
        x = nx; y = ny;
        trail.push(name(x, y));
        frames.push({ x, y, angle, move: ins.move, block: ins.block });
      }
    }
    const at = name(x, y);
    return { frames, trail, result: { kind: at === cfg.goal ? "pass" : "short", at, moves: instrs.length } };
  }

  function matHTML(cfg) {
    const shelves = new Set(cfg.shelves);
    let cells = "";
    for (let row = SIZE - 1; row >= 0; row--) {
      for (let col = 0; col < SIZE; col++) {
        const n = name(col, row);
        const isShelf = shelves.has(n);
        const isGoal = n === cfg.goal;
        cells += `<div class="cell${isShelf ? " shelf" : ""}" data-cell="${n}" role="gridcell" aria-label="${n}${isShelf ? ", shelf" : ""}${isGoal ? ", flag" : ""}${n === cfg.start ? ", start" : ""}">
          ${isGoal ? '<span class="flag"><svg viewBox="0 0 24 24"><path class="pole" d="M6 22V3"/><path class="cloth" d="M7 3h12l-3 4.5 3 4.5H7z"/></svg></span>' : ""}</div>`;
      }
    }
    const rows = Array.from({ length: SIZE }, (_, i) => `<span>${SIZE - i}</span>`).join("");
    const cols = COLS.split("").map(c => `<span>${c}</span>`).join("");
    return `<div class="grid-wrap">
      <div class="grid-rows" aria-hidden="true">${rows}</div>
      <div class="mat" role="grid" aria-label="Robot mat, 6 by 6. Start ${cfg.start} facing ${({ N: "north", E: "east", S: "south", W: "west" })[cfg.facing]}. Flag on ${cfg.goal}. Shelves on ${cfg.shelves.join(", ") || "no squares"}.">
        ${cells}
        <div class="robot" aria-hidden="true"><div class="robot-body"><i></i></div></div>
      </div>
      <div class="grid-cols" aria-hidden="true">${cols}</div>
    </div>`;
  }

  function place(robotEl, f) {
    robotEl.style.left = `${(f.x * 100) / SIZE}%`;
    robotEl.style.bottom = `${(f.y * 100) / SIZE}%`;
    robotEl.querySelector(".robot-body").style.transform = `rotate(${f.angle}deg)`;
  }

  function resetMat(root, cfg) {
    root.querySelectorAll(".cell").forEach(c => c.classList.remove("trail", "crash"));
    const s = parse(cfg.start);
    place(root.querySelector(".robot"), { x: s.x, y: s.y, angle: ANGLE[cfg.facing] });
  }

  // Plays frames on the mat. Returns a cancel function.
  function animate(root, sim, onFrame, onDone) {
    const robotEl = root.querySelector(".robot");
    const reduce = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const delay = reduce ? 90 : 320;
    let i = 0, timer = null, cancelled = false;
    function tick() {
      if (cancelled) return;
      const f = sim.frames[i];
      place(robotEl, f);
      const cell = root.querySelector(`[data-cell="${name(f.x, f.y)}"]`);
      if (cell && i > 0) cell.classList.add("trail");
      if (f.bump) {
        robotEl.classList.remove("bump");
        void robotEl.offsetWidth;
        robotEl.classList.add("bump");
        if (sim.result.kind === "crash") {
          const hit = root.querySelector(`[data-cell="${sim.result.at}"]`);
          if (hit) hit.classList.add("crash");
        }
      }
      if (onFrame) onFrame(f);
      i++;
      if (i < sim.frames.length) timer = setTimeout(tick, delay);
      else timer = setTimeout(() => onDone && onDone(sim.result), reduce ? 50 : 200);
    }
    tick();
    return () => { cancelled = true; clearTimeout(timer); };
  }

  RP.robot = { COLS, SIZE, parse, name, expand, simulate, matHTML, resetMat, animate, place, ANGLE };
})(window.RP);
