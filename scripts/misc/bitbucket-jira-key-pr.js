// TODO Send Monkey.setValue to Google and use that one instead
const MonkeySetValue = (input, value) => {
  const setter = Object.getOwnPropertyDescriptor(input.__proto__, "value").set;
  const event = new Event("input", { bubbles: true });
  setter.call(input, value);
  input.dispatchEvent(event);
};

import(chrome.runtime.getURL("/lib/monkey-script.js")).then(async (Monkey) => {
  const doStuff = () => {
    Monkey.waitForSelector("input[name=title]").then((inputTitle) => {
      if (!window.location.pathname.includes("pull-requests/new")) return;
      const url = new URL(window.location);
      const src = url.searchParams.get("source");
      const jiraKey = src.split("-").slice(0, 2).join("-");
      if (isNaN(jiraKey.split("-")[1].trim())) return; // hotfix
      const goFix = () => {
        if (!inputTitle.value?.trim()) return setTimeout(goFix, 123);
        if (!inputTitle.value.includes(jiraKey)) {
          MonkeySetValue(inputTitle, `${jiraKey} ${inputTitle.value}`);
        }
      };
      setTimeout(goFix, 123);
    });
  };
  doStuff();
  Monkey.onLocationChange(doStuff);
});
