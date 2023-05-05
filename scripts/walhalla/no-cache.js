if (
  ([5400, 9000].includes(parseInt(window.location.port)) ||
    window.location.host === "walhalla.inwork.nl") &&
  !window.location.href.includes("no-cache")
) {
  const url = new URL(window.location);
  url.searchParams.set("no-cache", "1");
  window.location.replace(url);
}
