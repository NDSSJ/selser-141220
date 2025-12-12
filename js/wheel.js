document.addEventListener('DOMContentLoaded', () => {
    const wheelCanvas = document.getElementById('wheelCanvas');
    const spinBtn = document.querySelector('.spin-btn');
    const resultDisplay = document.querySelector('.result');

    // Popup-Elemente
    const resultPopup = document.getElementById('resultPopup');
    const popupResult = document.getElementById('popupResult');
    const closePopupBtn = document.querySelector('.close-btn');

    // Glücksrad Funktion
    const wheel = new Winwheel({
        'numSegments': 8,
        'outerRadius': 200,
        'segments': [
            { 'fillStyle': '#ff1e6a', 'text': 'Prize 1' },
            { 'fillStyle': '#ff4d8f', 'text': 'Prize 2' },
            { 'fillStyle': '#10a329', 'text': 'Prize 3' },
            // Weitere Segmente ...
        ],
        'animation': {
            'type': 'spinToStop',
            'duration': 5,
            'spins': 8
        },
        // Callback, wenn die Animation abgeschlossen ist
        'animationComplete': function () {
            showPopup(wheel.getIndicatedSegment().text); // Segmenttext abrufen
        }
    });

    // Spin Button
    document.querySelector('.spin-btn').addEventListener('click', () => {
        wheel.startAnimation();
    });

    // Funktion zum Anzeigen des Popups
    function showPopup(prizeText) {
        const popup = document.getElementById('resultPopup');
        const popupResult = document.getElementById('popupResult');
        popupResult.textContent = `You won: ${prizeText}`;  // Zeigt den gewonnenen Text an

        // Popup einblenden mit Animation (zum Beispiel sanftes Hineingleiten)
        popup.style.display = 'block';
        popup.classList.add('show-popup'); // Popup mit Animation sichtbar machen

        // Schließe das Popup nach 3 Sekunden
        setTimeout(() => {
            popup.style.display = 'none';
            popup.classList.remove('show-popup');
        }, 3000);
    }

});


// ========================================================= Glücksrad ==========================================================
const wheelCanvas = document.getElementById("wheelCanvas");
if (wheelCanvas) {
    const ctx = wheelCanvas.getContext("2d");
    const spinBtn = document.getElementById("spinBtn");
    const result = document.getElementById("wheelResult");

    // 12 Felder – kannst du beliebig umbenennen
    let sectors = [
        "Sercan kriegt Kuss 😘",
        "Umarmunggggg 🤗",
        "Massage for you 💆",
        "Filmabend 🎬",
        "Selis kriegt Kuss 😘",
        "Kriegst ein Matcha 🥤",
        "Du wirst gekitzelt 😂",
        "Date dieses Wochenende 👩‍❤️‍👨",
        "EIN CEYREK 🥇",
        "Du schuldest mir was 😉",
        "Ich singe für dich 🎤",
        "Dummes Foto für Sticker 🤳",
        "Kraul Gutschein🎟️",
        "Pech, heute nichts 🐦‍⬛"
    ];

    const numSectors = sectors.length;
    const arc = (2 * Math.PI) / numSectors;
    let currentAngle = 0;
    let spinning = false;

    function drawWheel() {
        const w = wheelCanvas.width;
        const h = wheelCanvas.height;
        const cx = w / 2 - 40;
        const cy = h / 2;
        const r = Math.min(cx, cy) - 20;

        ctx.clearRect(0, 0, w, h);

        for (let i = 0; i < numSectors; i++) {
            const angle = currentAngle + i * arc;
            ctx.beginPath();
            ctx.fillStyle = i % 2 === 0 ? "#ff1e6a" : "#ff4d8f";
            ctx.moveTo(cx, cy);
            ctx.arc(cx, cy, r, angle, angle + arc);
            ctx.fill();

            ctx.save();
            ctx.translate(cx, cy);
            ctx.rotate(angle + arc / 2);
            ctx.textAlign = "right";
            ctx.fillStyle = "#fff";
            ctx.font = "18px sans-serif";
            ctx.fillText(sectors[i], r - 20, 6);
            ctx.restore();
        }

        // Mittelpunkt
        ctx.beginPath();
        ctx.arc(cx, cy, 8, 0, 2 * Math.PI);
        ctx.fillStyle = "#fff";
        ctx.fill();

        // Pfeil
        const arrowDist = r + 45;
        const arrowWidth = 28;
        const arrowHeight = 40;

        ctx.beginPath();
        ctx.moveTo(cx + arrowDist - arrowHeight, cy);
        ctx.lineTo(cx + arrowDist, cy - arrowWidth / 2);
        ctx.lineTo(cx + arrowDist, cy + arrowWidth / 2);
        ctx.closePath();
        ctx.fillStyle = "#10a329";
        ctx.shadowColor = "#10a329";
        ctx.shadowBlur = 12;
        ctx.fill();
        ctx.shadowBlur = 0;
    }

    drawWheel();

    // Wenn heute schon gedreht wurde, Hinweis anzeigen
    if (alreadySpunToday()) {
        result.textContent = "Heute schon gedreht 🥹 – morgen wieder!";
    }

    // ---- Daily-Spin-Helper ----
    function alreadySpunToday() {
        const last = localStorage.getItem("wheelLastSpin");
        if (!last) return false;

        const today = new Date().toISOString().slice(0, 10);
        return last === today;
    }

    function markSpunToday() {
        const today = new Date().toISOString().slice(0, 10);
        localStorage.setItem("wheelLastSpin", today);
    }



    function spinWheel() {
        // 1) prüfen ob heute schon gedreht
        if (alreadySpunToday()) {
            result.textContent = "Heute schon gedreht 🥹 – morgen wieder!";
            return;
        }

        if (spinning) return;
        spinning = true;
        result.textContent = "Dreht...";

        // Zufällige Endrotation
        const extraSpins = 3 + Math.random() * 3; // 3–6 Runden
        const targetAngle = currentAngle + extraSpins * 2 * Math.PI + Math.random() * 2 * Math.PI;

        const duration = 4000; // 4 Sekunden
        const start = performance.now();

        function animate(time) {
            const elapsed = time - start;
            const progress = Math.min(elapsed / duration, 1);
            const ease = 1 - Math.pow(1 - progress, 3); // smooth
            currentAngle = targetAngle * ease;
            drawWheel();

            if (progress < 1) {
                requestAnimationFrame(animate);
            } else {
                spinning = false;
                // Ergebnis berechnen
                const deg = ((currentAngle % (2 * Math.PI)) + 2 * Math.PI) % (2 * Math.PI);
                const index = Math.floor(numSectors - (deg / arc)) % numSectors;
                const prizeText = sectors[index];

                // Text unter dem Rad
                result.textContent = "→ " + prizeText;

                // POPUP öffnen
                const resultPopup = document.getElementById("resultPopup");
                const popupResult = document.getElementById("popupResult");
                popupResult.textContent = prizeText;
                resultPopup.classList.remove("hidden");

                // Speichern, dass heute gedreht wurde
                markSpunToday();

            }
        }

        requestAnimationFrame(animate);
    }


    if (spinBtn) {
        spinBtn.addEventListener("click", spinWheel);
    }
}

// Popup schließen
document.getElementById("closePopupBtn").addEventListener("click", () => {
    document.getElementById("resultPopup").classList.add("hidden");
});
