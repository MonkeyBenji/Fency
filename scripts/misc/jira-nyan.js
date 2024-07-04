import(chrome.runtime.getURL("/lib/monkey-script.js")).then(async (Monkey) => {
  try {
    const div = await Monkey.waitForSelector('#ak-main-content div[aria-label*="nyan"]');
    const img = document.createElement("img");
    img.width = 24;
    img.height = 24;
    img.src = "https://cdn3.emoji.gg/emojis/3878_Nyan_Cat_animated.gif";
    div.prepend(img);
  } catch (e) {}
});
