# מדריך Git למתחיל — SportGrade
**מיועד ל-Eitan, Windows**

---

## למה בכלל Git?

תחשוב על Git כמו **"שמור גרסה"** על סטרואידים:
- כל פעם שתשמור — יש נקודת חזרה
- משהו נשבר? לוחצים "חזור לגרסה הקודמת"
- רואים בדיוק מה השתנה ומתי

---

## שלב 1 — הורד GitHub Desktop

1. כנס לאתר: **https://desktop.github.com**
2. לחץ "Download for Windows"
3. התקן (Next → Next → Finish)

זה ממשק גרפי — **אין שורת פקודה.**

---

## שלב 2 — פתח חשבון GitHub

1. כנס לאתר: **https://github.com**
2. לחץ "Sign up"
3. הזן:
   - Username: `eitan-sportgrade` (או כל שם שתרצה)
   - Email: האימייל שלך
   - Password: סיסמה חזקה
4. אמת את האימייל

---

## שלב 3 — חבר GitHub Desktop לחשבון

1. פתח GitHub Desktop
2. File → Options → Accounts
3. לחץ "Sign in to GitHub.com"
4. הזן את הפרטים

---

## שלב 4 — העלה את הפרויקט

1. פתח GitHub Desktop
2. לחץ **"Add an Existing Repository from your Hard Drive"**
3. בחר את התיקייה `sportgrade-project` מ-Downloads
4. לחץ **"create a repository"**
5. תן שם: `sportgrade`
6. לחץ **"Publish repository"**

✅ **זהו. הפרויקט שלך שמור ב-GitHub.**

---

## שימוש יומיומי (3 שניות)

בכל פעם שתשנה משהו:

```
1. פתח GitHub Desktop
2. תראה בצד שמאל מה השתנה
3. כתוב תיאור קצר בתחתית: "תיקון ביפ" / "הוספת מבחן"
4. לחץ "Commit to main"
5. לחץ "Push origin"
```

---

## איך חוזרים אחורה אם משהו נשבר?

```
1. פתח GitHub Desktop
2. לחץ "History" בצד שמאל
3. מצא את הגרסה שרצית
4. לחץ עליה ימין → "Revert Changes"
```

---

## שאלות נפוצות

**שאלה:** האם הקוד שלי גלוי לכולם?
**תשובה:** לא. כשתעלה, בחר "Private" ואף אחד לא יראה.

**שאלה:** עולה כסף?
**תשובה:** חינם לחלוטין לשימוש פרטי.

**שאלה:** מה אם אשכח לעשות commit?
**תשובה:** שום דבר לא יאבד — רק לא תהיה לך נקודת חזרה לאותה גרסה.
