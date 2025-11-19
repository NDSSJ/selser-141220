//--------------------------------------------------------------- Sidebar ein-/ausklappen ---------------------------------------------------
const sidebar = document.getElementById("sidebar");
const globalToggle = document.getElementById("sidebarToggle");
const mobileToggle = document.getElementById("mobileSidebarToggle");

if (globalToggle && sidebar) {
    globalToggle.addEventListener("click", () => {
        sidebar.classList.toggle("collapsed");
    });
}

if (mobileToggle && sidebar) {
    mobileToggle.addEventListener("click", () => {
        sidebar.classList.toggle("open");
    });
}



/* === Panels wechseln (wie Tabs) === */
const menuItems = document.querySelectorAll(".menu-item");
const panels = document.querySelectorAll(".panel");

menuItems.forEach((item) => {
    item.addEventListener("click", () => {
        // aktives Menü markieren
        menuItems.forEach((i) => i.classList.remove("active"));
        item.classList.add("active");

        // Panels umschalten
        const target = item.getAttribute("data-target");
        panels.forEach((p) => p.classList.remove("active"));
        document.getElementById(target).classList.add("active");
    });
});