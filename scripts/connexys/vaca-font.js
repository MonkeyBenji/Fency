import(chrome.runtime.getURL("/lib/monkey-script.js")).then(async (Monkey) => {
  const doStuff = () => {
    if (!window.location.href.includes("cxsrec__cxsPosition__c")) return;
    Monkey.css(`div.ql-editor, div.slds-rich-text-area__content {
    font-size: 17px !important;
    line-height: 1.7em !important;
    font-family: 'Titillium Web',Helvetica,Arial,Lucida,sans-serif !important;
  }
  div.ql-editor ul {
    margin-left: 0;
  }
  div.ql-editor ol {
    margin-left: -24px;
  }
  div.ql-editor ul li {
    list-style-type: disc;
  }
  div.ql-editor ul li::before {
    display: none;
  }
  .slds-rich-text-editor__textarea ul li {
    padding-left: 0;
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
        .querySelectorAll('[style*="font-family"]')
        .forEach((span) => (span.style.fontFamily = null));
    };
    document.body.addEventListener("input", (ev) =>
      setTimeout(() => fontClear(ev), 123)
    );
  };
  Monkey.onLocationChange(doStuff);
});
