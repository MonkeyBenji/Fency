import(chrome.runtime.getURL("/lib/monkey-script.js")).then(async (Monkey) => {
  if (
    window.location.pathname === "/one/one.app" &&
    atob(decodeURIComponent(window.location.hash.substring(1))).includes(
      "reports:reportBuilder"
    )
  ) {
    Monkey.js(() => {
      // Hijack XHR to hijack picklist values
      const getMultipicklistValuesFromJson = (data) => {
        const cats = data.actions[0].returnValue.reportTypeMetadata.categories;
        const multipicklistValues = {};
        cats.forEach((cat) => {
          Object.values(cat.columns).forEach((col) => {
            if (col.dataType !== "multipicklist") return;
            multipicklistValues[col.label] = col.filterValues.map(
              (val) => val.label
            );
          });
        });
        return multipicklistValues;
      };

      !(function (send) {
        XMLHttpRequest.prototype.send = function (postData) {
          if (postData.includes("queryReportType")) {
            this.addEventListener("load", () => {
              try {
                const data = JSON.parse(this.response);
                localStorage.setItem(
                  "multipicklistValues",
                  JSON.stringify(getMultipicklistValuesFromJson(data))
                );
              } catch (e) {}
            });
          }
          send.call(this, postData);
        };
      })(XMLHttpRequest.prototype.send);
    });
  } else {
    // On new multipicklist filter set inclusive as default
    document.addEventListener(
      "click",
      async (ev) => {
        try {
          if (!ev.target.closest("ul.report-combobox-listbox")) return;
          const popover = await Monkey.waitForSelector(
            "section.reports-filter-popover"
          );
          const title = popover
            .querySelector("h2")
            .textContent.trim()
            .split(" ")
            .slice(2)
            .join(" ");
          const multipicklistValues = JSON.parse(
            localStorage.getItem("multipicklistValues")
          );

          if (!title in multipicklistValues) return;

          const operator = popover.querySelector("button.slds-picklist__label");
          console.log("operator", operator);
          operator.click();
          const allInclusive = await Monkey.waitForSelector(
            "UL.dropdown__list > li:nth-of-type(3) > a"
          );
          allInclusive.click();
        } catch (e) {
          console.warn(e);
        }
      },
      true
    );

    // Wait for filter click to add some options
    document.addEventListener(
      "click",
      async (ev) => {
        try {
          if (
            !ev.target.closest("ul.report-combobox-listbox") &&
            !ev.target.closest(".filters-panel")
          )
            return;
          const popover = await Monkey.waitForSelector(
            "section.reports-filter-popover"
          );
          const title = popover
            .querySelector("h2")
            .textContent.trim()
            .split(" ")
            .slice(2)
            .join(" ");
          const multipicklistValues = JSON.parse(
            localStorage.getItem("multipicklistValues")
          );

          if (!title in multipicklistValues) return;

          const input = popover.querySelector("input.slds-input");
          if (input.getAttribute("list")) return;
          input.setAttribute("list", "multipicklistValues");

          const datalist = document.createElement("datalist");
          datalist.setAttribute("id", "multipicklistValues");
          input.parentNode.appendChild(datalist);

          const addOptions = () => {
            datalist.innerHTML = "";
            let currentValues = input.value.split(",").map((s) => s.trim());
            const lastValue = currentValues.slice(-1)[0];
            const possibleValues = multipicklistValues[title];
            if (!possibleValues.includes(lastValue))
              currentValues = currentValues.slice(0, -1);
            possibleValues.forEach((value) => {
              if (currentValues.includes(value)) return;
              const option = document.createElement("option");
              if (currentValues.length) {
                option.value = currentValues.join(", ") + ", " + value;
              }
              option.textContent = value;
              datalist.appendChild(option);
            });
          };
          addOptions();
          input.addEventListener("input", addOptions);
        } catch (e) {
          console.warn(e);
        }
      },
      true
    );
  }
});
