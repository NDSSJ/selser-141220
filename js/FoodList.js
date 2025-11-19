async function loadEssenZettel(category = "hauptspeise") {
    if (!supabaseClient || !window.currentUser) return;

    const { data, error } = await supabaseClient
        .from("essen_zettel")
        .select("id, text, category")
        .eq("owner", window.currentUser.id)
        .eq("category", category)
        .order("created_at", { ascending: false });

    const listEl = document.getElementById("essenList");
    if (!listEl) return;

    listEl.innerHTML = "";

    if (error) {
        listEl.innerHTML = "<li>Fehler beim Laden.</li>";
        console.error(error);
        return;
    }

    if (!data || data.length === 0) {
        listEl.innerHTML = "<li>Keine Zettel in dieser Kategorie 💭</li>";
        return;
    }

    data.forEach(row => {
        const li = document.createElement("li");
        li.style.background = "rgba(0,0,0,.25)";
        li.style.padding = ".3rem .5rem";
        li.style.borderRadius = "8px";
        li.style.display = "flex";
        li.style.justifyContent = "space-between";
        li.style.alignItems = "center";
        li.style.gap = ".5rem";

        const textSpan = document.createElement("span");
        textSpan.textContent = row.text;

        const delBtn = document.createElement("button");
        delBtn.textContent = "✖";
        delBtn.style.background = "transparent";
        delBtn.style.border = "none";
        delBtn.style.color = "#fca5a5";
        delBtn.style.cursor = "pointer";
        delBtn.style.fontSize = "1rem";
        delBtn.addEventListener("click", () => deleteEssenZettel(row.id, category));

        li.appendChild(textSpan);
        li.appendChild(delBtn);
        listEl.appendChild(li);
    });
}

async function addEssenZettel(text) {
    const msgEl = document.getElementById("essenAddMsg");
    const catEl = document.getElementById("essenCategory");
    const category = catEl ? catEl.value : "hauptspeise";

    if (!supabaseClient || !window.currentUser) {
        if (msgEl) msgEl.textContent = "Nicht eingeloggt.";
        return;
    }
    if (!text) {
        if (msgEl) msgEl.textContent = "Bitte etwas eingeben.";
        return;
    }

    const { error } = await supabaseClient
        .from("essen_zettel")
        .insert([{
            text,
            owner: window.currentUser.id,
            category
        }]);

    if (error) {
        console.error(error);
        if (msgEl) msgEl.textContent = "Fehler beim Speichern.";
        return;
    }

    if (msgEl) msgEl.textContent = "Gespeichert ✅";
    document.getElementById("essenInput").value = "";
    loadEssenZettel(category);
}

async function drawEssenZettel() {
    const outEl = document.getElementById("essenDrawMsg");
    const catEl = document.getElementById("essenDrawCategory");
    const category = catEl ? catEl.value : "hauptspeise";

    if (!supabaseClient || !window.currentUser) {
        if (outEl) outEl.textContent = "Nicht eingeloggt.";
        return;
    }

    const { data, error } = await supabaseClient
        .from("essen_zettel")
        .select("id, text")
        .eq("owner", window.currentUser.id)
        .eq("category", category);

    if (error) {
        console.error(error);
        if (outEl) outEl.textContent = "Fehler beim Ziehen.";
        return;
    }

    if (!data || data.length === 0) {
        if (outEl) outEl.textContent = "In dieser Kategorie ist noch nichts 👀";
        return;
    }

    const random = data[Math.floor(Math.random() * data.length)];
    outEl.textContent = "→ " + random.text;
    showPopup("Heute essen wir: " + random.text);

}

async function deleteEssenZettel(id, category = "hauptspeise") {
    if (!supabaseClient || !window.currentUser) return;

    const { error } = await supabaseClient
        .from("essen_zettel")
        .delete()
        .eq("id", id)
        .eq("owner", window.currentUser.id);

    if (error) {
        console.error(error);
        return;
    }

    loadEssenZettel(category);
}

document.addEventListener("DOMContentLoaded", () => {
    const addBtn = document.getElementById("essenAddBtn");
    const drawBtn = document.getElementById("essenDrawBtn");
    const drawCat = document.getElementById("essenDrawCategory");

    if (addBtn) {
        addBtn.addEventListener("click", () => {
            const val = document.getElementById("essenInput").value.trim();
            addEssenZettel(val);
        });
    }

    // Enter-Taste im Essen-Eingabefeld => Speichern
    const essenInput = document.getElementById("essenInput");
    if (essenInput && addBtn) {
        essenInput.addEventListener("keydown", (e) => {
            if (e.key === "Enter") {
                e.preventDefault();
                addBtn.click();
            }
        });
    }


    if (drawBtn) {
        drawBtn.addEventListener("click", () => {
            drawEssenZettel();
        });
    }

    // wenn die Kategorie rechts gewechselt wird => Liste neu laden
    if (drawCat) {
        drawCat.addEventListener("change", () => {
            loadEssenZettel(drawCat.value);
        });
    }

    // initial laden (nachdem protectPageIfNeeded gelaufen ist)
    if (document.getElementById("panel-essen")) {
        setTimeout(() => {
            const startCat = drawCat ? drawCat.value : "hauptspeise";
            loadEssenZettel(startCat);
        }, 500);
    }
});

document.addEventListener("DOMContentLoaded", () => {
    loadDailyMessages();
});
