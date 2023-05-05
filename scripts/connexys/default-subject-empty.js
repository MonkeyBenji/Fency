import(chrome.runtime.getURL("/lib/monkey-script.js")).then(async (Monkey) => {
  document.body.addEventListener("click", async (ev) => {
    if (
      ev.target.matches(".dummyButtonCallToAction") ||
      ev.target.closest(".dummyButtonCallToAction")
    ) {
      await Monkey.waitForSelector("lightning-grouped-combobox");
      // Stupid shadow dom
      Monkey.js(() => {
        const subject = document.querySelector("lightning-grouped-combobox");
        subject.value = "";
        const input = subject.shadowRoot
          .querySelector("lightning-base-combobox")
          .shadowRoot.querySelector("input");

        const inputBeGone123 = () => setTimeout(() => (input.value = ""), 123);
        input.value = "";
        input.addEventListener("focus", inputBeGone123, { once: true });
        // Below fucks up the combo box selection, so this is it
        // input.addEventListener("blur", inputBeGone123);
        // input.addEventListener("change", () => {
        //   input.removeEventListener("focus", inputBeGone123);
        //   input.removeEventListener("blur", inputBeGone123);
        // });
        // subject.addEventListener("change", () => {
        //   input.removeEventListener("focus", inputBeGone123);
        //   input.removeEventListener("blur", inputBeGone123);
        // });
      });
    }
  });
});
