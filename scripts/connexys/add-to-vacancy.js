import(chrome.runtime.getURL("/lib/monkey-script.js")).then(async (Monkey) => {
  const RECENT_POSITIONS_KEY = "recentPositions";
  const LAST_RECORDTYPE_KEY = "lastJobAppRecordType";
  let thisButton = null;

  const boopVaca = async (id, title) => {
    const recentPositions = await Monkey.get(RECENT_POSITIONS_KEY, []);
    const found = recentPositions.find((position) => position.id === id);
    const lastVisited = Date.now();
    if (found) {
      // Update last visited
      found.lastVisited = lastVisited;
      found.title = title;
    } else {
      // Create new
      recentPositions.push({ id, title, lastVisited });
    }
    recentPositions.sort((a, b) => b.lastVisited - a.lastVisited);
    await Monkey.set(RECENT_POSITIONS_KEY, recentPositions);
  };

  const doStuff = async () => {
    if (thisButton !== null) {
      thisButton.unregister();
      thisButton = null;
    }

    // Keep track of recent vaca's
    if (window.location.pathname.includes("/a0w")) {
      // Wait for title change
      const watcher = new MutationObserver(async () => {
        if (!window.location.pathname.includes("/a0w")) {
          return watcher.disconnect();
        }
        const positionId = window.location.pathname
          .split("/")
          .filter((s) => s.startsWith("a0w"))[0];
        const title = document.title.split(" | ")[0];
        await boopVaca(positionId, title);
      });
      watcher.observe(document.querySelector("title"), {
        subtree: true,
        characterData: true,
        childList: true,
      });
    }

    // Keep track of record type choices and choose same one again
    if (window.location.pathname.includes("/one.app")) {
      document.body.addEventListener("click", async (ev) => {
        const selectedRadio = document.querySelector(
          'input[type="radio"][value^="012"]:checked'
        );
        if (selectedRadio) {
          await Monkey.set(LAST_RECORDTYPE_KEY, selectedRadio.value);
        }
      });

      const lastRecordType = await Monkey.get(LAST_RECORDTYPE_KEY, null);
      if (lastRecordType) {
        const option = await Monkey.waitForSelector(
          `input[type="radio"][value="${lastRecordType}"]`
        );
        if (option) {
          option.click();
          document.querySelector("button.slds-button_brand").click();
        }
      }
    }

    // Add "add to basket" FAB
    if (window.location.pathname.includes("/a0A")) {
      thisButton = Monkey.fab(
        "fa fa-shopping-basket",
        "Voeg toe aan vacature",
        async () => {
          const recentPositions = await Monkey.get(RECENT_POSITIONS_KEY, []);
          if (recentPositions.length === 0) {
            alert(
              "Open eerst eenmalig de vacature waaraan je de kandidaat wilt koppelen"
            );
            return;
          }
          const positionId = await Monkey.select(
            "Vacature",
            recentPositions.map(({ id, title }) => ({
              value: id,
              text: title,
            })),
            recentPositions[0].id
          );
          const positionName = recentPositions.find(
            ({ id }) => id === positionId
          ).title;

          const candidateId = window.location.pathname
            .split("/")
            .filter((s) => s.startsWith("a0A"))[0];
          const candidateName = document.title.split(" | ")[0];

          const args = {
            componentDef: "cxsrec:EasyCreateJobApplication",
            attributes: {
              additionalDefaults: [
                {
                  name: "cxsrec__Candidate__c",
                  value: candidateId,
                  displayValue: candidateName,
                  onlyWhenOnScreen: false,
                },
                {
                  name: "cxsrec__Position__c",
                  value: positionId,
                  displayValue: positionName,
                  onlyWhenOnScreen: false,
                },
              ],
            },
            state: {},
          };

          window.open(`/one/one.app#${btoa(JSON.stringify(args))}`);
        }
      );
    }
  };
  Monkey.onLocationChange(doStuff);
  doStuff();
});
