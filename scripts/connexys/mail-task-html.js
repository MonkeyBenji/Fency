import(chrome.runtime.getURL("/lib/monkey-script.js")).then(async (Monkey) => {
  const doStuff = async () => {
    if (!window.location.pathname.includes("/r/Task/")) return;
    await Monkey.sleep(250);
    const textarea = await Monkey.waitForSelector(".active .uiOutputTextArea");
    if (!textarea.textContent.includes("Body:")) return;
    const body = textarea.textContent.split("Body:")[1];
    const header = textarea.innerHTML.split("Body:")[0];
    textarea.innerHTML = header + body;
  };
  Monkey.onLocationChange(doStuff);
  doStuff();
});
