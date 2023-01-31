document.addEventListener(
  "focus",
  (ev) => {
    let textarea = ev.target;
    if (textarea.tagName === "LIGHTNING-TEXTAREA")
      textarea = textarea.shadowRoot?.querySelector("textarea");
    if (!(textarea instanceof HTMLTextAreaElement)) return;
    if (textarea.maxLength === -1) return;

    const counter = document.createElement("div");
    const style = getComputedStyle(textarea);
    counter.style.backgroundColor = style.backgroundColor;
    counter.style.color = style.color;
    counter.style.position = "absolute";
    counter.style.whiteSpace = "nowrap";
    counter.style.fontSize = "0.8em";

    const updateCounter = () =>
      (counter.textContent = `${textarea.value.length} / ${textarea.maxLength}`);
    updateCounter();
    textarea.addEventListener("input", updateCounter);

    // TODO: Copy pasta'd from berry
    const getAbsLeftTop = (elem) => {
      const getRelParent = (elem) =>
        elem.parentElement.parentElement === null ||
        ["relative", "absolute", "sticky", "fixed"].includes(
          getComputedStyle(elem.parentElement).position
        )
          ? elem.parentElement
          : getRelParent(elem.parentElement);

      const ancestor = getRelParent(elem);
      const ancestorRect = ancestor.getBoundingClientRect();
      const elemRect = elem.getBoundingClientRect();
      return [
        elemRect.left - ancestorRect.left,
        elemRect.top - ancestorRect.top,
      ];
    };

    const setCounterPosition = () => {
      const [left, top] = getAbsLeftTop(textarea);
      const rect = textarea.getBoundingClientRect();
      counter.style.top = top + rect.height + "px";
      counter.style.left =
        left + rect.width - counter.getBoundingClientRect().width + "px";
    };
    setCounterPosition();
    const boudie = new ResizeObserver(setCounterPosition);
    boudie.observe(textarea);

    const onBlur = () => {
      textarea.removeEventListener("input", updateCounter);
      boudie.disconnect();
      textarea.parentElement.removeChild(counter);
    };
    textarea.addEventListener("blur", onBlur, { once: true });

    textarea.parentElement.appendChild(counter);
  },
  true
);
