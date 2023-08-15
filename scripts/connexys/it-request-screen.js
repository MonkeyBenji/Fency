import(chrome.runtime.getURL("/lib/monkey-script.js")).then(async (Monkey) => {
  const url = new URL(window.location);
  // IT aanvragen scherm [benji-edit]
  if (url.pathname === "/lightning/r/Dashboard/01Z9L0000005RHBUA2/view") {
    // Parent page
    Monkey.css(`
    .oneAppNavContainer, 
    .slds-global-header {
      display: none;
    }
    section.layoutContent {
      height: 100% !important;
      top: 0 !important;
    }
    `);
  } else if (url.searchParams.get("dashboardId") === "01Z9L0000005RHBUA2") {
    // Dashboard
    Monkey.css(`
    div.slds-media__figure {
      background-image: url(https://inwork.lightning.force.com/file-asset/logo_2016_inwork1?v=1&height=80&width=400) !important;
      background-position-x: 0% !important;
      background-position-y: 50% !important;
      background-repeat-x: no-repeat !important;
      background-repeat-y: no-repeat !important;
      background-size: contain !important;
      height: 38px !important;
      width: 188px !important;
    }
    div.slds-media__figure svg { display: none; }

    div.data-grid-table-ctr { overflow-x: hidden !important; }
    div.grid-layout {overflow-y: hidden !important; }
    
    div.widgets .widget-container:nth-child(1) colgroup > col:nth-of-type(1) { width: 28px !important; }
    div.widgets .widget-container:nth-child(1) colgroup > col:nth-of-type(2) { width: 50% !important; }
    div.widgets .widget-container:nth-child(1) colgroup > col:nth-of-type(3) { width: 20% !important; }
    div.widgets .widget-container:nth-child(1) colgroup > col:nth-of-type(4) { width: 20% !important; }
    div.widgets .widget-container:nth-child(1) colgroup > col:nth-of-type(5) { width: 15% !important; }
    
    div.widgets .widget-container:nth-child(2) colgroup > col:nth-of-type(1) { width: 28px !important; }
    div.widgets .widget-container:nth-child(2) colgroup > col:nth-of-type(2) { width: 20% !important; }
    div.widgets .widget-container:nth-child(2) colgroup > col:nth-of-type(3) { width: 10% !important; }
    div.widgets .widget-container:nth-child(2) colgroup > col:nth-of-type(4) { width: 20% !important; }
    div.widgets .widget-container:nth-child(2) colgroup > col:nth-of-type(5) { width: 10% !important; }
    div.widgets .widget-container:nth-child(2) colgroup > col:nth-of-type(6) { width: 10% !important; }
    div.widgets .widget-container:nth-child(2) colgroup > col:nth-of-type(7) { width: 10% !important; }
    div.widgets .widget-container:nth-child(2) colgroup > col:nth-of-type(8) { width: 15% !important; }
    div.widget-grid,
    div.widget-container
    {
      height: calc(100% - 50px) !important;
    }
    `);
    await Monkey.waitForSelector("col.data-grid-table-col");
    await Monkey.sleep(123);
    const translations = {
      "1. Hoog": "🟥",
      "2. Midden": "🟨",
      "3. Laag": "🟩",
      Goud: "🥇",
      Zilver: "🥈",
      Brons: "🥉",
      "Prioriteit vacature": "Prio",
      "Naam inlenersbeloning": "Functie",
      "Accountnaam: Accountnaam": "Klant",
      "Eigenaar: Volledige naam": "Eigenaar",
      Standplaats: "Plaats",
      "Salaris (max)": "Salaris",
      "Gewenste brutosalaris": "Salaris",
      Roepnaam: "Naam",
      "Hoogst genoten afgeronde opleiding": "Niveau",
      "Aantal jaren ervaring": "Ervaring",
      "Aanbieding bij aanname prioriteit": "Medaille",
    };
    const fixCols = () => {
      document.querySelectorAll("div.wave-table-cell-text, span.lightning-table-cell-measure-header-value").forEach((div) => {
        const text = div.textContent.trim();
        if (text in translations) div.textContent = translations[text];
        if (text.endsWith(",00")) div.textContent = text.replace(",00", "");
        // if (text === "Eigenaar: Volledige naam") {
        //   if (div.closest(".widget-container").previousSibling === null) {
        //     div.textContent = "AM";
        //   } else {
        //     div.textContent = "Recr.";
        //   }
        // }
        const managerLink = div.querySelector('a[href*="/lightning/r/005"]');
        if (managerLink) {
          const splitName = managerLink.textContent.split(" ");
          if (splitName[0] === "Dave") {
            managerLink.textContent = splitName[0] + " " + splitName[1][0];
          } else {
            managerLink.textContent = splitName[0];
          }
        }
      });
    };
    fixCols();
    window.addEventListener("resize", () => setTimeout(fixCols, 1337), { capture: true, passive: true });
    window.addEventListener(
      "click",
      () => {
        setTimeout(fixCols, 1337);
        setTimeout(fixCols, 2500);
        setTimeout(fixCols, 5000);
      },
      { capture: true, passive: true }
    );

    // Auto-scroll
    const SCROLL_INTERVAL = 5 * 1000;
    const SCROLL_DELAY_MANUAL = 30 * 1000;
    let scrollTimer = null;
    let itWasMe = false;
    const doAutoScroll = () => {
      document.querySelectorAll("div.data-grid-table-ctr").forEach((div) => {
        if (div.style.overflow !== "scroll" && div.style.overflowY !== "scroll") return;
        const fullHeight = div.scrollHeight;
        const viewHeight = div.offsetHeight;
        if (fullHeight === viewHeight) return;
        const scrollTop = div.scrollTop;

        itWasMe = true;
        if (scrollTop + viewHeight > fullHeight - 1) {
          div.scrollTo({ top: 0, behavior: "smooth" });
        } else {
          div.scrollTo({ top: scrollTop + viewHeight, behavior: "smooth" });
        }
        setTimeout(() => {
          itWasMe = false;
        }, 1337);
      });
      scrollTimer = setTimeout(doAutoScroll, SCROLL_INTERVAL);
      window.scrollTimer = scrollTimer;
    };
    document.addEventListener(
      "scroll",
      () => {
        fixCols();
        if (itWasMe) return;
        if (scrollTimer) clearTimeout(scrollTimer);
        scrollTimer = setTimeout(doAutoScroll, SCROLL_DELAY_MANUAL);
      },
      { capture: true, passive: true }
    );
    scrollTimer = setTimeout(doAutoScroll, SCROLL_INTERVAL);
  }
});
