if (
  [5400, 9000].includes(parseInt(window.location.port)) &&
  (document.body.textContent.includes("AbstractGuard.php:66") ||
    document.body.textContent.includes(
      "Om gebruik te maken van deze website heeft u een @inwork.nl email adres nodig."
    ))
) {
  const url = new URL(window.location);
  url.searchParams.set("login-token", "development");
  window.location = url;
}
