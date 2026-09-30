const DAY_NAMES = [
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday',
  'Sunday'
];

const LABEL_ALIASES = {
  warm: ['warm', 'heiss', 'heiß', 'hot'],
  cold: ['cold', 'kalt'],
  fast: ['fast', 'quick', 'schnell', 'kurz'],
  slow: ['slow', 'langsam', 'lang'],
  easy: ['easy', 'leicht', 'simple', 'null', 'normal', 'mittel'],
  difficult: ['difficult', 'hard', 'schwierig', 'challenging', 'tief', 'hoch'],
  vegetarian: ['vegetarian', 'vegetarisch'],
  family: ['family', 'familie', 'familiaer'],
  cheap: ['cheap', 'gunstig', 'günstig', 'budget'],
  'high-protein': ['high-protein', 'proteinreich', 'protein rich'],
  comfort: ['comfort', 'gemutlich', 'cozy'],
  light: ['light', 'leicht', 'fresh'],
  breakfast: ['breakfast', 'fruhstuck', 'frühstück'],
  lunch: ['lunch', 'mittag'],
  dinner: ['dinner', 'abend'],
  gutburgerlich: ['gutburgerlich', 'gutbürgerlich', 'common', 'traditional'],
  variabel: ['variabel', 'variable', 'varied'],
  exotisch: ['exotisch', 'exotic'],
  mittel: ['mittel', 'medium'],
  lang: ['lang', 'long'],
  hoch: ['hoch', 'high'],
  tief: ['tief', 'deep'],
  null: ['null']
};

const sheetUrlInput = document.getElementById('sheetUrl');
const statusBox = document.getElementById('statusBox');
const recipeSummary = document.getElementById('recipeSummary');
const weeklyPlan = document.getElementById('weeklyPlan');
const loadSheetBtn = document.getElementById('loadSheetBtn');
const generatePlanBtn = document.getElementById('generatePlanBtn');
const mealTypeSelect = document.getElementById('mealType');
const maxMinutesInput = document.getElementById('maxMinutes');
const slotsSelect = document.getElementById('slots');

const mustHaveLabels = document.getElementById('mustHaveLabels');
const avoidLabels = document.getElementById('avoidLabels');

let recipeData = [];

function textKey(value) {
  return String(value || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9\s-]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function normalizeLabelValue(value) {
  const key = textKey(value);
  if (!key) return '';

  for (const [canonical, aliases] of Object.entries(LABEL_ALIASES)) {
    if (aliases.includes(key)) {
      return canonical;
    }
  }

  return key;
}

function getSelectedLabels(container) {
  return Array.from(container.querySelectorAll('input:checked')).map((input) => input.value);
}

function createLabelCheckboxes(container, values) {
  values.forEach((label) => {
    const labelBox = document.createElement('label');
    labelBox.className = 'label-pill';

    const checkbox = document.createElement('input');
    checkbox.type = 'checkbox';
    checkbox.value = label;

    labelBox.appendChild(checkbox);
    labelBox.appendChild(document.createTextNode(label));
    container.appendChild(labelBox);
  });
}

function setStatus(message) {
  statusBox.textContent = message;
}

function normalizeLabels(rawLabels) {
  if (!rawLabels) return [];

  return String(rawLabels)
    .split(/[;,|/]/)
    .map((label) => normalizeLabelValue(label))
    .filter(Boolean)
    .filter((label, index, arr) => arr.indexOf(label) === index);
}

function parseCSV(text) {
  const rows = [];
  let current = '';
  let row = [];
  let inQuotes = false;

  for (let i = 0; i < text.length; i += 1) {
    const char = text[i];
    const nextChar = text[i + 1];

    if (char === '"') {
      if (inQuotes && nextChar === '"') {
        current += '"';
        i += 1;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === ',' && !inQuotes) {
      row.push(current);
      current = '';
    } else if ((char === '\n' || char === '\r') && !inQuotes) {
      if (char === '\r' && nextChar === '\n') {
        i += 1;
      }
      row.push(current);
      if (row.some((cell) => cell.trim() !== '')) {
        rows.push(row);
      }
      row = [];
      current = '';
    } else {
      current += char;
    }
  }

  if (current || row.length) {
    row.push(current);
    if (row.some((cell) => cell.trim() !== '')) {
      rows.push(row);
    }
  }

  return rows;
}

function firstValue(record, candidates) {
  for (const candidate of candidates) {
    const match = record[candidate];
    if (match !== undefined && match !== null && String(match).trim() !== '') {
      return match;
    }
  }

  return '';
}

function parseTimeLabel(value) {
  const key = textKey(value);

  if (!key) return 30;
  if (['null', 'nichts', 'none'].includes(key)) return 10;
  if (['kurz', 'short', 'quick'].includes(key)) return 15;
  if (['mittel', 'medium', 'normal'].includes(key)) return 30;
  if (['lang', 'long', 'slow'].includes(key)) return 45;
  if (['sehr lang', 'very long'].includes(key)) return 60;

  const digits = Number(String(value).replace(/[^0-9]/g, ''));
  return Number.isFinite(digits) && digits > 0 ? digits : 30;
}

function mapDifficulty(value) {
  const key = textKey(value);

  if (['easy', 'leicht', 'simple', 'null'].includes(key)) return 'easy';
  if (['difficult', 'hard', 'schwierig', 'challenging', 'tief', 'hoch'].includes(key)) return 'difficult';
  if (['mittel', 'medium'].includes(key)) return 'easy';

  return 'easy';
}

function parseRecipesFromCSV(csvText) {
  const rows = parseCSV(csvText);
  if (rows.length < 2) {
    return [];
  }

  const rawHeaders = rows[0].map((cell) => String(cell).trim().toLowerCase());
  const headers = rawHeaders.map((header) => textKey(header).replace(/\s+/g, ''));
  const dataRows = rows.slice(1);

  return dataRows
    .map((row) => {
      const record = {};
      headers.forEach((header, index) => {
        record[header] = row[index] || '';
      });

      const title = firstValue(record, ['menu', 'menue', 'menü', 'title', 'name', 'recipe']);
      const effort = firstValue(record, ['effort', 'schwierigkeit', 'difficulty']);
      const timeValue = firstValue(record, ['zeit', 'time', 'minutes', 'prep_time']);
      const temperature = firstValue(record, ['temperatur', 'temperature', 'temp']);
      const vibe = firstValue(record, ['vibe', 'style', 'mood', 'category']);

      const labels = normalizeLabels([effort, timeValue, temperature, vibe]);
      const time = parseTimeLabel(timeValue);

      return {
        title: String(title || '').trim(),
        labels,
        type: 'Any',
        difficulty: mapDifficulty(effort),
        time,
        notes: ''
      };
    })
    .filter((recipe) => recipe.title && recipe.title !== 'Untitled recipe');
}

function buildLabelOptions() {
  const labels = [...new Set(recipeData.flatMap((recipe) => recipe.labels))].sort();
  const container = document.getElementById('mustHaveLabels');
  const avoidContainer = document.getElementById('avoidLabels');

  container.innerHTML = '';
  avoidContainer.innerHTML = '';

  labels.forEach((label) => {
    const option = document.createElement('label');
    option.className = 'label-pill';

    const input = document.createElement('input');
    input.type = 'checkbox';
    input.value = label;

    option.appendChild(input);
    option.appendChild(document.createTextNode(label));
    container.appendChild(option.cloneNode(true));
    avoidContainer.appendChild(option);
  });
}

function filterRecipes() {
  const mustHave = getSelectedLabels(mustHaveLabels).map((label) => label.toLowerCase());
  const avoid = getSelectedLabels(avoidLabels).map((label) => label.toLowerCase());
  const selectedMealType = mealTypeSelect.value.toLowerCase();
  const maxMinutes = Number(maxMinutesInput.value || 999);

  return recipeData.filter((recipe) => {
    const recipeLabels = recipe.labels.map((label) => label.toLowerCase());

    if (mustHave.length > 0 && !mustHave.every((label) => recipeLabels.includes(label))) {
      return false;
    }

    if (avoid.some((label) => recipeLabels.includes(label))) {
      return false;
    }

    if (selectedMealType !== 'any' && recipe.type && recipe.type.toLowerCase() !== selectedMealType) {
      return false;
    }

    if (Number.isFinite(maxMinutes) && recipe.time > maxMinutes) {
      return false;
    }

    return true;
  });
}

function renderWeeklyPlan(plan) {
  if (!plan.length) {
    weeklyPlan.innerHTML = '<p class="empty-state">No recipes match your current filters. Try removing a few labels or increasing the time limit.</p>';
    return;
  }

  weeklyPlan.innerHTML = plan
    .map(
      (item) => `
        <article class="day-card">
          <h3>${item.day}</h3>
          <h4>${item.recipe.title}</h4>
          <p class="meta">${item.recipe.type} • ${item.recipe.difficulty} • ${item.recipe.time} min</p>
          ${item.recipe.notes ? `<p>${item.recipe.notes}</p>` : ''}
          <div class="tag-list">
            ${item.recipe.labels
              .map((label) => `<span class="tag">${label}</span>`)
              .join('')}
          </div>
        </article>
      `
    )
    .join('');
}

function generateWeeklyPlan() {
  const filteredRecipes = filterRecipes();
  const slots = Number(slotsSelect.value || 7);

  if (!filteredRecipes.length) {
    recipeSummary.textContent = '0 recipes match your filters.';
    renderWeeklyPlan([]);
    return;
  }

  const chosenPlans = [];
  const availableRecipes = [...filteredRecipes];

  for (let i = 0; i < slots; i += 1) {
    if (!availableRecipes.length) break;

    const randomIndex = Math.floor(Math.random() * availableRecipes.length);
    const recipe = availableRecipes[randomIndex];
    chosenPlans.push({
      day: DAY_NAMES[i % DAY_NAMES.length],
      recipe
    });
    availableRecipes.splice(randomIndex, 1);
  }

  recipeSummary.textContent = `${filteredRecipes.length} recipes matched your filters. ${chosenPlans.length} meals selected for the week.`;
  renderWeeklyPlan(chosenPlans);
}

async function loadRecipes() {
  const url = sheetUrlInput.value.trim() || './sample-recipes.csv';

  try {
    setStatus('Loading recipe data...');
    const response = await fetch(url, { cache: 'no-store' });

    if (!response.ok) {
      throw new Error(`Unable to load the spreadsheet (${response.status}).`);
    }

    const csvText = await response.text();
    const parsedRecipes = parseRecipesFromCSV(csvText);

    if (!parsedRecipes.length) {
      throw new Error('The file was loaded, but no recipe rows were found. Check your sheet columns.');
    }

    recipeData = parsedRecipes;
    buildLabelOptions();
    setStatus(`Loaded ${recipeData.length} recipes successfully.`);
    recipeSummary.textContent = `${recipeData.length} recipes are ready to use.`;
    renderWeeklyPlan([]);
    generateWeeklyPlan();
  } catch (error) {
    console.error(error);
    setStatus(error.message || 'Something went wrong while loading the spreadsheet.');
    recipeSummary.textContent = 'No recipes loaded yet. Please check the Google Sheet URL and try again.';
    renderWeeklyPlan([]);
  }
}

loadSheetBtn.addEventListener('click', loadRecipes);
generatePlanBtn.addEventListener('click', generateWeeklyPlan);
loadRecipes();
