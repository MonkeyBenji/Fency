import(chrome.runtime.getURL("/lib/monkey-script.js")).then(async (Monkey) => {
  Monkey.css(`html[data-color-mode="dark"][data-theme~="dark:dark"] body {
    --ds-surface: #2b2b2b;
    --ds-surface-sunken: #222222;
    --ds-surface-hovered: #32393F;
    --ds-surface-raised: #32393F;
    --ds-background-input: #32393F;
    --ds-background-input-pressed: #32393F;
    --ds-background-card: #32393F;
  }`);
});
