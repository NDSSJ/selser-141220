async function loadDailyMessages() {
    if (!supabaseClient) return;

    const selectEl = document.getElementById("dailyMsgSelect");
    const textEl = document.getElementById("dailyMsgText");
    const metaEl = document.getElementById("dailyMsgMeta");

    if (!selectEl || !textEl) return;

    // UI erstmal leeren
    selectEl.innerHTML = "";
    textEl.textContent = "Lade ...";
    if (metaEl) metaEl.textContent = "";

    const { data, error } = await supabaseClient
        .from("daily_messages")
        .select("id, message, date_for")
        .order("date_for", { ascending: false });

    if (error) {
        console.error(error);
        selectEl.innerHTML = `<option>Fehler beim Laden</option>`;
        textEl.textContent = "Konnte nichts laden.";
        return;
    }

    if (!data || data.length === 0) {
        selectEl.innerHTML = `<option>Keine Nachrichten vorhanden</option>`;
        textEl.textContent = "Noch keine Nachricht hinterlegt 🙂";
        return;
    }

    // heutigess Datum als string "YYYY-MM-DD"
    const todayStr = new Date().toISOString().slice(0, 10);

    // Optionen bauen
    data.forEach((row) => {
        const opt = document.createElement("option");
        opt.value = row.id;
        opt.textContent = row.date_for; // z.B. 2025-12-15
        selectEl.appendChild(opt);
    });

    // versuchen: Eintrag für heute finden
    const todaysMsg = data.find((row) => row.date_for === todayStr);

    // das Objekt, das wir anzeigen wollen
    const toShow = todaysMsg ? todaysMsg : data[0];

    // im select auswählen
    selectEl.value = toShow.id;

    // Text anzeigen
    textEl.textContent = toShow.message || "–";
    if (metaEl) metaEl.textContent = `Nachricht für: ${toShow.date_for}`;

    // Wechsel-Handler
    selectEl.onchange = () => {
        const selectedId = selectEl.value;
        const found = data.find((r) => r.id === selectedId);
        textEl.textContent = found ? (found.message || "–") : "–";
        if (metaEl) metaEl.textContent = found ? `Nachricht für: ${found.date_for}` : "";
    };
}