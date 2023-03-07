import(chrome.runtime.getURL("/lib/monkey-script.js")).then((Monkey) => {
  Monkey.css("#bb-domain-switcher {display: none}"); // Yes I'm Dutch
  Monkey.css("#bb-age-check {display: none}"); // Yes I'm 18+
  Monkey.waitForSelector(".inhoud-label")
    .then(() => {
      document.querySelectorAll(".inhoud-label").forEach((inhoudLabel) => {
        try {
          const [amount, unit] = inhoudLabel.textContent.trim().split(" ");
          let amountMl = parseFloat(amount);
          if (unit === "liter") amountMl *= 1000;
          else if (unit === "cl") amountMl *= 10;
          else return console.log(`unexpected unit ${unit}`);

          const priceSpan = inhoudLabel
            .closest(".product-item")
            .querySelector(".price");
          const price = parseFloat(
            priceSpan.textContent.trim().substring(2).replace(",", ".")
          );
          const pricePpl = (price / amountMl) * 1000;
          const pricePplFormatted = new Intl.NumberFormat("nl-NL", {
            style: "currency",
            currency: "EUR",
          }).format(pricePpl);

          const div = document.createElement("div");
          div.style.fontSize = "0.6em";
          div.textContent = `${pricePplFormatted} per l.`;

          priceSpan.appendChild(div);
        } catch (e) {
          console.log(e);
        }
      });
    })
    .catch(() => {});
});
