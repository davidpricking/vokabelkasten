// Baut welt/camden.json aus OpenStreetMap-Daten (Overpass-Antwort mit "out geom").
//   node tools/osm-welt.mjs osm-camden.json welt/camden.json
// Die Abfrage steht in tools/camden.overpassql. Daten © OpenStreetMap-Mitwirkende, ODbL.
import { readFileSync, writeFileSync } from "node:fs";

const [, , inFile, outFile = "welt/camden.json"] = process.argv;
const osm = JSON.parse(readFileSync(inFile, "utf8"));

// Mittelpunkt: U-Bahnhof Camden Town
const LAT0 = 51.5392, LON0 = -0.1426;
const KX = Math.cos(LAT0 * Math.PI / 180) * 111320, KZ = 110540;
const RADIUS = 840;                        // Meter, alles außerhalb fällt weg
const xy = p => [(p.lon - LON0) * KX, -(p.lat - LAT0) * KZ];
const q = v => Math.round(v * 10);         // Dezimeter als ganze Zahlen
const flat = pts => pts.flatMap(([x, z]) => [q(x), q(z)]);
const segDist = ([ax, az], [bx, bz]) => { const dx = bx - ax, dz = bz - az, l = dx * dx + dz * dz || 1;
  const t = Math.max(0, Math.min(1, -(ax * dx + az * dz) / l)); return Math.hypot(ax + t * dx, az + t * dz); };
const inside = pts => pts.some((p, i) => Math.hypot(...p) < RADIUS || (i && segDist(pts[i - 1], p) < RADIUS));

// Wahrzeichen in der Reihenfolge, in der sie freigeschaltet werden: [Name in OSM (Teil), Anzeige, ab Gebäude Nr.]
const LANDMARKS = [
  [/^camden town station$/i, "Camden Town Station", 0],
  [/^waterside halls west$/i, "Camden Lock Market", 9],
  [/^the dublin castle$/i, "The Dublin Castle", 24],
  [/stables market/i, "Stables Market", 49],
  [/jewish museum/i, "Jewish Museum", 74],
  [/^koko$/i, "KOKO", 99],
  [/^roundhouse$/i, "The Roundhouse", 149],
  [/^camden road station$/i, "Camden Road Station", 199],
  [/^the hawley arms$/i, "The Hawley Arms", 299],
  [/^mornington crescent$/i, "Mornington Crescent", 399],
  [/greek orthodox cathedral/i, "All Saints Cathedral", 499],
  [/^st\. michael's camden town$/i, "St Michael's Church", 699],
  [/^crowndale centre$/i, "Crowndale Centre", 999]
];

const area = pts => { let a = 0; for (let i = 0, j = pts.length - 1; i < pts.length; j = i++) a += (pts[j][0] + pts[i][0]) * (pts[j][1] - pts[i][1]); return a / 2; };
const centroid = pts => { let x = 0, z = 0; pts.forEach(p => { x += p[0]; z += p[1]; }); return [x / pts.length, z / pts.length]; };
function ring(geom) {
  let pts = geom.map(xy);
  if (pts.length > 2) { const [a, b] = [pts[0], pts.at(-1)]; if (a[0] === b[0] && a[1] === b[1]) pts.pop(); }
  // gerade Zwischenpunkte weg
  pts = pts.filter((p, i) => { const a = pts[(i + pts.length - 1) % pts.length], b = pts[(i + 1) % pts.length];
    const cross = (p[0] - a[0]) * (b[1] - a[1]) - (p[1] - a[1]) * (b[0] - a[0]);
    return Math.abs(cross) / (Math.hypot(b[0] - a[0], b[1] - a[1]) || 1) > 0.15; });
  if (area(pts) < 0) pts.reverse();       // einheitlich gegen den Uhrzeigersinn (in x/z)
  return pts;
}
function height(t) {
  const h = parseFloat(t.height || t["building:height"]);
  if (h > 2 && h < 150) return h;
  const lv = parseFloat(t["building:levels"]);
  if (lv > 0 && lv < 40) return lv * 3.2 + (t["roof:levels"] ? 1.5 : 0.8);
  if (/^(garage|garages|shed|kiosk|hut|roof|carport|service)$/.test(t.building)) return 3;
  return null;                              // wird im Browser aus der Nachbarschaft geschätzt
}
const KIND = { house: 1, terrace: 1, residential: 1, apartments: 1, detached: 1, semidetached_house: 1,
  retail: 2, commercial: 2, office: 2, supermarket: 2, kiosk: 2, train_station: 3, transportation: 3,
  church: 4, chapel: 4, school: 5, college: 5, university: 5, industrial: 6, warehouse: 6, garage: 6, garages: 6, shed: 6 };

const buildings = [], roads = [], water = [], green = [], rail = [], trees = [], lamps = [];
const names = [];
const nameIdx = n => { let i = names.indexOf(n); if (i < 0) { i = names.length; names.push(n); } return i; };

const ROAD_W = { primary: 14, secondary: 12, tertiary: 10, unclassified: 8, residential: 8, living_street: 6,
  service: 5, pedestrian: 7, footway: 2.5, path: 2.2, cycleway: 2.5, steps: 2.5, trunk: 16, primary_link: 9, secondary_link: 8 };

for (const el of osm.elements) {
  const t = el.tags || {};
  if (el.type === "node") {
    const p = xy(el); if (Math.hypot(...p) > RADIUS) continue;
    if (t.natural === "tree") trees.push(q(p[0]), q(p[1]));
    else if (t.highway === "street_lamp") lamps.push(q(p[0]), q(p[1]));
    continue;
  }
  const outers = el.type === "way" ? (el.geometry ? [el.geometry] : [])
    : (el.members || []).filter(m => m.role === "outer" && m.geometry).map(m => m.geometry);
  for (const g of outers) {
    if (g.length < 2) continue;
    if (t.building && t.building !== "no" && !t.location?.startsWith("under")) {
      const pts = ring(g); if (pts.length < 3 || !inside(pts) || Math.abs(area(pts)) < 6) continue;
      const nm = t.name || t["addr:housename"] || "";
      buildings.push({ pts, h: height(t), k: KIND[t.building] || 0, name: nm, c: centroid(pts),
        a: area(pts), min: parseFloat(t.min_height) || (parseFloat(t["building:min_level"]) * 3.2) || 0,
        col: t["building:colour"] || "" });
    } else if (t.highway && ROAD_W[t.highway] && !t.tunnel) {
      const pts = g.map(xy); if (!inside(pts)) continue;
      const w = parseFloat(t.width) > 1 ? parseFloat(t.width) : ROAD_W[t.highway];
      roads.push([Math.round(w * 10), t.name === "Camden High Street" || t.name === "Chalk Farm Road" ? 1 : 0, ...flat(pts)]);
    } else if (t.waterway === "canal" || t.natural === "water" || t.water || t.waterway === "riverbank") {
      const pts = g.map(xy); if (!inside(pts)) continue;
      if (el.type === "way" && t.waterway === "canal") water.push([1, ...flat(pts)]);   // Linie
      else water.push([0, ...flat(ring(g))]);                                         // Fläche
    } else if (/^(park|garden|playground|pitch|common|nature_reserve)$/.test(t.leisure) || /^(grass|recreation_ground|village_green|meadow|cemetery|allotments)$/.test(t.landuse)) {
      const pts = ring(g); if (pts.length < 3 || !inside(pts)) continue;
      green.push(flat(pts));
    } else if (/^(rail|subway|light_rail)$/.test(t.railway) && !t.tunnel) {
      const pts = g.map(xy); if (!inside(pts)) continue;
      rail.push(flat(pts));
    }
  }
}

// Reihenfolge: Bahnhof zuerst, dann in einer Spirale nach außen; Wahrzeichen an festen Stellen.
buildings.sort((a, b) => Math.hypot(...a.c) - Math.hypot(...b.c));
const used = new Set(), marks = [];
for (const [re, label, at] of LANDMARKS) {
  const hits = buildings.filter(b => b.name && re.test(b.name) && !used.has(b));
  if (!hits.length) { console.warn("Wahrzeichen nicht gefunden:", label); continue; }
  const best = hits.sort((a, b) => b.a - a.a)[0];
  used.add(best); best.mark = label; marks.push([best, at]);
}
let order = buildings.filter(b => !used.has(b));
for (const [b, at] of marks.sort((x, y) => x[1] - y[1])) order.splice(Math.min(at, order.length), 0, b);

const out = {
  attribution: "© OpenStreetMap-Mitwirkende, ODbL 1.0 – openstreetmap.org/copyright",
  origin: [LAT0, LON0], radius: RADIUS, scale: 0.1,
  names,
  // je Gebäude: [Höhe in dm (0 = unbekannt), Art, Name-Index (-1 = keiner), Wahrzeichen (0/1), Sockel in dm, x0, z0, x1, z1, …]
  b: order.map(b => [b.h ? Math.round(b.h * 10) : 0, b.k, b.mark ? nameIdx(b.mark) : (b.name ? nameIdx(b.name) : -1), b.mark ? 1 : 0, Math.round(b.min * 10), ...flat(b.pts)]),
  roads, water, green, rail, trees, lamps
};
writeFileSync(outFile, JSON.stringify(out));
console.log(`${order.length} Gebäude, ${roads.length} Straßen, ${water.length} Wasser, ${green.length} Grün, ${rail.length} Gleise, ${trees.length / 2} Bäume, ${marks.length} Wahrzeichen → ${outFile}`);
