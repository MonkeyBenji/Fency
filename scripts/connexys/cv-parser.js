import(chrome.runtime.getURL("/lib/monkey-script.js")).then(async (Monkey) => {
  const getPersonalProfile = () => {
    const profile = (
      document
        .querySelector(".cvText .uiOutputText")
        .innerHTML.replaceAll("<br>", "\n")
        .replace("rofiel   ", "rofiel\n")
        .split(/rofiel\n/i)[1] ?? ""
    )
      .trim()
      .split("\n\n")[0]
      .trim();
    const profileLower = profile.toLowerCase();
    if (profileLower.startsWith("werk") || profileLower.startsWith("opleiding"))
      return null;
    return profile
      .split("\n")
      .map((line) => line.trim())
      .join("\n")
      .replaceAll(/(?<![\.\:\;])\n/g, " ")
      .replaceAll("  ", " ");
  };

  const onFileChange = async (ev) => {
    if (!ev.target.matches(".cxsrecCandidateWizard .cxsrecDropFile input"))
      return;
    await Monkey.waitForSelector(".cvText .uiOutputText");
    const profile = getPersonalProfile();
    if (profile)
      document.querySelector(
        ".ql-editor.slds-rich-text-area__content"
      ).innerHTML = `<p>${profile.replaceAll("\n", "<br>\n")}</p>`;
  };

  document.addEventListener("drop", onFileChange, true);
  document.addEventListener("change", onFileChange, true);
});
