// HearthLedger — router, state and wiring. The shell (index.html) holds the nav
// and the #app mount; this file renders the current hash route into #app and
// owns every action (add/edit/delete transaction, edit a limit, add to a goal,
// reset). All totals are computed from state here, never hard-coded in views.

import { DATA, DONUT_COLORS, DONUT_OTHER } from './data.js';
import {
  renderDashboard, wireDashboard,
  renderTransactions, wireTransactions,
  renderBudgets, wireBudgets,
  renderGoals, wireGoals,
  renderInsights, wireInsights,
} from './views.js';

const STORAGE_KEY = 'hearthledger-v1';
const SPENDING_CATEGORIES = DATA.categories.map((c) => c.name);

// ---------- money math in integer cents (no floating-point drift) ----------

const toCents = (n) => Math.round(n * 100);
const fromCents = (c) => c / 100;
const sumCents = (rows) => rows.reduce((acc, n) => acc + toCents(n), 0);

// ---------- state ----------

function freshState() {
  return {
    transactions: DATA.transactions.map((t) => ({ ...t })),
    limits: Object.fromEntries(DATA.categories.map((c) => [c.name, c.limit])),
    goals: DATA.goals.map((g) => ({ ...g })),
    income: DATA.income.map((s) => ({ ...s })),
    months: DATA.months.map((m) => ({ ...m })),
    categories: DATA.categories.map((c) => ({ name: c.name, note: c.note })),
  };
}

function loadState() {
  const state = freshState();
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return state;
    const saved = JSON.parse(raw);
    if (!saved || !Array.isArray(saved.transactions)) return state;
    state.transactions = saved.transactions;
    if (saved.limits && typeof saved.limits === 'object') {
      for (const name of SPENDING_CATEGORIES) {
        if (typeof saved.limits[name] === 'number') state.limits[name] = saved.limits[name];
      }
    }
    if (saved.goals && typeof saved.goals === 'object') {
      for (const g of state.goals) {
        if (typeof saved.goals[g.name] === 'number') g.saved = saved.goals[g.name];
      }
    }
  } catch (err) {
    // Storage blocked or data corrupt: memory-only, the site still works.
  }
  return state;
}

function saveState(state) {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify({
      transactions: state.transactions,
      limits: state.limits,
      goals: Object.fromEntries(state.goals.map((g) => [g.name, g.saved])),
    }));
  } catch (err) {
    // Storage unavailable: keep going in memory.
  }
}

const state = loadState();

// UI-only state (never persisted): the transactions filter/search/editing.
const ui = { txFilter: 'All', txSearch: '', editingId: null, txMsg: '' };

// ---------- derived totals (recomputed on every render) ----------

function derive(s) {
  const spendingTx = s.transactions.filter((t) => t.amount < 0);
  const incomeTx = s.transactions.filter((t) => t.amount > 0);
  const spent = fromCents(sumCents(spendingTx.map((t) => t.amount)) * -1);
  const receivedIncome = fromCents(sumCents(incomeTx.filter((t) => t.status !== 'Scheduled').map((t) => t.amount)));
  const plannedIncome = fromCents(sumCents(s.income.map((i) => i.amount)));
  const budgetTotal = fromCents(sumCents(Object.values(s.limits)));
  const savedMonth = fromCents(sumCents(s.goals.map((g) => g.monthly)));
  const leftToSpend = budgetTotal - spent;
  const cashOnHand = receivedIncome - spent - savedMonth;

  const actualByCategory = {};
  for (const name of SPENDING_CATEGORIES) {
    actualByCategory[name] = fromCents(sumCents(spendingTx.filter((t) => t.category === name).map((t) => t.amount)) * -1);
  }

  // On-pace projection: non-housing spending per day so far, times 5 days left.
  const housingActual = actualByCategory.Housing || 0;
  const dailyRate = (spent - housingActual) / DATA.daysElapsed;
  const projectedSpending = Math.round(spent + dailyRate * DATA.daysLeft);
  const projectedUnder = budgetTotal - projectedSpending;

  // Donut slices: 6 big categories + Other (the 6 small ones folded together).
  const big = ['Housing', 'Groceries', 'Transport', 'Utilities', 'Kids & school', 'Dining out & coffee'];
  const donutSlices = big.map((name, i) => ({ label: name, value: actualByCategory[name] || 0, color: DONUT_COLORS[i], filter: name }));
  const otherValue = DONUT_OTHER.reduce((acc, name) => acc + (actualByCategory[name] || 0), 0);
  donutSlices.push({ label: 'Other', value: otherValue, color: DONUT_COLORS[6], filter: null });

  // Budgets to watch: top 3 by % used, housing excluded (it is paid in full).
  const watchTop = SPENDING_CATEGORIES.filter((n) => n !== 'Housing')
    .map((name) => ({ name, actual: actualByCategory[name] || 0, limit: s.limits[name] }))
    .sort((a, b) => (b.actual / b.limit) - (a.actual / a.limit))
    .slice(0, 3);

  // Budget cards: % used, highest first, Housing last (paid in full).
  const budgetCards = SPENDING_CATEGORIES.filter((n) => n !== 'Housing')
    .map((name) => ({ name, actual: actualByCategory[name] || 0, limit: s.limits[name] }))
    .sort((a, b) => (b.actual / b.limit) - (a.actual / a.limit));
  budgetCards.push({ name: 'Housing', actual: actualByCategory.Housing || 0, limit: s.limits.Housing });

  // Goals, with the finish math from the spec: transfers to go = ceil(remaining
  // / monthly), counted from Dec 2026; more than 60 transfers reads "Long-term".
  const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const goals = s.goals.map((g) => {
    const remaining = g.target - g.saved;
    const transfersToGo = Math.max(0, Math.ceil(remaining / g.monthly));
    let finishLabel = '';
    if (transfersToGo > 0) {
      // First transfer is Dec 2026; the last is (transfersToGo - 1) months later.
      const totalMonths = 11 + (transfersToGo - 1); // Dec 2026 = month 11 of 2026
      const year = 2026 + Math.floor(totalMonths / 12);
      const month = totalMonths % 12;
      finishLabel = `${monthNames[month]} ${year}`;
    }
    return { ...g, remaining, transfersToGo, finishLabel };
  });
  const goalsTop2 = [...goals].sort((a, b) => (b.saved / b.target) - (a.saved / a.target)).slice(0, 2);
  const goalsSavedTotal = fromCents(sumCents(s.goals.map((g) => g.saved)));
  const goalsTargetTotal = fromCents(sumCents(s.goals.map((g) => g.target)));

  // Recent spending: 5 newest spending rows (stable sort keeps the spec's
  // listing order for same-date rows).
  const recentSpending = [...spendingTx]
    .sort((a, b) => (a.date < b.date ? 1 : a.date > b.date ? -1 : 0))
    .slice(0, 5);

  // Transactions newest-first for the ledger table.
  const sortedTx = [...s.transactions]
    .sort((a, b) => (a.date < b.date ? 1 : a.date > b.date ? -1 : 0));

  // Six-month series.
  const months = s.months.map((m) => ({ ...m, net: m.income - m.spending - m.saved }));
  const sixTotalSpent = fromCents(sumCents(months.map((m) => m.spending)));
  const sixTotalSaved = fromCents(sumCents(months.map((m) => m.saved)));
  const sixAvg = sixTotalSpent / months.length;
  const octSpending = months.find((m) => m.short === 'Oct').spending;
  const novVsOct = {
    diff: projectedSpending - octSpending,
    pct: (((projectedSpending - octSpending) / octSpending) * 100).toFixed(1),
  };

  // Biggest slice of November spending, and the biggest flexible category.
  const biggest = SPENDING_CATEGORIES
    .map((name) => ({ name, value: actualByCategory[name] || 0 }))
    .sort((a, b) => b.value - a.value)[0];
  const biggestFlexible = SPENDING_CATEGORIES.filter((n) => n !== 'Housing')
    .map((name) => actualByCategory[name] || 0)
    .sort((a, b) => b - a)[0];

  return {
    plannedIncome, receivedIncome, spent, savedMonth, budgetTotal, leftToSpend,
    cashOnHand, actualByCategory, dailyRate, projectedSpending, projectedUnder,
    donutSlices, watchTop, budgetCards, goals, goalsTop2, goalsSavedTotal,
    goalsTargetTotal, recentSpending, sortedTx, months, sixTotalSpent,
    sixTotalSaved, sixAvg, octSpending, novVsOct,
    biggest: { ...biggest, pct: Math.round((biggest.value / spent) * 100) },
    biggestFlexible,
  };
}

// ---------- actions ----------

let nextId = 1000;
function newId() {
  return `u${nextId++}`;
}

const actions = {
  rerender() {
    render();
  },
  goTransactions(filter) {
    ui.txFilter = filter || 'All';
    ui.txSearch = '';
    ui.editingId = null;
    ui.txMsg = '';
    window.location.hash = '#/transactions';
    render();
  },
  addTransaction(row) {
    state.transactions.push({ id: newId(), ...row });
    saveState(state);
    render();
  },
  saveTransaction(id, row) {
    const t = state.transactions.find((x) => x.id === id);
    if (t) {
      t.date = row.date;
      t.payee = row.payee;
      t.category = row.category;
      t.amount = row.amount;
    }
    ui.editingId = null;
    saveState(state);
    render();
  },
  deleteTransaction(id) {
    state.transactions = state.transactions.filter((t) => t.id !== id);
    if (ui.editingId === id) ui.editingId = null;
    saveState(state);
    render();
  },
  setLimit(name, value) {
    state.limits[name] = value;
    saveState(state);
    render();
  },
  addToGoal(name, amount) {
    const g = state.goals.find((x) => x.name === name);
    if (g) g.saved = Math.round((g.saved + amount) * 100) / 100;
    saveState(state);
    render();
  },
  resetData() {
    try {
      window.localStorage.removeItem(STORAGE_KEY);
    } catch (err) {
      // Storage unavailable: just rebuild from the built-in data.
    }
    const fresh = freshState();
    state.transactions = fresh.transactions;
    state.limits = fresh.limits;
    state.goals = fresh.goals;
    ui.txFilter = 'All';
    ui.txSearch = '';
    ui.editingId = null;
    ui.txMsg = '';
    render();
  },
};

// ---------- router ----------

const ROUTES = {
  dashboard: { render: renderDashboard, wire: wireDashboard },
  transactions: { render: renderTransactions, wire: wireTransactions },
  budgets: { render: renderBudgets, wire: wireBudgets },
  goals: { render: renderGoals, wire: wireGoals },
  insights: { render: renderInsights, wire: wireInsights },
};

function routeFromHash() {
  const hash = window.location.hash.replace(/^#\/?/, '');
  if (hash === '' || hash === 'dashboard') return 'dashboard';
  if (Object.hasOwn(ROUTES, hash)) return hash;
  return 'dashboard';
}

function render() {
  const route = routeFromHash();
  const d = derive(state);
  const ctx = { state, d, actions, ui };
  const app = document.getElementById('app');
  app.innerHTML = ROUTES[route].render(ctx);
  document.querySelectorAll('.site-nav a').forEach((a) => {
    a.classList.toggle('active', a.getAttribute('data-route') === route);
  });
  ROUTES[route].wire(app, ctx);
  window.scrollTo(0, 0);
}

window.addEventListener('hashchange', render);
render();
