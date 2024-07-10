import(chrome.runtime.getURL("/lib/monkey-script.js")).then(async (Monkey) => {
  setTimeout(async () => {
    try {
      const div = await Monkey.waitForSelector('#ak-main-content div[aria-label*="nyan"]');
      const img = document.createElement("img");
      img.width = 24;
      img.height = 24;
      img.src = "https://cdn3.emoji.gg/emojis/3878_Nyan_Cat_animated.gif";
      div.prepend(img);
    } catch (e) {}
  }, 1);
  setTimeout(async () => {
    try {
      const div = await Monkey.waitForSelector('#ak-main-content div[aria-label="Hup Holland, Hup!"]');
      div.innerHTML =
        '<span style="color: red">Hup </span><span style="color: white">Holland</span><span style="color: #579dff">, Hup</span><span style="color: orange; font-weight: bold">!</span>';
    } catch (e) {}
  }, 1);
});
