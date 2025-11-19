document.addEventListener("DOMContentLoaded", () => {
    const giftAddBtn = document.getElementById("giftAddBtn");
    if (giftAddBtn) {
        giftAddBtn.addEventListener("click", addGiftWish);
    }

    const giftTitle = document.getElementById("giftTitle");
    if (giftTitle && giftAddBtn) {
        giftTitle.addEventListener("keydown", (e) => {
            if (e.key === "Enter") {
                e.preventDefault();
                giftAddBtn.click();
            }
        });
    }

    // nach Login + currentUser: Liste laden
    if (document.getElementById("panel-gifts")) {
        setTimeout(() => {
            loadGiftWishes();
        }, 500);
    }
});