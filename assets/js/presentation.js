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

const state = {
  currentSlide: 0,
  totalSlides: 0,
  slides: []
};

const container = document.getElementById("presentation-container");
const track = document.getElementById("slide-track");
const pageCounter = document.getElementById("page-counter");
const progressBar = document.getElementById("progress-bar");

function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

function scalePresentation() {
  const width = window.innerWidth;
  const height = window.innerHeight;
  const scale = Math.min(width / 1920, height / 1080);
  container.style.transform = `scale(${scale})`;
}

function getHashSlideIndex() {
  const hash = window.location.hash;
  if (!hash.startsWith("#slide-")) {
    return 0;
  }

  const value = Number(hash.replace("#slide-", ""));
  if (Number.isNaN(value) || value < 1) {
    return 0;
  }

  return value - 1;
}

function syncHash() {
  const hashValue = String(state.currentSlide + 1).padStart(2, "0");
  window.history.replaceState(null, "", `#slide-${hashValue}`);
}

function updateUI() {
  state.slides.forEach((slide, index) => {
    slide.classList.toggle("active", index === state.currentSlide);
    slide.setAttribute("aria-hidden", index === state.currentSlide ? "false" : "true");
  });

  pageCounter.innerText = String(state.currentSlide + 1).padStart(2, "0");

  const progress = ((state.currentSlide + 1) / state.totalSlides) * 100;
  progressBar.style.width = `${progress}%`;

  syncHash();
}

function changeSlide(direction) {
  const nextSlide = state.currentSlide + direction;
  if (nextSlide < 0 || nextSlide >= state.totalSlides) {
    return;
  }

  state.currentSlide = nextSlide;
  updateUI();
}

function isInteractiveTarget(target) {
  if (!(target instanceof Element)) {
    return false;
  }

  return Boolean(target.closest("a, button, input, textarea, select, label, summary, [data-no-nav]"));
}

function bindEvents() {
  const swipeThreshold = 44;
  const tapThreshold = 12;
  const ghostMouseWindow = 700;
  let touchStartX = null;
  let touchStartY = null;
  let lastTouchInteractionAt = 0;

  document.addEventListener("keydown", (event) => {
    if (["ArrowRight", " ", "PageDown"].includes(event.key)) {
      event.preventDefault();
      changeSlide(1);
    }

    if (["ArrowLeft", "PageUp"].includes(event.key)) {
      event.preventDefault();
      changeSlide(-1);
    }

    if (event.key === "Home") {
      event.preventDefault();
      state.currentSlide = 0;
      updateUI();
    }

    if (event.key === "End") {
      event.preventDefault();
      state.currentSlide = state.totalSlides - 1;
      updateUI();
    }
  });

  container.addEventListener("mousedown", (event) => {
    if (Date.now() - lastTouchInteractionAt < ghostMouseWindow || isInteractiveTarget(event.target)) {
      return;
    }

    if (event.button === 2) {
      changeSlide(-1);
      return;
    }

    if (event.button === 0) {
      const clickOnLeftHalf = event.clientX < window.innerWidth / 2;
      changeSlide(clickOnLeftHalf ? -1 : 1);
    }
  });

  container.addEventListener(
    "touchstart",
    (event) => {
      if (event.touches.length !== 1 || isInteractiveTarget(event.target)) {
        touchStartX = null;
        touchStartY = null;
        return;
      }

      touchStartX = event.touches[0].clientX;
      touchStartY = event.touches[0].clientY;
    },
    { passive: true }
  );

  container.addEventListener(
    "touchend",
    (event) => {
      if (touchStartX === null || touchStartY === null || event.changedTouches.length !== 1) {
        touchStartX = null;
        touchStartY = null;
        return;
      }

      const touch = event.changedTouches[0];
      const deltaX = touch.clientX - touchStartX;
      const deltaY = touch.clientY - touchStartY;
      const absX = Math.abs(deltaX);
      const absY = Math.abs(deltaY);

      touchStartX = null;
      touchStartY = null;

      if (absX > swipeThreshold && absX > absY) {
        lastTouchInteractionAt = Date.now();
        changeSlide(deltaX < 0 ? 1 : -1);
        return;
      }

      if (absX < tapThreshold && absY < tapThreshold && !isInteractiveTarget(event.target)) {
        lastTouchInteractionAt = Date.now();
        const tapOnLeftHalf = touch.clientX < window.innerWidth / 2;
        changeSlide(tapOnLeftHalf ? -1 : 1);
      }
    },
    { passive: true }
  );

  container.addEventListener(
    "touchcancel",
    () => {
      touchStartX = null;
      touchStartY = null;
    },
    { passive: true }
  );

  container.addEventListener("contextmenu", (event) => {
    event.preventDefault();
  });

  window.addEventListener("resize", scalePresentation);
  window.addEventListener("hashchange", () => {
    state.currentSlide = clamp(getHashSlideIndex(), 0, state.totalSlides - 1);
    updateUI();
  });
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

    slide.id = `slide-${String(index + 1).padStart(2, "0")}`;
    track.appendChild(slide);
  });

  state.slides = Array.from(track.querySelectorAll(".slide"));
  state.totalSlides = state.slides.length;
}

async function init() {
  try {
    await loadSlides();
    bindEvents();
    scalePresentation();

    state.currentSlide = clamp(getHashSlideIndex(), 0, state.totalSlides - 1);
    updateUI();
  } catch (error) {
    track.innerHTML = `<div class="loading-state">Error cargando la presentación modular.</div>`;
    console.error(error);
  }
}

init();
