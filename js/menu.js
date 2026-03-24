document.addEventListener("DOMContentLoaded", () => {
    const menuToggle = document.getElementById("menuToggle");
    const menuMobile = document.getElementById("menuMobile");
    const languageSelect = document.getElementById("languageSelect");
    const languageSelectMobile = document.getElementById("languageSelectMobile");

    if (menuToggle && menuMobile) {
        menuToggle.addEventListener("click", () => {
            menuMobile.classList.toggle("menu-open");
        });

        menuMobile.querySelectorAll("a").forEach((link) => {
            link.addEventListener("click", () => {
                if (!link.classList.contains("menu-disabled")) {
                    menuMobile.classList.remove("menu-open");
                }
            });
        });
    }

    const currentLang = typeof getCurrentLang === "function" ? getCurrentLang() : "en";
    if (languageSelect) languageSelect.value = currentLang;
    if (languageSelectMobile) languageSelectMobile.value = currentLang;

    const syncLanguage = (lang) => {
        if (languageSelect) languageSelect.value = lang;
        if (languageSelectMobile) languageSelectMobile.value = lang;
        if (typeof setCurrentLang === "function") {
            setCurrentLang(lang);
        }
    };

    if (languageSelect) {
        languageSelect.addEventListener("change", (event) => syncLanguage(event.target.value));
    }

    if (languageSelectMobile) {
        languageSelectMobile.addEventListener("change", (event) => syncLanguage(event.target.value));
    }

    document.querySelectorAll(".menu-disabled").forEach((link) => {
        link.addEventListener("click", (event) => event.preventDefault());
    });

    if (typeof applyTranslations === "function") {
        applyTranslations();
    }
});
