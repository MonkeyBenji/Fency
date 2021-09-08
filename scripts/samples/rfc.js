import(chrome.runtime.getURL("/lib/monkey-script.js")).then((Monkey) => {
  const enc = encodeURIComponent;
  const mail = "fency@inwork.nl";
  const salutation = Monkey.sample(["Yo Gap", "Hey Gozert", "Hey Pik"]);
  const greeting = Monkey.sample(["Xoxo", "Hoogachtend", "Latex"]);
  const host = window.location.host;
  const href = window.location.href;
  const title = `Geniaal idee ${host}`;
  const body = `${salutation},

Ik zat dus op deze woopsite pagina: ${href}
En ik dacht zo van hoe chill zou het zijn dat als je hiero:
<plaatje hier?>
  
Nou eens: <verwijder wat niet van toepassing is>
- Een knopje toevoegt, en als je er op klikt dan ... ... kaboom!
- Ff zorgt dat dattes verdwijnt, neemt te veel ruimte in.
- Een shortcut toevoegt naar deze pagina: https://xkcd.com/
- Dit gewoon ff in dit verandert, snap je?
  
${greeting},
<hiermijnnaam>`;

  const url = `mailto:${enc(mail)}?subject=${enc(title)}&body=${enc(body)}`;
  Monkey.menu("Request Fency Change", () => window.open(url));
});
