import(chrome.runtime.getURL("/lib/monkey-script.js")).then(async (Monkey) => {
  const doStuff = async () => {
    if (!window.location.hash.includes("/documents")) return;
    try {
      const button = await Monkey.waitForSelector('button.v-btn[value="100"]');
      button.click();
    } catch (e) {}
  };
  Monkey.onLocationChange(doStuff);
  doStuff();
});
