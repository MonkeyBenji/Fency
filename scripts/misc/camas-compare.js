import(chrome.runtime.getURL("/lib/monkey-script.js")).then((Monkey) => {
  // ================ //
  // The Compare part //
  // ================ //
  const doCompare = async () => {
    const camasEmployees = await Monkey.get("camas-employees", null);
    const camasOmissions = await Monkey.get("camas-omissions", null);
    const crmEmployees = await Monkey.get("crm-employees", null);
    const crmOmissions = await Monkey.get("crm-omissions", null);

    if (camasEmployees === null) return setTimeout(doCompare, 1337);
    if (camasOmissions === null) return setTimeout(doCompare, 1337);
    if (crmEmployees === null) return setTimeout(doCompare, 1337);
    if (crmOmissions === null) return setTimeout(doCompare, 1337);

    const camasEmployeesNotExistingInCRM = Object.entries(camasEmployees)
      .filter(([nr]) => !(nr in crmEmployees))
      .sort((a, b) =>
        a[1].bv === b[1].bv ? b[0] - a[0] : a[1].bv.localeCompare(b[1].bv)
      )
      .map(([nr, employee]) => `${nr} ${employee.name} (${employee.bv})`)
      .join("\n");
    const crmEmployeesNotExistingInCamas = Object.entries(crmEmployees)
      .filter(([nr]) => !(nr in camasEmployees))
      .sort((a, b) =>
        a[1].bv === b[1].bv ? b[0] - a[0] : a[1].bv.localeCompare(b[1].bv)
      )
      .map(([nr, employee]) => `${nr} ${employee.name} (${employee.bv})`)
      .join("\n");
    const camasOmissionsNotExistingInCRM = Object.entries(camasOmissions)
      .filter(([nr]) => !(nr in crmOmissions))
      .sort((a, b) =>
        a[1].bv === b[1].bv ? b[0] - a[0] : a[1].bv.localeCompare(b[1].bv)
      )
      .map(([nr, omission]) => `${nr} ${omission.name} (${omission.bv})`)
      .join("\n");
    const crmOmissionsNotExistingInCamas = Object.entries(crmOmissions)
      .filter(([nr]) => !(nr in camasOmissions))
      .sort((a, b) =>
        a[1].bv === b[1].bv ? b[0] - a[0] : a[1].bv.localeCompare(b[1].bv)
      )
      .map(([nr, omission]) => `${nr} ${omission.name} (${omission.bv})`)
      .join("\n");

    const complaints = [
      [
        "Volgens Camas staat er van deze medewerkers nog een verzuim open, maar InCTRL vindt van niet",
        camasOmissionsNotExistingInCRM,
      ],
      [
        "Volgens InCTRL staat er nog een verzuim open van deze medewerkers, maar Camas weet van niks",
        crmOmissionsNotExistingInCamas,
      ],
      [
        "Deze medewerkers zijn volgens Camas in dienst, maar InCTRL vindt van niet",
        camasEmployeesNotExistingInCRM,
      ],
      [
        "Deze medewerkers zijn volgens InCTRL in dienst, maar Camas weet dan weer van niks",
        crmEmployeesNotExistingInCamas,
      ],
    ].filter(([type, issues]) => issues.length);

    const body = `Hey Benji,

Ik zat dus ff te vergelijken wat er in Camas staat en wat in InCTRL staat en er klopt weer geen reet van:
${complaints
  .map(([type, issues]) => "<strong>" + type + "</strong><p>" + issues + "</p>")
  .join("")}
Kan jij ff checken wat er nu weer aan de hand is?

Groetjes,
Stefan Stefan
    `.replaceAll("\n", "<br>\n");
    document.title = "Pfffffft (CAMAS)";
    document.body.innerHTML = body;

    Monkey.set("camas-employees", null);
    Monkey.set("camas-omissions", null);
    Monkey.set("crm-employees", null);
    Monkey.set("crm-omissions", null);
  };

  // ============== //
  // The Camas part //
  // ============== //
  if (
    window.location.pathname === "/Overzichten/Werknemers" ||
    window.location.pathname === "/Overzichten/Dossiers"
  ) {
    Monkey.waitForSelector(".ps-sbd-search-button").then((searchButton) => {
      const button = document.createElement("button");
      button.textContent = "Zoek de Verschillen";
      searchButton.parentElement.appendChild(button);

      button.addEventListener("click", () => {
        button.disabled = true;
        button.textContent = "Ff wachten...";
        window.open("https://inctrl.inwork.nl/profile/?camas-compare");

        // Fetch Camas active Employees
        fetch(
          "https://werkgever.perspectief.eu//DesktopModules/sbd/API/Search/Search",
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: '{"sbd":"EmployeeWG","portalDependent":false,"query":[{"value":null,"sbdOperator":"Contains","name":"naam"},{"value":"Ja","sbdOperator":"Equals","name":"actiefdienstverband"},{"value":null,"sbdOperator":"Equals","name":"geboortedatum"},{"value":null,"sbdOperator":"Contains","name":"bedrijfsnaam"},{"value":null,"sbdOperator":"Contains","name":"bsn"},{"value":null,"sbdOperator":"Contains","name":"personeelsnummer"}]}',
          }
        )
          .then((response) => response.json())
          .then((camasEmployees) => {
            camasEmployees = camasEmployees.reduce((map, employee) => {
              map[employee.Personeelsnummer] = {
                name: employee.Naam,
                bv: employee.Bedrijfsnaam,
              };
              return map;
            }, {});
            console.log("camas-employees", camasEmployees);
            Monkey.set("camas-employees", camasEmployees);
            button.textContent = "Nog ff wachten...";

            // Fetch Camas active Omissions
            fetch(
              "https://werkgever.perspectief.eu//DesktopModules/sbd/API/Search/Search",
              {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: '{"sbd":"AbsenceDossierOverviewCustomer","portalDependent":false,"query":[{"value":null,"sbdOperator":"Contains","name":"werknemer"},{"value":"Ja","sbdOperator":"Equals","name":"lopendverzuim"},{"value":null,"sbdOperator":"Equals","name":"datumverzuim"},{"value":null,"sbdOperator":"Contains","name":"strverzuimnummer"},{"value":null,"sbdOperator":"Contains","name":"verzuimduur"},{"value":"Alles","sbdOperator":"Equals","name":"strsoortverzuimdossier"},{"value":null,"sbdOperator":"Contains","name":"werkgever"}]}',
              }
            )
              .then((response) => response.json())
              .then((camasOmissions) => {
                camasOmissions = camasOmissions.reduce((map, omission) => {
                  const employeeNumber =
                    Object.entries(camasEmployees).filter(
                      ([_, employee]) => employee.name === omission.Werknemer
                    )?.[0]?.[0] ?? Math.round(-100 * Math.random());
                  map[employeeNumber] = {
                    name: omission.Werknemer,
                    bv: omission.Werkgever,
                  };
                  return map;
                }, {});
                console.log("camas-omissions", camasOmissions);
                Monkey.set("camas-omissions", camasOmissions);
                button.textContent = "🍕!";
              });
          });
      });
    });
  }

  // =============== //
  // The InCTRL part //
  // =============== //
  if (window.location.search === "?camas-compare") {
    // Fetch InCTRL active Employees
    const dmy = new Date()
      .toISOString()
      .split("T")[0]
      .split("-")
      .reverse()
      .join("-");
    fetch("https://inctrl.inwork.nl/employee/search-ajax/", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: `draw=2&columns%5B0%5D%5Bdata%5D=0&columns%5B0%5D%5Bname%5D=&columns%5B0%5D%5Bsearchable%5D=true&columns%5B0%5D%5Borderable%5D=true&columns%5B0%5D%5Bsearch%5D%5Bvalue%5D=&columns%5B0%5D%5Bsearch%5D%5Bregex%5D=false&columns%5B1%5D%5Bdata%5D=1&columns%5B1%5D%5Bname%5D=&columns%5B1%5D%5Bsearchable%5D=true&columns%5B1%5D%5Borderable%5D=true&columns%5B1%5D%5Bsearch%5D%5Bvalue%5D=&columns%5B1%5D%5Bsearch%5D%5Bregex%5D=false&columns%5B2%5D%5Bdata%5D=2&columns%5B2%5D%5Bname%5D=&columns%5B2%5D%5Bsearchable%5D=true&columns%5B2%5D%5Borderable%5D=true&columns%5B2%5D%5Bsearch%5D%5Bvalue%5D=&columns%5B2%5D%5Bsearch%5D%5Bregex%5D=false&columns%5B3%5D%5Bdata%5D=3&columns%5B3%5D%5Bname%5D=&columns%5B3%5D%5Bsearchable%5D=true&columns%5B3%5D%5Borderable%5D=true&columns%5B3%5D%5Bsearch%5D%5Bvalue%5D=&columns%5B3%5D%5Bsearch%5D%5Bregex%5D=false&columns%5B4%5D%5Bdata%5D=4&columns%5B4%5D%5Bname%5D=&columns%5B4%5D%5Bsearchable%5D=true&columns%5B4%5D%5Borderable%5D=true&columns%5B4%5D%5Bsearch%5D%5Bvalue%5D=&columns%5B4%5D%5Bsearch%5D%5Bregex%5D=false&columns%5B5%5D%5Bdata%5D=5&columns%5B5%5D%5Bname%5D=&columns%5B5%5D%5Bsearchable%5D=true&columns%5B5%5D%5Borderable%5D=true&columns%5B5%5D%5Bsearch%5D%5Bvalue%5D=&columns%5B5%5D%5Bsearch%5D%5Bregex%5D=false&columns%5B6%5D%5Bdata%5D=6&columns%5B6%5D%5Bname%5D=&columns%5B6%5D%5Bsearchable%5D=true&columns%5B6%5D%5Borderable%5D=true&columns%5B6%5D%5Bsearch%5D%5Bvalue%5D=&columns%5B6%5D%5Bsearch%5D%5Bregex%5D=false&columns%5B7%5D%5Bdata%5D=7&columns%5B7%5D%5Bname%5D=&columns%5B7%5D%5Bsearchable%5D=true&columns%5B7%5D%5Borderable%5D=true&columns%5B7%5D%5Bsearch%5D%5Bvalue%5D=&columns%5B7%5D%5Bsearch%5D%5Bregex%5D=false&columns%5B8%5D%5Bdata%5D=8&columns%5B8%5D%5Bname%5D=&columns%5B8%5D%5Bsearchable%5D=true&columns%5B8%5D%5Borderable%5D=true&columns%5B8%5D%5Bsearch%5D%5Bvalue%5D=&columns%5B8%5D%5Bsearch%5D%5Bregex%5D=false&columns%5B9%5D%5Bdata%5D=9&columns%5B9%5D%5Bname%5D=&columns%5B9%5D%5Bsearchable%5D=true&columns%5B9%5D%5Borderable%5D=true&columns%5B9%5D%5Bsearch%5D%5Bvalue%5D=&columns%5B9%5D%5Bsearch%5D%5Bregex%5D=false&columns%5B10%5D%5Bdata%5D=10&columns%5B10%5D%5Bname%5D=&columns%5B10%5D%5Bsearchable%5D=true&columns%5B10%5D%5Borderable%5D=true&columns%5B10%5D%5Bsearch%5D%5Bvalue%5D=&columns%5B10%5D%5Bsearch%5D%5Bregex%5D=false&columns%5B11%5D%5Bdata%5D=11&columns%5B11%5D%5Bname%5D=&columns%5B11%5D%5Bsearchable%5D=true&columns%5B11%5D%5Borderable%5D=true&columns%5B11%5D%5Bsearch%5D%5Bvalue%5D=&columns%5B11%5D%5Bsearch%5D%5Bregex%5D=false&columns%5B12%5D%5Bdata%5D=12&columns%5B12%5D%5Bname%5D=&columns%5B12%5D%5Bsearchable%5D=true&columns%5B12%5D%5Borderable%5D=true&columns%5B12%5D%5Bsearch%5D%5Bvalue%5D=&columns%5B12%5D%5Bsearch%5D%5Bregex%5D=false&columns%5B13%5D%5Bdata%5D=13&columns%5B13%5D%5Bname%5D=&columns%5B13%5D%5Bsearchable%5D=true&columns%5B13%5D%5Borderable%5D=true&columns%5B13%5D%5Bsearch%5D%5Bvalue%5D=&columns%5B13%5D%5Bsearch%5D%5Bregex%5D=false&columns%5B14%5D%5Bdata%5D=14&columns%5B14%5D%5Bname%5D=&columns%5B14%5D%5Bsearchable%5D=true&columns%5B14%5D%5Borderable%5D=true&columns%5B14%5D%5Bsearch%5D%5Bvalue%5D=&columns%5B14%5D%5Bsearch%5D%5Bregex%5D=false&columns%5B15%5D%5Bdata%5D=15&columns%5B15%5D%5Bname%5D=&columns%5B15%5D%5Bsearchable%5D=true&columns%5B15%5D%5Borderable%5D=true&columns%5B15%5D%5Bsearch%5D%5Bvalue%5D=&columns%5B15%5D%5Bsearch%5D%5Bregex%5D=false&columns%5B16%5D%5Bdata%5D=16&columns%5B16%5D%5Bname%5D=&columns%5B16%5D%5Bsearchable%5D=true&columns%5B16%5D%5Borderable%5D=true&columns%5B16%5D%5Bsearch%5D%5Bvalue%5D=&columns%5B16%5D%5Bsearch%5D%5Bregex%5D=false&columns%5B17%5D%5Bdata%5D=17&columns%5B17%5D%5Bname%5D=&columns%5B17%5D%5Bsearchable%5D=true&columns%5B17%5D%5Borderable%5D=true&columns%5B17%5D%5Bsearch%5D%5Bvalue%5D=&columns%5B17%5D%5Bsearch%5D%5Bregex%5D=false&columns%5B18%5D%5Bdata%5D=18&columns%5B18%5D%5Bname%5D=&columns%5B18%5D%5Bsearchable%5D=true&columns%5B18%5D%5Borderable%5D=true&columns%5B18%5D%5Bsearch%5D%5Bvalue%5D=&columns%5B18%5D%5Bsearch%5D%5Bregex%5D=false&columns%5B19%5D%5Bdata%5D=19&columns%5B19%5D%5Bname%5D=&columns%5B19%5D%5Bsearchable%5D=true&columns%5B19%5D%5Borderable%5D=true&columns%5B19%5D%5Bsearch%5D%5Bvalue%5D=&columns%5B19%5D%5Bsearch%5D%5Bregex%5D=false&columns%5B20%5D%5Bdata%5D=20&columns%5B20%5D%5Bname%5D=&columns%5B20%5D%5Bsearchable%5D=true&columns%5B20%5D%5Borderable%5D=true&columns%5B20%5D%5Bsearch%5D%5Bvalue%5D=&columns%5B20%5D%5Bsearch%5D%5Bregex%5D=false&columns%5B21%5D%5Bdata%5D=21&columns%5B21%5D%5Bname%5D=&columns%5B21%5D%5Bsearchable%5D=true&columns%5B21%5D%5Borderable%5D=false&columns%5B21%5D%5Bsearch%5D%5Bvalue%5D=&columns%5B21%5D%5Bsearch%5D%5Bregex%5D=false&order%5B0%5D%5Bcolumn%5D=3&order%5B0%5D%5Bdir%5D=asc&start=0&length=1000&search%5Bvalue%5D=&search%5Bregex%5D=false&filter%5Baccount%5D%5BaccountAddress%5D%5Blat%5D=&filter%5Baccount%5D%5BaccountAddress%5D%5Blng%5D=&filter%5Baccount%5D%5Bfullname%5D=&filter%5BlistOrganisationType%5D=&filter%5Brecruiter%5D=&filter%5Bjobcoach%5D=&filter%5Bgroup%5D=&filter%5Bemployment%5D%5Bstart%5D=${dmy}&filter%5Bemployment%5D%5Bend%5D=${dmy}`,
    })
      .then((response) => response.json())
      .then((crmEmployees) => {
        crmEmployees = crmEmployees.data.reduce((map, row) => {
          if (!row[15].includes(" Flex ")) {
            map[row[0]] = {
              name: row[1],
              bv: row[15],
            };
          }
          return map;
        }, {});
        Monkey.set("crm-employees", crmEmployees);

        // Fetch Camas active Omissions
        fetch("https://inctrl.inwork.nl/overview/omission/list-ajax/", {
          method: "POST",
          headers: { "Content-Type": "application/x-www-form-urlencoded" },
          body: `draw=2&columns%5B0%5D%5Bdata%5D=0&columns%5B0%5D%5Bname%5D=&columns%5B0%5D%5Bsearchable%5D=true&columns%5B0%5D%5Borderable%5D=true&columns%5B0%5D%5Bsearch%5D%5Bvalue%5D=&columns%5B0%5D%5Bsearch%5D%5Bregex%5D=false&columns%5B1%5D%5Bdata%5D=1&columns%5B1%5D%5Bname%5D=&columns%5B1%5D%5Bsearchable%5D=true&columns%5B1%5D%5Borderable%5D=true&columns%5B1%5D%5Bsearch%5D%5Bvalue%5D=&columns%5B1%5D%5Bsearch%5D%5Bregex%5D=false&columns%5B2%5D%5Bdata%5D=2&columns%5B2%5D%5Bname%5D=&columns%5B2%5D%5Bsearchable%5D=true&columns%5B2%5D%5Borderable%5D=true&columns%5B2%5D%5Bsearch%5D%5Bvalue%5D=&columns%5B2%5D%5Bsearch%5D%5Bregex%5D=false&columns%5B3%5D%5Bdata%5D=3&columns%5B3%5D%5Bname%5D=&columns%5B3%5D%5Bsearchable%5D=true&columns%5B3%5D%5Borderable%5D=true&columns%5B3%5D%5Bsearch%5D%5Bvalue%5D=&columns%5B3%5D%5Bsearch%5D%5Bregex%5D=false&columns%5B4%5D%5Bdata%5D=4&columns%5B4%5D%5Bname%5D=&columns%5B4%5D%5Bsearchable%5D=true&columns%5B4%5D%5Borderable%5D=true&columns%5B4%5D%5Bsearch%5D%5Bvalue%5D=&columns%5B4%5D%5Bsearch%5D%5Bregex%5D=false&columns%5B5%5D%5Bdata%5D=5&columns%5B5%5D%5Bname%5D=&columns%5B5%5D%5Bsearchable%5D=true&columns%5B5%5D%5Borderable%5D=true&columns%5B5%5D%5Bsearch%5D%5Bvalue%5D=&columns%5B5%5D%5Bsearch%5D%5Bregex%5D=false&columns%5B6%5D%5Bdata%5D=6&columns%5B6%5D%5Bname%5D=&columns%5B6%5D%5Bsearchable%5D=true&columns%5B6%5D%5Borderable%5D=true&columns%5B6%5D%5Bsearch%5D%5Bvalue%5D=&columns%5B6%5D%5Bsearch%5D%5Bregex%5D=false&columns%5B7%5D%5Bdata%5D=7&columns%5B7%5D%5Bname%5D=&columns%5B7%5D%5Bsearchable%5D=true&columns%5B7%5D%5Borderable%5D=true&columns%5B7%5D%5Bsearch%5D%5Bvalue%5D=&columns%5B7%5D%5Bsearch%5D%5Bregex%5D=false&columns%5B8%5D%5Bdata%5D=8&columns%5B8%5D%5Bname%5D=&columns%5B8%5D%5Bsearchable%5D=true&columns%5B8%5D%5Borderable%5D=true&columns%5B8%5D%5Bsearch%5D%5Bvalue%5D=&columns%5B8%5D%5Bsearch%5D%5Bregex%5D=false&columns%5B9%5D%5Bdata%5D=9&columns%5B9%5D%5Bname%5D=&columns%5B9%5D%5Bsearchable%5D=true&columns%5B9%5D%5Borderable%5D=true&columns%5B9%5D%5Bsearch%5D%5Bvalue%5D=&columns%5B9%5D%5Bsearch%5D%5Bregex%5D=false&columns%5B10%5D%5Bdata%5D=10&columns%5B10%5D%5Bname%5D=&columns%5B10%5D%5Bsearchable%5D=true&columns%5B10%5D%5Borderable%5D=true&columns%5B10%5D%5Bsearch%5D%5Bvalue%5D=&columns%5B10%5D%5Bsearch%5D%5Bregex%5D=false&columns%5B11%5D%5Bdata%5D=11&columns%5B11%5D%5Bname%5D=&columns%5B11%5D%5Bsearchable%5D=true&columns%5B11%5D%5Borderable%5D=true&columns%5B11%5D%5Bsearch%5D%5Bvalue%5D=&columns%5B11%5D%5Bsearch%5D%5Bregex%5D=false&columns%5B12%5D%5Bdata%5D=12&columns%5B12%5D%5Bname%5D=&columns%5B12%5D%5Bsearchable%5D=true&columns%5B12%5D%5Borderable%5D=true&columns%5B12%5D%5Bsearch%5D%5Bvalue%5D=&columns%5B12%5D%5Bsearch%5D%5Bregex%5D=false&columns%5B13%5D%5Bdata%5D=13&columns%5B13%5D%5Bname%5D=&columns%5B13%5D%5Bsearchable%5D=true&columns%5B13%5D%5Borderable%5D=true&columns%5B13%5D%5Bsearch%5D%5Bvalue%5D=&columns%5B13%5D%5Bsearch%5D%5Bregex%5D=false&columns%5B14%5D%5Bdata%5D=14&columns%5B14%5D%5Bname%5D=&columns%5B14%5D%5Bsearchable%5D=true&columns%5B14%5D%5Borderable%5D=true&columns%5B14%5D%5Bsearch%5D%5Bvalue%5D=&columns%5B14%5D%5Bsearch%5D%5Bregex%5D=false&order%5B0%5D%5Bcolumn%5D=0&order%5B0%5D%5Bdir%5D=desc&start=0&length=100&search%5Bvalue%5D=&search%5Bregex%5D=false&filter%5BlistOrganisationType%5D=&filter%5Bjobcoach%5D=&filter%5BlistOmissionReason%5D=&filter%5Bfrom%5D=${dmy}&filter%5Bto%5D=${dmy}&filter%5BinService%5D=1`,
        })
          .then((response) => response.json())
          .then((crmOmissions) => {
            crmOmissions = crmOmissions.data.reduce((map, row) => {
              map[row[2]] = {
                name: row[3],
                bv: row[9],
              };
              return map;
            }, {});

            Monkey.set("crm-omissions", crmOmissions);
            doCompare();
          });
      });
  }
});
