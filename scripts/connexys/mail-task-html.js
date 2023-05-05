import(chrome.runtime.getURL("/lib/monkey-script.js")).then(async (Monkey) => {
  const enableHtml = (container) => {
    if (!container.textContent.includes("Body:")) return;
    const body = container.textContent.split("Body:")[1];
    const header = container.innerHTML.split("Body:")[0];
    container.innerHTML = header + body;
  };

  // Make it work for /r/Task/
  const doStuff = async () => {
    if (!window.location.pathname.includes("/r/Task/")) return;
    await Monkey.sleep(250);
    const textarea = await Monkey.waitForSelector(".active .uiOutputTextArea");
    enableHtml(textarea);
  };
  Monkey.onLocationChange(doStuff);
  doStuff();

  // Make it work for activity widget
  document.addEventListener(
    "click",
    async (ev) => {
      const target = ev.target;
      if (!target.matches("a.chevronLink") && !target.closest("a.chevronLink"))
        return;
      await Monkey.sleep(100);
      const wrapper = target.closest("flexipage-aura-wrapper");
      await Monkey.waitForSelector(".bodyText");
      wrapper.querySelectorAll(".bodyText").forEach(enableHtml);
    },
    true
  );
});
