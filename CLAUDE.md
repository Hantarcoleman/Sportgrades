# SportGrade — הנחיות לעבודה עם Claude

## עדכון מסמך המצב

בכל פעם שמתבצע עדכון משמעותי בפרויקט — **עדכן את `docs/STATUS.md`**.

עדכון נחשב "משמעותי" אם:
- נוסף פיצ'ר חדש או תוקנה באג מרכזית
- השתנה מבנה נתונים (localStorage keys, סכמת אובייקטים)
- נוסף קובץ חדש לפרויקט
- השתנתה סביבת הפיתוח (שרת, פורט, תלויות)
- התחלה או סיום של שלב בתוכנית ה-Backend

מה לעדכן ב-`docs/STATUS.md`:
- תאריך העדכון בראש המסמך
- טבלת הקבצים הפעילים (גדלים, תיאורים)
- סעיף הפיצ'רים המיושמים (סמן ✅ על מה שהושלם)
- בעיות ידועות (הוסף / הסר לפי המצב)
- פונקציות מרכזיות אם נוספו/שונו

## זרימת עבודה — פרסום שינויים

האפליקציה חיה בגיטהאב פייג'ס:
`https://hantarcoleman.github.io/Sportgrades/client/pe-grading-app.html`

**אחרי כל שינוי — חובה לבצע:**
```bash
git add client/pe-grading-app.html
git commit -m "תיאור השינוי"
# ואז מה-main repo:
git -C "C:/Users/eitan/OneDrive/שולחן העבודה/אפליקציית ציונים/Sportgrade" merge claude/competent-banach-4c0fcf --no-edit
git -C "C:/Users/eitan/OneDrive/שולחן העבודה/אפליקציית ציונים/Sportgrade" push origin main
```

GitHub Pages מתעדכן תוך ~1 דקה אחרי ה-push.

---

## שרת הפיתוח

להפעלת preview mode:
```
preview_start("static-powershell")   ← מריץ .claude/serve.ps1 על פורט 8000
```
הכתובת: http://localhost:8000/  
אין צורך ב-Node.js או Python — עובד עם PowerShell מובנה בלבד.
