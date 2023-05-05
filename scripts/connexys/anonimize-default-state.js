import(chrome.runtime.getURL("/lib/monkey-script.js")).then(async (Monkey) => {
  document.body.addEventListener("click", async (ev) => {
    if (!ev.target.matches("#cxsAnonymize\\:form .btn")) return;
    const yolo = () => {};
    Monkey.waitForSelector(
      '#cxsAnonymize\\:cxsAnonymizeForm\\:ModalPageBlock option[value="a180Y000000X92MQAS"]'
    )
      .then((option) => (option.closest("select").value = "a180Y000000X92MQAS"))
      .catch(yolo);
    Monkey.waitForSelector(
      '#cxsAnonymize\\:cxsAnonymizeForm\\:ModalPageBlock option[value="a181n00000BDPzNAAX"]'
    )
      .then((option) => (option.closest("select").value = "a181n00000BDPzNAAX"))
      .catch(yolo);
    Monkey.waitForSelector(
      '#cxsAnonymize\\:cxsAnonymizeForm\\:ModalPageBlock option[value="a180Y000000W9U9QAK"]'
    )
      .then((option) => (option.closest("select").value = "a180Y000000W9U9QAK"))
      .catch(yolo);
  });
});
