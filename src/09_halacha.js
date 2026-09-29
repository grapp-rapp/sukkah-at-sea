// ---------------------------------------------------------------- halacha engine: every rule is evaluated live from CFG + the measured 3D sukkah
// status: ok | warn (kosher bedieved / lechatchila issue / ask a rav) | fail (pasul / forbidden) | info
const TF = () => (CFG.shiur === 'naeh' ? 8 : 9.6); // cm per tefach
const toT = (cm) => cm / TF();
const fT = (cm) => `${toT(cm).toFixed(1)} ${tt('tefachim', 'טפחים')}`;
const SCHACH_NAMES = {
  palm: ['palm fronds', 'כפות תמרים'], bamboo: ['bamboo poles', 'מקלות במבוק'], mats: ['bamboo mats made for schach', 'מחצלות שנעשו לסכך'], branches: ['evergreen branches', 'ענפי אורן'],
  boards: ['narrow boards (8 cm)', 'נסרים צרים (8 ס״מ)'], wideboards: ['wide boards (40 cm)', 'נסרים רחבים (40 ס״מ)'], tarp: ['a plastic tarp', 'יריעת ניילון'], metal: ['corrugated metal sheets', 'פח גלי'], corn: ['corn on the cob (food)', 'קלחי תירס (אוכל)'],
};

function evaluateHalacha() {
  const R = [];
  // each text argument is either a string or [English, Hebrew]
  const add = (grp, st, t, d, src) => R.push({ grp, st, t: tr(t), d: tr(d), src: tr(src) });
  const T = TF(), amah = 6 * T;
  const onCar = CFG.vehicle !== 'deck';
  const yomTov = CFG.day === 'first';
  const night = CFG.hour >= 18.9 || CFG.hour < 5.5;
  const cm = tt('cm', 'ס״מ');

  // ---------------- the structure
  add('sukkah', 'info', [`Measuring by ${CFG.shiur === 'naeh' ? 'Rav Chaim Na’eh (1 tefach = 8 cm)' : 'Chazon Ish (1 tefach = 9.6 cm)'}`, `מודדים לפי ${CFG.shiur === 'naeh' ? 'ר׳ חיים נאה (טפח = 8 ס״מ)' : 'החזון איש (טפח = 9.6 ס״מ)'}`],
    ['All sizes below are converted to tefachim using this shiur. Try switching it — a sukkah that is just big enough by one opinion can be too small by the other.', 'כל המידות כאן מחושבות בטפחים לפי השיעור הזה. נסו להחליף — סוכה שגדולה מספיק לשיטה אחת יכולה להיות קטנה מדי לשיטה השנייה.'],
    ['Shiurei Torah (R’ Chaim Na’eh); Chazon Ish O.C. 39', 'שיעורי תורה (ר׳ חיים נאה); חזון איש או״ח לט']);
  const small = Math.min(CFG.w, CFG.d);
  add('sukkah', small >= 7 * T ? 'ok' : 'fail', ['Big enough: at least 7 × 7 tefachim', 'גדולה מספיק: לפחות 7 על 7 טפחים'],
    [`Inside it measures ${CFG.w} × ${CFG.d} cm = ${toT(CFG.w).toFixed(1)} × ${toT(CFG.d).toFixed(1)} tefachim. It must hold “a person’s head, most of his body and his table” — 7 × 7 tefachim (${Math.round(7 * T)} cm).` + (small < 7 * T ? ' Too small: it is not a sukkah at all.' : ''),
      `מבפנים היא ${CFG.w} על ${CFG.d} ס״מ = ${toT(CFG.w).toFixed(1)} על ${toT(CFG.d).toFixed(1)} טפחים. היא צריכה להכיל ״ראשו ורובו ושולחנו״ — 7 על 7 טפחים (${Math.round(7 * T)} ס״מ).` + (small < 7 * T ? ' קטנה מדי: זו בכלל לא סוכה.' : '')],
    ['Sukkah 3a; Shulchan Aruch O.C. 634:1', 'סוכה ג ע״א; שו״ע או״ח תרלד:א']);
  add('sukkah', CFG.h >= 10 * T ? 'ok' : 'fail', ['Tall enough: at least 10 tefachim', 'גבוהה מספיק: לפחות 10 טפחים'],
    [`From the sukkah’s floor to the schach is ${CFG.h} cm = ${fT(CFG.h)} (minimum ${Math.round(10 * T)} cm).` + (CFG.h < 10 * T ? ' A sukkah lower than 10 tefachim is pasul.' : ''),
      `מרצפת הסוכה עד הסכך ${CFG.h} ס״מ = ${fT(CFG.h)} (מינימום ${Math.round(10 * T)} ס״מ).` + (CFG.h < 10 * T ? ' סוכה שאינה גבוהה עשרה טפחים פסולה.' : '')],
    ['Mishnah Sukkah 1:1; S.A. 633:8', 'משנה סוכה א:א; שו״ע תרלג:ח']);
  const floor = onCar ? (CFG.vehicle === 'pickup' ? ['the truck bed', 'ארגז הטנדר'] : ['the car roof', 'גג המכונית']) : ['the deck', 'הסיפון'];
  add('sukkah', CFG.h <= 20 * amah ? 'ok' : 'fail', ['Not higher than 20 amot', 'לא גבוהה מעשרים אמה'],
    [`A sukkah over 20 amot (${(20 * amah / 100).toFixed(1)} m) is too tall — you sit in the shade of the walls, not the schach, and it stops being a temporary dwelling. Height is measured from the sukkah’s own floor (${floor[0]}), not from the sea.`,
      `סוכה שגבוהה מעשרים אמה (${(20 * amah / 100).toFixed(1)} מ׳) פסולה — יושבים בצל הדפנות ולא בצל הסכך, והיא כבר לא דירת עראי. הגובה נמדד מרצפת הסוכה עצמה (${floor[1]}), לא מפני הים.`],
    ['Mishnah Sukkah 1:1; S.A. 633:1', 'משנה סוכה א:א; שו״ע תרלג:א']);

  // walls
  const wl = { '4': ['Four walls', 'ארבע דפנות'], '3': ['Three walls', 'שלוש דפנות'], '2t': ['Two walls and a tefach', 'שתיים כהלכתן ושלישית טפח'], '2': ['Only two walls', 'רק שתי דפנות'] }[CFG.walls];
  const wSrc = ['Sukkah 6b; S.A. 630:2', 'סוכה ו ע״ב; שו״ע תרל:ב'];
  if (CFG.walls === '4') add('sukkah', 'ok', wl, ['Three full walls are the mitzvah at its best; a fourth wall (with a doorway) protects from the sea wind.', 'שלוש דפנות שלמות הן המצווה כתיקונה; דופן רביעית (עם פתח) שומרת מרוח הים.'], wSrc);
  else if (CFG.walls === '3') add('sukkah', 'ok', wl, ['Three full walls: kosher, the mitzvah as it is meant to be.', 'שלוש דפנות שלמות: כשרה, המצווה כתיקונה.'], wSrc);
  else if (CFG.walls === '2t') add('sukkah', 'warn', wl, [`Two adjacent full walls plus a third just over a tefach wide (${Math.round(T)} cm), with a tzurat hapetach (the post and the beam above it) — kosher by a halacha given to Moshe at Sinai. Better to have three full walls.`, `שתי דפנות סמוכות שלמות ושלישית ברוחב טפח ומשהו (${Math.round(T)} ס״מ), עם צורת הפתח (הקנה והקורה שמעליו) — כשרה בהלכה למשה מסיני. עדיף שלוש דפנות שלמות.`], ['Sukkah 6b; S.A. 630:2–3', 'סוכה ו ע״ב; שו״ע תרל:ב–ג']);
  else add('sukkah', 'fail', wl, ['Two walls alone are not enough. You need at least two full walls and a third of more than a tefach.', 'שתי דפנות לבד אינן מספיקות. צריך לפחות שתיים כהלכתן ושלישית של יותר מטפח.'], ['S.A. 630:2', 'שו״ע תרל:ב']);
  add('sukkah', CFG.wallH >= 10 * T ? 'ok' : 'fail', ['Walls at least 10 tefachim high', 'דפנות גבוהות לפחות עשרה טפחים'],
    [`The walls are ${CFG.wallH} cm = ${fT(CFG.wallH)}. A wall of 10 tefachim counts even if it doesn’t reach the schach (gud asik).`, `הדפנות ${CFG.wallH} ס״מ = ${fT(CFG.wallH)}. דופן של עשרה טפחים כשרה גם אם אינה מגיעה לסכך (גוד אסיק).`], ['S.A. 630:9', 'שו״ע תרל:ט']);
  add('sukkah', CFG.wallGap < 3 * T ? 'ok' : 'fail', ['Gap under the walls less than 3 tefachim', 'רווח מתחת לדפנות פחות משלושה טפחים'],
    [`The walls start ${CFG.wallGap} cm (${fT(CFG.wallGap)}) above the floor. Under 3 tefachim (${Math.round(3 * T)} cm) the gap is “lavud” — considered closed. More, and a goat could pass under: it isn’t a wall.`, `הדפנות מתחילות ${CFG.wallGap} ס״מ (${fT(CFG.wallGap)}) מעל הרצפה. פחות משלושה טפחים (${Math.round(3 * T)} ס״מ) — ״לבוד״, כאילו סגור. יותר מזה גדיים בוקעים בו, וזו אינה דופן.`], ['Sukkah 16a; S.A. 630:9', 'סוכה טז ע״א; שו״ע תרל:ט']);
  const w10 = ['S.A. 630:10 and Mishnah Berurah there', 'שו״ע תרל:י ומשנה ברורה שם'];
  if (CFG.wallType === 'wood') add('sukkah', 'ok', ['Solid walls', 'דפנות קשיחות'], ['Plywood walls don’t move in the wind.', 'דפנות דיקט אינן זזות ברוח.'], ['S.A. 630:10', 'שו״ע תרל:י']);
  else if (!CFG.tied) add('sukkah', 'fail', ['Walls flap in the wind', 'הדפנות מתנופפות ברוח'], [`Loose ${CFG.wallType === 'sheet' ? 'bedsheets' : 'canvas'} that moves back and forth in an ordinary wind is not a wall. On a ship at sea you can watch it happen.`, `${CFG.wallType === 'sheet' ? 'סדינים רפויים' : 'בד רפוי'} שזז הלוך ושוב ברוח מצויה אינו דופן. על ספינה בים אפשר לראות את זה קורה.`], w10);
  else if (CFG.wallType === 'sheet') add('sukkah', 'warn', ['Bedsheet walls, tied down', 'דפנות סדינים, קשורות'], ['Tied tight they count, but sheets tend to come loose and people forget to check — better to use real walls, or run strings less than 3 tefachim apart as a backup.', 'כשהם קשורים היטב הם כשרים, אבל סדינים נוטים להשתחרר ושוכחים לבדוק — עדיף דפנות של ממש, או למתוח חוטים פחות משלושה טפחים זה מזה כגיבוי.'], w10);
  else add('sukkah', 'ok', ['Canvas walls tied tight', 'דפנות בד קשורות היטב'], ['The canvas is tied on every side so it doesn’t swing in the wind. Many also add strings every 3 tefachim as a backup wall.', 'הבד קשור מכל הצדדים ואינו מתנדנד ברוח. רבים מוסיפים גם חוטים כל שלושה טפחים כדופן גיבוי.'], w10);

  // on a car, on a ship
  add('sukkah', 'ok', onCar ? ['A sukkah on a car on a ship', 'סוכה על מכונית על ספינה'] : ['A sukkah on a ship', 'סוכה על ספינה'],
    ['The Mishnah rules that a sukkah on top of a wagon or on the deck of a ship is kosher, and you may go up into it on Yom Tov. A car is today’s wagon. Rabbi Akiva built his on a ship.', 'המשנה פוסקת: העושה סוכתו בראש העגלה או בראש הספינה — כשרה, ועולים לה ביום טוב. מכונית היא העגלה של היום. רבי עקיבא בנה את שלו על ספינה.'],
    ['Mishnah Sukkah 2:3; Sukkah 23a; S.A. 628:2', 'משנה סוכה ב:ג; סוכה כג ע״א; שו״ע תרכח:ב']);
  add('sukkah', CFG.strapped ? 'ok' : 'fail', ['It could stand in an ordinary wind on land', 'יכולה לעמוד ברוח מצויה של יבשה'],
    CFG.strapped ? ['The frame is strapped down to the vehicle, so it would survive a normal land wind — the condition Rabban Gamliel and Rabbi Akiva agree on.', 'השלד קשור ברצועות לרכב, כך שהוא יעמוד ברוח רגילה של יבשה — התנאי שרבן גמליאל ורבי עקיבא מסכימים עליו.']
      : ['The frame just sits there, not tied to anything. It couldn’t stand even in an ordinary wind on land — this is the sukkah Rabban Gamliel called pasul, and Rabbi Akiva’s blew away.', 'השלד פשוט מונח, לא קשור לכלום. הוא לא יעמוד אפילו ברוח מצויה של יבשה — זו הסוכה שרבן גמליאל פסל, ושל רבי עקיבא עפה ברוח.'],
    ['Sukkah 23a; S.A. 628:2 and commentaries', 'סוכה כג ע״א; שו״ע תרכח:ב ונושאי כלים']);

  // schach
  const kind = CFG.schach, nm = SCHACH_NAMES[kind];
  const s1 = ['Sukkah 11a; S.A. 629:1', 'סוכה יא ע״א; שו״ע תרכט:א'];
  if (['tarp', 'metal'].includes(kind)) add('sukkah', 'fail', [`Schach of ${nm[0]}`, `סכך של ${nm[1]}`], ['Schach must grow from the ground, be cut off it, and not be able to become tamei. Plastic and metal never grew from the ground.', 'סכך צריך להיות גידולי קרקע, תלוש, ושאינו מקבל טומאה. ניילון ומתכת לא גדלו מן הקרקע.'], s1);
  else if (kind === 'corn') add('sukkah', 'fail', [`Schach of ${nm[0]}`, `סכך של ${nm[1]}`], ['It grew from the ground — but food can become tamei (tumat ochalin), so it is pasul as schach.', 'זה גדל מן הקרקע — אבל אוכל מקבל טומאה (טומאת אוכלין), ולכן פסול לסכך.'], s1);
  else if (kind === 'wideboards') add('sukkah', 'fail', ['Boards 4 tefachim wide', 'נסרים ברוחב ארבעה טפחים'], [`Boards 40 cm wide are over 4 tefachim (${Math.round(4 * T)} cm). The Sages forbade them so that a sukkah won’t look like a house with a ceiling (gezeirat tikrah).`, `נסרים ברוחב 40 ס״מ הם יותר מארבעה טפחים (${Math.round(4 * T)} ס״מ). חכמים פסלו אותם שלא תיראה הסוכה כבית עם תקרה (גזירת תקרה).`], ['Sukkah 14a; S.A. 629:18', 'סוכה יד ע״א; שו״ע תרכט:יח']);
  else if (kind === 'boards') add('sukkah', 'warn', ['Narrow boards as schach', 'נסרים צרים לסכך'], ['Boards under 4 tefachim wide are kosher by law, but the Rema writes that the custom is not to use boards at all — lechatchila use branches, fronds or bamboo.', 'נסרים צרים מארבעה טפחים כשרים מעיקר הדין, אבל הרמ״א כותב שנוהגים שלא לסכך בנסרים כלל — לכתחילה ענפים, כפות או במבוק.'], ['S.A. 629:18 with Rema', 'שו״ע תרכט:יח ורמ״א']);
  else if (kind === 'mats') add('sukkah', 'ok', ['Mats made for schach', 'מחצלות שנעשו לסכך'], ['Bamboo mats are kosher only if they were made to be schach, not for lying on. Buy them with a reliable certification.', 'מחצלות כשרות רק אם נעשו לשם סכך ולא לשכיבה. קנו אותן עם הכשר אמין.'], ['Sukkah 19b–20a; S.A. 629:6', 'סוכה יט ע״ב–כ ע״א; שו״ע תרכט:ו']);
  else add('sukkah', 'ok', [`Schach of ${nm[0]}`, `סכך של ${nm[1]}`], ['It grew from the ground, it’s cut off, and it can’t become tamei.', 'גידולי קרקע, תלוש, ואינו מקבל טומאה.'], s1);

  const pct = Math.round(SUK.shade * 100);
  add('sukkah', SUK.shade > 0.5 ? 'ok' : 'fail', [`More shade than sun: ${pct}% measured`, `צילתה מרובה מחמתה: נמדד ${pct}%`],
    ['Measured by casting the real schach onto the sukkah floor. It needs more shade than sun (over 50%). Shade from the boat or its awning doesn’t count, only the schach.' + (SUK.shade <= 0.5 ? ' Add more schach.' : ''),
      'נמדד לפי הצל של הסכך האמיתי על רצפת הסוכה. צריך יותר צל משמש (מעל 50%). צל של הספינה או של הסוכך לא נחשב, רק הסכך.' + (SUK.shade <= 0.5 ? ' הוסיפו סכך.' : '')],
    ['Mishnah Sukkah 2:2 (22a); S.A. 631:1', 'משנה סוכה ב:ב (כב ע״א); שו״ע תרלא:א']);
  if (SUK.shade > 0.5) add('sukkah', SUK.shade >= 0.97 ? 'warn' : 'ok', SUK.shade >= 0.97 ? ['Too thick to see the stars', 'עבה מדי לראות כוכבים'] : ['You can see the stars through it', 'רואים דרכה את הכוכבים'],
    SUK.shade >= 0.97 ? ['It’s kosher, but lechatchila the schach should be thin enough to see the big stars through it.', 'כשרה, אבל לכתחילה הסכך צריך להיות דק כך שיראו דרכו כוכבים גדולים.'] : ['Thin enough that the big stars show through at night — the ideal.', 'דק מספיק שבלילה רואים דרכו את הכוכבים הגדולים — כך לכתחילה.'],
    ['Sukkah 22b; S.A. 631:3', 'סוכה כב ע״ב; שו״ע תרלא:ג']);
  const av = SUK.avirMax;
  if (av < 3 * T) add('sukkah', 'ok', ['No big gaps in the schach', 'אין אויר גדול בסכך'], [`The widest open strip is ${Math.round(av)} cm (${fT(av)}). Gaps under 3 tefachim are “lavud” — treated as closed.`, `הפס הפתוח הרחב ביותר ${Math.round(av)} ס״מ (${fT(av)}). פחות משלושה טפחים — ״לבוד״, כאילו סגור.`], ['Sukkah 17a; S.A. 632:1', 'סוכה יז ע״א; שו״ע תרלב:א']);
  else if (SUK.bestSegment >= 7 * T && Math.min(CFG.w, CFG.d) >= 7 * T) add('sukkah', 'warn', [`An air gap of ${fT(av)}`, `אויר של ${fT(av)}`], [`A gap of 3 tefachim or more splits the roof. Only the part that has 7 × 7 tefachim of schach (with its walls) is a sukkah — sit there, not under the gap. The largest good part here is ${Math.round(SUK.bestSegment)} cm deep.`, `אויר של שלושה טפחים ומעלה מחלק את הסכך. רק החלק שיש בו 7 על 7 טפחים של סכך (עם דפנות) הוא סוכה — שבו שם, לא תחת האויר. החלק הכשר הגדול כאן בעומק ${Math.round(SUK.bestSegment)} ס״מ.`], ['S.A. 632:1', 'שו״ע תרלב:א']);
  else add('sukkah', 'fail', [`An air gap of ${fT(av)}`, `אויר של ${fT(av)}`], ['A gap of 3 tefachim or more splits the schach, and no part is left that is 7 × 7 tefachim — the sukkah is pasul.', 'אויר של שלושה טפחים מחלק את הסכך ולא נשאר חלק של 7 על 7 טפחים — הסוכה פסולה.'], ['Sukkah 17a; S.A. 632:1', 'סוכה יז ע״א; שו״ע תרלב:א']);

  const s626 = ['Mishnah Sukkah 1:2 (9b); S.A. 626:1', 'משנה סוכה א:ב (ט ע״ב); שו״ע תרכו:א'];
  if (CFG.overhead === 'awning') add('sukkah', 'fail', ['Under the deck awning', 'מתחת לסוכך של הסיפון'], ['A sukkah under a roof, a tree or an awning is pasul — the shade must come from the schach alone. Roll the awning back and it becomes kosher again.', 'סוכה תחת גג, אילן או סוכך פסולה — הצל צריך לבוא מהסכך בלבד. גוללים את הסוכך והיא חוזרת להיות כשרה.'], s626);
  else if (CFG.overhead === 'upper') add('sukkah', 'fail', ['Parked under the upper deck', 'חונה מתחת לסיפון העליון'], ['The ship’s upper deck is a roof over the schach. A sukkah under a roof is pasul — drive the car out into the open.', 'הסיפון העליון של הספינה הוא גג מעל הסכך. סוכה תחת הבית פסולה — הוציאו את המכונית לשטח פתוח.'], s626);
  else add('sukkah', 'ok', ['Open sky above the schach', 'שמים פתוחים מעל הסכך'], ['Nothing — not the awning, not the upper deck, not the mast — is over the sukkah.', 'שום דבר — לא סוכך, לא סיפון עליון ולא התורן — אינו מעל הסוכה.'], ['S.A. 626:1', 'שו״ע תרכו:א']);
  add('sukkah', CFG.supports === 'metal' ? 'warn' : 'ok', CFG.supports === 'metal' ? ['Schach resting on metal poles', 'סכך מונח על צינורות מתכת'] : ['Schach resting on wooden beams', 'סכך מונח על קורות עץ'],
    CFG.supports === 'metal' ? ['Metal can become tamei. By law the schach may rest on it, but lechatchila it is better that the schach be held up by things that can’t become tamei — lay wooden slats on the metal.', 'מתכת מקבלת טומאה. מעיקר הדין מותר להניח עליה סכך, אבל לכתחילה עדיף שלא להעמיד את הסכך בדבר המקבל טומאה — הניחו פסי עץ על המתכת.'] : ['Wood beams can’t become tamei, so the schach is held up the best way.', 'קורות עץ אינן מקבלות טומאה, כך שהסכך מועמד בדרך הטובה ביותר.'],
    ['Sukkah 21a–b; Rema 629:7', 'סוכה כא; רמ״א תרכט:ז']);
  add('sukkah', CFG.order === 'walls' ? 'ok' : 'warn', CFG.order === 'walls' ? ['Walls first, then schach', 'קודם דפנות, אחר כך סכך'] : ['Schach went up before the walls', 'הסכך הונח לפני הדפנות'],
    CFG.order === 'walls' ? ['Built in the right order: walls, then schach — “ta’aseh v’lo min he’asui”.', 'נבנתה בסדר הנכון: דפנות ואחר כך סכך — ״תעשה ולא מן העשוי״.'] : ['Some poskim invalidate schach placed before the walls. Fix it by lifting each piece of schach and laying it down again.', 'יש פוסקים שפוסלים סכך שהונח לפני הדפנות. מתקנים על ידי הגבהת כל חלק מהסכך והנחתו מחדש.'],
    ['Rema 635:1', 'רמ״א תרלה:א']);
  if (CFG.old && !CFG.renewed) add('sukkah', 'warn', ['Built more than 30 days before Sukkot', 'נבנתה יותר משלושים יום לפני החג'], ['A sukkah left from before (not made for the festival) is kosher, but you should renew something in it — lay a new tefach-square of schach across its whole length.', 'סוכה ישנה (שלא נעשתה לשם החג) כשרה, אבל צריך לחדש בה דבר — להניח סכך חדש ברוחב טפח על פני כל אורכה.'], ['Sukkah 9a; S.A. 636:1', 'סוכה ט ע״א; שו״ע תרלו:א']);
  else if (CFG.old) add('sukkah', 'ok', ['An old sukkah, renewed', 'סוכה ישנה שחודשה'], ['Built long ago, but you renewed a tefach of schach for the festival.', 'נבנתה מזמן, אבל חידשתם טפח סכך לשם החג.'], ['S.A. 636:1', 'שו״ע תרלו:א']);
  add('sukkah', CFG.permission ? 'ok' : 'warn', CFG.permission ? ['The car and the deck spot are yours to use', 'יש לכם רשות במכונית ובמקום על הסיפון'] : ['Using the car/ship without permission', 'שימוש במכונית או בספינה בלי רשות'],
    CFG.permission ? ['You have the owner’s permission.', 'יש לכם רשות מהבעלים.'] : ['A “stolen sukkah” is a real problem, and a car or boat is movable property that can be stolen (unlike land). Get the owner’s permission — or ask your rav.', '״סוכה גזולה״ היא בעיה של ממש, ומכונית או ספינה הן מטלטלין שנגזלים (בניגוד לקרקע). בקשו רשות מהבעלים — או שאלו רב.'],
    ['Sukkah 31a; S.A. 637:3 and commentaries', 'סוכה לא ע״א; שו״ע תרלז:ג ונושאי כלים']);
  if (CFG.decor) add('sukkah', 'info', ['Decorations are part of the sukkah', 'נוי סוכה'], ['The lights, chains and pomegranates don’t spoil the schach. They become set aside for the whole festival — you can’t take them down to use for anything else.', 'האורות, השרשראות והרימונים אינם פוסלים את הסכך. הם מוקצים לכל ימי החג — אסור להורידם לשימוש אחר.'], ['Sukkah 10a; S.A. 638:2', 'סוכה י ע״א; שו״ע תרלח:ב']);

  // ---------------- you and the day
  add('you', 'info', yomTov ? ['First day of Sukkot (Yom Tov)', 'יום טוב ראשון של סוכות'] : ['Chol HaMoed', 'חול המועד'],
    yomTov ? ['The first night has special laws: eating a kezayit of bread in the sukkah is an absolute obligation.', 'ללילה הראשון דינים מיוחדים: אכילת כזית פת בסוכה היא חובה גמורה.'] : ['The intermediate days: the sukkah is still your home, but work for the festival’s needs is allowed.', 'ימי חול המועד: הסוכה עדיין הבית שלכם, ומלאכה לצורך המועד מותרת.'],
    ['S.A. 639:3', 'שו״ע תרלט:ג']);
  if (CFG.driving) add('you', yomTov ? 'fail' : 'ok', yomTov ? ['Driving on Yom Tov is forbidden', 'נהיגה ביום טוב אסורה'] : ['Driving on Chol HaMoed', 'נהיגה בחול המועד'],
    yomTov ? ['Burning fuel (and more) is melacha. The sukkah on the car is kosher — the driving isn’t.', 'שריפת דלק (ועוד) היא מלאכה. הסוכה על המכונית כשרה — הנהיגה לא.'] : ['Driving for the needs of the festival is permitted on Chol HaMoed. And you can eat in the sukkah while it moves — just like the wagon in the Mishnah.', 'נהיגה לצורך המועד מותרת בחול המועד. ואפשר לאכול בסוכה בזמן שהיא נוסעת — כמו העגלה שבמשנה.'],
    yomTov ? ['S.A. 495 (melacha on Yom Tov)', 'שו״ע תצה (מלאכה ביום טוב)'] : ['S.A. 530 (Chol HaMoed); 628:2', 'שו״ע תקל (חול המועד); תרכח:ב']);
  if (CFG.boat === 'sailing') add('you', yomTov ? 'warn' : 'ok', ['The ship is sailing', 'הספינה מפליגה'],
    yomTov ? ['A Jew may not operate the ship on Yom Tov. Staying aboard a ship run by non-Jews involves questions of techum — ask a rav before planning this.', 'אסור ליהודי להפעיל את הספינה ביום טוב. שהייה בספינה שמפעילים גויים מעוררת שאלות של תחומין — שאלו רב לפני שמתכננים.'] : ['Sailing on Chol HaMoed is fine. Travellers are exempt from the sukkah by day when there’s no sukkah on the way — but you brought yours, so use it.', 'הפלגה בחול המועד מותרת. הולכי דרכים פטורים מסוכה ביום כשאין סוכה בדרך — אבל הבאתם את שלכם, אז השתמשו בה.'],
    yomTov ? ['S.A. 248 and 404 (travel and techumin at sea)', 'שו״ע רמח ות״ד (הפלגה ותחומין בים)'] : ['S.A. 640:8', 'שו״ע תרמ:ח']);
  const rainy = CFG.rain >= 35;
  if (CFG.rain > 0) add('you', rainy ? 'warn' : 'ok', rainy ? ['Rain heavy enough to spoil the soup', 'גשם שמקלקל את התבשיל'] : ['A light drizzle', 'טפטוף קל'],
    rainy ? (yomTov && night ? ['Rain like this exempts you — but on the first night you should wait a while, then still make kiddush and eat a kezayit in the sukkah (without the bracha of leishev).', 'גשם כזה פוטר — אבל בלילה הראשון ממתינים מעט, ואחר כך בכל זאת עושים קידוש ואוכלים כזית בסוכה (בלי ברכת לישב).'] : ['When rain would spoil your food you may eat inside. “Like a servant who pours water for his master, and the master throws it in his face.”', 'כשהגשם מקלקל את התבשיל מותר לאכול בבית. ״משל לעבד שבא למזוג כוס לרבו ושפך לו קיתון על פניו.״'])
      : ['You are still obligated — light rain doesn’t exempt.', 'אתם עדיין חייבים — גשם קל אינו פוטר.'],
    ['Mishnah Sukkah 2:9; S.A. 639:5 with Rema', 'משנה סוכה ב:ט; שו״ע תרלט:ה ורמ״א']);
  const sick = CFG.seasick, stormy = CFG.wind >= 45;
  if (sick || stormy) add('you', 'warn', sick ? ['Seasick: a “mitztaer”', 'מחלת ים: ״מצטער״'] : ['Gale-force wind', 'רוח סערה'],
    [`Someone who suffers from being in the sukkah (${sick ? 'nausea' : 'wind blowing everything off the table, cold'}) is exempt — this is “mitztaer patur min hasukkah”.` + (yomTov && night ? ' On the first night many poskim still require a kezayit.' : ''),
      `מי שמצטער בישיבה בסוכה (${sick ? 'בחילה' : 'רוח שמעיפה הכול מהשולחן, קור'}) פטור — ״מצטער פטור מן הסוכה״.` + (yomTov && night ? ' בלילה הראשון פוסקים רבים עדיין מחייבים כזית.' : '')],
    ['Sukkah 26a; S.A. 640:4 and commentaries', 'סוכה כו ע״א; שו״ע תרמ:ד ונושאי כלים']);
  if (yomTov) add('you', night ? 'ok' : 'info', night ? ['It’s after nightfall', 'כבר צאת הכוכבים'] : ['Wait for nightfall', 'חכו לצאת הכוכבים'],
    night ? ['The first-night meal must be eaten after tzeit hakochavim — now is the time.', 'סעודת הלילה הראשון נאכלת אחרי צאת הכוכבים — עכשיו הזמן.'] : ['Kiddush and the first-night meal in the sukkah only after the stars come out.', 'קידוש וסעודת הלילה הראשון בסוכה רק אחרי צאת הכוכבים.'],
    ['S.A. 639:3', 'שו״ע תרלט:ג']);
  add('you', 'info', ['The bracha', 'הברכה'], ['When you eat more than a kebeitza of bread (or cake) in the sukkah, say “leishev basukkah”. On the first night add shehecheyanu at kiddush.', 'כשאוכלים יותר מכביצה פת (או מזונות) בסוכה מברכים ״לישב בסוכה״. בלילה הראשון מוסיפים שהחיינו בקידוש.'], ['S.A. 639:2, 8; 643:1', 'שו״ע תרלט:ב, ח; תרמג:א']);
  add('you', 'info', ['Sleeping on board', 'שינה בספינה'], ['Sleeping is part of dwelling in the sukkah too — but wind, cold and seasickness exempt, like for eating.', 'גם שינה היא חלק מהמצווה לדור בסוכה — אבל רוח, קור ומחלת ים פוטרים, כמו באכילה.'], ['S.A. 639:2; 640:4', 'שו״ע תרלט:ב; תרמ:ד']);

  return R;
}

function verdictOf(R) {
  const s = R.filter((r) => r.grp === 'sukkah');
  if (s.some((r) => r.st === 'fail')) return 'fail';
  if (s.some((r) => r.st === 'warn')) return 'warn';
  return 'ok';
}
function eatVerdict(R, v) {
  const yomTov = CFG.day === 'first', night = CFG.hour >= 18.9 || CFG.hour < 5.5;
  if (v === 'fail') return tt('<b>Not here.</b> This sukkah is pasul — eating in it isn’t the mitzvah, and a bracha of leishev basukkah would be in vain.', '<b>לא כאן.</b> הסוכה פסולה — אכילה בה אינה מצווה, וברכת ״לישב בסוכה״ תהיה לבטלה.');
  const drive = CFG.driving && yomTov ? tt(' <b>Also: stop driving</b> — it’s Yom Tov.', ' <b>וגם: תפסיקו לנהוג</b> — יום טוב היום.') : '';
  if (CFG.seasick || CFG.wind >= 45) return (yomTov && night ? tt('<b>Yes — a kezayit at least.</b> You’re exempt as a mitztaer, but on the first night many say to eat a kezayit in the sukkah anyway.', '<b>כן — לפחות כזית.</b> אתם פטורים כמצטערים, אבל בלילה הראשון רבים אומרים לאכול כזית בסוכה בכל זאת.') : tt('<b>You may go inside.</b> You’re a mitztaer (seasick / storm), so you’re exempt right now.', '<b>מותר להיכנס הביתה.</b> אתם מצטערים (מחלת ים / סערה), ולכן פטורים כרגע.')) + drive;
  if (CFG.rain >= 35) return (yomTov && night ? tt('<b>Wait, then eat a kezayit here.</b> Rain exempts, but the first night is special — after waiting, eat a kezayit in the sukkah without leishev.', '<b>חכו, ואז אכלו כאן כזית.</b> גשם פוטר, אבל הלילה הראשון מיוחד — אחרי המתנה אוכלים כזית בסוכה בלי ״לישב״.') : tt('<b>You may eat inside.</b> Rain that spoils the food exempts you.', '<b>מותר לאכול בבית.</b> גשם שמקלקל את התבשיל פוטר.')) + drive;
  if (yomTov && !night) return tt('<b>Not yet for the first-night meal</b> — wait for the stars. You may sit in it now.', '<b>עוד לא לסעודת הלילה הראשון</b> — חכו לכוכבים. לשבת בה אפשר כבר עכשיו.') + drive;
  return tt(`<b>Yes!</b> Make kiddush, say <i>leishev basukkah</i>${yomTov ? ' and shehecheyanu' : ''}, and eat.`, `<b>כן!</b> עשו קידוש, ברכו <i>לישב בסוכה</i>${yomTov ? ' ושהחיינו' : ''}, ותאכלו.`) + (v === 'warn' ? tt(' (Fix the ⚠ items for the best mitzvah.)', ' (תקנו את סעיפי ה־⚠ למצווה מהודרת.)') : '') + drive;
}

let RULE_FILTER = 'all';
function renderHalacha() {
  const R = evaluateHalacha();
  const v = verdictOf(R);
  const big = $('v-big'); big.className = v;
  big.textContent = v === 'ok' ? tt('Kosher', 'כשרה') : v === 'warn' ? tt('Kosher, but…', 'כשרה, אבל…') : tt('Pasul', 'פסולה');
  $('v-he').textContent = HE() ? (v === 'ok' ? 'Kosher' : v === 'warn' ? 'Kosher bedieved' : 'Pasul') : (v === 'ok' ? 'סוכה כשרה' : v === 'warn' ? 'כשרה בדיעבד' : 'סוכה פסולה');
  $('v-he').style.direction = HE() ? 'ltr' : 'rtl';
  const nf = R.filter((r) => r.st === 'fail').length, nw = R.filter((r) => r.st === 'warn').length, no = R.filter((r) => r.st === 'ok').length;
  $('v-sub').textContent = v === 'ok' ? tt('Every rule for the sukkah itself is met.', 'כל דיני הסוכה עצמה מתקיימים.') : v === 'warn' ? tt('Valid, but not the ideal way — see the ⚠ items.', 'כשרה, אבל לא לכתחילה — ראו את סעיפי ה־⚠.') : tt('At least one rule makes this sukkah invalid — see the ✕ items.', 'לפחות דין אחד פוסל את הסוכה — ראו את סעיפי ה־✕.');
  $('eat').innerHTML = tt('🍞 <b>Can you eat here right now?</b><br>', '🍞 <b>אפשר לאכול כאן עכשיו?</b><br>') + eatVerdict(R, v);
  $('counts').innerHTML = `<span><b style="color:var(--ok)">${no}</b>${tt('kept', 'מקוימות')}</span><span><b style="color:var(--warn)">${nw}</b>${tt('to improve', 'לשיפור')}</span><span><b style="color:var(--fail)">${nf}</b>${tt('problems', 'בעיות')}</span><span><b style="color:var(--info)">${R.length}</b>${tt('halachot', 'הלכות')}</span>`;
  const el = $('rules'); const open = new Set([...el.querySelectorAll('.rule.open')].map((x) => x.dataset.t));
  el.innerHTML = '';
  const order = { fail: 0, warn: 1, ok: 2, info: 3 };
  let lastGrp = null;
  const shown = R.filter((r) => RULE_FILTER === 'all' || (RULE_FILTER === 'fail' ? r.st === 'fail' || r.st === 'warn' : r.grp === RULE_FILTER));
  shown.sort((a, b) => (a.grp === b.grp ? 0 : a.grp === 'sukkah' ? -1 : 1) || order[a.st] - order[b.st]);
  for (const r of shown) {
    if (r.grp !== lastGrp) { const g = document.createElement('div'); g.className = 'grp'; g.style.cssText = 'padding:12px 0 2px;font-size:10.5px;letter-spacing:.14em;text-transform:uppercase;color:var(--faint)'; g.textContent = r.grp === 'sukkah' ? tt('The sukkah', 'הסוכה') : tt('You, the day and the sea', 'אתם, היום והים'); el.appendChild(g); lastGrp = r.grp; }
    const d = document.createElement('div'); d.className = 'rule ' + r.st + (open.has(r.t) ? ' open' : ''); d.dataset.t = r.t;
    d.innerHTML = `<div class="ic">${{ ok: '✓', warn: '!', fail: '✕', info: 'i' }[r.st]}</div><div><div class="t">${r.t}</div><div class="d">${r.d}</div><div class="src">📖 ${r.src}</div></div>`;
    d.onclick = () => d.classList.toggle('open');
    el.appendChild(d);
  }
  if (!shown.length) el.innerHTML = `<p style="color:var(--dim);font-size:13px;margin-top:14px">${tt('Nothing to fix here. 🎉', 'אין כאן מה לתקן. 🎉')}</p>`;
  return v;
}
