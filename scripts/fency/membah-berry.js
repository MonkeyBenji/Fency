import(chrome.runtime.getURL("/lib/monkey-script.js")).then((Monkey) => {
  const ts = Date.now();
  const load = async (url, formId) => {
    const map = await Monkey.get(`membah-${url}`, {});
    return map[formId] ?? [];
  };
  const relativeTs = (ts) => {
    const map = { day: 24 * 60 * 60, hour: 60 * 60, minute: 60, second: 1 };
    let secondsBetween = (Date.now() - ts) / 1000;
    return Object.entries(map)
      .map(([key, seconds]) => {
        const amount = Math.floor(secondsBetween / seconds);
        secondsBetween -= amount * seconds;
        if (!amount) return null;
        return `${amount} ${key}${amount !== 1 ? "s" : ""}`;
      })
      .filter((s) => s !== null)
      .join(", ");
  };

  // if sibbling of given element would be given absolute positioning and these left/top values, it would be on top of element
  const getAbsLeftTop = (elem) => {
    const getRelParent = (elem) =>
      elem.parentNode.tagName === "HTML" ||
      ["relative", "absolute", "sticky", "fixed"].includes(
        getComputedStyle(elem.parentNode).position
      )
        ? elem.parentNode
        : getRelParent(elem.parentNode);

    const ancestor = getRelParent(elem);
    const ancestorRect = ancestor.getBoundingClientRect();
    const elemRect = elem.getBoundingClientRect();
    return [elemRect.left - ancestorRect.left, elemRect.top - ancestorRect.top];
  };

  const berry = document.createElement("a");
  berry.textContent = "🍇";
  berry.style.background = "none";
  berry.style.border = "none";
  berry.style.position = "absolute";
  berry.style.cursor = "pointer";
  berry.style.fontFamily = "emoji";
  berry.style.fontSize = "24px";
  berry.tabIndex = -1;
  berry.title = "Membah Form?";

  // Berry click
  let berryEntries = null;
  const setFormData = (form, data) => {
    for (const input of form.elements) {
      const values = data
        .filter(([key]) => key === input.name)
        .map(([key, value]) => value);

      switch (input.type) {
        case "hidden":
        case "button":
        case "submit":
        case "file":
          continue;
        case "select-multiple":
          for (const option of input.options) {
            const selected = values.includes(option.value);
            if (option.selected !== selected) {
              input.focus();
              option.selected = selected;
            }
          }
          break;
        case "radio":
        case "checkbox":
          const checked = values.includes(input.value);
          if (input.checked !== checked) {
            input.focus();
            input.checked = checked;
          }
          break;
        default:
          if (values.length === 0) continue;
          if (input.value !== values[0]) {
            input.focus();
            input.value = values[0];
          }
      }
      if (input === document.activeElement) {
        input.dispatchEvent(new Event("change"));
      }
    }
  };
  berry.addEventListener("click", (ev) => {
    ev.preventDefault();
    const form = ev.target.closest("form");
    for (const entry of berryEntries.reverse()) {
      if (
        confirm(
          `Membah that form you filled in ${relativeTs(
            entry.ts
          )} ago? (and wanna reload it?)\n${entry.data
            .map(([key, value]) => value)
            .join(";")}`
        )
      ) {
        setFormData(form, entry.data);
        break;
      }
    }
  });

  const formComplexity = (form) =>
    [...form.elements]
      .map((input) => {
        switch (input.type) {
          case "hidden":
          case "button":
          case "submit":
            return 0;
          case "password":
            return -2;
          case "checkbox":
          case "radio":
            return 0.3;
          case "textarea":
            return 3;
          default:
            return 1;
        }
      })
      .reduce((a, b) => a + b);

  // Make berry appear
  document.addEventListener(
    "focus",
    (ev) => {
      const target = ev.target;
      const form = target.closest("form");
      if (!form || target === berry || formComplexity(form) <= 2) return;
      const formId = [...document.querySelectorAll("form")].indexOf(form);
      const url = window.location.href.split(/[?#]/)[0];
      load(url, formId).then((entries) => {
        entries = entries.filter((entry) => entry.ts < ts);
        if (entries.length === 0) return;
        berryEntries = entries;
        const [left, top] = getAbsLeftTop(target);
        let width = target.getBoundingClientRect().width;
        if (
          ["radio", "checkbox", "button", "submit", "date"].includes(
            target.type
          )
        )
          width += 32;
        berry.style.left = `${left + width - 24 - 8}px`;
        berry.style.top = `${top - 8}px`;
        target.insertAdjacentElement("afterend", berry);
      });
    },
    true
  );
});
