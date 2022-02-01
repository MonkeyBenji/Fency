import(chrome.runtime.getURL("/lib/monkey-script.js")).then(async (Monkey) => {
  Monkey.css(`
  th.cellContainer > span > a:not(.deblurred), /* Name */
  td.cellContainer > span > a.emailuiFormattedEmail:not(.deblurred), /* E-mail */
  td.cellContainer > span > span.forceOutputPhone:not(.deblurred), /* Phone */
  one-app-nav-bar-menu-item > a[href^="/lightning/r/"][href$="/view"]:not([href*="/cxsrec__cxsCandidate__c/"]) > span > span, /* Name recent */
  table.data-grid-full-table .data-grid-table-row td:nth-of-type(1), /* First col of report results */
  table.data-grid-full-table .data-grid-table-row td:nth-of-type(2) /* Second col of report results */
  {
     color: transparent;
     text-shadow: 0 0 5px rgba(0,0,0,0.5);
  }
  `);
});
