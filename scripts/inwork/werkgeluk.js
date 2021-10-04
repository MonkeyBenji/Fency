import(chrome.runtime.getURL("/lib/monkey-script.js")).then((Monkey) => {
  Monkey.onLoad(async () => {
    const KEY = "lastOccurrenceHappyGuy";
    const TIME_BETWEEN = 10 * 60 * 60 * 1000; // once every 10 hours
    const now = new Date().getTime();
    const lastOccurrence = await Monkey.get(KEY, 0);
    if (now - lastOccurrence > TIME_BETWEEN) {
      Monkey.css(`#happy-guy {
        position: fixed;
        top: 0;
        left: 0;
        z-index: 99999999;
        width: 100%;
        height: 100%;
        pointer-events: none;
        overflow: hidden;
        text-align: center;
      }
      #happy-guy img {
        position: absolute;
        bottom: 0;
        transform: translateY(100%);
        animation: appearFromBottom 3s ease-in-out;
      }
      @keyframes appearFromBottom {
        from {
          transform: translateY(100%);
        }
        10% {
          transform: translateY(0);
        }
        90% {
          transform: translateY(0);
        }
        to {
          transform: translateY(100%);
        }
      }
      `);
      const happyGuy = Monkey.createElement(
        '<div id="happy-guy"><img src="https://fency.dev/img/happy-person.png"></div>'
      );
      document.body.appendChild(happyGuy);
      setTimeout(() => Monkey.set(KEY, now), 1337);
    }
  });
});
