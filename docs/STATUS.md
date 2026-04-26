# SportGrade — מסמך מצב פרויקט
**עודכן:** 26 אפריל 2026  
**שיחה:** pe-grading-app-dev

---

## קבצים פעילים

| קובץ | גודל | תיאור |
|------|------|--------|
| `client/pe-grading-app.html` | 850KB | האפליקציה הראשית (כולל tournament משולב) |
| `client/login.html` | 17KB | דף התחברות |
| `client/tournament-manager.html` | 180KB | מנהל טורנירים עצמאי (legacy — לא בשימוש) |
| `.claude/launch.json` | — | הגדרות שרת פיתוח (preview mode) |
| `.claude/serve.ps1` | — | שרת סטטי ב-PowerShell (ללא תלויות חיצוניות) |

**חשוב:** מנהל הטורנירים משולב **בתוך** pe-grading-app.html מאז תיקון בעיית file:// URL. tournament-manager.html הוא גיבוי בלבד.

---

## סביבת פיתוח

- **שרת:** PowerShell HttpListener — `powershell -File .claude/serve.ps1 -Port 8000 -Root client`
- **כתובת:** http://localhost:8000/
- **הפעלה מ-Claude Code:** `preview_start("static-powershell")` (מוגדר ב-`.claude/launch.json`)
- **דרישות:** רק PowerShell 5.1+ מובנה — אין צורך ב-Node.js / Python

---

## ארכיטקטורה

### Storage
```
localStorage key: 'sportgrade_v6'        ← נתוני תלמידים + ציונים
localStorage key: 'sportgrade_random_v1' ← קבוצה אקראית
localStorage key: 'tourneygrade_all_v1'  ← כל הטורנירים (מערך)
localStorage key: 'tourneygrade_cur_v1'  ← id טורניר פעיל
```

### מבנה נתוני תלמידים
```javascript
S = {
  groups: {
    [gid]: {
      name: string,
      classes: string,        // "ח1, ח2"
      students: [{name, gender, grade, cls, _guest?}],
      results: {              // מחצית א'
        [testId]: { [studentIdx]: {a, b, bonusA, showB} }
      },
      results_b: { ... }      // מחצית ב'
    }
  },
  nextId: number,
  customTests: {}
}
```

### מבנה טורניר
```javascript
T = {
  id, name, grade, gender, type ('league'|'knockout'),
  teams: [{id, name, color}],
  matches: [{id, round, home, away, date, time, status, homeScore, awayScore, goalDetails, assists}],
  legs: number,               // מספר מפגשים בין קבוצות
  matchTime, days, startDate,
  blockedDays: [{start, end?, reason}],
  scorers: {name: {goals, assists, ownGoals, team}},
  roster: [],                 // רשימה כללית
  teamRosters: {[teamId]: []} // רשימה לפי קבוצה
}
```

---

## פיצ'רים מיושמים — SportGrade

### מבחנים
- ✅ כל מבחני כוח: שכיבות סמיכה, מתח, כפיפות, קפיצה, פלנק, שכיבות מטרונום
- ✅ ביפ טסט (חי + ידני)
- ✅ ריצות: 60מ, 100מ, 4×10מ, 1000מ, 2000מ, 3000מ, קופר
- ✅ מבחנים מותאמים אישית (custom tests)

### מנועי מבחן חי
- ✅ **ביפ חי** — כרטיסי תלמידים, tap לפסילה, ציון רק למי שנלחץ
- ✅ **ריצות ארוכות חי** — שעון, tap לסיום, איפוס מאושר
- ✅ **מטרונום** — BPM, ספליטים, sync מוט
- ✅ **טיימר** — פלנק + ריצות קצרות, ספליטים עם שם
- ✅ שמירה אוטומטית בסיום כל מבחן חי

### מחציות
- ✅ מחצית א' + ב' עצמאיות
- ✅ עמודת "מחצית א' (לצפייה)" במחצית ב'
- ✅ שיפור % — ירוק, ירידה — אדום
- ✅ ציון לתעודה = max(א', ב')
- ✅ בונוס % לכל מבחן

### ניהול קבוצות
- ✅ העלאת Excel (אלפון)
- ✅ עריכת קבוצה — view מלא (שם, מחיקה, העברת תלמיד)
- ✅ הוסף תלמיד — שכבה נעולה לפי קבוצה, בחירת מקבילה בלבד
- ✅ אורחים — מופיעים רק במבחן שביצעו
- ✅ קבוצה אקראית — ביפ + ריצות + מטרונום + פלנק

### UI
- ✅ Sidebar עם pin (נעיץ פתוח)
- ✅ ☰ בצד ימין (RTL נכון)
- ✅ קבוצה אקראית תחת "קבוצות לימוד"
- ✅ מדריך למורה (modal)
- ✅ ייצוא Excel (מבחן אחד / כל המבחנים)
- ✅ השלמת מבחנים
- ✅ כותרות עמודות מלאות (תוצאה מועד א', ציון מועד א' וכו')

---

## פיצ'רים מיושמים — TourneyGrade (משולב)

- ✅ ליגה + נוקאאוט
- ✅ 3–16 קבוצות (stepper +/-)
- ✅ מספר מפגשים (1×, 2×, 3×) — הלוך וחזור
- ✅ לוח משחקים אוטומטי
- ✅ ימים חסומים
- ✅ הזנת תוצאה עם +/- שערים
- ✅ כובשים ומבשלים לפי שורות (per-goal rows)
- ✅ אוטו-קומפליט מרשתרת הקבוצה
- ✅ שער עצמי (OG)
- ✅ טבלת ליגה עם FORM guide (W/D/L)
- ✅ TOP SCORERS / TOP ASSISTS / מאזן שערים
- ✅ Head to Head
- ✅ פרוטוקול משחק (post-match summary)
- ✅ ייצוא: PDF הדפסה, CSV, iCal
- ✅ QR Code לתלמידים
- ✅ דף צפייה לתלמידים (buildViewerHtml)
- ✅ ניהול גישה (admin password — SHA-256)
- ✅ ריבוי טורנירים — דף בית עם כרטיסים
- ✅ התראה על משחקים שעברו ללא תוצאה
- ✅ 3-dot menu: ערוך / הזז / מחק משחק
- ✅ איפוס שעון ריצות עם אישור

---

## בעיות ידועות / לא אושרו

| בעיה | סטטוס |
|------|--------|
| אורח בריצות ארוכות — שמירה לקבוצה מקורית | קוד תוקן, לא אושר בידי משתמש |
| אורח בביפ — שמירה לקבוצה מקורית | קוד תוקן, לא אושר |
| מטרונום sync מוט | קוד תוקן, לא אושר |
| tournament panel — פתיחה ב-overlay | משולב, לא נבדק עדיין |

---

## לא מיושם (Placeholder)

| פיצ'ר | הערה |
|--------|------|
| דוחות מחוז | placeholder בלבד |
| Realtime בין מכשירים | דורש שרת |
| Google Calendar sync | דורש OAuth |
| גיבוי אוטומטי | רק ייצוא ידני |

---

## רשימת פיצ'רים עתידיים (עלו בשיחה)

1. **PWA offline** — האפליקציה תעבוד ללא Wi-Fi + מסך הבית
2. **גיבוי אוטומטי** — ייצוא JSON מתוזמן / Google Drive
3. **תצוגת תלמיד בודד** — סיכום + גרף התקדמות
4. **גרף שכבתי** — ממוצע ציונים לפי מבחן ולפי קבוצה
5. **בדיקת שם כפול** — התראה בהוספת תלמיד
6. **חיפוש גלובלי** — חיפוש ברוחב כל הקבוצות

---

## תוכנית Backend עתידית (שלבים)

**מטרה:** עד 100 משתמשים, פשוט, Node.js + SQLite

```
שלב 0 — ייצוב הקיים (HTML בלבד)
שלב 1 — פרונט מסודר (/pages, /js, /styles)
שלב 2 — שרת Node.js מינימלי
שלב 3 — SQLite (מספיק ל-100 משתמשים)
שלב 4 — Auth (login, סיסמאות מוצפנות)
שלב 5 — חיבור HTML ↔ שרת (fetch)
שלב 6 — פריסה (Railway / Vercel)
שלב 7 — Git + progress.md
```

**שאלות פתוחות שטרם נענו:**
- האם מורים רואים רק קבוצות שלהם, או מנהל בית-ספר רואה הכל?
- האם שני מורים יכולים לשתף קבוצה?
- תלמידים מתחברים בעצמם, או רק המורה מזין?
- מה קורה לנתוני localStorage הקיימים?
- הפריסה — Railway / Vercel, יש hosting קיים?
- רמת נוחות עם Node.js + terminal?

---

## פונקציות מרכזיות — מפתח מהיר

```javascript
// ── ניהול נתונים ──────────────────────────────────
saveState()                          // שמור לlocalStorage
S.groups[gid].students               // רשימת תלמידים
S.groups[gid].results[testId][idx]   // ציון תלמיד
writeResult(gid, testId, idx, val, round) // כתיבה מרכזית

// ── תצוגה ─────────────────────────────────────────
renderTable()                        // עדכן טבלת ציונים
renderGroupGrid()                    // עדכן כרטיסי קבוצות
showView(name)                       // ניווט בין views
openModal(id) / closeModal(id)       // מודאלים

// ── מבחנים חיים ───────────────────────────────────
openBeepLive()                       // ביפ טסט
openLongRunLive()                    // ריצות ארוכות
openMetronome()                      // מטרונום
openTimer()                          // טיימר/פלנק
blSaveAll(silent?)                   // שמור ביפ
lrSaveAll(silent?)                   // שמור ריצות

// ── Sidebar ────────────────────────────────────────
openSidebar() / closeSidebar()
toggleSidebarPin()                   // נעיצה
sbGoHome() / sbGoRandom()

// ── טורניר ────────────────────────────────────────
openTournamentManager()              // פתח overlay
init_tm()                            // אתחול טורניר
saveData() / loadData()              // persistence
calcStandings()                      // טבלת ליגה
```

---

## CSS Variables (`:root`)

```css
--bg, --bg2, --bg3, --sf           /* רקעים */
--ink, --ink2, --ink3              /* טקסט */
--bd, --bd2                        /* גבולות */
--ac                               /* צבע ראשי (כתום) */
--gn, --gnbg, --gnbd               /* ירוק (שיפור) */
--bl, --blbg                       /* כחול */
--pu, --pubg, --pubd               /* סגול */
--r, --rs, --rx                    /* radii */
--sh, --shl                        /* צללים */
--t                                /* transition */

/* בתוך tm-wrap (טורניר) */
--gr, --grbd, --grbg               /* ירוק */
--re, --rebd, --rebg               /* אדום */
--ye, --yebd, --yebg               /* צהוב */
```

---

*מסמך זה נוצר אוטומטית — יש לעדכן בכל שינוי ארכיטקטורלי משמעותי*
