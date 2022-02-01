import(chrome.runtime.getURL("/lib/monkey-script.js")).then((Monkey) => {
  Monkey.css(`
a, a *, a:hover {
  animation: rainbow-text 5s infinite !important;
}
@keyframes rainbow-text {
  0% { color: hsl(0, 100%, 50%); }
  20% { color: hsl(60, 100%, 50%); }
  40% { color: hsl(120, 100%, 50%); }
  60% { color: hsl(180, 100%, 50%); }
  80% { color: hsl(240, 100%, 50%); }
  100% { color: hsl(300, 100%, 50%); }
}
`);
});
