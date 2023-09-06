import(chrome.runtime.getURL("/lib/monkey-script.js")).then((Monkey) => {
  /** Monkey.set / get key */
  const KEY = "Membah";
  let berryEnabled = true;

  const MODAL_ID = "fency-modal-membah-fields";
  const THIS_FORM = "this-form";
  const THIS_DOMAIN = "this-domain";
  const ALL = "all";
  const CSS = `
    #${MODAL_ID} {
      border: 1px solid rgba(0,0,0,20%);
      border-radius: 10px;
      width: 60%;
      height: 80%;
      overflow-y: scroll;
      font-size: 12pt;
      background: #eee;
      padding: 0;
    }
    #${MODAL_ID} header {
      position: fixed;
      display: flex;
      background: #fff;
      width: 57.75%;
      margin-top: -12px;
      height: 34px;
    }
    #${MODAL_ID} header label {
      flex: 1;
      width: 30%;
      border: 1px solid rgba(0,0,0,20%);
      border-radius: 8px;
      font-size: 18px;
      text-align: center;
      background: #aaa;
      color: #fff;
      padding: 4px;
      margin: 2px;
    }
    #${MODAL_ID} header label:has(input:checked) {
      background: #5187ef;
    }
    #${MODAL_ID} header label:has(input) input {
      display: none;
    }
    #${MODAL_ID} > div {
      clear: both;
      background: #fff;
      padding: 12px;
    }
    #${MODAL_ID} .form-div {
      overflow: hidden;
      background: #fff;
      border: 1px solid rgba(0,0,0,20%);
      border-radius: 10px;
      padding: 10px 8px 8px;
      margin-bottom: 10px;
      margin-top: 34px;
      transition: background 0.5s;
    }
    #${MODAL_ID} .form-div:hover {
      background: rgba(0,0,0,8%);
    }
    #${MODAL_ID} .form-div > div {
      clear: both;
      background: #fff;
      border: 1px solid rgba(0,0,0,20%);
      border-radius: 10px;
      padding: 10px 8px 8px;
      margin-bottom: 10px;
      transition: background 0.5s;
    }
    #${MODAL_ID} .form-div > div:hover {
      background: rgba(255,255,255,50%);
    }
    #${MODAL_ID} a {
      float: left;
      display: block;
      width: calc(100% - 150px);
      white-space: nowrap;
      overflow: hidden;
      font-size: 0.8em;
      padding: 0 0 6px 6px;
    }
    #${MODAL_ID} time {
      float: right;
      text-align: right;
      overflow: hidden;
      font-size: 0.8em;
    }
    #${MODAL_ID} span.label {
      float: left;
      width: 50%;
      white-space: nowrap;
      overflow: hidden;
      font-size: 0.8em;
    }
    #${MODAL_ID} textarea {
      width: calc(100% - 6px);
    }
    #${MODAL_ID} button {
      border: 0;
      color: #fff;
      border-radius: 6px;
      padding: 6px 12px;
      margin: 4px 0;
      margin-right: 6px;
      background: #999;
    }
    #${MODAL_ID} button:hover {
      opacity: 0.8;
    }
    #${MODAL_ID} .copy {
      background: #286cee;
    }
    #${MODAL_ID} .fill,
    #${MODAL_ID} .fill-all {
      clear: both;
      background: #9bcb41;
    }
    #${MODAL_ID} .fill-all {
      float: right;
    }
    #${MODAL_ID} .delete,
    #${MODAL_ID} .delete-all {
      float: right;
      background: #cc0000;
      margin-right: 0;
    }
    #${MODAL_ID} .delete-all {
      margin: 4px; 
    }
  `;
  Monkey.css(CSS);

  const getData = async () => await Monkey.get(KEY, {});

  const deleteTs = async (ts) => {
    const all = await Monkey.get(KEY, {});
    delete all[ts];
    await Monkey.set(KEY, all);
  };

  const setValue = (element, value) => {
    const duration = 500; // x2 ms
    const oldAnimation = element.style.animation;
    const oldBackgroundColor = element.style.backgroundColor;
    element.style.transition = `background ${duration}ms`;
    element.style.backgroundColor = "purple";
    Monkey.setValue(element, value);
    setTimeout(() => {
      element.style.backgroundColor = oldBackgroundColor;
    }, duration);
    setTimeout(() => {
      element.style.animation = oldAnimation;
    }, 2 * duration);
  };

  const findElementByLabel = (label) => {
    for (const element of document.querySelectorAll("input,textarea,select")) {
      if (Monkey.getLabel(element) === label) return element;
    }
  };

  const isSameIshURL = (url1, url2, filter) => {
    if (filter === ALL) return true;
    const urlA = new URL(url1);
    const urlB = new URL(url2);
    urlA.hash = null;
    urlB.hash = null;
    if (filter === THIS_DOMAIN && urlA.hostname === urlB.hostname) return true;
    return urlA.toString() === urlB.toString();
  };

  // Track selected form to fill in all teh things
  let selectedForm;
  document.addEventListener(
    "focus",
    (ev) => {
      if (!ev.target.closest) return;
      if (ev.target.closest(`#${MODAL_ID}`)) return;
      const form = ev.target.closest("form");
      if (form) selectedForm = form;
    },
    { passive: true, capture: true }
  );

  const showMembahFields = async () => {
    berryEnabled = true;
    if (!selectedForm) selectedForm = document.querySelector("form");
    const defaultFormatter = new Intl.DateTimeFormat();
    const formatter = new Intl.DateTimeFormat("nl" || defaultFormatter.resolvedOptions().locale, {
      dateStyle: "medium",
      timeStyle: "medium",
    });

    const truncated = (s) => (s.length > 250 ? s.substring(0, 250) + "..." : s);
    const data = await getData();

    // Dialog and container
    const dialog = Object.assign(document.createElement("dialog"), { id: MODAL_ID });
    dialog.addEventListener("click", (ev) => {
      if (ev.target === dialog) dialog.close();
    });
    const container = document.createElement("div");
    dialog.appendChild(container);

    // Header
    const header = Object.assign(document.createElement("header"), { className: "" });
    header.innerHTML = `
    <label><input type="radio" name="filter" value="${THIS_FORM}" checked>This Form</label>
    <label><input type="radio" name="filter" value="${THIS_DOMAIN}">This Domain</label>
    <label><input type="radio" name="filter" value="${ALL}">All</label>
    `;
    container.appendChild(header);

    const renderMembahedForms = () => {
      let formDiv = null;
      let fillAllButton = null;
      let deleteAllButton = null;
      let fillAllMap = {};
      container.querySelectorAll(".form-div").forEach((div) => div.parentElement.removeChild(div));
      Object.values(data).forEach((record) => {
        const { url, ts, label, value, html, formId, formTs, name } = record;
        const filter = header.querySelector('[name="filter"]:checked').value;
        if (!isSameIshURL(window.location, url, filter)) return;

        // Group fields of same Form
        if (formDiv === null || formDiv.dataset.formTs != formTs) {
          formDiv = Object.assign(document.createElement("div"), { className: "form-div" });
          formDiv.dataset.formTs = formTs;
          const formTime = Object.assign(document.createElement("time"), { textContent: formatter.format(formTs) });

          const a = Object.assign(document.createElement("a"), {
            href: url,
            textContent: url,
            target: "_blank",
          });
          formDiv.appendChild(a);
          formDiv.appendChild(formTime);

          container.appendChild(formDiv);

          // Initialize "fill all" button which will be added at the end
          const thisFormDiv = formDiv;
          fillAllButton = Object.assign(document.createElement("button"), { className: "fill-all", textContent: "✍️ Fill form" });
          fillAllButton.addEventListener("click", async () => {
            for (const button of thisFormDiv.querySelectorAll("button.fill")) {
              await Monkey.sleep(333); // TODO fix the debouncer in membah-fields instead
              button.click();
            }
          });

          deleteAllButton = Object.assign(document.createElement("button"), { className: "delete-all", textContent: "🗑️ Delete form" });
          deleteAllButton.addEventListener("click", async () => {
            for (const button of thisFormDiv.querySelectorAll("button.delete")) {
              await Monkey.sleep(123);
              button.click();
            }
            await Monkey.sleep(500);
            thisFormDiv.parentElement.removeChild(thisFormDiv);
          });
        }

        // Field
        const fieldDiv = Object.assign(document.createElement("div"), { title: JSON.stringify(record) });
        const spanLabel = Object.assign(document.createElement("span"), { textContent: label });
        const time = Object.assign(document.createElement("time"), { textContent: formatter.format(ts) });
        const textarea = Object.assign(document.createElement("textarea"), { value: truncated(value), readOnly: true });
        const fillButton = Object.assign(document.createElement("button"), { className: "fill", textContent: "✍️ Fill" });
        const copyButton = Object.assign(document.createElement("button"), { className: "copy", textContent: "📋 Copy" });
        const deleteButton = Object.assign(document.createElement("button"), { className: "delete", textContent: "🗑️ Delete" });

        // Button listeners
        let element = selectedForm?.elements[name];
        if (element instanceof NodeList) element = element[0];
        if (!element && formId === -1 && label === name) element = findElementByLabel(label);
        if (element) {
          fillButton.addEventListener("click", () => {
            setValue(element, value);
          });
        }
        copyButton.addEventListener("click", () => {
          textarea.select();
          const blobs = { "text/plain": new Blob([value], { type: "text/plain" }) };
          if (html) blobs["text/html"] = new Blob([html], { type: "text/html" });
          navigator.clipboard.write([new ClipboardItem(blobs)]);
        });
        deleteButton.addEventListener("click", () => {
          deleteTs(ts);
          fieldDiv.style.transition = "opacity 0.4s";
          fieldDiv.style.opacity = 0;
          fieldDiv.addEventListener("transitionend", () => {
            fieldDiv.parentElement.removeChild(fieldDiv);
          });
        });

        fieldDiv.appendChild(spanLabel);
        fieldDiv.appendChild(time);
        fieldDiv.appendChild(textarea);
        if (element) {
          fieldDiv.appendChild(fillButton);
          fillAllMap[name] = fillButton;
        }
        fieldDiv.appendChild(copyButton);
        fieldDiv.appendChild(deleteButton);
        formDiv.appendChild(fieldDiv);
        formDiv.appendChild(fillAllButton);
        formDiv.appendChild(deleteAllButton);
      });
    };
    renderMembahedForms();
    header.addEventListener("click", () => {
      renderMembahedForms();
      dialog.scrollTo(0, dialog.scrollHeight);
    });
    if (container.querySelectorAll(".form-div").length === 0) {
      header.querySelector(`[value="${THIS_DOMAIN}"]`).click();
    }

    document.body.appendChild(dialog);
    dialog.addEventListener("close", () => dialog.parentElement.removeChild(dialog));
    dialog.showModal();
    dialog.scrollTo(0, dialog.scrollHeight);
  };
  Monkey.menu("Membah Berry", showMembahFields);

  // Make berry appear
  const getAbsLeftTop = (elem) => {
    const getRelParent = (elem) =>
      elem.parentNode.tagName === "HTML" || ["relative", "absolute", "sticky", "fixed"].includes(getComputedStyle(elem.parentNode).position)
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
  berry.addEventListener("click", showMembahFields);

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
  const buttonish = ["radio", "checkbox", "button", "submit"]; // Inputs you change by clicking
  const hasIcon = ["date", "time", "datetime-local", "week", "month", "number"]; // Inputs with picker icon
  const ts = Date.now();
  document.addEventListener(
    "focus",
    (ev) => {
      const target = ev.target;
      const form = target.closest && target.closest("form");
      if (!target.closest) return;
      if (target.closest(`#${MODAL_ID}`)) return;
      if (!target.type || (form && formComplexity(form) <= 2)) return;
      if (buttonish.includes(target.type)) return;
      berry.style.display = "None";
      setTimeout(() => (berryEnabled = false), 9001);
      if (!berryEnabled) return;
      getData().then((entries) => {
        entries = Object.values(entries)
          .filter((entry) => entry.ts < ts)
          .filter(({ url }) => isSameIshURL(window.location, url, THIS_FORM));
        if (entries.length === 0) return;
        berryEntries = entries;
        const [left, top] = getAbsLeftTop(target);
        let width = target.getBoundingClientRect().width;
        if (hasIcon.includes(target.type)) width += 32;
        berry.style.left = `${left + width - 16}px`;
        berry.style.top = `${top - 8}px`;
        target.parentNode.appendChild(berry);
        setTimeout(() => (berry.style.display = "block"), 250);
      });
    },
    true
  );
});
