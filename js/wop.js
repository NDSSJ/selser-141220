const wopData = {
    classic: {
        truth: [
            "Was war dein peinlichster Moment?",
            "Hast du jemals etwas gestohlen?",
            "Wen würdest du gern einmal küssen?",
            "Was war dein schlimmster Albtraum?",
            "Welche Eigenschaft nervt dich an dir selbst?"
        ],
        dare: [
            "Singe laut ein Lied deiner Wahl.",
            "Mach 10 Liegestütze.",
            "Schicke einer Person ein Kompliment per Nachricht.",
            "Imitiere eine berühmte Person für 20 Sekunden.",
            "Mach ein lustiges Selfie und zeig es!"
        ]
    },
    couple: {
        truth: [
            "Wann hast du dich das erste Mal zu mir hingezogen gefühlt?",
            "Was war dein erster Gedanke heute Morgen?",
            "Was liebst du am meisten an mir?",
            "Wofür bist du mir besonders dankbar?",
            "Welche meiner Eigenschaften macht dich verrückt?"
        ],
        dare: [
            "Gib mir einen Kuss, wo ich es nicht erwarte 😘",
            "Umarme mich für 30 Sekunden ohne zu reden.",
            "Sag mir 3 Dinge, die du an mir liebst.",
            "Mach mir ein ernst gemeintes Kompliment.",
            "Flüster mir etwas Romantisches ins Ohr."
        ]
    },
    spicy: {
        truth: [
            "Was war dein wildester Gedanke in der letzten Zeit? 😏",
            "Was turnt dich am meisten an?",
            "Was würdest du tun, wenn wir jetzt komplett allein wären?",
            "Was war dein peinlichster Moment beim Küssen?",
            "Welche Fantasie würdest du gern ausleben?",
            "Was an mir findest du unwiderstehlich?",
            "Womit könnte ich dich sofort um den Finger wickeln?",
            "Hast du jemals von uns in einer heißen Situation geträumt? Erzähle davon!",
            "Was ist das Verrückteste, was du je im Schlafzimmer gemacht hast?",
            "Gibt es etwas, das du schon immer mal mit mir ausprobieren wolltest?",


        ],
        dare: [
            "Flüster mir dein Lieblingswort auf eine sexy Art ins Ohr 😈",
            "Sag mir 3 Dinge, die du an meinem Körper magst.",
            "Mach 10 Sekunden lang einen sexy Blickkontakt ohne zu lachen.",
            "Sag mir etwas, das du dir mit mir vorstellen könntest 😘",
            "Berühre meine Hand auf die verführerischste Weise, die dir einfällt.",
            "Gib mir einen Kuss, der mich umhaut 😍",
            "Beschreibe mir in 3 Worten, wie du mich findest.",
            "Mach mir ein Kompliment, das mich erröten lässt.",
            "Zeig mir deinen verführerischsten Tanz für 15 Sekunden.",
            "Sag mir, was du als Nächstes mit mir machen möchtest 😉",

        ]
    }
};

function setupWahrheitOderPflicht() {
    const categorySelect = document.getElementById("wopCategory");
    const truthBtn = document.getElementById("truthBtn");
    const dareBtn = document.getElementById("dareBtn");
    const questionEl = document.getElementById("wopQuestion");

    function randomItem(arr) {
        return arr[Math.floor(Math.random() * arr.length)];
    }

    function showQuestion(type) {
        const cat = categorySelect.value;
        const list = wopData[cat][type];
        const q = randomItem(list);
        questionEl.textContent = q;
        questionEl.classList.remove("animate");
        void questionEl.offsetWidth; // animation reset
        questionEl.classList.add("animate");
    }

    truthBtn.onclick = () => showQuestion("truth");
    dareBtn.onclick = () => showQuestion("dare");
}



document.addEventListener("DOMContentLoaded", setupWahrheitOderPflicht);
