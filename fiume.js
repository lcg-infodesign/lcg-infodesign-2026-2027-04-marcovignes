let data = [];
let righe;
let fiume = null;

// Stesse variabili geometriche di sketch.js
const margin = 24;
const topBand = 184;
const rowH = 26;
const labelH = 34;
const seaReserve = 150;
const barH = 16;

// Parametri numerici da mostrare nel grafico.
// I parametri con lo stesso "gruppo" condividono la stessa scala (le tre temperature).
const parametri = [
  { key: 'length',      label: 'Lunghezza',       unit: 'km',   gruppo: 'length' },
  { key: 'area',        label: 'Area del bacino', unit: 'km²',  gruppo: 'area' },
  { key: 'discharge',   label: 'Portata',         unit: 'm³/s', gruppo: 'discharge' },
  { key: 'tributaries', label: 'Affluenti',       unit: '',     gruppo: 'tributaries' },
  { key: 'min_temp',    label: 'Temp. minima',    unit: '°C',   gruppo: 'temp' },
  { key: 'max_temp',    label: 'Temp. massima',   unit: '°C',   gruppo: 'temp' },
  { key: 'avg_temp',    label: 'Temp. media',     unit: '°C',   gruppo: 'temp' }
];
let scale = {};   // gruppo -> { lo, hi }

// Funzione integrata per leggere e pulire il CSV con punto e virgola
function parseCSV(lines) {
  const campiNumerici = ["length", "area", "discharge", "tributaries", "min_temp", "max_temp", "avg_temp"];
  let pulite = lines
    .map(l => l.replace(/^\uFEFF/, "").trim())
    .filter(l => l.length > 0);
  let header = pulite.at(0).split(";");
  let out = [];
  for (let r = 1; r < pulite.length; r++) {
    let celle = pulite[r].split(";");
    let obj = {};
    header.forEach((h, k) => obj[h] = celle[k]);
    campiNumerici.forEach(c => obj[c] = Number(obj[c]));
    out.push(obj);
  }
  return out;
}

function preload() {
  righe = loadStrings("assets/Cartel1.csv");
}

function setup() {
  data = parseCSV(righe);

  let id = new URLSearchParams(window.location.search).get('id');
  fiume = data.find(r => r.id === id) || null;
  document.title = fiume ? fiume.name : "Fiume non trovato";

  // Scala di ogni gruppo: da min(0, minimo) a max(0, massimo) su tutto il dataset
  for (let p of parametri) {
    let g = p.gruppo;
    if (!scale[g]) scale[g] = { lo: 0, hi: 0 };
    for (let r of data) {
      scale[g].lo = min(scale[g].lo, r[p.key]);
      scale[g].hi = max(scale[g].hi, r[p.key]);
    }
  }

  createCanvas(windowWidth, altezza());
  textFont("Helvetica");
}

function altezza() {
  return topBand + parametri.length * (labelH + rowH) + margin;
}

function windowResized() {
  resizeCanvas(windowWidth, altezza());
}

function draw() {
  // Sfondo verde prato scuro
  background('#2b4c32');
  noStroke();
  textAlign(LEFT, TOP);

  // Gestione caso fiume non trovato
  if (!fiume) {
    fill(255);
    textStyle(BOLD);
    textSize(40);
    text("Fiume non trovato", margin, 14);
    return;
  }

  // Titolo: identico per posizione (margin, 14) e grandezza (40) a sketch.js
  fill(255);
  textStyle(BOLD);
  textSize(40);
  text(fiume.name, margin, 14);

  // Sottotitolo allineato a sketch.js (y = 66)
  textStyle(NORMAL);
  textSize(12.5);
  fill(210);
  text("Continente: " + fiume.continent + "   ·   Sfocia in: " + fiume.outflow, margin, 66);

  // Disposizione identica a sketch.js
  let y = topBand;
  let chartX0 = margin;
  let chartX1 = max(chartX0 + 100, width - margin - seaReserve);

  for (let i = 0; i < parametri.length; i++) {
    let p = parametri[i];
    let s = scale[p.gruppo];
    let v = fiume[p.key];

    // 1. Titoletto del parametro (stesso stile e spaziatura dei continenti in sketch.js)
    y += labelH;
    fill(255);
    noStroke();
    textStyle(BOLD);
    textSize(17);
    textAlign(LEFT, TOP);
    text(p.label, margin, y - labelH * 0.45);
    textStyle(NORMAL);

    // 2. Rappresentazione del dato subito sotto (stessa altezza riga rowH di sketch.js)
    let cy = y + rowH / 2;

    // Binario di sfondo (intervallo di tutti i fiumi)
    fill(255, 22);
    rect(chartX0, cy - barH / 2, chartX1 - chartX0, barH, 4);

    // Barra: parte dallo zero e arriva al valore
    let xZero = map(0, s.lo, s.hi, chartX0, chartX1);
    let xVal  = map(v, s.lo, s.hi, chartX0, chartX1);
    let barLeft = min(xZero, xVal);
    let barWidth = max(abs(xVal - xZero), 2);

    fill(v < 0 ? '#1a5296' : '#64dfdf');
    rect(barLeft, cy - barH / 2, barWidth, barH, 4);

    // Linea dello zero (solo se ci sono valori negativi)
    if (s.lo < 0) {
      stroke(255, 120);
      strokeWeight(1);
      line(xZero, cy - barH / 2 - 4, xZero, cy + barH / 2 + 4);
      noStroke();
    }

    // Didascalia numerica posizionata esattamente 8px dopo la barra (come in sketch.js)
    fill(210);
    textAlign(LEFT, CENTER);
    textSize(min(12, rowH * 0.5));
    text(v.toLocaleString('it-IT') + (p.unit ? " " + p.unit : ""), barLeft + barWidth + 8, cy);

    y += rowH;
  }
}
