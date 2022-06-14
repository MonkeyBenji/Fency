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
  berry.style.textDecoration = "none";
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

  const getElement = (form, key, value) => {
    const elements = form[key];
    if (!(elements instanceof NodeList)) return elements;
    for (const element of elements) {
      if (element.value === value) return element;
    }
  };

  const getLabel = (element) => {
    if (!element.labels || !element.labels[0]) return null;
    const label = element.labels[0].textContent.trim().split("\n")[0];
    return label.endsWith(":") ? label.slice(0, -1) : label;
  };

  const getDescription = (form, data) =>
    data
      .map(([key, value]) => {
        const element = getElement(form, key, value);
        if (!element || !element.type) return null;
        if (["hidden", "file"].includes(element.type)) return null;
        if (!value) return null;
        const label = getLabel(element);
        return label ? `${label}: ${value}` : value;
      })
      .filter((s) => s)
      .join("\n");

  berry.addEventListener("click", (ev) => {
    ev.preventDefault();
    const form = ev.target.closest("form");
    for (const entry of berryEntries.reverse()) {
      const description = getDescription(form, entry.data);
      const when = relativeTs(entry.ts);
      if (
        description &&
        confirm(
          `Membah that form you filled in ${when} ago? (and wanna reload it?)\n${description}`
        )
      ) {
        setFormData(form, entry.data);
        return;
      }
    }
    if (confirm("Remove the berry?")) {
      berry.style.display = "None";
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
  const buttonish = ["radio", "checkbox", "button", "submit"]; // Inputs you change by clicking
  const hasIcon = ["date", "time", "datetime-local", "week", "month", "number"]; // Inputs with picker icon
  document.addEventListener(
    "focus",
    (ev) => {
      const target = ev.target;
      const form = target.closest && target.closest("form");
      if (!form || !target.type || formComplexity(form) <= 2) return;
      if (buttonish.includes(target.type)) return;
      const formId =
        form.id || [...document.querySelectorAll("form")].indexOf(form);
      const url = window.location.href.split(/[?#]/)[0];
      load(url, formId).then((entries) => {
        entries = entries.filter((entry) => entry.ts < ts);
        if (entries.length === 0) return;
        berryEntries = entries;
        const [left, top] = getAbsLeftTop(target);
        let width = target.getBoundingClientRect().width;
        if (hasIcon.includes(target.type)) width += 32;
        berry.style.left = `${left + width - 24 - 8}px`;
        berry.style.top = `${top - 8}px`;
        target.parentNode.appendChild(berry);
      });
    },
    true
  );
});
