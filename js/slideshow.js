
// ===== Slideshow-Referenzen (falls noch nicht vorhanden) =====
// ===== Referenzen =====
const slides = document.querySelectorAll(".slide");
let current = 0;

const prevBtn = document.getElementById("prevBtn");
const nextBtn = document.getElementById("nextBtn");

const rightTitle = document.getElementById("rightTitle");
const rightBody = document.getElementById("rightBody");

// ===== Funktion: nur rechter Text wechselt =====
function updateRightText(index) {
    const s = slides[index];
    if (!s) return;

    rightTitle.textContent = s.dataset.rightTitle || "Zusatzinfo";
    rightBody.textContent = s.dataset.right || "";
}

// ===== Slideshow-Funktionen =====
function showSlide(index) {
    slides.forEach(sl => sl.classList.remove("active"));
    slides[index].classList.add("active");
    updateRightText(index);   // <- nur rechte Seite aktualisieren
}

function goNext() {
    current = (current + 1) % slides.length;
    showSlide(current);
}

function goPrev() {
    current = (current - 1 + slides.length) % slides.length;
    showSlide(current);
}

// ===== Buttons =====
if (nextBtn) nextBtn.addEventListener("click", goNext);
if (prevBtn) prevBtn.addEventListener("click", goPrev);

// ===== Tastatursteuerung (optional) =====
document.addEventListener("keydown", (e) => {
    if (e.key === "ArrowRight") goNext();
    if (e.key === "ArrowLeft") goPrev();
});

// ===== Startzustand =====
updateRightText(current);
