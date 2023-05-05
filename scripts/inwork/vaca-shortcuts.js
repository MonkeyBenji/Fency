import(chrome.runtime.getURL("/lib/monkey-script.js")).then((Monkey) => {
  const salesforceId = window.location.href.split("/").slice(-2)[0];
  if (!salesforceId.startsWith("a0w")) return;
  Monkey.waitForSelector("h1.header,.entry-title").then((h1) => {
    h1.innerHTML = `<a style="color: #000; text-decoration: none" href="https://inwork.cloudforce.com/${salesforceId}">${h1.innerHTML}</a>`;
  });
});
