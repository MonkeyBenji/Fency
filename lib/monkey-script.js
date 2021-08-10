const sendMessage = (fun, args = undefined) =>
  new Promise((resolve, reject) => {
    const message = { fun };
    if (typeof args !== "undefined") message.args = args;
    chrome.runtime.sendMessage(message, resolve);
  });

const set = (key, value) =>
  new Promise((resolve, reject) =>
    chrome.storage.local.set({ [key]: value }, () => resolve())
  );

const get = (key, defaultValue) =>
  new Promise((resolve, reject) =>
    chrome.storage.local.get([key], (result) =>
      resolve(result[key] ?? defaultValue)
    )
  );

const css = (css) => {
  const style = document.createElement("style");
  style.innerHTML = css;
  document.head.appendChild(style);
};

const js = (js) => {
  if (typeof js === "function") js = `(${js})()`;
  const script = document.createElement("script");
  script.innerHTML = js;
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

const onLoad = (callback) => {
  if (document.readyState !== "loading") callback();
  else document.addEventListener("DOMContentLoaded", callback);
};

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

// TODO compare performance with observer style checking
const waitForSelector = (selector, timeout = 9001) =>
  new Promise((resolve, reject) => {
    const failTimer = setTimeout(
      () =>
        reject(`Did not find element matching ${selector} within ${timeout}ms`),
      timeout
    );
    const checkScript = () => {
      const element = document.querySelector(selector);
      if (element) {
        clearTimeout(failTimer);
        return resolve(element);
      }
      setTimeout(checkScript, 10);
    };
    checkScript();
  });

const waitForTrue = (callback, timeout = 9001) =>
  new Promise((resolve, reject) => {
    const failTimer = setTimeout(
      () =>
        reject(`Did not find element matching ${selector} within ${timeout}ms`),
      timeout
    );
    const checkScript = () => {
      const result = callback();
      if (result) {
        clearTimeout(failTimer);
        return resolve(result);
      }
      setTimeout(checkScript, 10);
    };
    checkScript();
  });

const close = () => sendMessage("closeTab");

const replaceDomStrings = (mapping, domElement = null) => {
  domElement = domElement ?? document.body;
  if (domElement instanceof Text) {
    // Replace texts
    for (const search in mapping) {
      if (domElement.textContent.includes(search))
        domElement.textContent = domElement.textContent.replaceAll(
          search,
          mapping[search]
        );
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

const createElement = (html) => {
  const template = document.createElement("template");
  template.innerHTML = html;
  return template.content.firstElementChild.cloneNode(true);
};

const coordsDialog = (
  options = {
    default: "",
    country: "Nederland",
  }
) =>
  new Promise((resolve, reject) => {
    const dialog = createElement(`<dialog>
    <form method="dialog">
      <p>
        <label>Location:<input type="text"></label>
        <label><input type="checkbox" value=", Nederland" checked>, Nederland</label>
      </p>
      <p>
        <label>Matches:<select required></select></label>
      </p>
      <menu>
        <button type="reset" value="cancel">Cancel</button>
        <button type="submit" value="" style="font-weight: bold">Confirm</button>
      </menu>
    </form>
  </dialog>`);
    if (typeof dialog.showModal !== "function") {
      alert("about:config -> dom.dialog_element.enabled");
      reject("unsupported");
    } else {
      // TODO input+debounce
      const input = dialog.querySelector('input[type="text"]');
      const checkbox = dialog.querySelector('input[type="checkbox"]');
      const select = dialog.querySelector("select");
      input.value = options.default;

      const updateOptions = () => {
        const search = input.value + (checkbox.checked ? checkbox.value : "");
        const url = `https://nominatim.openstreetmap.org/search.php?q=${search}&format=jsonv2`;

        fetch(url)
          .then((response) => response.json())
          .then((data) => {
            select.innerHTML = "<option></option>";
            data.forEach((result) => {
              const option = document.createElement("option");
              option.textContent = result.display_name;
              option.value = JSON.stringify({
                search: input.value,
                lon: result.lon,
                lat: result.lat,
                name: result.display_name,
              });
              select.appendChild(option);
            });
          });
      };
      if (input.value) updateOptions();
      input.addEventListener("change", updateOptions);

      let cancelled = false;
      dialog
        .querySelector('button[type="reset"]')
        .addEventListener("click", () => {
          cancelled = true;
          dialog.close();
        });

      dialog.addEventListener("close", () => {
        if (cancelled) {
          reject();
        } else {
          resolve(JSON.parse(select.value));
        }
      });
      document.body.appendChild(dialog);
      dialog.showModal();
    }
  });

const type = (text) => sendMessage("type", { text });
// TODO split in multiple files, import, check performance to see if build step is required

const fab = (icon, text, callback) => {
  const button = document.createElement("button");
  button.style.position = "fixed";
  button.style.right = "20px";
  button.style.bottom = "20px";
  button.style.width = "80px";
  button.style.height = "80px";
  button.style.zIndex = 1337;
  button.style.borderRadius = "100%";
  button.innerText = text;
  button.addEventListener("click", callback);
  document.body.appendChild(button);
};

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
  fab,
};
