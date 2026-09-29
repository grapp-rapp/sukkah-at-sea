// ---------------------------------------------------------------- English / Hebrew
const LANG = { cur: store.get('lang') === 'he' ? 'he' : 'en' };
const HE = () => LANG.cur === 'he';
const tt = (en, he) => (LANG.cur === 'he' ? he : en);
const tr = (x) => (Array.isArray(x) ? (LANG.cur === 'he' ? x[1] : x[0]) : x);
// static page text, keyed by data-i18n
const STR = {
  title: ['Sukkah <span>on a car</span> on a boat', 'סוכה <span>על מכונית</span> על ספינה'],
  sub: ['Build it, sail it, and see which halachot it keeps.', 'בנו אותה, הפליגו איתה, ובדקו אילו הלכות היא מקיימת.'],
  fAll: ['All', 'הכול'], fFail: ['Problems', 'בעיות'], fSukkah: ['The sukkah', 'הסוכה'], fYou: ['You & the day', 'אתם והיום'],
  cOrbit: ['Orbit', 'סיבוב'], cInside: ['Sit inside', 'לשבת בפנים'], cDeck: ['On deck', 'על הסיפון'], cSea: ['From the sea', 'מהים'],
  tBuild: ['Build', 'בנייה'], tCheck: ['Halacha', 'הלכה'], tView: ['View', 'תצוגה'],
  story: ['<b>Rabbi Akiva’s sukkah</b><br>Rabban Gamliel and Rabbi Akiva were sailing on a ship. Rabbi Akiva built a sukkah on the deck, and the next day the wind blew it away. Rabban Gamliel asked him, <i>“Akiva, where is your sukkah?”</i> — Sukkah 23a. The halacha follows Rabbi Akiva: a sukkah on a ship or a wagon is kosher, as long as it could stand in an ordinary wind on land.',
    '<b>הסוכה של רבי עקיבא</b><br>רבן גמליאל ורבי עקיבא היו באים בספינה. עשה רבי עקיבא סוכה בראש הספינה, ולמחר נשבה הרוח ועקרתה. אמר לו רבן גמליאל: <i>״עקיבא, היכן סוכתך?״</i> — סוכה כג ע״א. הלכה כרבי עקיבא: סוכה בראש העגלה או בראש הספינה כשרה, ובלבד שיכולה לעמוד ברוח מצויה של יבשה.'],
  lang: ['עברית', 'English'],
  jump: ['JUMP', 'קפיצה'],
};
const HINTS = {
  orbit: ['Drag to look around · scroll to zoom · click a rule for its source', 'גררו כדי להסתכל מסביב · גלגלת לזום · לחצו על הלכה כדי לראות את המקור'],
  sea: ['Drag to look around · scroll to zoom · click a rule for its source', 'גררו כדי להסתכל מסביב · גלגלת לזום · לחצו על הלכה כדי לראות את המקור'],
  inside: ['Drag to look around — you are sitting in the sukkah', 'גררו כדי להסתכל מסביב — אתם יושבים בסוכה'],
  deck: ['Drag to look · W A S D to walk on the deck', 'גררו כדי להסתכל · W A S D כדי ללכת על הסיפון'],
};
function applyLang() {
  document.documentElement.lang = LANG.cur;
  document.documentElement.dir = HE() ? 'rtl' : 'ltr';
  for (const el of document.querySelectorAll('[data-i18n]')) el.innerHTML = tr(STR[el.dataset.i18n]);
  $('story').innerHTML = `<span class="x" id="story-x">✕</span>` + tr(STR.story);
  $('story-x').onclick = () => { $('story').hidden = true; store.set('story', '1'); };
  if (typeof buildControls === 'function' && $('controls').childElementCount) { buildControls(); renderHalacha(); $('hint').textContent = tr(HINTS[camMode]); }
}
function toggleLang() { LANG.cur = HE() ? 'en' : 'he'; store.set('lang', LANG.cur); applyLang(); }
