console.log(12323123123);

import(chrome.runtime.getURL("/lib/monkey-script.js")).then(async (Monkey) => {
  Monkey.waitForSelector(".entry-title");
  console.log(typeof window.cxsConfig);

  setTimeout(() => {
    // Perform in page context to access window object
    Monkey.js(() => {
      const h = document.querySelector(".entry-title");
      console.log(typeof window.cxsConfig);
      if (typeof window.cxsConfig !== "undefined") {
        h.innerHTML = `<a href="https://inwork.cloudforce.com/${window.cxsConfig.jobId}">${h.innerHTML}</a>`;
      }
    });
  }, 1337);
});
