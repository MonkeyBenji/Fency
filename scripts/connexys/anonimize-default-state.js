import(chrome.runtime.getURL("/lib/monkey-script.js")).then(async (Monkey) => {
  document.body.addEventListener("click", async (ev) => {
    if (!ev.target.matches("#cxsAnonymize\\:form .btn")) return;
    const select = await Monkey.waitForSelector(
      "#cxsAnonymize\\:cxsAnonymizeForm\\:ModalPageBlock select"
    );
    select.value = "a180Y000000X92MQAS";
  });
});
