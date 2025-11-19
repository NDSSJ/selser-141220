// ===================== "Wer hat das gesagt?" =====================
(() => {
    const textEl = document.getElementById("quizText");
    const resultEl = document.getElementById("quizResult");
    const yearInput = document.getElementById("guessYear");
    const checkBtn = document.getElementById("checkQuote");
    const nextBtn = document.getElementById("nextQuote");

    if (!textEl) return;

    // HIER deine Karten – jetzt MIT note 👇
    const quotes = [
        {
            text: "Rate mal wer etwas zu spät kommt", author: "selinay", year: "2019",
            note: "Das hast zwar du geschrieben, aber meine Antwort war: Du kannst direkt auch raten haha"
        },
        {
            text: "Die Aufgaben die ich kann wirst du schon abschreiben können", author: "selinay", year: "2019",
            note: "Ich hatte Angst in Chemie nicht abschreiben zu können"
        },
        {
            text: "Guten Morgen willst du vorbei kommen?", author: "selinay", year: "2019",
            note: "Ich wünschte es wäre in einem anderen Kontext, aber du hast mich nur zum lernen gerufen"
        },
        {
            text: "Hast du irgendwas wichtiges aufgeschrieben", author: "sercan", year: "2019",
            note: "Hab dich wieder mal nach Schulstoff gefragt weil ich nicht da war"
        },
        {
            text: "Schön positiv denken", author: "selinay", year: "2020",
            note: "Eine Selinay die versucht mich aufzumuntern nach einer schlechten Chemie Klausur"
        },
        {
            text: "Ich bewerbe mich auch für Jura undso einfach hahaha", author: "sercan", year: "2020",
            note: "Bewerbungen für Uni Studiengang (Hab mich niemals für Jura beworben leider)"
        },
        {
            text: "Egal ich schenke dir einfach wieder ein Ring aus einem Radiergummi und einer Büroklammer", author: "sercan", year: "2020",
            note: "Du hast mir zu spät gesagt dass es sich bei dem Treffen in deinem Garten um deinen Geburtstag handelt. Meine Spontane Idee war dann das"
        },
        {
            text: "Das ist echt Dorf türkisch was die sprechen", author: "selinay", year: "2019",
            note: "DAS HAST DU ZU DEINER EIGENEN MAMA GESAGT!!!! DU HAST ANGEFANGEN"
        },
        {
            text: "Jetzt haben wir genuuuuug Bilder", author: "selinay", year: "2020",
            note: "JAAA DU HAST ES SELBER GESAGT! Das war nachdem wir zusammen Bilder in deinem Garten gemacht haben"
        },
        {
            text: "2 Tonnen Makeup klärt schon", author: "selinay", year: "2020",
            note: "Wir hatten damals den Plan dich mit Cagatay Ulusoy zu verkuppeln. Jetzt ist dein Freund sogar noch geiler"
        },
        {
            text: "Ok reicht von mir aus genug genervt du tust mir auch leid grad", author: "selinay", year: "2020",
            note: "Da waren wir noch nicht zusammen, jetzt hör ich sowas niemals HAHAHAHHA"
        },
        {
            text: "Wenn du morgen nicht kommst, bin ich auch nicht dabei", author: "sercan", year: "2020",
            note: "Anca Beraber kanca beraber. Ich bin nirgendwo wo meine süße Maus nicht auch ist!"
        },
        {
            text: "Ich hasse niemanden, hass ist ein starker Begriff", author: "sercan", year: "2020",
            note: "Will den Kontext nicht geben, aber ich bin NICHT Goethe. Ich hasse z.B. Ju..."
        },
        {
            text: "Merk dir eins, wenn ich dich jemals anlügen sollte, allah belami versin", author: "sercan", year: "2020",
            note: "Du hast gefragt ob Berkant Gefühle für Kaley hat und ich meinte nein HAHAHAHHA, daraufhin hast du mir erstmal nicht geglaubt"
        },
        {
            text: "Ich weiß wann du Geburtstag hast, soll ich aus Favoriten raus tun als Beweis?", author: "sercan", year: "2020",
            note: "Ich hab safe nur gehofft dass du nein sagst, konnte mir niemals deinen Geburtstag merken HAHAHAHA"
        },
        {
            text: "Wichtige Sachen haben einen extra Platz in meinem Hirn", author: "sercan", year: "2020",
            note: "Habe mich an deinen Geburtstag erinnert + daran, dass ich dir den Radiergummi Ring schenken wollte (Hab es aber am Ende nicht getan HAHAHAH)"
        },
        {
            text: "Du hast mich echt zum Lachen gebracht", author: "sercan", year: "2020",
            note: "Kann sein erstes Mal dass ich wegen dir gelacht habe HAHAHAHHA, wir waren Supernatural am gucken und du hast nen Witz gebracht"
        },
        {
            text: "Ich will dich noch behalten", author: "selinay", year: "2020",
            note: "Du hast mich behalten... Du hast was süßes gesagt, ich meinte mein Herz schmilzt. Daraufhin hast du gesagt dass du mich noch behalten willst"
        },
        {
            text: "NEINNNN Was mache ich ohne dich", author: "selinay", year: "2020",
            note: "Du warst schon flirty. Das war so mitte Oktober, da stand jemand schon bisschen auf mich, du hast das öfter gesagt zu der Zeit"
        },
        {
            text: "Ey ohne witz mach nicht so... ich will dich nicht verlieren...", author: "sercan", year: "2020",
            note: "Hatten gestritten wegen etwas kleinem, wir waren zu süß damals"
        },
        {
            text: "Ich kann es nicht glauben dass ich es dir gerade geschickt habe", author: "selinay", year: "2020",
            note: "Du hast mir Editierte Fotos geschickt wie du mit kurzen Haaren aussehen würdest, du meintest das ist komisch das einem Jungen zu schicken. Ich war so verliebt, die Fotos waren wow"
        },
        {
            text: "Wir werden alt", author: "sercan", year: "2021",
            note: "schon vor 4 Jahren gesagt weil wir morgens noch müde waren nach dem aufstehen HAHAHAHHA guck uns heute mal an 24/7 müde"
        },
        {
            text: "Ich will Lasagne", author: "selinay", year: "2021",
            note: "Was für Kontext, du hast das einfach so um 0Uhr rausgehauen HAHAHAHAHHA"
        },
        {
            text: "Sana ceza vermek istiyorum", author: "selinay", year: "2022",
            note: "Mommy? HAHAHAHHA Ich war lange draußen und hab nicht geantwortet dann warst du unnormal sauer, hat was wenn ich das gerade so wieder lese oh"
        },
        {
            text: "Dann gucken wir Saw 1", author: "selinay", year: "2022",
            note: " JA DAS HAST DU GESAGT!!!! Mit 20 warst du weniger schisser als jetzt!"
        },
        {
            text: "Ich würde kein Tattoo machen wenn wir nur ein Paar sind", author: "sercan", year: "2021",
            note: "Ja guuuut, die Meinung hat sich geändert HAHAHAH"
        },
        { text: "Komm Discord", author: "sercan", year: "2019", note: "Ganz frühe Gaming-Zeit 😎" },
        { text: "Komm Discord", author: "sercan", year: "2019", note: "Ganz frühe Gaming-Zeit 😎" },
    ];

    let order = quotes.map((_, i) => i).sort(() => Math.random() - 0.5);
    let pos = 0;

    function loadCurrent() {
        const card = quotes[order[pos]];
        textEl.textContent = card.text;
        resultEl.innerHTML = ""; // wichtig: leeren
        yearInput.value = "";
        document
            .querySelectorAll("input[name='guessPerson']")
            .forEach(r => (r.checked = false));
    }

    loadCurrent();

    checkBtn.addEventListener("click", () => {
        const card = quotes[order[pos]];
        const chosenRadio = document.querySelector("input[name='guessPerson']:checked");
        const guessedYear = (yearInput.value || "").trim();

        if (!chosenRadio || !guessedYear) {
            resultEl.textContent = "Erst Person UND Jahr wählen 🥺";
            resultEl.style.color = "#ffb4c7";
            return;
        }

        const okPerson = chosenRadio.value === card.author;
        const okYear = guessedYear === card.year;

        let message = "";
        if (okPerson && okYear) {
            message = "Richtiiiig 🥳";
            resultEl.style.color = "#10a329";
        } else if (okPerson && !okYear) {
            message = `Person stimmt ✅, Jahr war ${card.year}.`;
            resultEl.style.color = "#fbbf24";
        } else if (!okPerson && okYear) {
            message = `Jahr stimmt ✅, aber das war ${card.author === "selinay" ? "Selinay" : "Sercan"}.`;
            resultEl.style.color = "#fbbf24";
        } else {
            message = `Beides falsch 😅 → richtig: ${card.author === "selinay" ? "Selinay" : "Sercan"} (${card.year})`;
            resultEl.style.color = "#ffb4c7";
        }

        // hier packen wir den Kontext drunter
        resultEl.innerHTML = `
      <div>${message}</div>
      <div style="margin-top:.4rem; color:#ddd; font-size:.85rem;">
        Kontext: ${card.note}
      </div>
    `;
    });

    nextBtn.addEventListener("click", () => {
        pos++;
        if (pos >= order.length) {
            order = quotes.map((_, i) => i).sort(() => Math.random() - 0.5);
            pos = 0;
        }
        loadCurrent();
    });
})();