import(chrome.runtime.getURL("/lib/monkey-script.js")).then((Monkey) => {
  // Auto click download link
  if (window.location.host === "pokemonwereld.eu") {
    Monkey.waitForSelector('.middlediv a[target="_blank"]')
      .then((a) => {
        a.click();
      })
      .catch(() => {});
  }

  if (window.location.host === "linkvertise.com") {
    // Linkvertise, cookies
    Monkey.waitForSelector('button[mode="secondary"]')
      .then((button) => {
        button.click();
        Monkey.waitForSelector('button[mode="primary"]')
          .then((button) => {
            button.click();
          })
          .catch(() => {});
      })
      .catch(() => {});

    // Join the dark side, we got ads
    Monkey.waitForSelector("a.lv-dark-btn")
      .then(async (a) => {
        a.click();
      })
      .catch(() => {});

    // Ooh, very interesting articles, bye!
    Monkey.waitForSelector("#webModal .close-icon")
      .then(async (a) => {
        a.click();
        await Monkey.sleep(123);
        // Click that button again, now give me the download! (disable popup blocker)
        Monkey.waitForSelector("a.lv-dark-btn")
          .then(async (a) => {
            a.click();
          })
          .catch(() => {});
      })
      .catch(() => {});
  }

  if (window.location.host === "www.google.com") {
    // I am not a robot... am I?
    Monkey.waitForSelector(".recaptcha-checkbox")
      .then(async (checkbox) => {
        await Monkey.sleep(Math.random() * 1337);
        checkbox.click();
      })
      .catch(() => {});
  }

  // Mega! We're there, finally!
  if (window.location.host === "mega.nz")
    Monkey.waitForSelector("button.js-standard-download")
      .then(async (button) => {
        button.click();
      })
      .catch(() => {});

  // Well that was easy!
});
