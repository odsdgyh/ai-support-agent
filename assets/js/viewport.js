/**
 * Интерактивный SVG-меш во вьюпорте Hero-секции (orbit drag, WIRE / SOLID).
 */

const LAT = 12;
const LON = 20;
const R = 112;
const CX = 160;
const CY = 150;

function buildSphere() {
  const verts = [];
  for (let i = 0; i <= LAT; i++) {
    const row = [];
    const th = (i / LAT) * Math.PI;
    for (let j = 0; j < LON; j++) {
      const ph = (j / LON) * Math.PI * 2;
      // лёгкая деформация «скульпта»
      const r = R * (1 + 0.06 * Math.sin(3 * ph) * Math.sin(th) * Math.sin(2 * th));
      row.push([r * Math.sin(th) * Math.cos(ph), r * Math.cos(th), r * Math.sin(th) * Math.sin(ph)]);
    }
    verts.push(row);
  }
  return verts;
}

export function initViewport(root = document) {
  const vp = root.querySelector('#viewport');
  if (!vp) return;
  const el = (id) => root.getElementById(id);
  const back = el('meshBack');
  const front = el('meshFront');
  const faces = el('meshFaces');
  const verts = el('meshVerts');
  const svgNS = 'http://www.w3.org/2000/svg';

  const base = buildSphere();
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  let yaw = 0.6;
  let pitch = 0.42;
  let autoSpin = true;
  let dragging = false;
  let lastX = 0;
  let lastY = 0;
  let shading = 'wire';
  let visible = true;
  let resumeTimer = null;

  const rotate = ([x, y, z]) => {
    const cy = Math.cos(yaw), sy = Math.sin(yaw), cp = Math.cos(pitch), sp = Math.sin(pitch);
    const x1 = x * cy + z * sy;
    const z1 = -x * sy + z * cy;
    return [x1, y * cp - z1 * sp, y * sp + z1 * cp];
  };
  const project = (v) => {
    const [x, y, z] = rotate(v);
    const f = 520 / (520 - z);
    return [CX + x * f, CY - y * f, z];
  };
  const seg = (a, b) => `M${a[0].toFixed(1)} ${a[1].toFixed(1)}L${b[0].toFixed(1)} ${b[1].toFixed(1)}`;

  function drawGizmo() {
    // Blender: Z вверх, Y «в экран»
    const axes = { X: [1, 0, 0], Y: [0, 0, -1], Z: [0, 1, 0] };
    for (const [k, v] of Object.entries(axes)) {
      const [x, y] = rotate(v);
      const ex = 32 + x * 24;
      const ey = 32 - y * 24;
      el(`ax${k}`).setAttribute('x2', ex);
      el(`ax${k}`).setAttribute('y2', ey);
      el(`ax${k}c`).setAttribute('cx', ex);
      el(`ax${k}c`).setAttribute('cy', ey);
      el(`ax${k}t`).setAttribute('x', ex);
      el(`ax${k}t`).setAttribute('y', ey);
    }
  }

  function draw() {
    const P = base.map((row) => row.map(project));
    let dBack = '';
    let dFront = '';
    for (let i = 0; i <= LAT; i++) {
      for (let j = 0; j < LON; j++) {
        const a = P[i][j];
        if (i > 0 && i < LAT) {
          const b = P[i][(j + 1) % LON];
          if (a[2] + b[2] > 0) dFront += seg(a, b); else dBack += seg(a, b);
        }
        if (i < LAT) {
          const b = P[i + 1][j];
          if (a[2] + b[2] > 0) dFront += seg(a, b); else dBack += seg(a, b);
        }
      }
    }

    faces.replaceChildren();
    if (shading === 'solid') {
      const quads = [];
      for (let i = 0; i < LAT; i++) {
        for (let j = 0; j < LON; j++) {
          const q = [P[i][j], P[i][(j + 1) % LON], P[i + 1][(j + 1) % LON], P[i + 1][j]];
          const z = (q[0][2] + q[1][2] + q[2][2] + q[3][2]) / 4;
          if (z > 0) quads.push([z, q]);
        }
      }
      quads.sort((a, b) => a[0] - b[0]);
      for (const [z, q] of quads) {
        const l = Math.round(40 + (z / R) * 110);
        const path = document.createElementNS(svgNS, 'path');
        path.setAttribute('d', `M${q.map((p) => `${p[0].toFixed(1)} ${p[1].toFixed(1)}`).join('L')}Z`);
        path.setAttribute('fill', `rgb(${l},${l + 4},${l + 18})`);
        faces.appendChild(path);
      }
    }

    back.setAttribute('d', shading === 'solid' ? '' : dBack);
    front.setAttribute('d', dFront);
    front.setAttribute('stroke-opacity', shading === 'solid' ? '0.35' : '0.9');

    verts.replaceChildren();
    for (const p of [P[0][0], P[LAT][0]]) {
      if (p[2] <= -20) continue;
      const c = document.createElementNS(svgNS, 'circle');
      c.setAttribute('cx', p[0].toFixed(1));
      c.setAttribute('cy', p[1].toFixed(1));
      c.setAttribute('r', '3');
      c.setAttribute('fill', '#f97316');
      verts.appendChild(c);
    }
    drawGizmo();
  }

  // Анимация работает только когда вьюпорт виден и вкладка активна.
  let rafId = null;
  const tick = () => {
    rafId = null;
    if (!autoSpin || dragging || reduceMotion || !visible || document.hidden) return;
    yaw += 0.004;
    draw();
    rafId = requestAnimationFrame(tick);
  };
  const ensureLoop = () => {
    if (rafId === null) rafId = requestAnimationFrame(tick);
  };

  new IntersectionObserver(([entry]) => {
    visible = entry.isIntersecting;
    if (visible) ensureLoop();
  }).observe(vp);
  document.addEventListener('visibilitychange', ensureLoop);

  vp.addEventListener('pointerdown', (e) => {
    if (e.target.closest('button')) return;
    dragging = true;
    autoSpin = false;
    clearTimeout(resumeTimer);
    lastX = e.clientX;
    lastY = e.clientY;
    vp.setPointerCapture(e.pointerId);
  });
  vp.addEventListener('pointermove', (e) => {
    if (!dragging) return;
    yaw += (e.clientX - lastX) * 0.01;
    pitch = Math.max(-1.4, Math.min(1.4, pitch + (e.clientY - lastY) * 0.01));
    lastX = e.clientX;
    lastY = e.clientY;
    draw();
  });
  const endDrag = () => {
    if (!dragging) return;
    dragging = false;
    resumeTimer = setTimeout(() => {
      autoSpin = true;
      ensureLoop();
    }, 2500);
  };
  vp.addEventListener('pointerup', endDrag);
  vp.addEventListener('pointercancel', endDrag);

  root.querySelectorAll('.shading-btn').forEach((btn) =>
    btn.addEventListener('click', () => {
      shading = btn.dataset.shading;
      root.querySelectorAll('.shading-btn').forEach((x) => {
        x.className = `shading-btn px-2 py-0.5 border-2 border-black font-extrabold uppercase ${
          x === btn ? 'bg-black text-white' : 'bg-white text-black'
        }`;
      });
      draw();
    }),
  );

  draw();
  ensureLoop();
}
