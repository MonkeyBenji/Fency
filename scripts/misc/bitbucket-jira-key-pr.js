// TODO Send Monkey.setValue to Google and use that one instead
const MonkeySetValue = (input, value) => {
  const setter = Object.getOwnPropertyDescriptor(input.__proto__, "value").set;
  const event = new Event("input", { bubbles: true });
  setter.call(input, value);
  input.dispatchEvent(event);
};

import(chrome.runtime.getURL("/lib/monkey-script.js")).then(async (Monkey) => {
  if (!window.location.pathname.includes("pull-requests/new")) return;
  Monkey.waitForSelector("input[name=title]").then((inputTitle) => {
    if (!window.location.pathname.includes("pull-requests/new")) return;
    const url = new URL(window.location);
    const src = url.searchParams.get("source");
    const jiraKey = src.split("-").slice(0, 2).join("-");
    console.log(inputTitle.value.includes(jiraKey), inputTitle.value, jiraKey);
    setTimeout(() => {
      if (!inputTitle.value.includes(jiraKey)) {
        MonkeySetValue(inputTitle, `${jiraKey} ${inputTitle.value}`);
      }
    }, 123);
  });
});
