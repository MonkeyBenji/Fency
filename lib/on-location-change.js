let rewrittenHistory = false;

const rewriteHistory = () => {
  if (rewrittenHistory) return; // It's already done
  rewrittenHistory = true;

  const js = (js) => {
    if (typeof js === "function") js = `(${js})()`;
    const script = document.createElement("script");
    script.innerHTML = js;
    document.head.appendChild(script);
  };
  js(() => {
    // https://stackoverflow.com/questions/6390341/how-to-detect-if-url-has-changed-after-hash-in-javascript
    history.pushState = ((f) =>
      function pushState() {
        var ret = f.apply(this, arguments);
        window.dispatchEvent(new Event("pushstate"));
        window.dispatchEvent(new Event("locationchange"));
        return ret;
      })(history.pushState);

    history.replaceState = ((f) =>
      function replaceState() {
        var ret = f.apply(this, arguments);
        window.dispatchEvent(new Event("replacestate"));
        window.dispatchEvent(new Event("locationchange"));
        return ret;
      })(history.replaceState);

    window.addEventListener("popstate", () => {
      window.dispatchEvent(new Event("locationchange"));
    });
  });
};

const onLocationChange = (callback) => {
  rewriteHistory();
  window.addEventListener("locationchange", callback);
};

export { onLocationChange };
