import(chrome.runtime.getURL("/lib/monkey-script.js")).then(async (Monkey) => {
  const doStuff = () => {
    if (!window.location.href.includes("cxsrec__cxsPosition__c")) return;
    Monkey.css(`.slds-rich-text-editor__textarea {
    font-size: 17px !important;
    line-height: 1.7em !important;
    font-family: 'Archivo',Helvetica,Arial,Lucida,sans-serif !important;
  }
  .slds-rich-text-editor__textarea p {
    margin-top: 0;
    margin-bottom: 1rem;
  }
  .slds-rich-text-editor__textarea ul {
    margin-left: 0;
  }
  .slds-rich-text-editor__textarea ul li {
    padding-left: 0;
    position: relative;
    margin-bottom: 10px;
  }
  .slds-rich-text-editor__textarea ul li::before {
    content: url(data:image/svg+xml;base64,PHN2ZyBpZD0iY2hlY2siIHZpZXdCb3g9IjAgMCA1MTIgNTEyIiB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciPjxwYXRoIGZpbGw9IiMxN0MyNTQiIGQ9Ik0xNzMuODk4IDQzOS40MDRsLTE2Ni40LTE2Ni40Yy05Ljk5Ny05Ljk5Ny05Ljk5Ny0yNi4yMDYgMC0zNi4yMDRsMzYuMjAzLTM2LjIwNGM5Ljk5Ny05Ljk5OCAyNi4yMDctOS45OTggMzYuMjA0IDBMMTkyIDMxMi42OSA0MzIuMDk1IDcyLjU5NmM5Ljk5Ny05Ljk5NyAyNi4yMDctOS45OTcgMzYuMjA0IDBsMzYuMjAzIDM2LjIwNGM5Ljk5NyA5Ljk5NyA5Ljk5NyAyNi4yMDYgMCAzNi4yMDRsLTI5NC40IDI5NC40MDFjLTkuOTk4IDkuOTk3LTI2LjIwNyA5Ljk5Ny0zNi4yMDQtLjAwMXoiIGNsYXNzPSIiPjwvcGF0aD48L3N2Zz4=);
    width: 15px;
    margin-right: 8px;
  }
  .slds-rich-text-editor__textarea ol {
    margin-left: -24px;
  }`);
    const fontClear = (ev) => {
      const rt =
        ev.target.closest("lightning-input-rich-text") ||
        ev.target.closest(".lightningInputRichText");
      if (!rt) return;
      const editor = rt.querySelector("div.ql-editor");

      // Fix (un)ordered lists
      editor.querySelectorAll('span[style*="font-size"]').forEach((span) => {
        if (!span.innerHTML.startsWith("&nbsp;&nbsp;&nbsp;")) return;
        const p = span.parentElement;
        if (!p instanceof HTMLParagraphElement) return;
        const dotOrNumber = span.previousSibling;
        const listElement = dotOrNumber instanceof Text ? "ol" : "ul";
        p.removeChild(dotOrNumber);
        p.removeChild(span);
        p.outerHTML = p.outerHTML
          .replace("<p>", `<${listElement}><li>`)
          .replace("</p>", `</li></${listElement}>`);
      });

      // Remove fonts
      editor
        .querySelectorAll(
          '[style*="font-family"],[style*="font-size"],[style*="color"]'
        )
        .forEach((span) => {
          span.style.fontFamily = null;
          if (span.style.backgroundColor === "white")
            span.style.backgroundColor = null;
          if (
            span.style.fontSize === "14px" ||
            span.style.fontSize === "12px" ||
            span.style.fontSize === "10pt" ||
            span.style.fontSize === "11pt"
          )
            span.style.fontSize = null;
        });
    };
    document.body.addEventListener("input", (ev) =>
      setTimeout(() => fontClear(ev), 123)
    );
  };
  Monkey.onLocationChange(doStuff);
});
