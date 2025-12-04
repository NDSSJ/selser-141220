// js/advent.js

document.addEventListener("DOMContentLoaded", () => {

    // Advent Popup DOM-Elemente
    const adventLockedOverlay = document.getElementById("adventLockedOverlay");
    const adventLockedText = document.getElementById("adventLockedText");
    const adventLockedClose = document.getElementById("adventLockedClose");

    function showAdventLockedModal(dateString) {
        if (adventLockedText) {
            adventLockedText.textContent = `Du hast wohl auf's falsche geklickt selis! Warte noch bisschen`;
        }
        if (adventLockedOverlay) {
            adventLockedOverlay.classList.remove("hidden");
        }
    }

    // schließen per Button
    if (adventLockedClose) {
        adventLockedClose.addEventListener("click", () => {
            adventLockedOverlay?.classList.add("hidden");
        });
    }

    // schließen beim Klick auf den dunklen Hintergrund
    if (adventLockedOverlay) {
        adventLockedOverlay.addEventListener("click", (e) => {
            if (e.target === adventLockedOverlay) {
                adventLockedOverlay.classList.add("hidden");
            }
        });
    }

    const grid = document.getElementById("adventGrid");
    if (!grid) return;

    // Jahr für das „echte“ Öffnen
    const CALENDAR_YEAR = 2025;

    // localStorage-Key, damit geöffnete Türchen gespeichert werden
    const STORAGE_KEY = "selser_advent_2025_opened";

    // schon geöffnete Tage laden
    let openedDays = [];
    try {
        const raw = localStorage.getItem(STORAGE_KEY);
        if (raw) {
            openedDays = JSON.parse(raw);
        }
    } catch (e) {
        console.warn("Konnte Advent-Storage nicht lesen:", e);
    }

    // helper: aktuell „offiziell“ erlaubter Tag
    function getMaxOpenDay() {
        const today = new Date();

        // Nur im Dezember 2025 wird wirklich limitiert
        if (today.getFullYear() === CALENDAR_YEAR && today.getMonth() === 11) {
            // 0 = vor dem 1.12 -> nix, sonst Tag des Monats
            return Math.min(24, today.getDate());
        }

        // In allen anderen Monaten / Jahren: alles freigeben (praktisch zum Testen)
        return 24;
    }

    const maxOpenDay = getMaxOpenDay();

    // Bilderpfade nach konvention: front1.jpg / inside1.jpg usw.
    const FRONT_BASE = "assets/Images/advent/front";
    const INSIDE_BASE = "assets/Images/advent/inside";
    const EXT = ".png"; // Wenn du .png nutzt -> ".png"

    function getFrontImg(day) {
        return `${FRONT_BASE}${day}${EXT}`;
    }

    function getInsideImg(day) {
        return `${INSIDE_BASE}${day}${EXT}`;
    }

    // 24 Zahlen mischen (Zahlen sollen durcheinander sein)
    const days = Array.from({ length: 24 }, (_, i) => i + 1);
    days.sort(() => Math.random() - 0.5);

    // Grid leeren (falls da noch was drinsteht)
    grid.innerHTML = "";

    days.forEach((day) => {
        const btn = document.createElement("button");
        btn.className = "advent-door";
        btn.dataset.day = String(day);

        const isAlreadyOpened = openedDays.includes(day);

        btn.innerHTML = `
            <div class="advent-door-inner">
                <div class="advent-face advent-front">
                    <img src="${getFrontImg(day)}" alt="Türchen ${day}">
                    <span class="advent-day-label">${day}</span>
                </div>
                <div class="advent-face advent-inside">
                    <img src="${getInsideImg(day)}" alt="Überraschung ${day}">
                </div>
            </div>
        `;

        if (isAlreadyOpened) {
            btn.classList.add("open");
        }

        btn.addEventListener("click", () => {
            handleDoorClick(btn, day);
        });

        grid.appendChild(btn);
    });

    function handleDoorClick(button, day) {
        // Welcher Tag ist maximal erlaubt?
        const currentMax = getMaxOpenDay();

        // Wenn das Türchen in der Zukunft liegt → Popup zeigen
        if (day > currentMax) {
            // Schön formatiertes Datum bauen, z.B. "15.12.2025"
            const displayDate = `${String(day).padStart(2, "0")}.12.${CALENDAR_YEAR}`;
            showAdventLockedModal(displayDate);
            return;
        }

        // Bereits geöffnet? Dann nichts mehr tun
        if (button.classList.contains("open")) {
            return;
        }

        // Türchen öffnen (Flip-Animation)
        button.classList.add("open");

        // Im localStorage merken, dass dieses Türchen geöffnet wurde
        if (!openedDays.includes(day)) {
            openedDays.push(day);
            try {
                localStorage.setItem(STORAGE_KEY, JSON.stringify(openedDays));
            } catch (e) {
                console.warn("Advent-Storage konnte nicht gespeichert werden:", e);
            }
        }
    }

});
