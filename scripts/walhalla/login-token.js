if (
  window.location.port == 9000 &&
  document.body.textContent.includes("AbstractGuard.php:66")
) {
  const url = new URL(window.location);
  url.searchParams.set("login-token", "development");
  window.location = url;
}
