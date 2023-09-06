import(chrome.runtime.getURL("/lib/monkey-script.js")).then((Monkey) => {
  const MODAL_ID = "fency-modal-membah-fields";
  /** Monkey.set / get key */
  const KEY = "Membah";
  /** Maximum number of entries that will be membah'd */
  const MAX_SIZE = 100;
  /** Time until another entry is made for certain element to prevent data loss by deleting textarea content */
  const FORGET_FIELD_AFTER = 5 * 60 * 1000;

  const formTs = Date.now();

  const debounceTarget = (func, timeout = 300) => {
    let timer;
    let prevElement = null;
    return (...args) => {
      if (args[0].target === prevElement) clearTimeout(timer);
      prevElement = args[0].target;
      timer = setTimeout(() => {
        func.apply(this, args);
      }, timeout);
    };
  };

  // Store timestamp element was first logged this session as key for the stored array
  const elementsToTimestamp = new Map();

  const storeData = async (obj) => {
    const all = await Monkey.get(KEY, {});
    all[obj.ts] = obj;
    const keys = Object.keys(all);
    if (keys.length > MAX_SIZE) {
      delete all[keys.sort()[0]];
    }
    await Monkey.set(KEY, all);
  };

  const onInput = debounceTarget((ev) => {
    const element = Monkey.getInputElement(ev.target);
    if (element.type === "password") return;
    if (element.closest(`#${MODAL_ID}`)) return;
    let ts = elementsToTimestamp.get(element);
    if (!ts) {
      ts = Date.now();
    }
    // If more than 5 minutes elapsed, create new entry, so history of big text elements is kept
    if (Date.now() - ts > FORGET_FIELD_AFTER) {
      ts = Date.now();
    }
    elementsToTimestamp.set(element, ts);

    const label = Monkey.getLabel(element);
    const data = {
      url: window.location.href,
      ts,
      name: element.name || label,
      label,
      value: Monkey.getValue(element),
      formTs,
      formId: [...document.querySelectorAll("form")].indexOf(element.closest("form")),
    };
    if (element.isContentEditable) data.html = element.innerHTML;
    if (data.value) storeData(data);
  }, 250);

  document.addEventListener("input", onInput, { capture: true, passive: true });
});
