(() => {
    const cards = document.querySelectorAll(".countdown-card-love");
    if (!cards.length) return;

    // Hier trägst du eure Daten ein
    // Monat ist 0-basiert (0=Jan, 1=Feb, 11=Dez)
    const eventDates = {
        valentine: { month: 1, day: 14 },        // 14. Februar
        anniversary: { month: 11, day: 14 },     // 14. Dezember (14122020 😏)
        "her-bday": { month: 6, day: 13 },       // TODO: anpassen!
        "his-bday": { month: 3, day: 8 }         // TODO: anpassen!
    };

    function nextDate(month, day) {
        const now = new Date();
        const year = now.getFullYear();
        let target = new Date(year, month, day, 0, 0, 0);

        // wenn dieses Jahr schon vorbei → nächstes Jahr
        if (target.getTime() < now.getTime()) {
            target = new Date(year + 1, month, day, 0, 0, 0);
        }
        return target;
    }

    function updateCountdowns() {
        const now = new Date().getTime();

        cards.forEach(card => {
            const key = card.getAttribute("data-event");
            const cfg = eventDates[key];
            if (!cfg) return;

            const target = nextDate(cfg.month, cfg.day).getTime();
            const diff = target - now;

            const days = Math.floor(diff / (1000 * 60 * 60 * 24));
            const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
            const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
            const seconds = Math.floor((diff % (1000 * 60)) / 1000);

            card.querySelector(".days").textContent = String(days).padStart(2, "0");
            card.querySelector(".hours").textContent = String(hours).padStart(2, "0");
            card.querySelector(".minutes").textContent = String(minutes).padStart(2, "0");
            card.querySelector(".seconds").textContent = String(seconds).padStart(2, "0");

            // wenn genau heute:
            if (days === 0 && hours === 0 && minutes === 0 && seconds >= 0) {
                const note = card.querySelector(".love-note");
                if (note) note.textContent = "Heute ist es soweit!!! 💓";
            }
        });
    }

    updateCountdowns();
    setInterval(updateCountdowns, 1000);
})();