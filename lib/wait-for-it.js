// TODO compare performance with observer style checking
const waitForSelector = (selector, timeout = 9001) =>
  new Promise((resolve, reject) => {
    const failTimer = setTimeout(
      () =>
        reject(`Did not find element matching ${selector} within ${timeout}ms`),
      timeout
    );
    const checkScript = () => {
      const element = document.querySelector(selector);
      if (element) {
        clearTimeout(failTimer);
        return resolve(element);
      }
      setTimeout(checkScript, 10);
    };
    checkScript();
  });

const waitForTrue = (callback, timeout = 9001) =>
  new Promise((resolve, reject) => {
    const failTimer = setTimeout(
      () =>
        reject(`Did not find element matching ${selector} within ${timeout}ms`),
      timeout
    );
    const checkScript = () => {
      const result = callback();
      if (result) {
        clearTimeout(failTimer);
        return resolve(result);
      }
      setTimeout(checkScript, 10);
    };
    checkScript();
  });

export { waitForSelector, waitForTrue };
