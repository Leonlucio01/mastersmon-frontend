document.addEventListener("DOMContentLoaded", () => {
    const menuToggle = document.getElementById("menuToggle");
    const menuMobile = document.getElementById("menuMobile");
    const languageSelect = document.getElementById("languageSelect");
    const languageSelectMobile = document.getElementById("languageSelectMobile");
    const desktopDropdownToggles = document.querySelectorAll("[data-menu-dropdown-toggle]");
    const mobileGroupToggles = document.querySelectorAll("[data-menu-mobile-group-toggle]");

    const closeDesktopDropdowns = () => {
        document.querySelectorAll(".menu-dropdown.is-open").forEach((dropdown) => {
            dropdown.classList.remove("is-open");
            const toggle = dropdown.querySelector("[data-menu-dropdown-toggle]");
            if (toggle) toggle.setAttribute("aria-expanded", "false");
        });
    };

    const closeMobileMenu = () => {
        if (menuMobile) menuMobile.classList.remove("menu-open");
    };

    if (menuToggle && menuMobile) {
        menuToggle.addEventListener("click", () => {
            menuMobile.classList.toggle("menu-open");
        });

        menuMobile.querySelectorAll("a").forEach((link) => {
            link.addEventListener("click", () => {
                if (!link.classList.contains("menu-disabled")) {
                    closeMobileMenu();
                }
            });
        });
    }

    desktopDropdownToggles.forEach((toggle) => {
        toggle.addEventListener("click", (event) => {
            event.preventDefault();
            const dropdown = toggle.closest(".menu-dropdown");
            const willOpen = !dropdown.classList.contains("is-open");
            closeDesktopDropdowns();
            if (willOpen) {
                dropdown.classList.add("is-open");
                toggle.setAttribute("aria-expanded", "true");
            }
        });
    });

    mobileGroupToggles.forEach((toggle) => {
        toggle.addEventListener("click", () => {
            const target = toggle.getAttribute("data-menu-mobile-group-toggle");
            const submenu = document.querySelector(`[data-menu-mobile-group="${target}"]`);
            if (!submenu) return;
            const willOpen = !submenu.classList.contains("is-open");
            submenu.classList.toggle("is-open", willOpen);
            toggle.classList.toggle("is-open", willOpen);
            toggle.setAttribute("aria-expanded", willOpen ? "true" : "false");
        });
    });

    document.addEventListener("click", (event) => {
        const insideDropdown = event.target.closest(".menu-dropdown");
        if (!insideDropdown) {
            closeDesktopDropdowns();
        }
    });

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
