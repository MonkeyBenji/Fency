"use strict";

(async () => {
  const sendMessage = (fun, args = undefined) =>
    new Promise((resolve, reject) => {
      const message = { fun };
      if (typeof args !== "undefined") message.args = args;
      chrome.runtime.sendMessage(message, resolve);
    });

  const subscriptions = await sendMessage("getSubscriptions");
  const toggleSubscription = async (url, enabled) =>
    await sendMessage("toggleSubscription", { url, enabled });

  const toggles = document.querySelector("#toggles");
  toggles.innerHTML = "";
  subscriptions.forEach((subscription) => {
    // Add toggle
    const div = document.createElement("div");
    const label = document.createElement("label");
    label.textContent = subscription.url.replace(
      /chrome-extension:\/\/.*\//,
      "Fency/"
    );

    const checkbox = document.createElement("input");
    checkbox.type = "checkbox";
    checkbox.checked = subscription.enabled;
    checkbox.addEventListener("change", () => {
      toggleSubscription(subscription.url, checkbox.checked);
    });

    label.appendChild(checkbox);
    div.appendChild(label);
    toggles.appendChild(div);
  });

  document.querySelector("#reset").addEventListener("click", (ev) => {
    ev.preventDefault();
    const uSure =
      "Weet je zeker dat je al je mooie voorkeuren 'n shit in de shredder wilt pleuren?";
    const allDone =
      "Ik heb het in principe nu weggepleurt, maar ik denk dat je er pas echt wat van merkt als je je browsert opnieuw opstart (alle venstertjes)";
    if (confirm(uSure)) {
      chrome.storage.local.clear();
      alert(allDone);
      window.close();
    }
  });
})();
