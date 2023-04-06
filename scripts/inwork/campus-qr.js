import(chrome.runtime.getURL("/lib/monkey-script.js")).then((Monkey) => {
  Monkey.waitForSelector("#cxsApplyButton").then((apply) => {
    const qr = document.createElement("a");
    const hyperlink = document.createElement("a");
    [qr, hyperlink].forEach((a) => {
      a.target = "_blank";
      a.className = "cxsButton";
      a.style.backgroundColor = "#623cb9";
      a.style.marginLeft = "8px";
      a.style.minWidth = "120px";
    });
    qr.textContent = "QR";
    hyperlink.textContent = "Hieperlink";

    const updateHrefs = () => {
      const selects = [...document.querySelectorAll("select[name]")];
      const url = new URL(window.location.href);
      url.search = selects
        .filter((select) => select.value)
        .map((select) => select.name + "=" + select.value)
        .join("&");

      hyperlink.href = url;
      qr.href =
        "https://www.qr-genereren.nl/qrcode.svg?text=" +
        encodeURIComponent(url);
    };
    document.body.addEventListener("change", updateHrefs);
    updateHrefs();
    apply.insertAdjacentElement("afterend", qr);
    apply.insertAdjacentElement("afterend", hyperlink);
  });
});
