// Camden-Welt: echte Gebäude von Camden Town (OpenStreetMap) in 3D. Jedes Wort, das sitzt (ab Fach 3),
// baut ein Haus; Wahrzeichen kommen an festen Stellen. Antippen fliegt hin und zeigt das Wort.
// Daten: welt/camden.json, gebaut mit tools/osm-welt.mjs. © OpenStreetMap-Mitwirkende, ODbL.
import * as THREE from "../vendor/three.module.min.js";
import { MapControls } from "../vendor/MapControls.js";

const LAT = 51.5392, LON = -0.1426;
const SIT = 3;                                   // ab diesem Fach sitzt ein Wort
const PALETTE = {
  1: ["#EBC7A6", "#F4E6CF", "#E0AE8E", "#F0DDC3", "#D9A286", "#F7EFE3", "#C9D6DE", "#EDCDB2", "#F2D6D0", "#D8E4CF"],        // Wohnhäuser: Backstein, Stuck
  2: ["#FF6B6B", "#FFD166", "#06D6A0", "#4CC9F0", "#C77DFF", "#FF9F1C", "#F15BB5", "#8AC926"],       // Läden an der High Street
  0: ["#EAD6BF", "#F3E8D7", "#E2C4AA", "#D3DCE2", "#EEDFCC", "#F6ECDD", "#E9D3CB", "#BFE3D0", "#F7C9C9", "#BFD9F2", "#FBE3A1", "#D9C8F0"],
  3: ["#D9534F"], 4: ["#D8CFC0"], 5: ["#E9C46A", "#F4A261"], 6: ["#AEB8C2", "#C2B8A3"]
};
const ROOF = ["#A9A6A8", "#B8ABA1", "#E6E1D9", "#D6CFC5", "#C3C8CE"];
// Viertel: Camden Town ist von Anfang an offen, jede geschaffte Unit lichtet den Nebel über dem nächsten.
// [Name, x, z, Vorsprung in Metern]; jedes Haus gehört zum nächsten Mittelpunkt (Camden Town bekommt etwas mehr Fläche).
const DISTRICTS = [
  ["Camden Town", 0, -30, 110], ["Camden Lock", -170, -290, 0], ["Parkway", -220, 220, 0], ["Stables Market", -560, -420, 0],
  ["Camden Square", 330, 60, 0], ["Camden Road", 280, -290, 0], ["Mornington Crescent", 290, 520, 0]
];
// Wie schön ein Haus ist, hängt am Fach seines Worts: 0 Farbe blättert ab, 1 steht, 2 Fenster leuchten, 3 goldenes Dach
const tierOf = lv => lv >= 7 ? 3 : lv >= 5 ? 2 : lv >= SIT ? 1 : 0;
const MARK_AT = [4, 19, 39, 69, 99, 149, 199];   // an diesen Stellen eines Viertels kommt das nächste Wahrzeichen

// ---------- kleine Helfer ----------
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const lerp = (a, b, t) => a + (b - a) * t;
const ease = t => t < .5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
const backOut = t => { const c = 1.9; return 1 + (c + 1) * Math.pow(t - 1, 3) + c * Math.pow(t - 1, 2); };
function hash(n) { n = Math.sin(n * 127.1 + 311.7) * 43758.5453; return n - Math.floor(n); }
const esc = s => String(s ?? "").replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
const col = new THREE.Color();

// Sonnenstand (vereinfachte NOAA-Formel): Höhe und Richtung in Grad, Richtung ab Norden im Uhrzeigersinn.
function sunPos(date) {
  const r = Math.PI / 180, d = (date - Date.UTC(2000, 0, 1, 12)) / 864e5;
  const L = (280.46 + .9856474 * d) % 360, g = ((357.528 + .9856003 * d) % 360) * r;
  const lam = (L + 1.915 * Math.sin(g) + .02 * Math.sin(2 * g)) * r, eps = (23.439 - 4e-7 * d) * r;
  const ra = Math.atan2(Math.cos(eps) * Math.sin(lam), Math.cos(lam)), dec = Math.asin(Math.sin(eps) * Math.sin(lam));
  const gmst = (18.697374558 + 24.06570982441908 * d) % 24;
  const H = ((gmst * 15 + LON) * r - ra), la = LAT * r;
  const alt = Math.asin(Math.sin(la) * Math.sin(dec) + Math.cos(la) * Math.cos(dec) * Math.cos(H));
  const az = Math.atan2(-Math.sin(H), Math.tan(dec) * Math.cos(la) - Math.sin(la) * Math.cos(H));
  return { alt: alt / r, az: az / r };
}

// Himmelsfarben je nach Sonnenhöhe: [Grad, oben, Horizont, Sonnenlicht, Stärke, Himmelslicht, Bodenlicht, Stärke]
const SKY = [
  [-90, "#0A1430", "#1F2D5C", "#9DB0F0", .55, "#6A7CC0", "#2A3050", 1.1],
  [-10, "#12204D", "#33407A", "#A2B2F2", .6, "#7584C4", "#2E3456", 1.1],
  [-3, "#2C3A7C", "#F08A6A", "#FF9C6B", .7, "#8C86C0", "#4A3C48", .75],
  [4, "#4F7FCB", "#FFC08A", "#FFC48A", 1.8, "#B8CAEA", "#9A8670", 1.25],
  [15, "#5DA2E6", "#CFE7F7", "#FFF0D8", 2.3, "#D6E7F8", "#C8B898", 1.45],
  [90, "#4C97E6", "#D8EEFA", "#FFFFFF", 2.5, "#E2EEFA", "#D0C2A4", 1.5]
];
function skyAt(alt) {
  let i = 0; while (i < SKY.length - 2 && alt > SKY[i + 1][0]) i++;
  const a = SKY[i], b = SKY[i + 1], t = clamp((alt - a[0]) / (b[0] - a[0]), 0, 1);
  const c = k => new THREE.Color(a[k]).lerp(new THREE.Color(b[k]), t);
  return { top: c(1), hor: c(2), sun: c(3), sunI: lerp(a[4], b[4], t), hemi: c(5), ground: c(6), hemiI: lerp(a[7], b[7], t),
    night: clamp((2 - alt) / 10, 0, 1) };
}

// ---------- Geometrie ----------
function decode(arr, from) { const pts = []; for (let i = from; i + 1 < arr.length; i += 2) pts.push([arr[i] / 10, arr[i + 1] / 10]); return pts; }
// Umlaufsinn vereinheitlichen, damit Wände und Flächen nach außen bzw. oben zeigen
function ccw(pts) { let s = 0; for (let i = 0; i < pts.length; i++) { const a = pts[i], b = pts[(i + 1) % pts.length]; s += a[0] * b[1] - b[0] * a[1]; } return s < 0 ? pts.reverse() : pts; }

function estimateHeight(kind, i, area) {
  if (kind === 6) return 4 + hash(i) * 4;
  if (kind === 3) return 9;
  if (area < 25) return 3.2;
  const lv = kind === 2 ? 2 + Math.floor(hash(i) * 3) : 3 + Math.floor(hash(i + 7) * 2);
  return lv * 3.2 + .8 + (area > 900 ? 6 : 0);
}

function buildBuildings(data) {
  const N = data.b.length, pos = [], nor = [], colr = [], info = [], idx = [];
  const meta = new Array(N);
  for (let i = 0; i < N; i++) {
    const row = data.b[i], kind = row[1], pts = ccw(decode(row, 5));
    let a = 0, cx = 0, cz = 0;
    for (let k = 0, j = pts.length - 1; k < pts.length; j = k++) a += (pts[j][0] + pts[k][0]) * (pts[j][1] - pts[k][1]);
    a = Math.abs(a / 2); pts.forEach(p => { cx += p[0]; cz += p[1]; }); cx /= pts.length; cz /= pts.length;
    const h = row[0] ? row[0] / 10 : estimateHeight(kind, i, a), base = row[4] / 10;
    const pal = PALETTE[kind] || PALETTE[0], wall = new THREE.Color(pal[Math.floor(hash(i * 3.1) * pal.length)]);
    if (row[3]) wall.set(["#E76F51", "#2A9D8F", "#E9C46A", "#9B5DE5", "#F15BB5", "#00BBF9"][i % 6]);
    const roof = new THREE.Color(kind === 1 && a < 200 ? ROOF[Math.floor(hash(i) * 2)] : ROOF[2 + Math.floor(hash(i * 1.7) * 3)]);
    let d = 0, dd = 1e9; DISTRICTS.forEach(([, x, z, bonus], k) => { const q = Math.hypot(cx - x, cz - z) - bonus; if (q < dd) { dd = q; d = k; } });
    meta[i] = { x: cx, z: cz, h, area: a, kind, name: row[2] >= 0 ? data.names[row[2]] : "", mark: !!row[3], r: Math.sqrt(a / Math.PI), d };
    // Wände: je Kante ein Viereck; y = 0 unten, y = h oben; im Shader mal Wachstum
    let u = 0;
    for (let k = 0; k < pts.length; k++) {
      const [x0, z0] = pts[k], [x1, z1] = pts[(k + 1) % pts.length], len = Math.hypot(x1 - x0, z1 - z0);
      if (len < .05) continue;
      const nx = (z1 - z0) / len, nz = -(x1 - x0) / len, v = pos.length / 3;
      pos.push(x0, base, z0, x1, base, z1, x1, h, z1, x0, h, z0);
      for (let m = 0; m < 4; m++) { nor.push(nx, 0, nz); colr.push(wall.r, wall.g, wall.b); }
      info.push(i, h, u, 0, i, h, u + len, 0, i, h, u + len, 0, i, h, u, 0);
      idx.push(v, v + 2, v + 1, v, v + 3, v + 2);
      u += len;
    }
    // Dach
    const v0 = pos.length / 3, contour = pts.map(p => new THREE.Vector2(p[0], p[1]));
    const tris = THREE.ShapeUtils.triangulateShape(contour, []);
    pts.forEach(p => { pos.push(p[0], h, p[1]); nor.push(0, 1, 0); colr.push(roof.r, roof.g, roof.b); info.push(i, h, 0, 1); });
    tris.forEach(t => idx.push(v0 + t[0], v0 + t[2], v0 + t[1]));
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3));
  g.setAttribute("normal", new THREE.Float32BufferAttribute(nor, 3));
  g.setAttribute("color", new THREE.Float32BufferAttribute(colr, 3));
  g.setAttribute("aInfo", new THREE.Float32BufferAttribute(info, 4));
  g.setIndex(idx);
  g.computeBoundingSphere();
  return { geo: g, meta };
}

// Bänder für Straßen, Kanal und Gleise; Flächen für Parks und Wasser. Alles in einem Mesh.
function buildGround(data) {
  const pos = [], colr = [], idx = [];
  const add = (x, y, z, c) => { pos.push(x, y, z); colr.push(c.r, c.g, c.b); };
  function ribbon(pts, w, y, c) {
    for (let k = 0; k + 1 < pts.length; k++) {
      const [x0, z0] = pts[k], [x1, z1] = pts[k + 1], len = Math.hypot(x1 - x0, z1 - z0) || 1;
      const nx = -(z1 - z0) / len * w / 2, nz = (x1 - x0) / len * w / 2, ex = (x1 - x0) / len * w * .35, ez = (z1 - z0) / len * w * .35;
      const v = pos.length / 3;
      add(x0 + nx - ex, y, z0 + nz - ez, c); add(x0 - nx - ex, y, z0 - nz - ez, c); add(x1 - nx + ex, y, z1 - nz + ez, c); add(x1 + nx + ex, y, z1 + nz + ez, c);
      idx.push(v, v + 2, v + 1, v, v + 3, v + 2);
    }
  }
  function poly(pts, y, c) {
    if (pts.length < 3) return; ccw(pts);
    const v = pos.length / 3, tris = THREE.ShapeUtils.triangulateShape(pts.map(p => new THREE.Vector2(p[0], p[1])), []);
    pts.forEach(p => add(p[0], y, p[1], c)); tris.forEach(t => idx.push(v + t[0], v + t[2], v + t[1]));
  }
  // Boden: runde Scheibe
  const groundC = new THREE.Color("#E4DDCD"), R = 6000, v = pos.length / 3;
  add(0, 0, 0, groundC);
  for (let k = 0; k <= 64; k++) { const a = k / 64 * Math.PI * 2; add(Math.cos(a) * R, 0, Math.sin(a) * R, groundC); if (k) idx.push(v, v + k + 1, v + k); }
  const green = new THREE.Color("#A9D18E"), water = new THREE.Color("#6EB8D9"), road = new THREE.Color("#FBF8F1"),
    high = new THREE.Color("#F7E3CF"), railC = new THREE.Color("#B3AEA6"), foot = new THREE.Color("#EFE8DA");
  data.green.forEach(a => poly(decode(a, 0), .25, green));
  data.rail.forEach(a => ribbon(decode(a, 0), 7, .3, railC));
  [...data.roads].sort((a, b) => a[0] - b[0]).forEach(r => ribbon(decode(r, 2), r[0] / 10, r[0] < 40 ? .45 : .55 + r[1] * .05, r[1] ? high : r[0] < 40 ? foot : road));
  data.water.forEach(w => w[0] ? ribbon(decode(w, 1), 13, .7, water) : poly(decode(w, 1), .7, water));
  const g = new THREE.BufferGeometry();
  g.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3));
  g.setAttribute("color", new THREE.Float32BufferAttribute(colr, 3));
  g.setIndex(idx); g.computeVertexNormals();
  return g;
}

function buildTrees(data) {
  const pts = decode(data.trees, 0);
  // zusätzlich Bäume in Parks, damit Grünflächen lebendig wirken
  data.green.forEach((a, gi) => {
    const p = decode(a, 0); let minx = 1e9, maxx = -1e9, minz = 1e9, maxz = -1e9;
    p.forEach(([x, z]) => { minx = Math.min(minx, x); maxx = Math.max(maxx, x); minz = Math.min(minz, z); maxz = Math.max(maxz, z); });
    const n = Math.min(40, Math.floor((maxx - minx) * (maxz - minz) / 700));
    for (let k = 0; k < n; k++) {
      const x = lerp(minx, maxx, hash(gi * 91 + k)), z = lerp(minz, maxz, hash(gi * 37 + k * 3.3));
      let inside = false; for (let i = 0, j = p.length - 1; i < p.length; j = i++)
        if ((p[i][1] > z) !== (p[j][1] > z) && x < (p[j][0] - p[i][0]) * (z - p[i][1]) / (p[j][1] - p[i][1]) + p[i][0]) inside = !inside;
      if (inside) pts.push([x, z]);
    }
  });
  const crown = new THREE.IcosahedronGeometry(3.2, 0); crown.translate(0, 7, 0);
  const trunk = new THREE.CylinderGeometry(.35, .5, 4.5, 5); trunk.translate(0, 2.25, 0);
  const paint = (g, c) => { const n = g.attributes.position.count, a = new Float32Array(n * 3); col.set(c); for (let i = 0; i < n; i++) col.toArray(a, i * 3); g.setAttribute("color", new THREE.BufferAttribute(a, 3)); return g; };
  const geo = mergeGeos([paint(trunk.toNonIndexed(), "#8A6A4F"), paint(crown, "#FFFFFF")]);
  const mat = new THREE.MeshLambertMaterial({ vertexColors: true, flatShading: true });
  const mesh = new THREE.InstancedMesh(geo, mat, Math.max(1, pts.length));
  const m = new THREE.Matrix4(), q = new THREE.Quaternion(), s = new THREE.Vector3(), p = new THREE.Vector3(), up = new THREE.Vector3(0, 1, 0);
  const greens = ["#6BAF5B", "#7FBF62", "#5A9E55", "#8CC66B", "#4F9150"];
  pts.forEach(([x, z], i) => {
    const sc = .7 + hash(i * 1.3) * .6; q.setFromAxisAngle(up, hash(i) * 6.28);
    m.compose(p.set(x, 0, z), q, s.set(sc, sc * (.9 + hash(i * 2.1) * .3), sc)); mesh.setMatrixAt(i, m);
    mesh.setColorAt(i, col.set(greens[i % greens.length]));
  });
  mesh.count = pts.length; mesh.castShadow = true; mesh.receiveShadow = true;
  return mesh;
}
function mergeGeos(list) {
  const pos = [], nor = [], c = [];
  list.forEach(g => { g.computeVertexNormals(); pos.push(...g.attributes.position.array); nor.push(...g.attributes.normal.array); c.push(...g.attributes.color.array); });
  const g = new THREE.BufferGeometry();
  g.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3));
  g.setAttribute("normal", new THREE.Float32BufferAttribute(nor, 3));
  g.setAttribute("color", new THREE.Float32BufferAttribute(c, 3));
  return g;
}

// Lange Wege für Boote und Busse: zusammenhängende Linien aneinanderhängen.
function chain(lines) {
  lines = lines.map(l => l.slice()); const near = (a, b) => Math.hypot(a[0] - b[0], a[1] - b[1]) < 2;
  const paths = [];
  while (lines.length) {
    let p = lines.shift(), grew = true;
    while (grew) {
      grew = false;
      for (let i = 0; i < lines.length; i++) {
        const l = lines[i];
        if (near(p.at(-1), l[0])) p = p.concat(l.slice(1));
        else if (near(p.at(-1), l.at(-1))) p = p.concat(l.slice(0, -1).reverse());
        else if (near(p[0], l.at(-1))) p = l.concat(p.slice(1));
        else if (near(p[0], l[0])) p = l.slice().reverse().concat(p.slice(1));
        else continue;
        lines.splice(i, 1); grew = true; break;
      }
    }
    paths.push(p);
  }
  const len = p => p.reduce((s, q, i) => i ? s + Math.hypot(q[0] - p[i - 1][0], q[1] - p[i - 1][1]) : 0, 0);
  return paths.map(p => ({ p, len: len(p) })).sort((a, b) => b.len - a.len);
}
function along(path, d) {
  const p = path.p; d = ((d % (2 * path.len)) + 2 * path.len) % (2 * path.len);
  const back = d > path.len; if (back) d = 2 * path.len - d;
  for (let i = 1; i < p.length; i++) {
    const l = Math.hypot(p[i][0] - p[i - 1][0], p[i][1] - p[i - 1][1]);
    if (d <= l || i === p.length - 1) {
      const t = l ? Math.min(1, d / l) : 0, x = lerp(p[i - 1][0], p[i][0], t), z = lerp(p[i - 1][1], p[i][1], t);
      let a = Math.atan2(p[i][0] - p[i - 1][0], p[i][1] - p[i - 1][1]); if (back) a += Math.PI;
      return { x, z, a, back };
    }
    d -= l;
  }
  return { x: p[0][0], z: p[0][1], a: 0, back };
}
function vehicle(parts) {
  const g = new THREE.Group();
  parts.forEach(([w, h, d, y, c, z = 0]) => {
    const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), new THREE.MeshLambertMaterial({ color: c }));
    m.position.set(0, y, z); m.castShadow = true; g.add(m);
  });
  return g;
}

// Reihenfolge, in der ein Viertel bebaut wird: Camden Town von innen nach außen wie in camden.json,
// die anderen Viertel von ihrem Mittelpunkt aus; Wahrzeichen kommen in jedem Viertel an festen Stellen.
function districtOrder(meta) {
  return DISTRICTS.map(([, x, z], d) => {
    const all = meta.map((m, i) => i).filter(i => meta[i].d === d);
    const near = d ? i => Math.hypot(meta[i].x - x, meta[i].z - z) : i => i;   // Camden Town: Reihenfolge aus camden.json
    const plain = all.filter(i => !meta[i].mark).sort((a, b) => near(a) - near(b)), marks = all.filter(i => meta[i].mark).sort((a, b) => near(a) - near(b));
    const at = d ? MARK_AT : [0, ...MARK_AT.slice(1)];      // der Bahnhof kommt gleich mit dem ersten Wort
    marks.forEach((i, k) => plain.splice(Math.min(at[k] ?? plain.length, plain.length), 0, i));
    return plain;
  });
}

// ---------- Shader: Wachstum, Fenster, Licht in der Nacht ----------
function patchBuildings(mat, U, depth) {
  mat.onBeforeCompile = sh => {
    Object.assign(sh.uniforms, U);
    sh.vertexShader = sh.vertexShader
      .replace("#include <common>", `#include <common>
        attribute vec4 aInfo; uniform sampler2D uState; uniform vec2 uSize;
        varying vec4 vInfo; varying vec4 vState; varying float vY; varying float vDist;`)
      .replace("#include <begin_vertex>", `#include <begin_vertex>
        float id = aInfo.x;
        vec4 st = texture2D(uState, vec2((mod(id, uSize.x) + .5) / uSize.x, (floor(id / uSize.x) + .5) / uSize.y));
        transformed.y = .08 + transformed.y * st.r;
        vInfo = aInfo; vState = st; vY = position.y;`)
      .replace("#include <project_vertex>", `#include <project_vertex>
        vDist = -mvPosition.z;`);
    if (depth) return;
    sh.fragmentShader = sh.fragmentShader
      .replace("#include <common>", `#include <common>
        uniform float uNight; uniform float uTime;
        varying vec4 vInfo; varying vec4 vState; varying float vY; varying float vDist;
        float h21(vec3 p) { p = fract(p * .1031); p += dot(p, p.zyx + 31.32); return fract((p.x + p.y) * p.z); }`)
      .replace("#include <color_fragment>", `#include <color_fragment>
        float built = vState.b, tier = floor(vState.a * 3. + .5);
        // Bauplatz: blasser Grundriss
        diffuseColor.rgb = mix(vec3(.84, .81, .75), diffuseColor.rgb, built);
        // Wort aus Fach 3 gerutscht: Farbe wird blass und blättert in Flecken ab
        if (built > .5 && tier < .5) {
          float n = h21(vec3(floor(vec2(vInfo.z, vY) * 1.4), mod(vInfo.x, 257.) + .5));
          diffuseColor.rgb = mix(diffuseColor.rgb, vec3(dot(diffuseColor.rgb, vec3(.3, .59, .11))) * .92, .65);
          diffuseColor.rgb = mix(diffuseColor.rgb, vec3(.80, .76, .70), step(.6, n) * (1. - vInfo.w) * .85);
        }
        float win = 0.; vec2 cell = vec2(0.);
        if (vInfo.w < .5 && built > .5) {
          cell = vec2(vInfo.z / 2.7, (vY - 1.) / 3.2);
          vec2 f = fract(cell);
          vec2 aa = fwidth(cell) * 1.2;
          win = smoothstep(.22 - aa.x, .22 + aa.x, f.x) * smoothstep(.78 + aa.x, .78 - aa.x, f.x)
              * smoothstep(.28 - aa.y, .28 + aa.y, f.y) * smoothstep(.82 + aa.y, .82 - aa.y, f.y);
          win *= step(1., vY) * step(vY, vInfo.y - 1.2) * smoothstep(1500., 400., vDist);
          // Erdgeschoss mit Schaufenstern
          diffuseColor.rgb = mix(diffuseColor.rgb, diffuseColor.rgb * .78, step(vY, 1.) * .5);
          diffuseColor.rgb = mix(diffuseColor.rgb, mix(vec3(.30, .38, .48), vec3(.12, .14, .22), uNight), win * .85);
        }
        if (vInfo.w > .5) diffuseColor.rgb *= mix(.97, 1.03, h21(vec3(mod(vInfo.x, 257.) + .5)));
        // Fach 7: goldenes Dach und goldener Sims
        if (built > .5 && tier > 2.5) {
          if (vInfo.w > .5) diffuseColor.rgb = vec3(1., .78, .24);
          else diffuseColor.rgb = mix(diffuseColor.rgb, vec3(1., .80, .30), step(vInfo.y - .8, vY) * .95);
        }`)
      .replace("#include <emissivemap_fragment>", `#include <emissivemap_fragment>
        float lit = tier > 1.5 ? 1. : step(.42, h21(vec3(floor(cell) + .5, mod(vInfo.x, 257.) + .5)));
        totalEmissiveRadiance += vec3(1., .72, .38) * win * lit * uNight * (tier > 1.5 ? 1.6 : 1.1);
        // ab Fach 5 leuchten die Fenster auch tagsüber ein wenig warm
        totalEmissiveRadiance += vec3(1., .80, .45) * win * step(1.5, tier) * .28 * (1. - uNight);
        if (built > .5 && tier > 2.5) totalEmissiveRadiance += vec3(1., .72, .2) * (vInfo.w > .5 ? .22 + .18 * sin(uTime * 2.2 + vInfo.x) : 0.) * (1. + uNight);
        // ausgewählt oder gerade gewachsen: leuchtet
        totalEmissiveRadiance += vec3(1., .85, .35) * vState.g * (.22 + .1 * sin(uTime * 5.)) * (1. - .6 * uNight);`);
  };
}

// ---------- Oberfläche ----------
const CSS = `
.welt{position:fixed;inset:0;z-index:50;overflow:hidden;background:#CFE7F7;font-family:var(--body,system-ui);color:#1D2A36;touch-action:none;user-select:none;-webkit-user-select:none}
.welt canvas{position:absolute;inset:0;width:100%!important;height:100%!important;display:block}
.welt .w-top{position:absolute;left:0;right:0;top:0;padding:calc(10px + env(safe-area-inset-top,0px)) 14px 10px;display:flex;gap:10px;align-items:center;pointer-events:none}
.welt .w-top>*{pointer-events:auto}
.welt .w-chip{background:rgba(255,255,255,.88);backdrop-filter:blur(8px);-webkit-backdrop-filter:blur(8px);border-radius:999px;padding:8px 14px;box-shadow:0 4px 14px rgba(20,40,60,.18);font-weight:700;display:flex;gap:8px;align-items:center}
.welt .w-title{font-family:var(--display,system-ui);font-weight:800;font-size:1.05rem;flex:1;min-width:0;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.welt .w-btn{border:0;width:44px;height:44px;border-radius:50%;background:rgba(255,255,255,.92);box-shadow:0 4px 14px rgba(20,40,60,.2);display:grid;place-items:center;font-size:1.3rem;cursor:pointer;color:#1D2A36;flex:none}
.welt .w-btn svg{width:22px;height:22px}
.welt .w-bottom{position:absolute;left:12px;right:12px;bottom:calc(12px + env(safe-area-inset-bottom,0px));display:flex;flex-direction:column;gap:8px;pointer-events:none}
.welt .w-bottom>*{pointer-events:auto}
.welt .w-next{background:rgba(255,255,255,.9);backdrop-filter:blur(8px);-webkit-backdrop-filter:blur(8px);border-radius:18px;padding:10px 14px;box-shadow:0 6px 20px rgba(20,40,60,.2)}
.welt .w-next b{font-family:var(--display,system-ui)}
.welt .w-nt{display:flex;justify-content:space-between;gap:8px;font-size:.85rem;color:#5D6B78}
.welt .w-nn{display:block;font-size:1.1rem}
.welt .w-bar{height:10px;border-radius:99px;background:#E3E8EC;overflow:hidden;margin-top:6px}
.welt .w-bar i{display:block;height:100%;background:linear-gradient(90deg,#FFD43B,#F59F00);border-radius:99px;transition:width .8s}
.welt .w-time{display:flex;align-items:center;gap:10px;background:rgba(255,255,255,.85);border-radius:999px;padding:6px 12px;box-shadow:0 4px 14px rgba(20,40,60,.18)}
.welt .w-time input{flex:1;accent-color:#F59F00}
.welt .w-time span{font-variant-numeric:tabular-nums;font-weight:700;min-width:3.2em}
.welt .w-time button{border:0;background:none;font:inherit;font-weight:700;color:#1F4E5F;padding:4px 6px;cursor:pointer}
.welt .w-sheet{position:absolute;left:12px;right:12px;bottom:calc(12px + env(safe-area-inset-bottom,0px));background:#FDFDFB;border-radius:22px;padding:16px 18px 18px;box-shadow:0 12px 40px rgba(20,40,60,.35);
  transform:translateY(130%);transition:transform .45s cubic-bezier(.2,1.3,.4,1);z-index:3}
.welt .w-sheet.on{transform:none}
.welt .w-foto{position:relative;margin:4px 0 8px;border-radius:14px;overflow:hidden;background:#dfe6ec}
.welt .w-foto img{display:block;width:100%;max-height:34vh;object-fit:cover;animation:wfoto .6s ease-out both}
.welt .w-foto.teaser img{filter:blur(10px) grayscale(.6);transform:scale(1.08);animation:none}
.welt .w-sheet{max-height:78vh;overflow-y:auto}
.welt .w-fotolock{position:absolute;inset:0;display:grid;place-items:center;color:#fff;font-weight:800;text-shadow:0 1px 6px rgba(0,0,0,.6)}
.welt .w-foto figcaption{font-size:.7rem;color:#5D6B78;padding:4px 8px;background:#FDFDFB}
.welt .w-foto figcaption a{color:inherit}
@keyframes wfoto{from{opacity:0;transform:scale(1.04)}to{opacity:1;transform:none}}
.welt .w-sheet .w-en{font-family:var(--hand,cursive);font-weight:700;font-size:2rem;line-height:1.1;color:#1D2A36}
.welt .w-sheet .w-de{font-size:1.1rem;color:#5D6B78;margin-top:2px}
.welt .w-sheet .w-meta{font-size:.85rem;color:#5D6B78;margin-top:10px;display:flex;gap:8px;flex-wrap:wrap}
.welt .w-pill{background:#E9EEF2;border-radius:99px;padding:3px 10px;font-weight:700}
.welt .w-pill.gold{background:#FFF1C2;color:#7A5200}
.welt .w-x{position:absolute;right:10px;top:10px;border:0;background:#E9EEF2;width:36px;height:36px;border-radius:50%;font-size:1.1rem;cursor:pointer;color:#1D2A36}
.welt .w-say{border:0;background:#1F4E5F;color:#fff;border-radius:12px;padding:6px 12px;font:inherit;font-weight:700;margin-top:10px;cursor:pointer}
.welt .w-label{position:absolute;left:0;top:0;transform:translate(-50%,-100%);pointer-events:none;white-space:nowrap;font-weight:800;font-family:var(--display,system-ui);font-size:.8rem;
  background:#1D2A36;color:#fff;padding:4px 9px;border-radius:99px;box-shadow:0 3px 10px rgba(0,0,0,.25);will-change:transform}
.welt .w-label::after{content:"";position:absolute;left:50%;bottom:-5px;margin-left:-5px;border:5px solid transparent;border-bottom:0;border-top-color:#1D2A36}
.welt .w-label.gold{background:#F59F00}
.welt .w-label.gold::after{border-top-color:#F59F00}
.welt .w-banner{position:absolute;left:50%;top:22%;transform:translate(-50%,-50%) scale(.6);opacity:0;text-align:center;pointer-events:none;transition:all .5s cubic-bezier(.2,1.5,.4,1);
  font-family:var(--display,system-ui);font-weight:800;color:#fff;text-shadow:0 3px 0 rgba(0,0,0,.25),0 0 30px rgba(0,0,0,.25);font-size:1.7rem;line-height:1.15;width:90%}
.welt .w-banner small{display:block;font-size:1rem;font-weight:700;opacity:.95;margin-top:6px}
.welt .w-banner.on{opacity:1;transform:translate(-50%,-50%) scale(1)}
.welt .w-osm{position:absolute;right:8px;bottom:2px;font-size:.62rem;color:rgba(29,42,54,.75);background:rgba(255,255,255,.55);padding:1px 6px;border-radius:6px;z-index:2}
.welt .w-osm a{color:inherit}
.welt.night .w-osm{color:rgba(255,255,255,.8);background:rgba(0,0,0,.3)}
.welt .w-load{position:absolute;inset:0;display:grid;place-items:center;font-family:var(--display,system-ui);font-weight:800;font-size:1.2rem;color:#1F4E5F}
.welt .w-skip{position:absolute;right:14px;bottom:calc(150px + env(safe-area-inset-bottom,0px));border:0;border-radius:99px;padding:8px 14px;background:rgba(0,0,0,.45);color:#fff;font-weight:700;font:inherit;z-index:4;cursor:pointer}
.welt .w-map{width:auto;padding:0 12px;border-radius:99px;gap:4px;display:flex;font-size:1.05rem}
.welt .w-map b{font-size:.85rem;font-family:var(--display,system-ui)}
.welt .w-hint{position:absolute;left:50%;top:calc(66px + env(safe-area-inset-top,0px));transform:translateX(-50%);border:0;font:inherit;font-weight:700;background:#FFF1C2;color:#7A5200;
  border-radius:99px;padding:8px 14px;box-shadow:0 4px 14px rgba(20,40,60,.2);cursor:pointer;width:max-content;max-width:92%;animation:whint 1.6s ease-in-out infinite}
@keyframes whint{50%{transform:translateX(-50%) scale(1.05)}}
.welt .w-how{margin-top:10px;font-size:.92rem;color:#3E4C59;background:#F2F5F7;border-radius:12px;padding:8px 10px}
.welt .w-dl{display:grid;gap:6px;margin-top:10px;max-height:42vh;overflow:auto}
.welt .w-dr{display:grid;grid-template-columns:1.6rem 1fr auto;gap:8px;align-items:center;border:0;background:#EAF4EC;border-radius:12px;padding:8px 10px;font:inherit;text-align:left;cursor:pointer;color:#1D2A36}
.welt .w-dr.off{background:#ECEFF2;color:#6B7884}
.welt .w-dr small{color:#5D6B78}
@media (prefers-reduced-motion: reduce){.welt .w-sheet,.welt .w-banner{transition:none}.welt .w-hint{animation:none}}
`;

// ---------- Hauptteil ----------
export async function open(root, api) {
  if (!document.getElementById("welt-css")) { const st = document.createElement("style"); st.id = "welt-css"; st.textContent = CSS; document.head.append(st); }
  const el = document.createElement("div"); el.className = "welt";
  el.innerHTML = `<div class="w-load">Camden wird gebaut …</div>`;
  root.append(el);
  let data;
  // Echte Fotos der Wahrzeichen (Wikimedia Commons, freie Lizenzen), mit Fotograf und Lizenz in fotos/credits.json
  let fotos = {};
  fetch(new URL("fotos/credits.json", import.meta.url)).then(r => r.ok ? r.json() : {}).then(j => { fotos = j || {}; }).catch(() => {});
  const fotoHtml = (name, teaser) => { const f = fotos[name]; if (!f) return "";
    return `<figure class="w-foto${teaser ? " teaser" : ""}"><img src="${new URL("fotos/" + f.file, import.meta.url)}" alt="${esc(name)}" loading="lazy">
      ${teaser ? `<span class="w-fotolock">🔒 So sieht es in echt aus</span>` : ""}
      <figcaption>Foto: ${esc(f.author)}, <a href="${esc(f.licenseUrl || f.source)}" target="_blank" rel="noopener">${esc(f.license)}</a>, <a href="${esc(f.source)}" target="_blank" rel="noopener">Wikimedia Commons</a></figcaption></figure>`; };
  try { data = await (await fetch(new URL("camden.json", import.meta.url))).json(); }
  catch (e) { el.querySelector(".w-load").textContent = "Die Welt konnte nicht geladen werden."; addClose(); return; }
  function addClose() { const b = document.createElement("button"); b.className = "w-btn"; b.style.cssText = "position:absolute;left:14px;top:14px"; b.textContent = "✕"; b.onclick = () => { el.remove(); api.onClose(); }; el.append(b); }

  const { geo, meta } = buildBuildings(data);
  const order = districtOrder(meta);

  // --- Spielstand: welches Wort hat welches Haus (b) gebaut, welche Viertel sind offen ---
  // { built: [{id,en,de,t,b}], seen, dist: [Unit, die Viertel 1, 2, … geöffnet hat], dSeen, tier: {id: zuletzt gezeigte Stufe}, wait: [ids] }
  const W = api.state, N = data.b.length;
  W.built = W.built || []; W.seen = W.seen || 0; W.dist = W.dist || []; W.dSeen = W.dSeen ?? W.dist.length; W.tier = W.tier || {};
  const owner = new Int32Array(N).fill(-1), slotAt = DISTRICTS.map(() => 0), cnt = DISTRICTS.map(() => 0);
  const openD = () => Math.min(DISTRICTS.length - 1, W.dist.length);
  // Gebaut wird im offenen Viertel, das am wenigsten voll ist: ein neues Viertel wächst zuerst schnell, danach wachsen alle gleichmäßig.
  function nextSlot(at = slotAt, n = cnt) {
    let best = -1, bf = 2;
    for (let d = 0; d <= openD(); d++) {
      const o = order[d]; while (at[d] < o.length && owner[o[at[d]]] >= 0) at[d]++;
      if (at[d] < o.length && n[d] / o.length < bf) { bf = n[d] / o.length; best = d; }
    }
    return best < 0 ? -1 : order[best][at[best]];
  }
  const place = (b, k) => { owner[b] = k; cnt[meta[b].d]++; };
  // ältere Stände ohne Hausnummer: neu verteilen
  if (W.built.some(w => w.b == null || w.b >= N)) W.built.forEach(w => w.b = null);
  W.built.forEach((w, k) => { if (w.b != null) place(w.b, k); });
  W.built.forEach((w, k) => { if (w.b == null) { w.b = nextSlot(); if (w.b >= 0) place(w.b, k); } });
  if (W.built.some(w => w.b < 0)) { W.built = W.built.filter(w => w.b >= 0); owner.fill(-1); cnt.fill(0); W.built.forEach((w, k) => place(w.b, k)); }
  const units = api.units ? api.units() : [];
  units.filter(u => u.done && !W.dist.includes(u.key)).forEach(u => { if (W.dist.length < DISTRICTS.length - 1) W.dist.push(u.key); });
  const have = new Set(W.built.map(b => b.id)), wait = [];
  api.cards().filter(c => c.level >= SIT && !have.has(c.id)).forEach(c => {
    let b = nextSlot();
    // alle offenen Viertel voll: dann öffnet sich das nächste auch ohne geschaffte Unit
    while (b < 0 && W.dist.length < DISTRICTS.length - 1) { W.dist.push("voll:" + W.dist.length); b = nextSlot(); }
    if (b < 0) { wait.push(c.id); return; }
    place(b, W.built.length); W.built.push({ id: c.id, en: c.en, de: c.de, t: Date.now(), b });
  });
  W.wait = wait;
  const fresh = Math.max(0, W.built.length - W.seen);
  const startBuilt = W.built.length - fresh;
  const levelOf = new Map(api.cards().map(c => [c.id, c.level]));
  const tierNow = w => tierOf(levelOf.get(w.id) ?? SIT);
  const newDist = []; for (let d = W.dSeen + 1; d <= openD(); d++) newDist.push(d);
  api.save();

  // --- Szene ---
  const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: "high-performance" });
  renderer.setPixelRatio(Math.min(devicePixelRatio || 1, 2));
  renderer.shadowMap.enabled = true; renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.NeutralToneMapping; renderer.toneMappingExposure = 1;
  el.innerHTML = ""; el.append(renderer.domElement);
  const scene = new THREE.Scene();
  scene.fog = new THREE.Fog("#CFE7F7", 1100, 3200);
  const camera = new THREE.PerspectiveCamera(40, 1, 2, 4000);

  const cols = 64, rowsN = Math.ceil(N / cols), stateArr = new Float32Array(cols * rowsN * 4);
  const stateTex = new THREE.DataTexture(stateArr, cols, rowsN, THREE.RGBAFormat, THREE.FloatType);
  stateTex.needsUpdate = true;
  const U = { uState: { value: stateTex }, uSize: { value: new THREE.Vector2(cols, rowsN) }, uNight: { value: 0 }, uTime: { value: 0 } };
  const setTier = (b, t) => { stateArr[b * 4 + 3] = t / 3; };
  // Häuser, die schon standen: mit der zuletzt gezeigten Stufe; Aufstiege werden gleich gefeiert, Abstiege gleich gezeigt
  const ups = [];
  for (let k = 0; k < startBuilt; k++) {
    const w = W.built[k], now = tierNow(w), was = W.tier[w.id] ?? 1;
    stateArr[w.b * 4] = 1; stateArr[w.b * 4 + 2] = 1;
    if (now > was && now >= 2) { setTier(w.b, was); ups.push(k); } else { setTier(w.b, now); W.tier[w.id] = now; }
  }
  for (let k = startBuilt; k < W.built.length; k++) setTier(W.built[k].b, tierNow(W.built[k]));
  const bMat = new THREE.MeshLambertMaterial({ vertexColors: true });
  patchBuildings(bMat, U, false);
  const buildings = new THREE.Mesh(geo, bMat);
  buildings.castShadow = buildings.receiveShadow = true;
  const depthMat = new THREE.MeshDepthMaterial({ depthPacking: THREE.RGBADepthPacking });
  patchBuildings(depthMat, U, true);
  buildings.customDepthMaterial = depthMat;
  buildings.frustumCulled = false;
  scene.add(buildings);

  const ground = new THREE.Mesh(buildGround(data), new THREE.MeshLambertMaterial({ vertexColors: true }));
  ground.receiveShadow = true; scene.add(ground);
  const trees = buildTrees(data); scene.add(trees);

  // Laternen leuchten nachts
  const lampPts = decode(data.lamps, 0);
  const lampGeo = new THREE.BufferGeometry().setAttribute("position", new THREE.Float32BufferAttribute(lampPts.flatMap(([x, z]) => [x, 5, z]), 3));
  const glowTex = (() => { const c = document.createElement("canvas"); c.width = c.height = 64; const g = c.getContext("2d"), gr = g.createRadialGradient(32, 32, 0, 32, 32, 32);
    gr.addColorStop(0, "rgba(255,240,200,1)"); gr.addColorStop(.25, "rgba(255,200,120,.6)"); gr.addColorStop(1, "rgba(255,180,90,0)"); g.fillStyle = gr; g.fillRect(0, 0, 64, 64);
    const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t; })();
  const lamps = new THREE.Points(lampGeo, new THREE.PointsMaterial({ map: glowTex, size: 14, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, opacity: 0 }));
  scene.add(lamps);

  // Licht
  const hemi = new THREE.HemisphereLight("#DDEBFA", "#C3B394", 1); scene.add(hemi);
  const sun = new THREE.DirectionalLight("#FFFFFF", 2.6); sun.castShadow = true;
  sun.shadow.mapSize.set(2048, 2048); sun.shadow.bias = -.0004; sun.shadow.normalBias = .6;
  scene.add(sun, sun.target);

  // Boote auf dem Kanal, Busse auf der High Street
  const movers = [];
  const canal = chain(data.water.filter(w => w[0]).map(w => decode(w, 1)))[0];
  if (canal && canal.len > 100) ["#2A6F4E", "#B23A48", "#1F4E8C", "#7B2D8B"].forEach((c, i) => {
    const b = vehicle([[2.2, 1, 17, .9, c], [1.9, 1.1, 11, 1.9, "#F4E9D8", -1.5], [2.25, .25, 17.2, .5, "#1D2A36"]]);
    scene.add(b); movers.push({ o: b, path: canal, d: canal.len * i / 4, v: 3 + i * .4, y: .4 });
  });
  const street = chain(data.roads.filter(r => r[1]).map(r => decode(r, 2)))[0];
  if (street && street.len > 100) [0, .5].forEach((f, i) => {
    const b = vehicle([[2.5, 2, 11, 1.6, "#D7263D"], [2.5, 1.9, 11, 3.6, "#D7263D"], [2.55, .6, 10.6, 2.4, "#2B2D42"], [2.55, .6, 10.6, 4.3, "#2B2D42"], [2.5, .12, 11, 4.6, "#F1F1F1"]]);
    scene.add(b); movers.push({ o: b, path: street, d: street.len * f * 2, v: 8, y: 0, side: 3.2 });
  });

  // Staub und Konfetti beim Bauen
  const PN = 700, pPos = new Float32Array(PN * 3), pCol = new Float32Array(PN * 3), pVel = new Float32Array(PN * 3), pLife = new Float32Array(PN);
  const pGeo = new THREE.BufferGeometry();
  pGeo.setAttribute("position", new THREE.BufferAttribute(pPos, 3)); pGeo.setAttribute("color", new THREE.BufferAttribute(pCol, 3));
  const parts = new THREE.Points(pGeo, new THREE.PointsMaterial({ size: 1.6, vertexColors: true, transparent: true, depthWrite: false }));
  parts.frustumCulled = false; scene.add(parts);
  let pNext = 0;
  const CONF = ["#FF6B6B", "#FFD166", "#06D6A0", "#4CC9F0", "#C77DFF", "#FF9F1C"].map(c => new THREE.Color(c));
  function burst(m, confetti) {
    const n = confetti ? 90 : 40;
    for (let k = 0; k < n; k++) {
      const i = pNext = (pNext + 1) % PN, a = Math.random() * 6.28, r = m.r * (.6 + Math.random() * .6);
      if (confetti) { pPos.set([m.x, m.h + 2, m.z], i * 3); pVel.set([Math.cos(a) * (4 + Math.random() * 8), 14 + Math.random() * 14, Math.sin(a) * (4 + Math.random() * 8)], i * 3); CONF[k % CONF.length].toArray(pCol, i * 3); }
      else { pPos.set([m.x + Math.cos(a) * r, .5, m.z + Math.sin(a) * r], i * 3); pVel.set([Math.cos(a) * 6, 2 + Math.random() * 3, Math.sin(a) * 6], i * 3); col.set("#D9CFBD").toArray(pCol, i * 3); }
      pLife[i] = confetti ? 2.2 : 1.2;
    }
  }

  // Nebel über Vierteln, die noch zu sind: weiche Wolken aus Punkten, je Viertel ein Objekt
  const puffTex = (() => { const c = document.createElement("canvas"); c.width = c.height = 128; const g = c.getContext("2d");
    for (let k = 0; k < 7; k++) { const x = 30 + hash(k) * 68, y = 40 + hash(k + 9) * 48, r = 26 + hash(k + 3) * 22, gr = g.createRadialGradient(x, y, 0, x, y, r);
      gr.addColorStop(0, "rgba(255,255,255,.95)"); gr.addColorStop(.6, "rgba(255,255,255,.5)"); gr.addColorStop(1, "rgba(255,255,255,0)"); g.fillStyle = gr; g.fillRect(0, 0, 128, 128); }
    const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t; })();
  const clouds = [];
  for (let d = W.dSeen + 1; d < DISTRICTS.length; d++) {
    const o = order[d], pts = [], step = Math.max(1, Math.floor(o.length / 70));
    for (let k = 0; k < o.length; k += step) { const m = meta[o[k]]; pts.push(m.x + (hash(k + d) - .5) * 30, 34 + hash(k * 1.7 + d) * 30, m.z + (hash(k * 2.3 + d) - .5) * 30); }
    const g = new THREE.BufferGeometry().setAttribute("position", new THREE.Float32BufferAttribute(pts, 3));
    const c = new THREE.Points(g, new THREE.PointsMaterial({ map: puffTex, size: 150, transparent: true, depthWrite: false, opacity: .93, color: "#FFFFFF" }));
    c.userData = { d, lift: 0 }; c.renderOrder = 2; scene.add(c); clouds.push(c);
  }
  function liftClouds(d) { const c = clouds.find(c => c.userData.d === d); if (c) c.userData.lift = reduce ? 1 : .001; }
  function stepClouds(dt, t) {
    for (let k = clouds.length - 1; k >= 0; k--) {
      const c = clouds[k], u = c.userData;
      c.position.x = Math.sin(t * .07 + u.d) * 8; c.position.z = Math.cos(t * .05 + u.d * 2) * 6;
      if (!u.lift) continue;
      u.lift += dt / 2.6; const e = ease(Math.min(1, u.lift));
      c.position.y = e * 160; c.material.opacity = .93 * (1 - e); c.material.size = 150 + e * 120;
      if (u.lift >= 1) { scene.remove(c); c.geometry.dispose(); c.material.dispose(); clouds.splice(k, 1); }
    }
  }

  // Tagesschatz: ein Päckchen auf einem Haus, mit Lichtstrahl, sobald heute geübt wurde
  let treasure = null;
  const T = api.treasure;
  if (T && T.ready && startBuilt >= 3) {
    let hs = 0; for (const ch of T.day) hs = (hs * 31 + ch.charCodeAt(0)) >>> 0;
    const pickK = hs % startBuilt, m = meta[W.built[pickK].b];
    const box = new THREE.Group();
    [[3.2, 3.2, 3.2, 0, "#FFC233"], [3.5, 1, 3.5, 1.6, "#E8574A"], [.8, 3.4, 3.4, 0, "#E8574A"], [3.4, 3.4, .8, 0, "#E8574A"]].forEach(([w, h, d, y, c]) => {
      const b = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), new THREE.MeshLambertMaterial({ color: c, emissive: c, emissiveIntensity: .35 })); b.position.y = y; box.add(b); });
    box.position.set(m.x, m.h + 5, m.z); box.scale.setScalar(1.6);
    const beam = new THREE.Mesh(new THREE.CylinderGeometry(2.6, 4, 320, 16, 1, true).translate(0, 160, 0),
      new THREE.MeshBasicMaterial({ color: "#FFE08A", transparent: true, opacity: .4, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide, fog: false }));
    beam.position.set(m.x, m.h, m.z);
    scene.add(box, beam);
    treasure = { box, beam, m, found: false, t: 0 };
  }
  function findTreasure() {
    treasure.found = true; T.claim(); burst(treasure.m, true); burst(treasure.m, true);
    api.sound?.("up"); api.confetti?.(); $("#w-hint").hidden = true;
    banner("🎁 Schatz gefunden!", "Ein Sticker-Päckchen wartet auf der Startseite", 2600);
  }

  // --- Oberfläche ---
  el.insertAdjacentHTML("beforeend", `
    <div class="w-top">
      <button class="w-btn" id="w-close" aria-label="Zurück">✕</button>
      <div class="w-chip w-title">🏙️ <span id="w-count"></span></div>
      <button class="w-btn w-map" id="w-dist" aria-label="Viertel"><span>🗺️</span><b id="w-dn"></b></button>
      <button class="w-btn" id="w-home" aria-label="Zur Übersicht"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><circle cx="12" cy="12" r="8"/><path d="M12 2v4M12 18v4M2 12h4M18 12h4"/></svg></button>
    </div>
    <button class="w-hint" id="w-hint" hidden></button>
    <div class="w-bottom" id="w-bottom">
      <div class="w-next" id="w-next"></div>
      <div class="w-time"><span aria-hidden="true">☀️</span><input type="range" id="w-hour" min="0" max="24" step=".05" aria-label="Tageszeit"><span id="w-clock"></span><button id="w-now">Jetzt</button></div>
    </div>
    <div class="w-sheet" id="w-sheet" role="dialog" aria-live="polite"></div>
    <div class="w-banner" id="w-banner"></div>
    <div id="w-labels"></div>
    <div class="w-osm">© <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener">OpenStreetMap</a>-Mitwirkende</div>`);
  const $ = s => el.querySelector(s);
  let built = startBuilt, shownD = W.dSeen;          // built: so viele Einträge aus W.built stehen schon; shownD: so viele Viertel sind ohne Nebel
  const isBuilt = b => owner[b] >= 0 && owner[b] < built;
  // Die freien Bauplätze in der Reihenfolge, in der sie bebaut werden
  function upcoming(max = 3000) {
    const at = [...slotAt], n = [...cnt], out = [];
    const saved = owner.slice();
    while (out.length < max) { const b = nextSlot(at, n); if (b < 0) break; out.push(b); owner[b] = 1e9; n[meta[b].d]++; }
    owner.set(saved);
    return out;
  }
  function hud() {
    $("#w-count").textContent = `${built} ${built === 1 ? "Haus" : "Häuser"}`;
    $("#w-dn").textContent = `${shownD + 1}/${DISTRICTS.length}`;
    const up = upcoming(); let at = up.findIndex(b => meta[b].mark);
    // ist das nächste Wahrzeichen weit weg, zählt der nächste bekannte Ort (Laden, Pub, Kirche) als Ziel
    const named = up.findIndex(b => meta[b].name), far = at < 0 || at > 40;
    if (far && named >= 0) {
      const left = named + 1;
      $("#w-next").innerHTML = `<div class="w-nt"><span>Nächster bekannter Ort</span><span>noch <b>${left}</b> ${left === 1 ? "Wort" : "Wörter"}</span></div><b class="w-nn">📍 ${esc(meta[up[named]].name)}</b><div class="w-bar"><i style="width:${clamp(1 - named / 12, .05, 1) * 100}%"></i></div>`;
      return;
    }
    let prev = 0; for (let k = built - 1; k >= 0; k--) if (meta[W.built[k].b].mark) { prev = k + 1; break; }
    if (at < 0) {
      $("#w-next").innerHTML = openD() < DISTRICTS.length - 1 ? `<b>Alle Wahrzeichen hier stehen!</b><div class="w-nt"><span>Schaff eine Unit, dann lichtet sich der Nebel über ${esc(DISTRICTS[openD() + 1][0])}.</span></div>` : `<b>Ganz Camden gehört dir!</b>`;
      return;
    }
    const left = at + 1, pct = clamp((built - prev) / (built - prev + left), 0, 1) * 100;
    $("#w-next").innerHTML = `<div class="w-nt"><span>Nächstes Wahrzeichen</span><span>noch <b>${left}</b> ${left === 1 ? "Wort" : "Wörter"}</span></div><b class="w-nn">★ ${esc(meta[up[at]].name)}</b><div class="w-bar"><i style="width:${pct}%"></i></div>`;
  }
  hud();

  // Wahrzeichen-Schilder
  const labels = [];
  function addLabel(i, gold) {
    if (labels.some(l => l.i === i)) return;
    const d = document.createElement("div"); d.className = "w-label" + (gold ? " gold" : ""); d.textContent = (gold ? "★ " : "") + meta[i].name;
    $("#w-labels").append(d); labels.push({ i, d, w: d.offsetWidth }); labels.sort((a, b) => a.i - b.i);
  }
  for (let k = 0; k < startBuilt; k++) if (meta[W.built[k].b].mark) addLabel(W.built[k].b, true);

  // --- Kamera ---
  const controls = new MapControls(camera, renderer.domElement);
  controls.enableDamping = true; controls.dampingFactor = .08;
  controls.minDistance = 35; controls.maxDistance = 1300; controls.maxPolarAngle = 1.32; controls.minPolarAngle = .15;
  controls.zoomToCursor = true; controls.screenSpacePanning = false;
  controls.touches = { ONE: THREE.TOUCH.PAN, TWO: THREE.TOUCH.DOLLY_ROTATE };
  const sph = new THREE.Spherical();
  function setView(target, dist, polar, az) {
    controls.target.copy(target);
    sph.set(dist, polar, az); camera.position.setFromSpherical(sph).add(target); camera.lookAt(target);
  }
  let fly = null;
  function flyTo(target, dist, polar, az, dur = 1.6) {
    const off = camera.position.clone().sub(controls.target), s0 = new THREE.Spherical().setFromVector3(off);
    let a1 = az ?? s0.theta; while (a1 - s0.theta > Math.PI) a1 -= 2 * Math.PI; while (a1 - s0.theta < -Math.PI) a1 += 2 * Math.PI;
    const t0 = controls.target.clone(), hop = Math.min(400, t0.distanceTo(target) * .35);
    return new Promise(res => { fly = { t0, t1: target.clone(), s0, d1: dist, p1: polar ?? s0.phi, a1, hop, t: 0, dur: reduce ? .01 : dur, res }; controls.enabled = false; });
  }
  function stepFly(dt) {
    if (!fly) return;
    fly.t = Math.min(1, fly.t + dt / fly.dur); const k = ease(fly.t);
    const tg = fly.t0.clone().lerp(fly.t1, k), d = lerp(fly.s0.radius, fly.d1, k) + Math.sin(Math.PI * fly.t) * fly.hop;
    setView(tg, d, lerp(fly.s0.phi, fly.p1, k), lerp(fly.s0.theta, fly.a1, k));
    if (fly.t >= 1) { const r = fly.res; fly = null; controls.enabled = true; r(); }
  }
  const v3 = (x, y, z) => new THREE.Vector3(x, y, z);

  // --- Sonne und Tageszeit ---
  let hourOverride = null;
  function nowHour() { const d = new Date(); return d.getHours() + d.getMinutes() / 60; }
  function applyTime() {
    const d = new Date(); const h = hourOverride ?? nowHour();
    d.setHours(Math.floor(h), Math.round((h % 1) * 60), 0, 0);
    const s = sunPos(d.getTime()), sky = skyAt(s.alt), r = Math.PI / 180;
    // Nachts scheint der Mond aus der Gegenrichtung
    const alt = s.alt > -4 ? Math.max(6, s.alt) : 35, az = s.alt > -4 ? s.az : s.az + 180;
    const dir = v3(Math.sin(az * r) * Math.cos(alt * r), Math.sin(alt * r), -Math.cos(az * r) * Math.cos(alt * r));
    sun.userData.dir = dir; sun.color.copy(sky.sun); sun.intensity = sky.sunI;
    hemi.color.copy(sky.hemi); hemi.groundColor.copy(sky.ground); hemi.intensity = sky.hemiI;
    scene.fog.color.copy(sky.hor);
    el.style.background = `linear-gradient(to bottom, #${sky.top.getHexString()} 0%, #${sky.hor.getHexString()} 75%)`;
    U.uNight.value = sky.night; lamps.material.opacity = sky.night;
    clouds.forEach(c => c.material.color.copy(sky.hemi).lerp(new THREE.Color("#FFFFFF"), 1 - sky.night * .7));
    el.classList.toggle("night", sky.night > .5);
    $("#w-hour").value = h; $("#w-clock").textContent = `${String(Math.floor(h) % 24).padStart(2, "0")}:${String(Math.floor((h % 1) * 60)).padStart(2, "0")}`;
    $("#w-now").hidden = hourOverride === null;
  }
  $("#w-hour").oninput = e => { hourOverride = +e.target.value; applyTime(); };
  $("#w-now").onclick = () => { hourOverride = null; applyTime(); };
  applyTime();
  const timeTimer = setInterval(() => { if (hourOverride === null) applyTime(); }, 60000);

  // --- Antippen ---
  const ray = new THREE.Raycaster(), ptr = new THREE.Vector2();
  let down = null, selected = -1, shift = 0, shiftTo = 0;   // shift schiebt das Bild nach oben, solange unten die Karte offen ist
  renderer.domElement.addEventListener("pointerdown", e => { down = { x: e.clientX, y: e.clientY, t: performance.now() }; });
  renderer.domElement.addEventListener("pointerup", e => {
    if (!down || Math.hypot(e.clientX - down.x, e.clientY - down.y) > 8 || performance.now() - down.t > 500 || fly || tour) { down = null; return; }
    down = null;
    const r = renderer.domElement.getBoundingClientRect();
    ptr.set((e.clientX - r.left) / r.width * 2 - 1, -(e.clientY - r.top) / r.height * 2 + 1);
    ray.setFromCamera(ptr, camera);
    if (treasure && !treasure.found) {      // Schatz: großzügig um ihn herum antippen reicht
      tmp.copy(treasure.box.position).project(camera);
      if (tmp.z < 1 && Math.hypot((tmp.x * .5 + .5) * r.width - (e.clientX - r.left), (-tmp.y * .5 + .5) * r.height - (e.clientY - r.top)) < 46) { findTreasure(); return; }
    }
    const hits = ray.intersectObject(buildings);
    let id = -1;
    for (const h of hits) { const b = geo.attributes.aInfo.getX(h.face.a); if (isBuilt(b)) { id = b; break; } }
    if (id < 0) {   // Bauplatz am Boden?
      const g = ray.ray.intersectPlane(new THREE.Plane(v3(0, 1, 0), 0), v3(0, 0, 0));
      if (g) {
        for (const h of hits) { const b = geo.attributes.aInfo.getX(h.face.a); if (!isBuilt(b) && Math.hypot(meta[b].x - g.x, meta[b].z - g.z) < meta[b].r * 1.4) { showLot(b); return; } }
        // knapp daneben getippt: nächstes gebautes Haus in der Nähe nehmen
        let best = -1, bd = 14; for (let k = 0; k < built; k++) { const i = W.built[k].b, d = Math.hypot(meta[i].x - g.x, meta[i].z - g.z) - meta[i].r; if (d < bd) { bd = d; best = i; } }
        if (best >= 0) { select(best); return; }
      }
      hideSheet(); return;
    }
    select(id);
  });
  function select(i, quiet) {
    if (selected >= 0) stateArr[selected * 4 + 1] = 0;
    selected = i; stateArr[i * 4 + 1] = .8; stateTex.needsUpdate = true;
    const m = meta[i], w = W.built[owner[i]];
    const card = api.cards().find(c => c.id === w.id);
    const fach = card ? card.level : null, t = card ? tierOf(fach) : 1;
    const how = !card ? "" : t === 0 ? `Die Farbe blättert ab, weil „${esc(w.en)}“ zurückgerutscht ist. Übe es wieder bis Fach ${SIT}, dann strahlt das Haus wieder.`
      : t === 1 ? `Noch ${5 - fach} ${5 - fach === 1 ? "Fach" : "Fächer"}, dann leuchten die Fenster.`
      : t === 2 ? `Die Fenster leuchten! Noch ${7 - fach} ${7 - fach === 1 ? "Fach" : "Fächer"} bis zum goldenen Dach.` : "Goldenes Dach! Dieses Wort sitzt richtig fest.";
    $("#w-sheet").innerHTML = `<button class="w-x" aria-label="Schließen">✕</button>
      ${m.mark ? `<div class="w-pill gold" style="display:inline-block;margin-bottom:6px">★ ${esc(m.name)}</div>` : m.name ? `<div class="w-pill" style="display:inline-block;margin-bottom:6px">${esc(m.name)}</div>` : ""}
      ${m.mark ? fotoHtml(m.name) : ""}
      <div class="w-en">${esc(w.en)}</div><div class="w-de">${esc(w.de)}</div>
      <div class="w-meta"><span class="w-pill">Haus Nr. ${owner[i] + 1}</span>${fach ? `<span class="w-pill${t === 3 ? " gold" : ""}">Fach ${fach}</span>` : ""}<span class="w-pill">${esc(DISTRICTS[m.d][0])}</span><span class="w-pill">gebaut am ${new Date(w.t).toLocaleDateString("de-DE")}</span></div>
      ${how ? `<div class="w-how">${how}</div>` : ""}
      ${api.say ? `<button class="w-say">🔊 Anhören</button>` : ""}`;
    $("#w-sheet").classList.add("on"); $("#w-bottom").style.visibility = "hidden"; shiftTo = .2;
    $("#w-sheet .w-x").onclick = hideSheet;
    if (api.say && $(".w-say")) $(".w-say").onclick = () => api.say(w.en);
    if (!quiet) { api.sound?.("good"); flyTo(v3(m.x, m.h * .5, m.z), clamp(m.h * 5 + m.r * 8, 140, 500), .9, undefined, 1.3); }
  }
  function showLot(i) {
    const m = meta[i], left = upcoming(N).indexOf(i) + 1;
    $("#w-sheet").innerHTML = `<button class="w-x" aria-label="Schließen">✕</button>
      <div class="w-en" style="font-size:1.5rem">${m.d > shownD ? "Im Nebel" : "Bauplatz"}${m.mark ? ": " + esc(m.name) : ""}</div>
      <div class="w-de">${m.d > shownD ? `Das Viertel ${esc(DISTRICTS[m.d][0])} liegt noch im Nebel. Jede Unit, die du schaffst (8 von 10 Wörtern ab Fach ${SIT}), öffnet ein neues Viertel.`
        : `Hier wird gebaut, wenn noch ${left} ${left === 1 ? "Wort" : "Wörter"} sitzen (ab Fach ${SIT}).`}</div>
      ${m.mark ? fotoHtml(m.name, true) : ""}`;
    $("#w-sheet").classList.add("on"); $("#w-bottom").style.visibility = "hidden";
    $("#w-sheet .w-x").onclick = hideSheet;
  }
  function hideSheet() {
    if (selected >= 0) { stateArr[selected * 4 + 1] = 0; stateTex.needsUpdate = true; selected = -1; }
    $("#w-sheet").classList.remove("on"); $("#w-bottom").style.visibility = ""; shiftTo = 0;
  }
  $("#w-home").onclick = () => { hideSheet(); flyTo(overviewTarget(), overviewDist(), .9, undefined, 1.4); };
  $("#w-dist").onclick = () => {
    if (tour) return;
    const best = units.filter(u => !u.done).sort((a, b) => b.pct - a.pct)[0];
    $("#w-sheet").innerHTML = `<button class="w-x" aria-label="Schließen">✕</button>
      <div class="w-en" style="font-size:1.5rem">Viertel von Camden</div>
      <div class="w-dl">${DISTRICTS.map(([name], d) => { const n = order[d].filter(isBuilt).length;
        return `<button class="w-dr${d > shownD ? " off" : ""}" data-d="${d}"><span>${d > shownD ? "☁️" : "📍"}</span><b>${esc(name)}</b><small>${d > shownD ? "im Nebel" : `${n} von ${order[d].length} Häusern`}</small></button>`; }).join("")}</div>
      <div class="w-how">${shownD < DISTRICTS.length - 1 ? `Schaff eine Unit (8 von 10 Wörtern ab Fach ${SIT}), dann lichtet sich der Nebel über ${esc(DISTRICTS[shownD + 1][0])}.${best ? ` Am weitesten ist „${esc(best.name)}“: ${Math.min(99, Math.round(best.pct / .8 * 100))} %.` : ""}` : "Alle Viertel sind offen!"}</div>`;
    $("#w-sheet").classList.add("on"); $("#w-bottom").style.visibility = "hidden";
    $("#w-sheet .w-x").onclick = hideSheet;
    el.querySelectorAll("[data-d]").forEach(b => b.onclick = () => { const [, x, z] = DISTRICTS[+b.dataset.d]; hideSheet(); flyTo(v3(x, 0, z), 560, .9, undefined, 1.6); });
  };
  function finishIntro() {
    if (!treasure || treasure.found) return;
    const h = $("#w-hint"); h.hidden = false; h.innerHTML = "🎁 Heute ist ein Schatz versteckt. Folge dem Lichtstrahl! <u>Hilfe</u>";
    h.onclick = () => { const m = treasure.m; hideSheet(); flyTo(v3(m.x + 60, 0, m.z + 60), 380, .95, undefined, 1.8); };
  }

  // --- Wachsen ---
  const growing = [];
  function grow(i, delay = 0, fx = true) { growing.push({ i, t: -delay, fx }); stateArr[i * 4 + 2] = 1; }
  function stepGrow(dt) {
    if (!growing.length) return;
    for (let k = growing.length - 1; k >= 0; k--) {
      const g = growing[k], before = g.t; g.t += dt;
      if (g.t < 0) continue;
      if (before < 0 && g.fx) { burst(meta[g.i], false); if (meta[g.i].mark) burst(meta[g.i], true); }
      const p = Math.min(1, g.t / .9);
      stateArr[g.i * 4] = Math.max(.001, backOut(p));
      stateArr[g.i * 4 + 1] = Math.max(stateArr[g.i * 4 + 1] * (g.i === selected ? 1 : 0), (1 - p) * .9);
      if (p >= 1) { stateArr[g.i * 4] = 1; if (g.i !== selected) stateArr[g.i * 4 + 1] = 0; growing.splice(k, 1); if (g.fx) burst(meta[g.i], true); }
    }
    stateTex.needsUpdate = true;
  }
  const builtIds = () => { const out = []; for (let k = 0; k < built; k++) out.push(W.built[k].b); return out.length ? out : [order[0][0]]; };
  function overviewTarget() {
    let x = 0, z = 0; const ids = builtIds();
    ids.forEach(i => { x += meta[i].x; z += meta[i].z; });
    return v3(x / ids.length * .7, 0, z / ids.length * .7);
  }
  function overviewDist() {
    const c = overviewTarget(); let r = 0; builtIds().forEach(i => r = Math.max(r, Math.hypot(meta[i].x - c.x, meta[i].z - c.z)));
    return clamp(r * 2.2 + 140, 160, 1100);
  }
  const banner = (big, small, ms = 2200) => new Promise(res => {
    const b = $("#w-banner"); b.innerHTML = `${esc(big)}${small ? `<small>${esc(small)}</small>` : ""}`; b.classList.add("on");
    setTimeout(() => { b.classList.remove("on"); setTimeout(res, 350); }, reduce ? 1200 : ms);
  });

  // Eröffnungsflug, danach die neuen Häuser
  let tour = false, skip = false;
  const unitName = d => { const key = W.dist[d - 1] || ""; if (key.startsWith("voll:")) return null; const u = units.find(u => u.key === key); return u ? u.name : null; };
  async function intro() {
    setView(v3(0, 0, 0), 1500, .2, -.6);
    if (!fresh && !newDist.length && !ups.length) { await flyTo(overviewTarget(), overviewDist(), .95, .35, 2.6); finishIntro(); return; }
    tour = true;
    const sk = document.createElement("button"); sk.className = "w-skip"; sk.textContent = "Überspringen ⏭"; el.append(sk);
    sk.onclick = () => { skip = true; sk.remove(); };
    // 1. neue Viertel: der Nebel zieht ab
    for (const d of newDist) {
      const [name, x, z] = DISTRICTS[d];
      if (!skip) await flyTo(v3(x, 0, z), 620, .85, undefined, 2);
      liftClouds(d); shownD = d; hud(); api.sound?.("up"); api.confetti?.();
      const un = unitName(d);
      if (!skip) await banner(`Neues Viertel: ${name}!`, un ? `freigeschaltet mit „${un}“` : "Camden Town war voll, jetzt geht es hier weiter", 2800);
    }
    shownD = openD(); W.dSeen = shownD;
    // 2. neue Häuser
    const list = []; for (let k = startBuilt; k < W.built.length; k++) list.push(k);
    if (list.length && list.length <= 6) {
      if (!newDist.length) await flyTo(overviewTarget(), overviewDist(), .9, .35, 2.2);
      for (const k of list) {
        if (skip) break;
        const i = W.built[k].b, m = meta[i];
        await flyTo(v3(m.x, m.h * .4, m.z), clamp(m.h * 4 + m.r * 6, 110, 280), .95, undefined, 1.5);
        grow(i); built = k + 1; hud(); api.sound?.(m.mark ? "up" : "good");
        if (m.mark) { addLabel(i, true); api.confetti?.(); }
        await banner(m.mark ? `★ ${m.name}!` : W.built[k].en, m.mark ? `Wahrzeichen freigeschaltet mit „${W.built[k].en}“` : m.name ? `hat ${m.name} gebaut` : `hat ein Haus gebaut`, m.mark ? 2600 : 1500);
      }
    }
    // viele auf einmal (oder übersprungen): als Welle
    const rest = list.map(k => W.built[k].b).filter(i => stateArr[i * 4 + 2] === 0);
    if (rest.length) {
      built = W.built.length;
      if (!skip) await flyTo(overviewTarget(), overviewDist(), .85, .35, 2);
      const span = Math.min(2.5, rest.length * .05);
      rest.forEach((i, k) => { grow(i, span * k / rest.length, k % 3 === 0 || meta[i].mark); if (meta[i].mark) addLabel(i, true); });
      hud(); api.sound?.("up"); api.confetti?.();
      const marks = rest.filter(i => meta[i].mark).map(i => meta[i].name);
      await banner(`+${rest.length} Gebäude!`, marks.length ? `Neu: ★ ${marks.join(", ")}` : "Deine Wörter bauen Camden", 2600);
    }
    built = W.built.length; W.seen = built;
    for (let k = startBuilt; k < W.built.length; k++) W.tier[W.built[k].id] = tierNow(W.built[k]);
    // 3. Häuser, deren Wort weiter nach hinten gewandert ist: Fenster leuchten oder das Dach wird golden
    const show = ups.slice(0, 4);
    for (const k of show) {
      if (skip) break;
      const w = W.built[k], i = w.b, m = meta[i], t = tierNow(w);
      await flyTo(v3(m.x, m.h * .5, m.z), clamp(m.h * 4 + m.r * 6, 110, 260), .9, undefined, 1.4);
      setTier(i, t); stateArr[i * 4 + 1] = .9; stateTex.needsUpdate = true; burst(m, true); api.sound?.("up");
      await banner(t === 3 ? "Goldenes Dach!" : "Die Fenster leuchten!", `„${w.en}“ ist jetzt in Fach ${levelOf.get(w.id)}`, 1900);
      stateArr[i * 4 + 1] = 0; stateTex.needsUpdate = true;
    }
    const restUp = ups.filter(k => stateArr[W.built[k].b * 4 + 3] * 3 < tierNow(W.built[k]) - .5);
    restUp.forEach(k => setTier(W.built[k].b, tierNow(W.built[k]))); stateTex.needsUpdate = true;
    if (restUp.length && !skip) await banner(`${restUp.length} ${restUp.length === 1 ? "Haus strahlt" : "Häuser strahlen"} jetzt heller`, "weil ihre Wörter weiter hinten im Kasten liegen", 2000);
    ups.forEach(k => W.tier[W.built[k].id] = tierNow(W.built[k]));
    el.querySelector(".w-skip")?.remove();
    api.save(); hud(); tour = false;
    if (skip || fresh > 6) await flyTo(overviewTarget(), overviewDist(), .9, .35, 1.6);
    finishIntro();
  }

  // --- Schleife ---
  const clock = new THREE.Clock(); let raf = 0, alive = true;
  const tmp = new THREE.Vector3();
  function resize() { const w = el.clientWidth, h = el.clientHeight; renderer.setSize(w, h, false); camera.aspect = w / h; camera.updateProjectionMatrix(); }
  addEventListener("resize", resize); resize();
  function frame() {
    if (!alive) return;
    raf = requestAnimationFrame(frame);
    const dt = Math.min(.05, clock.getDelta()); U.uTime.value += dt;
    stepFly(dt); if (!fly) controls.update();
    if (Math.abs(shift - shiftTo) > .001) {
      shift = lerp(shift, shiftTo, Math.min(1, dt * 6)); const w0 = el.clientWidth, h0 = el.clientHeight;
      if (shift > .002) camera.setViewOffset(w0, h0, 0, h0 * shift, w0, h0); else camera.clearViewOffset();
    }
    // nicht aus der Stadt hinausschieben
    const t = controls.target, R = data.radius + 60, l = Math.hypot(t.x, t.z);
    if (l > R) { tmp.set(t.x, 0, t.z).multiplyScalar(R / l - 1); t.add(tmp); camera.position.add(tmp); }
    stepGrow(dt); stepClouds(dt, U.uTime.value);
    if (treasure) {
      const tb = treasure.box;
      if (!treasure.found) { tb.rotation.y += dt * 1.6; tb.position.y = treasure.m.h + 5 + Math.sin(U.uTime.value * 2.4) * 1.2; treasure.beam.material.opacity = .3 + .12 * Math.sin(U.uTime.value * 3); }
      else if (treasure.t < 1) { treasure.t += dt / .9; tb.scale.setScalar(1.6 + treasure.t * 2.5); tb.position.y += dt * 18; tb.rotation.y += dt * 9;
        treasure.beam.material.opacity = .4 * (1 - treasure.t); if (treasure.t >= 1) { tb.visible = treasure.beam.visible = false; } }
    }
    // Schatten folgen dem Blick
    const dist = camera.position.distanceTo(controls.target), sz = clamp(dist * .9, 120, 900);
    const sc = sun.shadow.camera; if (sc.right !== sz) { sc.left = sc.bottom = -sz; sc.right = sc.top = sz; sc.near = 1; sc.far = 3000; sc.updateProjectionMatrix(); }
    sun.target.position.copy(controls.target); sun.position.copy(controls.target).addScaledVector(sun.userData.dir, 1200);
    // Fahrzeuge
    for (const m of movers) {
      m.d += m.v * dt; const p = along(m.path, m.d), s = m.side ? (p.back ? -m.side : m.side) : 0;
      m.o.position.set(p.x + Math.cos(p.a) * s, m.y, p.z - Math.sin(p.a) * s); m.o.rotation.y = p.a;
    }
    // Teilchen
    for (let i = 0; i < PN; i++) if (pLife[i] > 0) {
      pLife[i] -= dt; const j = i * 3;
      pVel[j + 1] -= 22 * dt; pVel[j] *= .98; pVel[j + 2] *= .98;
      pPos[j] += pVel[j] * dt; pPos[j + 1] = Math.max(.2, pPos[j + 1] + pVel[j + 1] * dt); pPos[j + 2] += pVel[j + 2] * dt;
      if (pLife[i] <= 0) pPos[j + 1] = -50;
    }
    pGeo.attributes.position.needsUpdate = true; pGeo.attributes.color.needsUpdate = true;
    renderer.render(scene, camera);
    // Schilder
    // Schilder; überdecken sich zwei, bleibt das frühere Wahrzeichen stehen
    const w = el.clientWidth, h = el.clientHeight, taken = [];
    for (const lb of labels) {
      const m = meta[lb.i]; tmp.set(m.x, m.h * stateArr[lb.i * 4] + 4, m.z).project(camera);
      const x = (tmp.x * .5 + .5) * w, y = (-tmp.y * .5 + .5) * h;
      lb.w = lb.w || 120;
      const box = [x - lb.w / 2 - 4, y - 30, x + lb.w / 2 + 4, y];
      let vis = tmp.z < 1 && Math.abs(tmp.x) < 1.1 && Math.abs(tmp.y) < 1.1 && stateArr[lb.i * 4] > .5;
      if (vis && taken.some(b => box[0] < b[2] && box[2] > b[0] && box[1] < b[3] && box[3] > b[1])) vis = false;
      if (vis) taken.push(box);
      lb.d.style.display = vis ? "" : "none";
      if (vis) lb.d.style.transform = `translate(${x}px,${y}px) translate(-50%,-100%)`;
    }
  }
  const onVis = () => { if (document.hidden) { cancelAnimationFrame(raf); raf = 0; } else if (!raf && alive) { clock.getDelta(); frame(); } };
  document.addEventListener("visibilitychange", onVis);
  frame();
  intro();

  function close() {
    alive = false; cancelAnimationFrame(raf); clearInterval(timeTimer);
    removeEventListener("resize", resize); document.removeEventListener("visibilitychange", onVis);
    if (tour) { W.seen = W.built.length; W.dSeen = openD(); W.built.forEach(w => W.tier[w.id] = tierNow(w)); api.save(); }
    controls.dispose(); scene.traverse(o => { o.geometry?.dispose(); if (o.material) [].concat(o.material).forEach(m => m.dispose()); });
    stateTex.dispose(); glowTex.dispose(); puffTex.dispose(); depthMat.dispose(); renderer.dispose(); renderer.forceContextLoss?.();
    el.remove(); api.onClose();
  }
  $("#w-close").onclick = close;
  return { close };
}

// Wie viele Häuser warten auf ihren Bau? (für die Startseite; ohne three.js nutzbar)
export function pending(cards, state) {
  const have = new Set((state.built || []).map(b => b.id));
  return cards.filter(c => c.level >= SIT && !have.has(c.id)).length + Math.max(0, (state.built || []).length - (state.seen || 0));
}
