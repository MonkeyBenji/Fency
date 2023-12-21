let rewrittenHistory = false;

const rewriteHistory = () => {
  if (rewrittenHistory) return; // It's already done
  rewrittenHistory = true;

  const js = (js) => {
    if (typeof js === "function") js = `(${js})()`;
    const script = document.createElement("script");
    const nonce = document.querySelector("script[nonce]").nonce;
    if (nonce) script.nonce = nonce;
    script.appendChild(document.createTextNode(js));
    document.head.appendChild(script);
  };
  js(() => {
    // https://stackoverflow.com/questions/6390341/how-to-detect-if-url-has-changed-after-hash-in-javascript
    history.pushState = ((f) =>
      function pushState() {
        var ret = f.apply(this, arguments);
        window.dispatchEvent(new Event("pushstate"));
        window.dispatchEvent(new Event("locationchange"));
        console.log("push");
        return ret;
      })(history.pushState);

    history.replaceState = ((f) =>
      function replaceState() {
        var ret = f.apply(this, arguments);
        window.dispatchEvent(new Event("replacestate"));
        window.dispatchEvent(new Event("locationchange"));
        console.log("replace");
        return ret;
      })(history.replaceState);

    window.addEventListener("popstate", () => {
      console.log("pop");
      window.dispatchEvent(new Event("locationchange"));
    });
  });
};

const onLocationChange = (callback) => {
  rewriteHistory();
  window.addEventListener("locationchange", callback);
};

export { onLocationChange };
