import(chrome.runtime.getURL("/lib/monkey-script.js")).then(async (Monkey) => {
  const sortOne = () => {
    const parseCxsNlDate = (s) => {
      if (s === "") return "1970-01-01";
      const parts = s.split("-");
      const year = parts[2];
      const month = (
        "" +
        ([
          "jan.",
          "feb.",
          "mrt.",
          "apr.",
          "mei.",
          "jun.",
          "jul.",
          "aug.",
          "sep.",
          "okt.",
          "nov.",
          "dec.",
        ].indexOf(parts[1]) +
          1)
      ).padStart(2, "0");
      const day = ("" + parts[0]).padStart(2, "0");
      return `${year}-${month}-${day}`;
    };
    const workExperienceDivs = [
      ...document.querySelector(".cvSection-Educations").children,
    ].slice(0, -1);
    const workExperienceEndDates = workExperienceDivs
      .map(
        (div) =>
          [...div.querySelectorAll("input.disabledDateInput")].slice(-1)[0]
            .value
      )
      .map((s) => (s === "" ? "1970-01-01" : parseCxsNlDate(s)));
    let datePrevious = workExperienceEndDates[0];
    for (const [idx, dateCurrent] of workExperienceEndDates
      .slice(1)
      .entries()) {
      if (dateCurrent > datePrevious) {
        // Go up
        workExperienceDivs[idx + 1]
          .querySelector(".cxsMoveSubsectionUp")
          .click();
        return true;
      }
      datePrevious = dateCurrent;
    }
    return false;
  };

  const sortAll = (onDone) => {
    if (sortOne()) {
      setTimeout(() => sortAll(onDone), 1);
    } else {
      if (onDone) onDone();
    }
  };

  Monkey.waitForSelector(".cvSection-Educations").then((cvSection) => {
    const button = document.createElement("button");
    button.innerText = "Sort die shit!";
    button.addEventListener("click", () => {
      button.innerText = "sorting...";
      button.disabled = true;
      sortAll(() => (button.innerText = "done!"));
    });
    cvSection.insertAdjacentElement("beforeBegin", button);
  });
});
