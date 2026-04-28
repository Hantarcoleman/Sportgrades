# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

---

## שרת פיתוח ופרסום

**Preview:**
```
preview_start("static-powershell")   ← מריץ .claude/serve.ps1 על פורט 8000
```
כתובת: http://localhost:8000/client/pe-grading-app.html — אין צורך ב-Node.js.

**פרסום ל-GitHub Pages** (אחרי כל שינוי ב-worktree):
```bash
git add client/pe-grading-app.html
git commit -m "תיאור השינוי"
# ואז מה-main repo:
git -C "C:/Users/eitan/OneDrive/שולחן העבודה/אפליקציית ציונים/Sportgrade" merge <branch> --no-edit
git -C "C:/Users/eitan/OneDrive/שולחן העבודה/אפליקציית ציונים/Sportgrade" push origin main
```
GitHub Pages מתעדכן תוך ~1 דקה. הכתובת הפעילה:
`https://hantarcoleman.github.io/Sportgrades/client/pe-grading-app.html`

**לאחר שינוי משמעותי — עדכן `docs/STATUS.md`** (פיצ'ר חדש, באג מרכזי, שינוי מבנה נתונים, קובץ חדש).

---

## ארכיטקטורה כללית

**SportGrade** הוא SPA בקובץ HTML יחיד (`client/pe-grading-app.html`, ~13K שורות) ללא frameworks. אין build step, אין modules — vanilla JS, CSS variables, RTL Hebrew UI.

קבצים פעילים:
- `client/pe-grading-app.html` — האפליקציה כולה
- `client/login.html` — Supabase auth gateway
- `client/tournament-manager.html` — Legacy standalone (backup בלבד, לא בשימוש)

---

## State ומפתחות localStorage

**Global state (`S`)** — מגובה ב-`localStorage('sportgrade_v6')`:
```javascript
S = {
  groups: {
    [gid]: {
      name, classes,                    // "ח1, ח2"
      students: [{name, gender, grade, cls, _guest?}],
      results:   {[testId]: {[idx]: {a, b, bonusA, showB}}},
      results_b: {[testId]: {[idx]: {...}}},  // semester B
      customTests: {[testId]: {...}},
      _sbId?: number                    // Supabase sync key
    }
  },
  nextId: number,
  customTests: {}
}
```

**Context נוכחי (`CUR`)** — מגובה ב-`localStorage('sg_cur_v1')`:
```javascript
CUR = { gid, test, semester: 'a'|'b', sort }
```

מפתחות נוספים: `sportgrade_archive_v1` (שנים קודמות), `sg_a11y_v1` (נגישות), `tourneygrade_all_v1` / `tourneygrade_cur_v1` (טורנירים), `sportgrade_random_v1` (ריצות).

---

## מערכת ציונים (TABLES)

18 מבחנים מובנים. מבנה:
```javascript
TABLES[testId] = {
  lb: boolean,       // lower-is-better (ריצות)
  isTime: true,      // ניתוח MM:SS
  isSeconds: true,   // שניות
  maleOnly: true,    // בנים בלבד
  grades: {
    [grade]: { m: [[val, score], ...], f: [[val, score], ...] }
  }
}
```

שרשרת ציון:
```
rawInput → parseInputVal() → getScore(testId, grade, gender, val) → interpolate()
→ calcFinal(score, bonusA%, 0) = min(100, score × (1 + bonus/100))
```

`interpolate()` מבצע interpolation ליניארי בין נקודות העוגן. ציון 0 → 0. מעבר לסף 100 → 100.

---

## Views ו-Navigation

```javascript
showView('welcome'|'group'|'group-edit'|'archive'|'random')
// מסיר 'active' מכל .view, מוסיף ל-view-{name}
// מעודכן ב-showView wrapper (line ~9968) שמוסיף טורניר-views
```

נתיב Hash: `#gid=1&test=pushups&sem=a` — משוחזר ב-`restoreRoute()` אחרי Supabase load.

---

## מנועי מבחן חי

| פונקציה | מבחן | שמירה |
|---|---|---|
| `openBeepLive()` | Beep test | `blSaveAll()` |
| `openLongRunLive()` | ריצות ארוכות + stopwatch | `lrSaveAll()` |
| `openMetronome()` | מטרונום + שכיבות סמיכה | שמירה בזמן אמת |
| `openTimer()` | טיימר / פלאנק | שמירה ידנית |

---

## Supabase Integration

`sbInit()` רץ ב-DOMContentLoaded → `getSession()` → אם אין session מעביר ל-`login.html`.

`sbLoadUserData()` → מעדכן `S.groups` → קורא `restoreRoute()`.

`saveState()` → localStorage תמיד; Supabase ב-background דרך `sbSaveGroup(gid)`.

localStorage הוא source of truth. Supabase הוא backup. מגבלה: 50 משתמשים (enforced ב-login.html).

---

## טורנירים (Tournament Manager)

```javascript
// נתונים ב-tourneygrade_all_v1
T = {
  id, name, grade, gender, type: 'league'|'knockout',
  teams: [{id, name, color}],
  matches: [{id, homeTeamId, awayTeamId, date, time, status,
             homeScore, awayScore, goalDetails: [{scorer, assister, ...}]}],
  legs, days, startDate, blockedDays,
  scorers: {[name]: {goals, assists, ownGoals, team}},
  teamRosters: {[teamId]: [...]}
}
```

פונקציות מרכזיות: `openTournamentManager()`, `init_tm()`, `calcStandings()`, `generateSchedule()`, `saveData()`.

---

## CSS Variables

```css
--bg, --bg2, --sf            /* רקעים */
--ink, --ink2, --ink3        /* טקסט (ראשי / משני / כהה) */
--ac, --abg, --abd           /* accent כתום */
--gn (ירוק), --bl (כחול), --pu (סגול), --gd (זהב)
--r: 12px, --rs: 8px, --rx: 30px (pill)
--sh, --shl                  /* צלליות */
```

Dark mode: `<html data-theme="dark">` — כל המשתנים מוגדרים מחדש ב-`[data-theme="dark"]`.

---

## פונקציות מרכזיות לעיון מהיר

| פונקציה | מיקום | תיאור |
|---|---|---|
| `renderTable()` | ~2738 | מרנדר טבלת ציונים מחדש |
| `refreshRow(idx)` | ~2917 | עדכון שורה אחת (cells[4] = ציון) |
| `onLive(e)` / `onFC(e)` | ~2879 | event handlers לשינוי תוצאה |
| `saveState()` | ~2201 | שמירה ל-localStorage + Supabase |
| `setCUR(patch)` | — | עדכון CUR + hash + save |
| `getScore(testId,grade,gender,val)` | ~2170 | חישוב ציון גולמי |
| `calcFinal(base,bonus%,pts)` | ~2196 | ציון סופי עם בונוס |
| `normGrade(input)` | — | נרמול כיתה → 'ז'-'יב' |
| `toast(msg)` | — | הודעת popup קצרה |
