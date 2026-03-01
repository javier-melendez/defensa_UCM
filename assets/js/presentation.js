const slideManifest = [
  "slides/01-portada-principal.html",
  "slides/02-separador-problema.html",
  "slides/03-problema-contexto.html",
  "slides/04-problema-relevancia-objetivos.html",
  "slides/06-separador-marco-teorico.html",
  "slides/07-marco-corrientes.html",
  "slides/08-marco-referencias.html",
  "slides/09-separador-metodologia.html",
  "slides/10-metodologia-bases.html",
  "slides/11-metodologia-enfoque.html",
  "slides/13-triangulacion-comparativa.html",
  "slides/13b-triangulacion-herramienta.html",
  "slides/14-triangulacion-visualizaciones.html",
  "slides/15-separador-resultados.html",
  "slides/16-resultados-hallazgos.html",
  "slides/17-resultados-discusion-conclusiones.html",
  "slides/16b-limitaciones-futuras-lineas.html",
  "slides/18-cierre-qa.html"
];

const track = document.getElementById("slide-track");
const revealRoot = document.getElementById("reveal-root");
const pageCounter = document.getElementById("page-counter");
const progressBar = document.getElementById("progress-bar");

function formatSlideNumber(value) {
  return String(value).padStart(2, "0");
}

function getLegacyHashSlideIndex() {
  const hash = window.location.hash;
  if (!hash.startsWith("#slide-")) {
    return null;
  }

  const value = Number(hash.replace("#slide-", ""));
  if (Number.isNaN(value) || value < 1) {
    return null;
  }

  return value - 1;
}

function updateCustomNav(deck) {
  const indices = deck.getIndices();
  const currentSlide = indices.h + 1;
  const totalSlides = deck.getTotalSlides();
  const progress = totalSlides > 0 ? (currentSlide / totalSlides) * 100 : 0;

  pageCounter.innerText = formatSlideNumber(currentSlide);
  progressBar.style.width = `${progress}%`;
}

async function fetchSlide(path) {
  const response = await fetch(path, { cache: "no-store" });
  if (!response.ok) {
    throw new Error(`No se pudo cargar la slide: ${path}`);
  }

  return response.text();
}

async function loadSlides() {
  const rawSlides = await Promise.all(slideManifest.map((path) => fetchSlide(path)));
  track.innerHTML = "";

  rawSlides.forEach((markup, index) => {
    const template = document.createElement("template");
    template.innerHTML = markup.trim();
    const slide = template.content.firstElementChild;
    if (!slide) {
      return;
    }

    slide.id = `slide-${formatSlideNumber(index + 1)}`;
    track.appendChild(slide);
  });
}

function createRevealDeck() {
  if (typeof window.Reveal !== "function") {
    throw new Error("Reveal.js no está disponible.");
  }

  return new window.Reveal(revealRoot, {
    disableLayout: true,
    controls: false,
    progress: false,
    slideNumber: false,
    center: false,
    hash: true,
    navigationMode: "linear",
    transition: "slide",
    backgroundTransition: "fade",
    touch: true,
    keyboard: true
  });
}

async function init() {
  try {
    await loadSlides();

    const deck = createRevealDeck();
    await deck.initialize();

    const legacyHashSlideIndex = getLegacyHashSlideIndex();
    if (legacyHashSlideIndex !== null) {
      const lastSlideIndex = deck.getTotalSlides() - 1;
      const safeIndex = Math.min(Math.max(legacyHashSlideIndex, 0), lastSlideIndex);
      deck.slide(safeIndex);
    }

    deck.on("ready", () => updateCustomNav(deck));
    deck.on("slidechanged", () => updateCustomNav(deck));
    updateCustomNav(deck);
  } catch (error) {
    track.innerHTML = `<section><div class="loading-state">Error cargando la presentación modular.</div></section>`;
    console.error(error);
  }
}

init();
