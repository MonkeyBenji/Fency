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
  console.log(subscriptions);

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
})();
