async function loadDateIdeen() {
    if (!supabaseClient || !window.currentUser) return;

    const listEl = document.getElementById("dateList");
    if (!listEl) return;

    const { data, error } = await supabaseClient
        .from("date_ideen")
        .select("id, text")
        .eq("owner", window.currentUser.id)
        .order("created_at", { ascending: false });

    listEl.innerHTML = "";

    if (error) {
        console.error(error);
        listEl.innerHTML = "<li>Fehler beim Laden.</li>";
        return;
    }

    if (!data || data.length === 0) {
        listEl.innerHTML = "<li>Noch keine Date-Ideen 💭</li>";
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
        delBtn.addEventListener("click", () => deleteDateIdee(row.id));

        li.appendChild(textSpan);
        li.appendChild(delBtn);
        listEl.appendChild(li);
    });
}

async function addDateIdee(text) {
    const msgEl = document.getElementById("dateAddMsg");

    if (!supabaseClient || !window.currentUser) {
        if (msgEl) msgEl.textContent = "Nicht eingeloggt.";
        return;
    }
    if (!text) {
        if (msgEl) msgEl.textContent = "Bitte etwas eingeben.";
        return;
    }

    const { error } = await supabaseClient
        .from("date_ideen")
        .insert([{
            text,
            owner: window.currentUser.id
        }]);

    if (error) {
        console.error(error);
        if (msgEl) msgEl.textContent = "Fehler beim Speichern.";
        return;
    }

    if (msgEl) msgEl.textContent = "Gespeichert ✅";
    const input = document.getElementById("dateInput");
    if (input) input.value = "";
    loadDateIdeen();
}

async function drawDateIdee() {
    const outEl = document.getElementById("dateDrawMsg");
    if (!supabaseClient || !window.currentUser) {
        if (outEl) outEl.textContent = "Nicht eingeloggt.";
        return;
    }

    const { data, error } = await supabaseClient
        .from("date_ideen")
        .select("id, text")
        .eq("owner", window.currentUser.id);

    if (error) {
        console.error(error);
        if (outEl) outEl.textContent = "Fehler beim Ziehen.";
        return;
    }

    if (!data || data.length === 0) {
        if (outEl) outEl.textContent = "Noch nichts gespeichert 👀";
        return;
    }

    const random = data[Math.floor(Math.random() * data.length)];
    outEl.textContent = "→ " + random.text;
    showPopup("Eure Date-Idee: " + random.text);

}

async function deleteDateIdee(id) {
    if (!supabaseClient || !window.currentUser) return;

    const { error } = await supabaseClient
        .from("date_ideen")
        .delete()
        .eq("id", id)
        .eq("owner", window.currentUser.id);

    if (error) {
        console.error(error);
        return;
    }

    loadDateIdeen();
}

// Events verdrahten
document.addEventListener("DOMContentLoaded", () => {
    const addBtn = document.getElementById("dateAddBtn");
    const drawBtn = document.getElementById("dateDrawBtn");

    if (addBtn) {
        addBtn.addEventListener("click", () => {
            const val = document.getElementById("dateInput").value.trim();
            addDateIdee(val);
        });
    }

    // Enter-Taste im Date-Ideen-Eingabefeld => Speichern
    const dateInput = document.getElementById("dateInput");
    if (dateInput && addBtn) {
        dateInput.addEventListener("keydown", (e) => {
            if (e.key === "Enter") {
                e.preventDefault();
                addBtn.click();
            }
        });
    }


    if (drawBtn) {
        drawBtn.addEventListener("click", () => {
            drawDateIdee();
        });
    }

    // beim Laden schon mal ziehen
    if (document.getElementById("panel-date-ideen")) {
        setTimeout(() => {
            loadDateIdeen();
        }, 500);
    }
});

// ====================== GESCHENKWÜNSCHE ======================
async function loadGiftWishes() {
    if (!supabaseClient || !window.currentUser) return;

    const listEl = document.getElementById("giftList");
    if (!listEl) return;

    const { data, error } = await supabaseClient
        .from("gift_wishes")
        .select("id, title, link, image_url")
        .eq("owner", window.currentUser.id)
        .order("created_at", { ascending: false });

    listEl.innerHTML = "";

    if (error) {
        console.error(error);
        listEl.innerHTML = "<li>Fehler beim Laden.</li>";
        return;
    }

    if (!data || data.length === 0) {
        listEl.innerHTML = "<li>Noch keine Wünsche 🥺</li>";
        return;
    }

    data.forEach(row => {
        const li = document.createElement("li");
        li.style.background = "rgba(0,0,0,.25)";
        li.style.padding = ".5rem .6rem";
        li.style.borderRadius = "10px";
        li.style.display = "flex";
        li.style.gap = ".6rem";
        li.style.alignItems = "center";
        li.style.justifyContent = "space-between";

        const left = document.createElement("div");
        left.style.display = "flex";
        left.style.gap = ".6rem";
        left.style.alignItems = "center";

        if (row.image_url) {
            const img = document.createElement("img");
            img.src = row.image_url;
            img.alt = row.title || "Geschenk";
            img.style.width = "52px";
            img.style.height = "52px";
            img.style.objectFit = "cover";
            img.style.borderRadius = "10px";
            left.appendChild(img);
        }

        const textWrap = document.createElement("div");

        const titleEl = document.createElement("div");
        titleEl.textContent = row.title || "(ohne Name)";
        titleEl.style.fontWeight = "600";
        textWrap.appendChild(titleEl);

        if (row.link) {
            const linkEl = document.createElement("a");
            linkEl.href = row.link;
            linkEl.target = "_blank";
            linkEl.rel = "noopener";
            linkEl.textContent = "Link öffnen";
            linkEl.style.fontSize = ".8rem";
            linkEl.style.color = "#93c5fd";
            textWrap.appendChild(linkEl);
        }

        left.appendChild(textWrap);

        const delBtn = document.createElement("button");
        delBtn.textContent = "✖";
        delBtn.style.background = "transparent";
        delBtn.style.border = "none";
        delBtn.style.color = "#fca5a5";
        delBtn.style.cursor = "pointer";
        delBtn.style.fontSize = "1rem";
        delBtn.addEventListener("click", () => deleteGiftWish(row.id));

        li.appendChild(left);
        li.appendChild(delBtn);
        listEl.appendChild(li);
    });
}

async function addGiftWish() {
    const msgEl = document.getElementById("giftAddMsg");
    const titleEl = document.getElementById("giftTitle");
    const linkEl = document.getElementById("giftLink");
    const fileEl = document.getElementById("giftImage");

    if (!supabaseClient || !window.currentUser) {
        if (msgEl) msgEl.textContent = "Nicht eingeloggt.";
        return;
    }

    const title = titleEl?.value.trim();
    const link = linkEl?.value.trim();

    if (!title) {
        if (msgEl) msgEl.textContent = "Bitte einen Namen eingeben.";
        return;
    }

    msgEl.textContent = "Speichere ...";

    let imageUrl = null;
    const file = fileEl?.files[0];

    if (file) {
        const path = `${window.currentUser.id}/${Date.now()}_${file.name}`;

        const { data: uploadData, error: uploadErr } = await supabaseClient
            .storage
            .from("gift-images")
            .upload(path, file);

        if (uploadErr) {
            console.error(uploadErr);
            msgEl.textContent = "Fehler beim Hochladen des Bildes.";
            return;
        }

        const { data: publicUrlData } = supabaseClient
            .storage
            .from("gift-images")
            .getPublicUrl(uploadData.path);

        imageUrl = publicUrlData?.publicUrl || null;
    }

    const { error } = await supabaseClient
        .from("gift_wishes")
        .insert([{
            owner: window.currentUser.id,
            title,
            link: link || null,
            image_url: imageUrl
        }]);

    if (error) {
        console.error(error);
        msgEl.textContent = "Fehler beim Speichern.";
        return;
    }

    msgEl.textContent = "Gespeichert ✅";
    if (titleEl) titleEl.value = "";
    if (linkEl) linkEl.value = "";
    if (fileEl) fileEl.value = "";
    loadGiftWishes();
}

async function deleteGiftWish(id) {
    if (!supabaseClient || !window.currentUser) return;

    const { error } = await supabaseClient
        .from("gift_wishes")
        .delete()
        .eq("id", id)
        .eq("owner", window.currentUser.id);

    if (error) {
        console.error(error);
        return;
    }

    loadGiftWishes();
}
