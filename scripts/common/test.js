// https://fency.dev/sample/sample-form-1.html
import(chrome.runtime.getURL("/lib/monkey-script.js")).then(async (Monkey) => {
  document.querySelector('[name="first-name"]').focus();
  await Monkey.type("Henk");
  document.querySelector('[name="prefix"]').focus();
  await Monkey.type("de");
  document.querySelector('[name="last-name"]').focus();
  await Monkey.type("Vries");
  document.querySelector('[name="life-story"]').focus();
  await Monkey.type(`Hoi,

Ik ben Henk.

Met vriendelijke groet,
Henk de Vries`);
  // console.log(await Monkey.coordsDialog());
});
