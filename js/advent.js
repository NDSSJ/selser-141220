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

    // RESET BUTTON ##########################################
    const resetBtn = document.getElementById("adventResetBtn");

    if (resetBtn) {
        resetBtn.addEventListener("click", () => {

            // 1. Storage löschen
            localStorage.removeItem(STORAGE_KEY);

            // 2. Grid leeren
            const grid = document.getElementById("adventGrid");
            if (grid) grid.innerHTML = "";

            // 3. Seite neu aufbauen (Türchen wieder geschlossen)
            location.reload();  // einfachste & sauberste Variante
        });
    }

    // Reihenfolge der Türchen (damit sie nicht bei jedem Reload neu mischen)
    const ORDER_KEY = "selser_advent_2025_order";


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
    const FRONT_BASE = "assets/images/advent/front";
    const INSIDE_BASE = "assets/images/advent/inside";
    const EXT = ".png"; // Wenn du .png nutzt -> ".png"

    function getFrontImg(day) {
        return `${FRONT_BASE}${day}${EXT}`;
    }

    function getInsideImg(day) {
        return `${INSIDE_BASE}${day}${EXT}`;
    }

    // 24 Zahlen mischen (Zahlen sollen durcheinander sein)
    // 24 Zahlen – Reihenfolge entweder aus localStorage oder neu generieren
    let dayOrder = null;

    try {
        const rawOrder = localStorage.getItem(ORDER_KEY);
        if (rawOrder) {
            const parsed = JSON.parse(rawOrder);
            if (Array.isArray(parsed) && parsed.length === 24) {
                dayOrder = parsed;
            }
        }
    } catch (e) {
        console.warn("Konnte Advent-Order nicht lesen:", e);
    }

    if (!dayOrder) {
        // Zum ersten Mal: zufällig mischen (Fisher–Yates)
        dayOrder = Array.from({ length: 24 }, (_, i) => i + 1);
        for (let i = dayOrder.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [dayOrder[i], dayOrder[j]] = [dayOrder[j], dayOrder[i]];
        }

        try {
            localStorage.setItem(ORDER_KEY, JSON.stringify(dayOrder));
        } catch (e) {
            console.warn("Advent-Order konnte nicht gespeichert werden:", e);
        }
    }

    // Grid leeren (falls da noch was drinsteht)
    grid.innerHTML = "";

    // Türchen in dieser festen Reihenfolge bauen
    dayOrder.forEach((day) => {

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

    // ---------------------------------------------
    // Adventskalender Inhalte: Texte & GIFs pro Tag
    // ---------------------------------------------
    const ADVENT_CONTENT = {
        1: {
            text: "Der 01.12!!!! Heute startet das Weihnachtsabenteuer Selis❤️",
            gif: "assets/Images/gifs/gif1.gif"
        },
        2: {
            text: "Damit deine Hände immer warm bleiben🎄",
            gif: "assets/Images/gifs/gif2.gif"
        },
        3: {
            text: "Alles für die königlichen Fußaaaa💚",
            gif: "assets/Images/gifs/gif3.gif"
        },
        4: {
            text: "Immer schön die Haare zumachen 🪮",
            gif: "assets/Images/gifs/gif4.gif"
        },
        5: {
            text: "Türchen 5 schon? Deine Lippen sollten immer bereit sein 💋",
            gif: "assets/Images/gifs/gif5.gif"
        },
        6: {
            text: "Nikooolauuuus, lass es dir schmecken askimmm 🎅",
            gif: "assets/Images/gifs/gif6.gif"
        },
        7: {
            text: "Socken für die kältesten Füße auf der Welt 🧦",
            gif: "assets/images/gifs/gif7.gif"
        },
        8: {
            text: "Die Haut muss ja auch rein und geschmeidig bleiben, oder? 🧴",
            gif: "assets/images/gifs/gif8.gif"
        },
        9: {
            text: "Für Rudolph, damit du innerlich warm bleibst 🍵",
            gif: "assets/images/gifs/gif9.gif"
        },
        10: {
            text: "Für mein Pickelmonster, schön dein Gesicht pflegen 🎭",
            gif: "assets/images/gifs/gif10.gif"
        },
        11: {
            text: "Auch wenn da Wasser drauf steht, nicht trinken 🚱",
            gif: "assets/images/gifs/gif11.gif"
        },
        12: {
            text: "Badesalz für die Bademaus 🛀🏽",
            gif: "assets/images/gifs/gif12.gif"
        },
        13: {
            text: "Hmmm lecker, müsste für dich Rotnäschen heißen 👃🏽",
            gif: "assets/images/gifs/gif13.gif"
        },
        14: {
            text: "Heute ist nicht nur das 14. Türchen, sondern auch ein besonderer Tag... Was könnte hier drin sein ⁉️",
            gif: "assets/images/gifs/gif14.gif"
        },
        15: {
            text: "Hab gehört die sollen warm halten, sieht auch noch süß aus! Türchen 15 for u 🐰",
            gif: "assets/images/gifs/gif15.gif"
        },
        16: {
            text: "Was duftet hier so gut (Du bist diesmal nicht gemeint) 🕯️",
            gif: "assets/images/gifs/gif16.gif"
        },
        17: {
            text: "Du brauchst ja auch etwas wo du deinen Tee reintun kannst... oder warmen Kakao? ☕",
            gif: "assets/images/gifs/gif17.gif"
        },
        18: {
            text: "Für deine Sammlung ❄️",
            gif: "assets/images/gifs/gif18.gif"
        },
        19: {
            text: "Geschenk19",
            gif: "assets/images/gifs/gif19.gif"
        },
        20: {
            text: "Geschenk20",
            gif: "assets/images/gifs/gif20.gif"
        },
        21: {
            text: "Geschenk21",
            gif: "assets/images/gifs/gif21.gif"
        },
        22: {
            text: "Geschenk22",
            gif: "assets/images/gifs/gif22.gif"
        },
        23: {
            text: "Bald vielleicht Helix? 👂🏽",
            gif: "assets/images/gifs/gif23.gif"
        },
        24: {
            text: "Was ist es wohl? Frohe Weihnachtennnn 🎁",
            gif: "assets/images/gifs/gif24.gif"
        },
    };

    // ---------------------------------------------
    // Advent: Popup beim Öffnen
    // ---------------------------------------------
    const adventOpenOverlay = document.getElementById("adventOpenOverlay");
    const adventOpenText = document.getElementById("adventOpenText");
    const adventOpenGif = document.getElementById("adventOpenGif");
    const adventOpenClose = document.getElementById("adventOpenClose");

    function showAdventOpenModal(day) {
        if (!adventOpenOverlay) return; // Sicherheit

        const content = ADVENT_CONTENT[day] || {
            text: "Frohe Adventszeit 🎅✨",
            gif: "assets/images/gifs/default.gif"
        };

        // Nur setzen, wenn das Element existiert
        if (adventOpenText) {
            adventOpenText.textContent = content.text;
        }
        if (adventOpenGif) {
            adventOpenGif.src = content.gif;
        }

        // Overlay anzeigen
        adventOpenOverlay.classList.remove("hidden");
        adventOpenOverlay.classList.add("visible"); // falls dein CSS die Klasse nutzt
    }

    // Schließen per Button (nur wenn Element existiert)
    if (adventOpenClose && adventOpenOverlay) {
        adventOpenClose.addEventListener("click", () => {
            adventOpenOverlay.classList.add("hidden");
            adventOpenOverlay.classList.remove("visible");
        });
    }

    // Schließen beim Klick auf den Hintergrund
    if (adventOpenOverlay) {
        adventOpenOverlay.addEventListener("click", (e) => {
            if (e.target === adventOpenOverlay) {
                adventOpenOverlay.classList.add("hidden");
                adventOpenOverlay.classList.remove("visible");
            }
        });
    }






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

        if (button.classList.contains("open")) {
            showAdventOpenModal(day);
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
        showAdventOpenModal(day);
    }

});
