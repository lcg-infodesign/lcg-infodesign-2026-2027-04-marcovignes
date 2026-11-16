let data = [];      // array di oggetti, uno per fiume
let righe;          // righe grezze del CSV (caricate in preload)
let minLength = Infinity, maxLength = 0;
let minArea = Infinity, maxArea = 0;
let minTemp = Infinity, maxTemp = -Infinity;
let fiumeSotto = null;   // id del fiume sotto il mouse (serve solo per il click)

// Scala cromatica unica: dal blu scuro (freddo) all'azzurro chiaro (caldo)
let coldColor = '#1a5296';
let hotColor  = '#64dfdf';

let continentOrder = ['Africa', 'Asia', 'Oceania', 'Australia', 'Europe', 'North America', 'South America'];

// Variabili di impaginazione geometrica
let margin = 24;
let topBand = 184;
let rowH = 26;
let labelH = 34;
let leftMargin = 0;
let seaReserve = 150;
let altezzaTotale = 0;

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

// preload() fa aspettare p5 finché il file non è completamente caricato
function preload() {
  righe = loadStrings("assets/Cartel1.csv");
}

function setup() {
  createCanvas(windowWidth, windowHeight);
  textFont("Helvetica");

  data = parseCSV(righe);

  for (let i = 0; i < data.length; i++) {
    let length = data[i].length;
    let area = data[i].area;
    let temp = data[i].avg_temp;

    minLength = min(minLength, length);
    maxLength = max(maxLength, length);
    minArea = min(minArea, area);
    maxArea = max(maxArea, area);
    minTemp = min(minTemp, temp);
    maxTemp = max(maxTemp, temp);
  }

  altezzaTotale = topBand + continentOrder.length * labelH + data.length * rowH + margin;
  resizeCanvas(windowWidth, altezzaTotale);
}

function draw() {
  // Sfondo verde prato scuro
  background('#2b4c32');

  // Titolo
  textStyle(NORMAL);
  textSize(12);
  textAlign(LEFT, TOP);

  fill(255);
  noStroke();
  textStyle(BOLD);
  textSize(40);
  text("I fiumi più lunghi del mondo", margin, 14);

  // Sottotitolo / legenda
  textStyle(NORMAL);
  textSize(12.5);
  fill(210);
  text("Ogni fiume è una linea ondulata: lunghezza linea = lunghezza del fiume · spessore = area del bacino · in fondo il nome del fiume.", margin, 66);
  text("Colore = temperatura media. La tinta va dal fiume più FREDDO (blu scuro) al più CALDO (azzurro chiaro). Clicca su un fiume per vederne il dettaglio.", margin, 84);

  fiumeSotto = null;

  // Evita errori durante il caricamento iniziale
  if (!data || data.length === 0) return;

  let y = topBand;
  let lineAreaW = width - leftMargin - seaReserve;

  let startY = topBand + labelH - 10;
  let endY = altezzaTotale - margin;

  stroke('#e6ccb2');
  strokeWeight(6);
  strokeCap(ROUND);
  line(leftMargin, startY, leftMargin, endY);

  for (let continent of continentOrder) {
    let haFiumi = false;
    for (let i = 0; i < data.length; i++) {
      if (data[i].continent === continent) {
        haFiumi = true;
        break;
      }
    }

    if (haFiumi) {
      y += labelH;
      fill(255);
      noStroke();
      textStyle(BOLD);
      textSize(17);
      text(continent, leftMargin + 8, y - labelH * 0.45);
      textStyle(NORMAL);
    }

    for (let i = 0; i < data.length; i++) {
      if (data[i].continent !== continent) continue;

      let cy = y + rowH / 2;
      let length = data[i].length;
      let area = data[i].area;
      let temp = data[i].avg_temp;
      let name = data[i].name;

      let lineLen = map(length, minLength, maxLength, 40, lineAreaW);

      textSize(min(12, rowH * 0.5));
      let xEnd = leftMargin + lineLen + 8 + textWidth(name);

      // Area cliccabile: dalla linea alla fine del nome
      if (mouseX >= leftMargin && mouseX <= xEnd && abs(mouseY - cy) <= rowH / 2) {
        fiumeSotto = data[i].id;
      }

      // Calcolo colore globale dal blu scuro (freddo) all'azzurro chiaro (caldo)
      let t = (maxTemp > minTemp) ? (temp - minTemp) / (maxTemp - minTemp) : 1;
      let col = lerpColor(color(coldColor), color(hotColor), constrain(t, 0, 1));

      let logNorm = map(log(area), log(minArea), log(maxArea), 0, 1);
      let thickness = 1 + pow(logNorm, 1.6) * (rowH * 0.95 - 1);

      noFill();
      stroke(col);
      strokeWeight(thickness);
      strokeCap(ROUND);

      beginShape();
      for (let x = 0; x <= lineLen; x += 4) {
        vertex(leftMargin + x, cy + sin(x * 0.045) * 2.4);
      }
      endShape();

      // Nome del fiume accanto
      noStroke();
      fill(210);
      textAlign(LEFT, CENTER);
      textSize(min(12, rowH * 0.5));
      text(name, leftMargin + lineLen + 8, cy);

      y += rowH;
    }
  }

  // Il cursore diventa una manina sopra i fiumi cliccabili
  cursor(fiumeSotto !== null ? HAND : ARROW);
}

// Click su un fiume -> apre la pagina di dettaglio
function mousePressed() {
  if (fiumeSotto !== null) {
    window.location.href = "fiume.html?id=" + encodeURIComponent(fiumeSotto);
  }
}
