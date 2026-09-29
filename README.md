# Sukkah at Sea · סוכה בים

A 3D halacha simulator: a sukkah built on a pickup truck, parked on a car ferry off the coast of Tel Aviv–Yafo.
Change anything, and ~30 halachot of sukkah are checked live, each with its source.

**▶ Play it:** https://grapp-rapp.github.io/sukkah-at-sea/

> “A sukkah on top of a wagon or on the deck of a ship is kosher” — Mishnah Sukkah 2:3.
> Rabbi Akiva built one on a ship, and the wind blew it away (Sukkah 23a).

## What you can do
- **Build:** size, walls (4 / 3 / 2 + tefach / 2), canvas, bedsheets or plywood, tied or loose, gap under the walls, 9 kinds of schach, how much schach, an air gap, wood or metal supports, and what's above (open sky, an awning, the upper deck).
- **The sea:** anchored or sailing, wind (real Gerstner waves), rain, seasickness, day/night.
- **The moment:** Yom Tov or Chol HaMoed, and the shiur: Rav Chaim Na’eh (8 cm) or the Chazon Ish (9.6 cm).
- **Check:** a verdict (Kosher / Kosher, but… / Pasul), “Can you eat here right now?”, and every rule with its source. Shade and air gaps are measured from the actual 3D schach.
- **Walk the ship:** W A S D to walk, Space to jump, Shift to run. Climb the stool onto the truck bed and into the sukkah, go into the wheelhouse cabin, and take the stairs up to the upper deck.
- **English / עברית** toggle.

Presets: Chabad sukkah-mobile · Tiny roof sukkah · Rabbi Akiva’s ship · Under the awning · Plastic tarp · Two walls + tefach · Storm at sea · Gap in the schach.

*A learning tool, not a psak. For a real sukkah — ask your rav.*

## Develop
The game is plain JavaScript + [three.js](https://threejs.org) (loaded from a CDN). The source is split into files in `src/`; `build.js` joins them into one `index.html`.

```bash
node build.js        # rebuild index.html from src/
node serve.js 5182   # play at http://localhost:5182
```
