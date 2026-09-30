# Weekly Menu Planner

A simple website that loads recipe ideas from a public Google Sheet and helps generate a weekly menu based on labels such as warm, cold, fast, vegetarian, and difficult.

This version is intentionally beginner-friendly. It uses plain HTML, CSS, and JavaScript, so you do not need a framework or backend just to get started.

## What this app does

- Reads a public CSV file from a Google Sheet
- Filters recipes by labels and time limits
- Lets the user choose what they want to avoid or include
- Generates a weekly menu with a simple schedule

## How to use it

1. Open the project folder in a browser, or run a local web server:

   ```bash
   cd recipe-menu-planner
   python -m http.server 8000
   ```

2. Open this URL in the browser:

   ```text
   http://localhost:8000
   ```

3. Paste your public Google Sheet CSV link in the input box.

4. Choose your filters and click "Generate weekly plan".

## Google Sheet setup

For the easiest setup, use a public CSV export.

### Recommended steps

1. In Google Sheets, create a sheet with columns like this:

   ```text
   title,labels,type,difficulty,time,notes
   Tomato Soup,"warm, vegetarian, lunch",Lunch,Easy,20,Comfort food
   Fruit Salad,"cold, fast, breakfast",Breakfast,Easy,10,Quick and fresh
   Chicken Stir Fry,"warm, fast, high-protein",Dinner,Medium,25,Good for busy nights
   ```

2. Publish the sheet to the web:
   - File > Share > Publish to web
   - Choose "CSV"
   - Copy the published URL

3. Paste that CSV link into the app input box.

The app will read the CSV and create a weekly menu automatically.

## Important note about Google Sheets

This project is a simple front-end app. That means it fetches a public CSV directly from the browser. For that to work, the sheet must be public or published.

## Project structure

- `index.html` – main page
- `style.css` – styling
- `script.js` – logic for reading the sheet and generating the plan
- `sample-recipes.csv` – example data you can use immediately

## Example CSV file

The included `sample-recipes.csv` file is meant to help you understand the format.

### Example rows

```csv
title,labels,type,difficulty,time,notes
Tomato Soup,"warm, vegetarian, comfort",Lunch,Easy,20,Cozy and easy
Fruit Salad,"cold, fast, light",Breakfast,Easy,10,Refreshing
Chicken Stir Fry,"warm, fast, high-protein",Dinner,Medium,25,Quick dinner option
Pasta Primavera,"warm, family, vegetarian",Dinner,Easy,30,Simple family favorite
``` 

## Future improvements

This is a solid starter version. Later, you could add:

- a calendar view
- login / saved weekly plans
- recipe details and ingredients
- a smarter matching engine
- deployment to Netlify or Vercel

## Need help?

If you want, I can continue by helping you:

- connect the app to your real Google Sheet
- improve the menu logic
- add a nicer design
- deploy it online
