import(chrome.runtime.getURL("/lib/monkey-script.js")).then(async (Monkey) => {
  Monkey.css(`.cxsField_STRING {
  max-width: 33%;
  float: left;
  clear: none !important;
}
.cxsField_DATE {
  max-width: 49%;
  float: left;
  clear: none !important;
}
.cxsrecField.cxsField_TEXTAREA .uiInputTextArea {
  height: 70px;
}
`);
});
