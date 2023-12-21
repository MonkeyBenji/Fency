import { sendMessage, get, set, sleep, getFaSvg } from "./core.js";
import { waitForSelector, waitForTrue } from "./wait-for-it.js";
import { coordsDialog } from "./osm-coords.js";
import { fab } from "./fab.js";
import { onLocationChange } from "./on-location-change.js";
import { select } from "./select.js";

const css = (css, parent = null) => {
  const style = document.createElement("style");
  style.appendChild(document.createTextNode(css));
  (parent ?? document.head).appendChild(style);
};

const js = (js) => {
  if (typeof js === "function") js = `(${js})()`;
  const script = document.createElement("script");
  script.appendChild(document.createTextNode(js));
  const nonce = document.querySelector("script[nonce]").nonce;
  if (nonce) script.nonce = nonce;
  document.head.appendChild(script);
};

const loadScript = (uri) =>
  new Promise((resolve, reject) => {
    const script = document.createElement("script");
    script.onload = resolve;
    script.onerror = reject;
    script.src = uri;
    document.head.appendChild(script);
  });

const createElement = (html) => {
  const doc = new DOMParser().parseFromString(html, "text/html");
  return document.importNode(doc.documentElement, true);
};

const onLoad = (callback) => {
  if (document.readyState !== "loading") callback();
  else document.addEventListener("DOMContentLoaded", callback);
};

const close = () => sendMessage("closeTab");

const replaceDomStrings = (mapping, domElement = null) => {
  domElement = domElement ?? document.body;
  if (domElement instanceof Text) {
    // Replace texts
    for (const search in mapping) {
      if (domElement.textContent.includes(search))
        domElement.textContent = domElement.textContent.replaceAll(search, mapping[search]);
    }
  } else {
    for (const search in mapping) {
      if (domElement.textContent.includes(search))
        for (const child of domElement.childNodes) {
          replaceDomStrings(mapping, child);
        }
    }
  }
};

const type = (text) =>
  new Promise((resolve) => {
    const dialog = document.createElement("dialog");
    dialog.style = `z-index: 999999999999; width: 50vw; height: 50vh; overflow: hidden`;
    const label = document.createElement("label");
    label.style = "font-size: 24px; height: 80px; text-align: center";
    label.innerText = "Please press Ctrl+C to copy the content\n and press Ctrl+V when the dialog disappears";
    const textarea = document.createElement("textarea");
    textarea.style = "width: calc(50vw - 12px); height: calc(50vh - 88px);";
    textarea.readOnly = true;
    textarea.textContent = text;

    dialog.appendChild(label);
    dialog.appendChild(textarea);
    document.body.appendChild(dialog);
    dialog.showModal();

    textarea.select();

    const ctrlVListener = (ev) => {
      if (!ev.ctrlKey) return;
      if (ev.code !== "KeyV") return;
      document.removeEventListener("keyup", ctrlVListener);
      resolve();
    };
    const ctrlCListener = (ev) => {
      if (ev.target !== textarea) return;
      if (!ev.ctrlKey) return;
      if (ev.code !== "KeyC") return;
      document.removeEventListener("keyup", ctrlCListener);
      dialog.close();
      document.addEventListener("keyup", ctrlVListener);
    };
    document.addEventListener("keyup", ctrlCListener);
    dialog.addEventListener("click", () => textarea.select());
    textarea.addEventListener("keypress", console.log);
  });

/** Selector to search for things that may be labelicious */
const LABEL_SELECTOR = 'label,.label,[class*="label"],[id*="label"]';
/**
 * @param {HTMLElement} node
 * @returns string
 */
const getLabel = (node) => {
  const getTextNodesIn = (node) => {
    let textNodes = [];
    for (const child of node.childNodes) {
      if (child instanceof Text) textNodes.push(child);
      else textNodes = textNodes.concat(getTextNodesIn(child));
    }
    return textNodes;
  };
  const getTextFromLabels = (node, labels) => {
    for (const label of labels) {
      for (const textNode of getTextNodesIn(label)) {
        const text = textNode.textContent.trim();
        if (text.length > 1) return text;
      }
    }
  };

  // Check if the website was made with accessibility in mind and supplies a related label
  if (node.labels && node.labels.length) {
    let labelText = getTextFromLabels(node, node.labels);
    if (node.textContent) labelText = labelText.replaceAll(node.textContent, ""); // TODO or just take the first non-empty textNode or something, which may fix * and (?) as well
    if (labelText) return labelText.trim();
  }

  // Find something that looks like a label in an ancestor element
  const ignoredLabels = [...node.querySelectorAll(LABEL_SELECTOR)];
  let parent = node.parentElement;
  while (parent && !(parent instanceof HTMLBodyElement) && !(parent instanceof HTMLTableRowElement)) {
    let labelChildren = parent.querySelectorAll(LABEL_SELECTOR);
    if (labelChildren.length > ignoredLabels.length) {
      labelChildren = [...labelChildren].filter(
        (label) => !ignoredLabels.includes(label) && (!label.htmlFor || document.getElementById(label.htmlFor) === null) // TODO or htmlFor is for me-ish
      );
      const text = getTextFromLabels(node, labelChildren);
      if (text) return text;
    }
    parent = parent.parentElement;
  }
};

const getElementsWithSameName = (node) => {
  if (!node.name) return [node];
  const form = node.closest("form");
  if (!form) return [node];
  const elements = form.elements[node.name];
  if (elements instanceof NodeList) return elements;
  return [node];
};

const getInputElement = (node) => {
  if (!node.value && node.isContentEditable && !node.hasAttribute("contenteditable")) {
    return node.closest("[contenteditable]");
  }
  if (node?.type === "checkbox" || node?.type === "radio") {
    return getElementsWithSameName(node)[0];
  }
  return node;
};

/**
 * @param {HTMLElement} node
 * @returns string|array
 */
const getValue = (node) => {
  node = getInputElement(node);
  if (node?.type === "checkbox" || node?.type === "radio") {
    return [...getElementsWithSameName(node)].filter(({ checked }) => checked).map(({ value }) => value);
  } else if (node?.type === "select-multiple") {
    return [...node.querySelectorAll("option:checked")].map(({ value }) => value);
  }
  if (node.value) return node.value;
  if (node.isContentEditable) {
    return node.innerText;
  }
};

const setValue = (element, value) => {
  if (element?.type === "checkbox" || element?.type === "radio") {
    getElementsWithSameName(element).forEach((input) => {
      input.checked = value.includes(input.value);
    });
    element.dispatchEvent(new Event("change", { bubbles: true }));
  } else if (element?.type === "select-multiple") {
    element.querySelectorAll("option").forEach((option) => {
      option.selected = value.includes(option.value);
    });
    element.dispatchEvent(new Event("change", { bubbles: true }));
  } else if (element?.type === "select") {
    element.value = value;
    element.dispatchEvent(new Event("change", { bubbles: true }));
  } else {
    const setter = Object.getOwnPropertyDescriptor(element.__proto__, "value").set;
    setter.call(element, value);
    element.dispatchEvent(new Event("input", { bubbles: true }));
    element.dispatchEvent(new Event("change", { bubbles: true }));
  }
};

const menuCallbacks = [];
const menu = async (title, callback) => {
  const idx = await sendMessage("menu", { title });
  if (idx === 0) {
    chrome.runtime.onMessage.addListener(({ fun, args }) => {
      if (fun === "menu") {
        menuCallbacks[args.index]();
      }
    });
  }
  menuCallbacks[idx] = callback;
};

const fetchData = async (resource, init = undefined) => await sendMessage("fetchData", { resource, init });

const fetchText = async (resource, init = undefined) => await sendMessage("fetchText", { resource, init });

const fetchJson = async (resource, init = undefined) => await sendMessage("fetchJson", { resource, init });

const lib = async (name) => await import(chrome.runtime.getURL(`/lib/external/${name}.js`));

const loadTextFile = (accept = null, encoding = "UTF-8") =>
  new Promise((resolve, reject) => {
    const input = document.createElement("input");
    input.type = "file";
    if (accept) input.accept = accept;
    input.addEventListener("change", (ev) => {
      const file = ev.target.files[0];
      const reader = new FileReader();
      reader.onload = (ev) => {
        resolve(ev.target.result);
      };
      reader.onerror = ev;
      reader.readAsText(file, encoding);
    });
    input.click();
  });

const save = (blob, filename) => {
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = filename;
  a.style.display = "none";
  document.body.appendChild(a);
  a.click();
  URL.revokeObjectURL(a.href);
  document.body.removeChild(a);
};

const sample = (arr) => arr[Math.floor(Math.random() * arr.length)];

const debounce = (func, timeout = 300) => {
  let timer;
  return (...args) => {
    clearTimeout(timer);
    timer = setTimeout(() => {
      func.apply(this, args);
    }, timeout);
  };
};

const info = (...args) =>
  console.info(
    `%c ℹ️ %c ${args.shift()}`,
    "color: #fff; background-color: #4299E1; border-radius: 100%;",
    `color: #2B6494`,
    ...args
  );

export {
  set,
  get,
  css,
  js,
  loadScript,
  onLoad,
  sleep,
  waitForSelector,
  waitForTrue,
  close,
  replaceDomStrings,
  createElement,
  coordsDialog,
  sendMessage,
  type,
  getLabel,
  getElementsWithSameName,
  getInputElement,
  getValue,
  setValue,
  fab,
  fetchData,
  fetchText,
  fetchJson,
  onLocationChange,
  select,
  menu,
  sample,
  debounce,
  lib,
  loadTextFile,
  save,
  info,
  getFaSvg,
};
