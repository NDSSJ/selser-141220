// ===== Herz-„Fäden“-Animation (Platzhalter 2) =====
(() => {
    const panel = document.getElementById("panel-platzhalter2");
    const canvas = document.getElementById("heartCanvas");
    if (!panel || !canvas) return;

    const ctx = canvas.getContext("2d");
    let rafId = null;
    let running = false;

    const W = canvas.width;
    const H = canvas.height;
    const CX = W / 2;
    const CY = H / 2;

    // Herz-Parameterkurve (klassisch)
    function hx(k) { return 16 * Math.pow(Math.sin(k), 3); }
    function hy(k) {
        return 13 * Math.cos(k) - 5 * Math.cos(2 * k) - 2 * Math.cos(3 * k) - Math.cos(4 * k);
    }

    // Einstellungen für den Look
    const scale = 20;   // Größe des Herzens
    const rays = 128;     // wie viele Fäden pro Frame
    const speed = 0.00018;  // wie schnell die Fäden wachsen / Phasenrotation
    let t = 0;      // Zeit/Phase
    let grow = 0;      // Wachstum von 0->1 (Herz „entsteht“)

    // weiches Ausfaden: halbtransparent übermalen statt hard clear
    function fadeBackground() {
        ctx.fillStyle = "rgba(83, 60, 72, 0.38)";
        // je kleiner, desto längere Spuren
    }

    function drawFrame() {
        fadeBackground();

        ctx.save();
        // (0,0) in die Mitte und y-Achse invertieren (wie bei Turtle)
        ctx.translate(CX, CY - 40);
        ctx.scale(1, -1);

        // „Strahlen“ zeichnen
        ctx.lineCap = "round";
        ctx.shadowColor = "rgba(230, 22, 84, 0.75)";
        ctx.shadowBlur = 12;

        for (let i = 0; i < rays; i++) {
            // fächerförmig gleichmäßig über die Kurve verteilt
            const k = (i / rays) * Math.PI * 2 + t;

            const x = hx(k) * scale;
            const y = hy(k) * scale;

            // Länge des Fadens (0..1). Erst wächst alles (grow), dann „atmet“ leicht
            const pulse = 0.03 * Math.sin(t * 4);
            const len = Math.max(0, Math.min(1, grow + pulse));

            ctx.beginPath();
            ctx.strokeStyle = "rgba(214, 36, 95, 0.86)";  // Rot
            ctx.lineWidth = 2;

            // vom Zentrum bis zu einem Anteil der Zielposition
            ctx.moveTo(0, 0);
            ctx.lineTo(x * len, y * len);
            ctx.stroke();
        }

        ctx.restore();

        // Zeit voranschreiten lassen
        t += speed;
        // Herz wachsen lassen bis voll (1)
        if (grow < 1) grow = Math.min(1, grow + 0.012);

        rafId = requestAnimationFrame(drawFrame);
    }

    function start() {
        if (running) return;
        running = true;
        // Reset für neuen Eintritt – Herz „entsteht“ jedes Mal neu
        ctx.clearRect(0, 0, W, H);
        t = 0;
        grow = 0;
        rafId = requestAnimationFrame(drawFrame);
    }

    function stop() {
        running = false;
        if (rafId) cancelAnimationFrame(rafId);
    }

    // Start/Stop abhängig davon, ob das Panel sichtbar (active) ist
    const obs = new MutationObserver(() => {
        if (panel.classList.contains("active")) start();
        else stop();
    });
    obs.observe(panel, { attributes: true, attributeFilter: ["class"] });

    // Falls „Platzhalter 2“ schon aktiv ist (z. B. beim Reload)
    if (panel.classList.contains("active")) start();
})();

// ===== Eingabe -> Popup =====-----------------------------------------------------------
const SECRET_A = "sercan";   // dein Name 1
const SECRET_B = "selinay";     // dein Name 2

const form = document.getElementById("heartForm");
const fieldA = document.getElementById("fieldA");
const fieldB = document.getElementById("fieldB");
const modal = document.getElementById("loveModal");
const closeBt = document.getElementById("closeModal");
const loader = document.getElementById("loader");

function openModal() { modal.classList.remove("hidden"); }
function closeModal() { modal.classList.add("hidden"); }
function showLoader() { loader.classList.remove("hidden"); }
function hideLoader() { loader.classList.add("hidden"); }

// ===== Allgemeines Popup für Essen & Date-Ideen =====
const popupModal = document.getElementById("popupModal");
const popupText = document.getElementById("popupText");
const popupClose = document.getElementById("popupClose");

function showPopup(msg) {
    if (!popupModal || !popupText) return;
    popupText.textContent = msg;
    popupModal.classList.remove("hidden");
}

function hidePopup() {
    if (!popupModal) return;
    popupModal.classList.add("hidden");
}

if (popupClose) popupClose.addEventListener("click", hidePopup);
popupModal?.addEventListener("click", (e) => {
    if (e.target === popupModal) hidePopup();
});
document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") hidePopup();
});


function matchesSecret() {
    const a = (fieldA.value || "").trim().toLowerCase();
    const b = (fieldB.value || "").trim().toLowerCase();
    return a === SECRET_A && b === SECRET_B;
}


if (form) {
    form.addEventListener("submit", e => {
        e.preventDefault();

        if (matchesSecret()) {
            startLoveSequence();
        } else {
            openPopup("Es geht hier nicht um andere");
        }
    });
}

function openPopup(message) {
    const modal = document.getElementById("popupModal");
    const text = document.getElementById("popupText");
    if (!modal || !text) return;

    text.textContent = message;
    modal.classList.remove("hidden");
}



function startLoveSequence() {
    showLoader();

    const bar = document.getElementById("progressBar");
    const txt = document.getElementById("progressText");
    let percent = 1;
    bar.style.width = "1%";
    txt.textContent = "1%";

    // Fortschrittsanimation – ca. 5 Sekunden bis 99 %
    const duration = 5000;      // ms
    const interval = 50;        // alle 50 ms aktualisieren
    const steps = duration / interval;
    const increment = 98 / steps; // von 1 % → 99 %

    const timer = setInterval(() => {
        percent += increment;
        if (percent >= 99) {
            percent = 99;
            clearInterval(timer);
            setTimeout(() => {
                hideLoader();
                openModal();
            }, 400); // kleine Verzögerung nach 99 %
        }
        bar.style.width = percent.toFixed(0) + "%";
        txt.textContent = Math.floor(percent) + "%";
    }, interval);
}


// Modal schließen
if (closeBt) closeBt.addEventListener("click", closeModal);
modal?.addEventListener("click", e => { if (e.target === modal) closeModal(); });
document.addEventListener("keydown", e => { if (e.key === "Escape") closeModal(); });

function createHeartParticles() {
    const container = document.getElementById('heartParticles');
    if (!container) return;

    container.innerHTML = ""; // falls Intro neu gezeigt wird

    const points = 140;      // Anzahl der Herzchen
    const scale = 32;         // Größe des Herzens

    for (let i = 0; i < points; i++) {
        const t = (Math.PI * 2 * i) / points;

        // klassische Herz-Gleichung
        const x = 16 * Math.pow(Math.sin(t), 3);
        const y =
            13 * Math.cos(t) -
            5 * Math.cos(2 * t) -
            2 * Math.cos(3 * t) -
            Math.cos(4 * t);

        const dot = document.createElement('div');
        dot.className = 'heart-dot';

        // Position ins CSS schieben (werden in der Animation benutzt)
        dot.style.setProperty('--tx', (x * scale).toString());
        dot.style.setProperty('--ty', (-y * scale).toString()); // minus, weil y oben/unten invertiert ist

        // random Delay, damit es lebendiger wirkt
        dot.style.animationDelay = (Math.random() * 2).toFixed(2) + 's';

        container.appendChild(dot);
    }
}
