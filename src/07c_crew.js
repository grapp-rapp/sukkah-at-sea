// ---------------------------------------------------------------- the people aboard: captain, crew and passengers (they talk when you come close)
const CREW = [];
const L = (en, he) => [en, he];

function person(id, o, parent, x, y, z, heading, extra = {}) {
  const P = makePerson(o); P.id = id; P.name = o.name; P.lines = o.lines || [];
  P.root.position.set(x, y, z); P.heading = P.targetHeading = heading;
  Object.assign(P, extra);
  mergeRig(P.root, new Set([...P.eyes, P.mouth, P.ponytail, P.skirt].filter(Boolean)));
  trimShadows(P.root);
  parent.add(P.root); CREW.push(P);
  return P;
}
function prop(P, joint, mesh, x, y, z, rx = 0, ry = 0, rz = 0) { mesh.position.set(x, y, z); mesh.rotation.set(rx, ry, rz); P.joints[joint].add(mesh); return mesh; }

function buildCrew() {
  const B = BOAT.root, D = BOAT.deckY, Y = BELOW.y;
  // the captain at the helm
  const cap = person('captain', {
    name: L('Captain Moshe', 'רב־החובל משה'), height: 1.78, skin: 0xc98f66, shirt: 0xf6f6f2, pants: 0x1b2a44, hair: 0xb8b2a8, beard: 0xcfc9c0, captainHat: true, epaulettes: true, sleeve: 'short', belly: 0.5, eyes: 0x3a5a7a,
    lines: [L('Welcome aboard the Rabbi Akiva! Mind the rolling deck.', 'ברוכים הבאים ל״רבי עקיבא״! היזהרו, הסיפון מתנדנד.'),
      L('We’re off Yafo — the port where Yonah boarded his ship to Tarshish.', 'אנחנו מול יפו — הנמל שממנו יונה עלה לאנייה לתרשיש.'),
      L('Your sukkah can stay on my deck — just keep it strapped down. Rabbi Akiva lost his to the wind!', 'הסוכה שלכם יכולה להישאר על הסיפון — רק שתהיה קשורה. של רבי עקיבא עפה ברוח!'),
      L('Two diesels below, 800 horsepower each. Go down the hatch and see.', 'למטה יש שני מנועי דיזל, 800 כוח סוס כל אחד. רדו בפתח ותראו.')],
  }, B, 2.0, D, 12.72, Math.PI, { pose: 'helm', noLook: true });
  // Chabad sukkah-mobile volunteer with a lulav and etrog
  const chabad = person('chabad', {
    name: L('Mendy', 'מנדי'), height: 1.76, skin: 0xe0ac86, shirt: 0xf6f6f2, top: 0x16181c, pants: 0x16181c, hair: 0x241810, beard: 0x241810, fedora: true, tzitzit: true, eyes: 0x3a2818,
    lines: [L('Chag sameach! Would you like to shake the lulav? Hold it with the etrog and say the bracha.', 'חג שמח! רוצים לנענע לולב? מחזיקים יחד עם האתרוג ומברכים.'),
      L('Our sukkah-mobile goes anywhere — even to sea. A sukkah on a wagon is kosher!', 'הסוכה הניידת שלנו מגיעה לכל מקום — אפילו לים. סוכה על עגלה כשרה!'),
      L('Come up into the sukkah — step on the stool, then the tailgate.', 'עלו לסוכה — על השרפרף ואז על הדלת האחורית.')],
  }, B, 1.35, D, 4.2, 0.9, { pose: 'lulav' });
  const green = new THREE.MeshStandardMaterial({ color: 0x6d8a3a, roughness: 0.5 });
  prop(chabad, 'wristR', new THREE.Mesh(new THREE.BoxGeometry(0.025, 1.05, 0.03), green), 0, -0.07 - 0.276 * 0.4, 0.03 + 0.962 * 0.4, 1.85);
  prop(chabad, 'wristL', new THREE.Mesh(new THREE.SphereGeometry(0.045, 14, 10), new THREE.MeshStandardMaterial({ color: 0xe9cf3a, roughness: 0.4 })), 0, -0.07, 0.04).scale.set(1, 1.35, 1);
  // deckhand patrolling the bow
  const hand = person('deckhand', {
    name: L('Avi, deckhand', 'אבי, איש צוות'), height: 1.74, skin: 0xb8805a, shirt: 0x6d737a, pants: 0x2c3440, hair: 0x1a1410, vest: 0xf07a1a, hardHat: 0xf2c81b, sleeve: 'rolled', eyes: 0x2a2018,
    lines: [L('Car strapped down? Good. Nothing moves on my deck.', 'הרכב קשור? יופי. על הסיפון שלי שום דבר לא זז.'),
      L('The lounge and the cafeteria are down the hatch, by the stairs.', 'הטרקלין והקפטריה למטה, דרך הפתח עם המדרגות.'),
      L('In a storm the canvas walls flap like flags — tie them tight.', 'בסערה דפנות הבד מתנופפות כמו דגלים — תקשרו חזק.')],
  }, B, 2.2, D, -4.5, Math.PI, { speed: 1.1, route: [[2.3, -4.6, 'rope', 4], [2.3, -11.0, 'rope', 5], [-2.2, -11.0, null, 1], [-2.0, -7.0, null, 0.5], [-1.8, -5.3, null, 0]], leg: 0, wait: 2 });
  // tourists at the port rail
  person('tourist1', {
    name: L('Dana', 'דנה'), female: true, height: 1.65, skin: 0xe8b894, top: 0x5aa0c8, skirt: 0x2b3a55, skirtLen: 0.55, sleeve: 'short', hair: 0x8a5a2a, longHair: true, eyes: 0x4a6a3a,
    lines: [L('Can you take our picture with the sukkah?', 'אפשר לצלם אותנו עם הסוכה?'), L('Look, you can see Yafo from here!', 'תראו, רואים מכאן את יפו!')],
  }, B, -3.75, D, 5.4, -Math.PI / 2, { pose: 'photo' });
  person('tourist2', {
    name: L('Tom', 'תום'), height: 1.82, skin: 0xf0c8a8, shirt: 0xe9e1c8, pants: 0x4a5a6a, hair: 0xd8b060, sleeve: 'short', eyes: 0x4a6a9a, cap: 0x2f4a6a,
    lines: [L('First time on a boat with a sukkah on it. Only in Israel!', 'פעם ראשונה שאני על סירה עם סוכה. רק בישראל!')],
  }, B, -3.75, D, 6.25, -Math.PI / 2, { pose: 'lean' });
  prop(CREW[CREW.length - 2], 'wristR', new THREE.Mesh(new THREE.BoxGeometry(0.07, 0.14, 0.01), new THREE.MeshStandardMaterial({ color: 0x111111, roughness: 0.2, metalness: 0.5 })), 0, -0.08, 0.05);
  // a kid running laps on the open deck
  person('kid', {
    name: L('Yoni', 'יוני'), height: 1.22, skin: 0xe6b28e, shirt: 0xd8352a, pants: 0x2f4a7a, hair: 0x3a2618, headMul: 1.15, sleeve: 'short', kippah: true, eyes: 0x3a2818, speed: 2.4,
    lines: [L('Is that a sukkah on a TRUCK?! Cool!', 'זאת סוכה על טנדר?! מגניב!'), L('Race you to the front of the ship!', 'בוא נעשה תחרות עד חרטום הספינה!')],
  }, B, -1.5, D, -2.5, 0, { loop: [[-2.1, -2.4], [2.1, -2.4], [2.3, -4.3], [-2.0, -4.3]], leg: 0 });
  // seasick passenger — only there when someone is seasick (or it's stormy)
  person('seasick', {
    name: L('Uncle Shmulik', 'הדוד שמוליק'), height: 1.72, skin: 0xc8d0a8, shirt: 0x8a9aa8, pants: 0x3a3a3a, hair: 0x5a5048, mustache: 0x5a5048, belly: 0.8, eyes: 0x2a2018,
    lines: [L('Ugh… I’m a mitztaer. The halacha says I’m exempt from the sukkah right now.', 'אוף… אני מצטער. ההלכה אומרת שאני פטור מהסוכה עכשיו.'), L('Don’t talk to me about food.', 'אל תדברו איתי על אוכל.')],
  }, B, 3.85, D, -1.0, Math.PI / 2, { pose: 'sick', noLook: true, onlyIf: () => CFG.seasick || CFG.wind >= 45 });
  // cabin: a passenger with tea
  person('tea', {
    name: L('Savta Rivka', 'סבתא רבקה'), female: true, height: 1.58, skin: 0xe2b494, top: 0x7a4a6a, skirt: 0x3a3440, skirtLen: 0.66, hair: 0xd8d4cc, glasses: true, tichel: 0x2d4f7c, stoop: 0.08, eyes: 0x5a4a3a,
    lines: [L('A cup of tea? It helps with the seasickness.', 'כוס תה? זה עוזר נגד מחלת ים.'), L('When I was young we crossed from Cyprus on a ship like this one.', 'כשהייתי צעירה עלינו מקפריסין בספינה כמו זאת.')],
  }, B, -1.4, D + 0.04, 16.63, Math.PI, { state: 'sit', pose: 'tea' });
  prop(CREW[CREW.length - 1], 'wristR', new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.025, 0.07, 12), new THREE.MeshStandardMaterial({ color: 0xf4f1ea, roughness: 0.3 })), 0, -0.07, 0.04);
  // --- below deck
  const low = BELOW.root;
  person('shesh1', { name: L('Itzik', 'איציק'), height: 1.75, skin: 0xb8805a, shirt: 0xf2f2ee, pants: 0x2a2a2a, hair: 0x1a1410, sleeve: 'short', kippah: true, mustache: 0x1a1410, eyes: 0x2a2018,
    lines: [L('Shesh-besh! Sit, sit, you play the winner.', 'שש־בש! שבו, שבו, אתם משחקים נגד המנצח.'), L('Double sixes! Did you see that?', 'שש־שש! ראיתם את זה?')] }, low, 2.6, Y, -2.28, 0, { state: 'sit', pose: 'dice' });
  person('shesh2', { name: L('Nissim', 'ניסים'), height: 1.7, skin: 0xa8704a, shirt: 0x6a8aa8, pants: 0x3a3a3a, hair: 0x6a6460, belly: 0.6, eyes: 0x2a2018,
    lines: [L('He only wins because the boat is rocking.', 'הוא מנצח רק כי הסירה מתנדנדת.')] }, low, 2.6, Y, -0.72, Math.PI, { state: 'sit', pose: 'dice' });
  person('davener', { name: L('Reb Yaakov', 'ר׳ יעקב'), height: 1.74, skin: 0xe0ac86, shirt: 0xf6f6f2, pants: 0x16181c, hair: 0x5a4a3a, beard: 0x8a8580, kippah: true, tzitzit: true, glasses: true, eyes: 0x3a2818,
    lines: [L('(davening quietly, facing Jerusalem — east of here)', '(מתפלל בשקט, פונה לירושלים — מזרחה מכאן)')] }, low, -3.05, Y, 0.2, Math.PI / 2, { pose: 'siddur', noLook: true });
  person('kiosk', { name: L('Orit, cafeteria', 'אורית, הקפטריה'), female: true, height: 1.64, skin: 0xd9a47e, top: 0xb3261e, skirt: 0x2b2f3a, skirtLen: 0.7, hair: 0x2a1d14, ponytail: true, eyes: 0x3a2818,
    lines: [L('Bourekas, coffee, pretzels! What can I get you?', 'בורקס, קפה, בייגלה! מה לתת לכם?'), L('Eat a snack here — a real meal belongs in the sukkah upstairs.', 'חטיף אפשר גם כאן — סעודה צריך לאכול בסוכה למעלה.')] }, low, 0.4, Y, BELOW.z0 + 0.25, 0, {});
  person('engineer', { name: L('Vova, engineer', 'וובה, המכונאי'), height: 1.8, skin: 0xf0c8a8, shirt: 0x2f4f7a, top: 0x2f4f7a, pants: 0x2f4f7a, hair: 0xc8a060, sleeve: 'rolled', eyes: 0x4a6a9a,
    lines: [L('Two diesels, 800 horsepower each. Don’t touch anything!', 'שני דיזלים, 800 כוח סוס כל אחד. אל תיגעו בכלום!'), L('On Yom Tov the engines are run by the non-Jewish crew. Ask your rav about sailing on the chag.', 'ביום טוב המנועים מופעלים בידי צוות שאינו יהודי. על הפלגה בחג — שאלו רב.')] }, low, 0.0, Y, BELOW.z1 - 0.75, 0, { pose: 'wrench' });
  // a guest eating in the sukkah (placed on each rebuild, if there's a table)
  SUK.guest = person('guest', { name: L('Chaim', 'חיים'), height: 1.76, skin: 0xd6a07a, shirt: 0xf6f6f2, pants: 0x1f232b, hair: 0x2b1e14, beard: 0x2b1e14, kippah: true, tzitzit: true, eyes: 0x3a2818,
    lines: [L('Leishev basukkah — even on the sea! Want some challah?', 'לישב בסוכה — אפילו בים! רוצים חלה?')] }, B, 0, -50, 0, 0, { state: 'sit', pose: 'tea' });
}
// seat the guest at the sukkah table (called after each sukkah rebuild)
function seatGuest() {
  const g = SUK.guest; if (!g) return;
  const W = CFG.w / 100, D = CFG.d / 100, H = CFG.h / 100;
  if (W >= 1.15 && D >= 1.6 && H >= 1.3) {
    const td = Math.min(0.6, D - 0.9);
    SUK.root.add(g.root); g.root.position.set(0, 0, 0.05 + td / 2 + 0.3); g.heading = g.targetHeading = Math.PI; g.root.visible = true;
  } else g.root.visible = false;
}

const _hd = new THREE.Vector3(), _cd = new THREE.Vector3();
let talkT = 0, talkWho = null, talkLine = 0;
function updateCrew(dt, t) {
  for (const P of CREW) {
    if (P.onlyIf) P.root.visible = P.onlyIf();
    if (!P.root.visible || P.far) continue;
    // simple routines: patrol with stops, or run laps
    if (P.route && !P.path.length) {
      if (P.wait > 0) { P.wait -= dt; }
      else { P.leg = (P.leg + 1) % P.route.length; const [x, z, pose, w] = P.route[P.leg]; P.pose = null; walkPath(P, [[x, z]], () => { P.pose = pose; P.wait = w; }); }
    }
    if (P.loop && !P.path.length) { P.leg = (P.leg + 1) % P.loop.length; walkPath(P, [P.loop[P.leg]]); }
    P.pos = P.root.position;
    animatePerson(P, dt, t);
  }
  for (const e of BELOW.engines) e.position.x += (Math.random() - 0.5) * (CFG.boat === 'sailing' ? 0.003 : 0.0008) - (e.position.x - Math.sign(e.position.x) * 1.75) * 0.3;
  // speech bubble for whoever is close and in view
  camera.getWorldDirection(_cd);
  let best = null, bestD = 2.6;
  for (const P of CREW) {
    if (!P.root.visible || !P.lines.length) continue;
    P.joints.head.getWorldPosition(_hd);
    const d = _hd.distanceTo(camera.position);
    if (d < bestD && _hd.clone().sub(camera.position).normalize().dot(_cd) > 0.55) { best = P; bestD = d; }
  }
  const el = $('talk');
  if (!best) { el.hidden = true; talkWho = null; return; }
  if (best !== talkWho) { talkWho = best; talkT = 0; talkLine = 0; }
  talkT += dt; if (talkT > 5.5) { talkT = 0; talkLine = (talkLine + 1) % best.lines.length; }
  best.gesture = Math.max(best.gesture, 0.3);
  best.joints.head.getWorldPosition(_hd); _hd.y += 0.32; _hd.project(camera);
  el.hidden = false;
  el.innerHTML = `<b>${tr(best.name)}</b>${tr(best.lines[talkLine])}`;
  const x = (_hd.x * 0.5 + 0.5) * innerWidth, y = (-_hd.y * 0.5 + 0.5) * innerHeight;
  el.style.left = clamp(x, 120, innerWidth - 120) + 'px'; el.style.top = clamp(y, 70, innerHeight - 160) + 'px';
}
