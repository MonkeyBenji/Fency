import(chrome.runtime.getURL("/lib/monkey-script.js")).then(async (Monkey) => {
  if (location.href.includes("workbench.developerforce.com/login.php")) {
    const termsAccepted = await Monkey.waitForSelector("#termsAccepted");
    termsAccepted.checked = true;
    const loginBtn = await Monkey.waitForSelector("#loginBtn");
    loginBtn.click();
  }
  if (location.href.includes("login.salesforce.com/")) {
    console.log("login", location.href);
    const mydomainLink = await Monkey.waitForSelector("#mydomainLink");
    mydomainLink.click();
    const mydomain = await Monkey.waitForSelector("#mydomain");
    mydomain.value = "inwork.cloudforce.com";
    const mydomainContinue = await Monkey.waitForSelector("#mydomainContinue");
    mydomainContinue.click();
  }
});
