import { css } from "./monkey-script.js";

const fabId = `monkey-fab`;

const style = `
#${fabId} {
  box-sizing: border-box;
  position: fixed;
  right: 20px;
  bottom: 20px;
  font-family: Arial;
  z-index: 7331;
  --h: 207;
  --s: 73%;
  --l: 57%;
  --hStart: 321;
  --hStep: 68;
  --hIdx: 0;
  margin: 0 !important;
  padding: 0 !important;
}
#${fabId} > summary {
  list-style: none;
  margin: 0 !important;
  padding: 0 !important;
}

#${fabId} summary button {
  width: 60px;
  height: 60px;
}
#${fabId} button svg {
  width: 26px;
  height: 26px;
}
#${fabId} summary button svg {
  width: 34px;
  height: 34px;
}
#${fabId} button {
  font-size: 24px;
  cursor: pointer;
  color: #fff;
  width: 40px;
  height: 40px;
  border-radius: 50%;
  padding: 0;
  background: hsl(var(--h), var(--s), var(--l));
  border: 0;
  box-shadow: 1px 1px 6px rgb(0 0 0 / 60%);
}
#${fabId} label:hover {
  opacity: 0.8;
}
#${fabId} label span:active,
#${fabId} label button:active,
#${fabId} button:active {
  opacity: 1;
  box-shadow: 1px 1px 6px rgb(0 0 0 / 60%), inset 0 0 8px hsl(var(--h), calc(var(--s) * 0.6), calc(var(--l) * 0.4));
}
#${fabId} label {
  font-size: 16px;
  --h: calc(var(--hStart) + (var(--hIdx) * var(--hStep)));
  margin: 0 !important;
  padding: 0 !important;
  margin-bottom: 7px !important;
}

#${fabId} div {
  position: fixed;
  right: 31px;
  bottom: 83px;
  display: flex;
  flex-direction: column-reverse;
  flex-wrap: wrap;
}
#${fabId} div label {
  display: flex;
  align-items: center;
  flex-direction: row;
  cursor: pointer;
  padding: 6px;
  user-select: none;
  justify-content: flex-end;
}
#${fabId} div label:nth-of-type(1) { --hIdx: 0; }
#${fabId} div label:nth-of-type(2) { --hIdx: 1; }
#${fabId} div label:nth-of-type(3) { --hIdx: 2; }
#${fabId} div label:nth-of-type(4) { --hIdx: 3; }
#${fabId} div label:nth-of-type(5) { --hIdx: 4; }
#${fabId} div label:nth-of-type(6) { --hIdx: 5; }
#${fabId} div label:nth-of-type(7) { --hIdx: 6; }
#${fabId} div label span {
  color: #fff;
  background: hsl(var(--h), var(--s), var(--l));
  margin-right: 12px;
  border-radius: 4px;
  box-shadow: 2px 2px 6px rgb(0 0 0 / 60%);
  padding: 4px 10px;
  line-height: normal;
}`;

let fabInitialized = false;
let details = null;
let fabMain = null;
let fabSub = null;

let svgMagic = null;
let svgClose = null;

const getFaSvg = async (icon) => {
  const response = await fetch(chrome.runtime.getURL(`/icons/fa/${icon}.svg`));
  const content = await response.text();
  return content.replaceAll("<path d", '<path fill="currentColor" d');
};

const initFab = () => {
  if (fabInitialized) return;
  fabInitialized = true;
  details = document.createElement("details");
  details.id = fabId;
  css(style);

  const summary = document.createElement("summary");
  fabMain = document.createElement("button");
  fabSub = document.createElement("div");
  summary.appendChild(fabMain);
  details.appendChild(summary);
  details.appendChild(fabSub);
  fabMain.addEventListener("click", function () {
    this.parentElement.click();
  });
  document.body.appendChild(details);

  getFaSvg("magic").then((svg) => {
    svgMagic = svg;
    setFabMainIcon();
  });
  getFaSvg("times").then((svg) => {
    svgClose = svg;
    setFabMainIcon();
  });

  details.addEventListener("toggle", setFabMainIcon);
};

const setFabMainIcon = () => {
  fabMain.innerHTML = details.open ? svgClose : svgMagic;
  const path = fabMain.firstElementChild.firstElementChild;
  path.setAttribute("fill", "currentColor");
};

const fab = (icon, text, callback) => {
  initFab();
  const label = document.createElement("label");
  const span = document.createElement("span");
  span.textContent = text;
  label.appendChild(span);
  const button = document.createElement("button");
  label.appendChild(button);
  fabSub.appendChild(label);

  const iconInfo = icon.split(" ");
  if (iconInfo.length === 2 && iconInfo[0] === "fa") {
    const icon = iconInfo[1].slice(3);
    getFaSvg(icon).then((svg) => (button.innerHTML = svg));
  } else {
    console.log(iconInfo.length, iconInfo[0]);
    button.textContent = icon;
  }
  button.addEventListener("click", callback);
  button.addEventListener("click", () => (details.open = false));
};

export { fab };
