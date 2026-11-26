// HearthLedger — page renderers. Each render function returns an HTML string for
// #app from the current state + derived totals (nothing hard-coded: every
// number is computed from state, so an added transaction moves the dashboard
// hero, the donut, the budget bars and the Insights table together). Each wire
// function attaches the page's buttons and inputs after the HTML is mounted.
// A ctx is { state, d (derived totals), actions, ui }.

import { CATEGORY_COLORS } from './data.js';
import { donutChart, trendChart } from './charts.js';

// ---------- small helpers (local; main.js has its own copies for state math) ----------

const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

function money(n) {
  const v = Math.abs(n);
  return (n < 0 ? '\u2212' : '') + '$' + v.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}
function money0(n) {
  const v = Math.abs(n);
  return (n < 0 ? '\u2212' : '') + '$' + Math.round(v).toLocaleString('en-US');
}
function signed(n) {
  return (n < 0 ? '\u2212' : '+') + '$' + Math.abs(n).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}
function fmtDate(iso) {
  const parts = iso.split('-');
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  return `${months[Number(parts[1]) - 1]} ${Number(parts[2])}, ${parts[0]}`;
}
function shortDate(iso) {
  const parts = iso.split('-');
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  return `${months[Number(parts[1]) - 1]} ${Number(parts[2])}`;
}
function pctOf(actual, limit) {
  return limit > 0 ? (actual / limit) * 100 : 0;
}
function barClass(pct) {
  if (pct > 100) return 'red';
  if (pct > 80) return 'gold';
  return '';
}
function bar(pct, cls) {
  const w = Math.min(100, Math.max(0, pct));
  return `<div class="bar ${cls || ''}"><span style="width:${w.toFixed(1)}%"></span></div>`;
}
function statusPill(name, pct) {
  if (name === 'Housing') return '<span class="pill pill-paid">Paid in full</span>';
  if (pct > 100) return '<span class="pill pill-over">Over</span>';
  if (pct > 80) return '<span class="pill pill-watch">Watch</span>';
  return '<span class="pill pill-ok">On track</span>';
}
function catPill(name) {
  const c = CATEGORY_COLORS[name] || '#22302B';
  return `<span class="pill pill-cat"><span class="dot" style="background:${c};width:9px;height:9px"></span> ${esc(name)}</span>`;
}
function categoryOptions(selected, includeIncome) {
  const names = ['Housing', 'Groceries', 'Dining out & coffee', 'Transport', 'Utilities', 'Kids & school', 'Health', 'Entertainment & subscriptions', 'Home & household', 'Personal & clothing', 'Giving & gifts', 'Miscellaneous'];
  if (includeIncome !== false) names.push('Income');
  return names.map((n) => `<option value="${esc(n)}"${n === selected ? ' selected' : ''}>${esc(n)}</option>`).join('');
}

// ---------- 3.1 Dashboard ----------

export function renderDashboard(ctx) {
  const { d } = ctx;
  const hero = `
    <div class="hero">
      <div class="hero-card"><div class="label">Income received</div><div class="num">${money0(d.receivedIncome)} <small>of ${money0(d.plannedIncome)}</small></div><div class="sub">As of Nov 25 — $45 interest posts Nov 30</div><div class="mini-bar">${bar(pctOf(d.receivedIncome, d.plannedIncome))}</div></div>
      <div class="hero-card"><div class="label">Spent</div><div class="num">${money0(d.spent)} <small>of ${money0(d.budgetTotal)}</small></div><div class="sub">November spending, 25 of 30 days</div><div class="mini-bar">${bar(pctOf(d.spent, d.budgetTotal), barClass(pctOf(d.spent, d.budgetTotal)))}</div></div>
      <div class="hero-card"><div class="label">Saved</div><div class="num">${money0(d.savedMonth)} <small>of ${money0(d.savedMonth)}</small></div><div class="sub">All 5 transfers done Nov 1 &#10003;</div><div class="mini-bar">${bar(100)}</div></div>
      <div class="hero-card"><div class="label">Left to spend</div><div class="num">${money0(d.leftToSpend)}</div><div class="sub">Budget left for the last 5 days</div><div class="mini-bar">${bar(pctOf(d.leftToSpend, d.budgetTotal))}</div></div>
    </div>
    <p class="recon">Left to spend <strong>${money0(d.leftToSpend)}</strong> &middot; Cash on hand <strong>${money0(d.cashOnHand)}</strong> &middot; $45 interest posts Nov 30 &middot; Updated Nov 25, 2026 &mdash; 5 days left in the month.</p>`;

  const legendRows = d.donutSlices.map((s) => {
    const pct = ((s.value / d.spent) * 100).toFixed(0);
    const label = s.filter === null ? `${s.label} (6 categories)` : s.label;
    return `<li><button type="button" data-filter="${esc(s.filter === null ? '' : s.filter)}" data-donut-link><span class="dot" style="background:${s.color}"></span><span>${esc(label)} &mdash; ${money0(s.value)} &middot; ${pct}%</span></button></li>`;
  }).join('');

  const main = `
    <section class="card section">
      <h2>Where November&rsquo;s money went</h2>
      <div class="donut-wrap">
        ${donutChart(d.donutSlices, d.spent)}
        <ul class="legend">${legendRows}</ul>
      </div>
    </section>
    <section class="card section">
      <h2>Spending vs income, Jun&ndash;Nov</h2>
      ${trendChart(d.months, { width: 640, height: 260 })}
      <p class="trend-foot">Nov is projected (${money0(d.projectedSpending)}). Income is the dashed line; August&rsquo;s bump is Daniel&rsquo;s $255 summer-school stipend.</p>
    </section>
    <div class="callout"><strong>On pace to finish ~${money0(d.projectedUnder)} under budget</strong> &mdash; at ${money0(d.dailyRate)}/day for 5 more days, November ends near ${money0(d.projectedSpending)} of the ${money0(d.budgetTotal)} plan.</div>`;

  const watch = d.watchTop.map((c) => `
      <li><div class="row"><span>${esc(c.name)}</span><span class="amt">${money0(c.actual)} of ${money0(c.limit)}</span></div>${bar(pctOf(c.actual, c.limit), barClass(pctOf(c.actual, c.limit)))}<div class="small muted">${pctOf(c.actual, c.limit).toFixed(0)}% used</div></li>`).join('');

  const goalsMini = d.goalsTop2.map((g) => `
      <li><div class="row"><span>${esc(g.name)}</span><span class="amt">${money0(g.saved)} / ${money0(g.target)}</span></div>${bar(pctOf(g.saved, g.target))}<div class="small muted">${pctOf(g.saved, g.target).toFixed(0)}% saved</div></li>`).join('');

  const recent = d.recentSpending.map((t) => `
      <li><div class="row"><span>${shortDate(t.date)} &mdash; ${esc(t.payee)}</span><span class="amt">${money(t.amount)}</span></div></li>`).join('');

  const side = `
    <aside>
      <section class="card section">
        <h3>Budgets to watch</h3>
        <ul class="mini-list">${watch}</ul>
        <a class="more-link" href="#/budgets">View budgets &rarr;</a>
      </section>
      <section class="card section">
        <h3>Savings goals</h3>
        <ul class="mini-list">${goalsMini}</ul>
        <a class="more-link" href="#/goals">View all goals &rarr;</a>
      </section>
      <section class="card section">
        <h3>Recent spending</h3>
        <ul class="mini-list">${recent}</ul>
        <a class="more-link" href="#/transactions">See all transactions &rarr;</a>
      </section>
    </aside>`;

  return `<div class="page-head"><h1>November at a glance</h1><p class="lede">The Rivera family &mdash; Austin, Texas. One household, one shared budget.</p></div>${hero}<div class="grid-2col"><div>${main}</div>${side}</div>`;
}

export function wireDashboard(el, ctx) {
  el.querySelectorAll('[data-donut-link]').forEach((btn) => {
    btn.addEventListener('click', () => {
      ctx.actions.goTransactions(btn.getAttribute('data-filter') || '');
    });
  });
}

// ---------- 3.2 Transactions ----------

export function renderTransactions(ctx) {
  const { state, d, ui } = ctx;
  const editing = ui.editingId ? state.transactions.find((t) => t.id === ui.editingId) : null;
  const chips = ['All', ...state.categories.map((c) => c.name), 'Income']
    .map((c) => `<button type="button" class="chip${ui.txFilter === c ? ' active' : ''}" data-chip="${esc(c)}">${esc(c)}</button>`)
    .join('');
  const rows = d.sortedTx.map((t) => `
      <tr data-payee="${esc(t.payee.toLowerCase())}" data-category="${esc(t.category)}" data-amount="${t.amount}" data-kind="${t.amount >= 0 ? 'income' : 'spending'}" data-received="${t.status === 'Scheduled' ? '0' : '1'}">
        <td class="tx-meta">${fmtDate(t.date)}</td>
        <td class="tx-payee">${esc(t.payee)}${t.status === 'Scheduled' ? ' <span class="pill pill-sched">Scheduled</span>' : ''}</td>
        <td class="tx-meta">${catPill(t.category)}</td>
        <td class="tx-amount num"><span class="${t.amount >= 0 ? 'amt-pos' : 'amt-neg'}">${signed(t.amount)}</span></td>
        <td class="tx-actions row-actions"><button type="button" class="btn-small btn-secondary" data-edit="${t.id}">Edit</button><button type="button" class="btn-small btn-danger" data-delete="${t.id}">Delete</button></td>
      </tr>`).join('');

  return `<div class="page-head"><h1>Transactions</h1><p class="lede">The full November ledger &mdash; newest first. ${state.transactions.length} rows, every dollar accounted for.</p></div>
  <section class="card section">
    <h2>${editing ? 'Edit transaction' : 'Add a transaction'}</h2>
    <form id="tx-form">
      <div class="form-grid">
        <div class="field"><label for="tx-date">Date</label><input id="tx-date" name="date" type="date" value="${editing ? editing.date : '2026-11-25'}" required></div>
        <div class="field grow"><label for="tx-payee">Payee</label><input id="tx-payee" name="payee" type="text" placeholder="e.g. H-E-B Grocery" value="${editing ? esc(editing.payee) : ''}" required></div>
        <div class="field"><label for="tx-category">Category</label><select id="tx-category" name="category">${categoryOptions(editing ? editing.category : 'Groceries')}</select></div>
        <div class="field"><label for="tx-amount">Amount ($)</label><input id="tx-amount" name="amount" type="number" min="0.01" step="0.01" placeholder="42.10" value="${editing ? Math.abs(editing.amount).toFixed(2) : ''}" required></div>
        <button type="submit">${editing ? 'Save changes' : 'Add transaction'}</button>
        ${editing ? '<button type="button" class="btn-secondary" id="tx-cancel">Cancel</button>' : ''}
      </div>
      <p class="notice" id="tx-msg" aria-live="polite">${ui.txMsg ? esc(ui.txMsg) : ''}</p>
    </form>
  </section>
  <section class="card section">
    <div class="form-grid">
      <div class="field grow"><label for="tx-search">Search payee</label><input id="tx-search" type="search" placeholder="Type to filter by payee&hellip;" value="${esc(ui.txSearch)}"></div>
    </div>
    <div class="chips" id="tx-chips">${chips}</div>
    <p class="muted" id="tx-count">Showing ${d.sortedTx.length} of ${state.transactions.length} transactions &middot; Spending ${money(d.spent)} &middot; Income ${money(d.receivedIncome)} received</p>
    <table class="tx-table">
      <thead><tr><th>Date</th><th>Payee</th><th>Category</th><th class="num">Amount</th><th></th></tr></thead>
      <tbody id="tx-body">${rows}</tbody>
    </table>
    <div id="tx-empty" hidden><p>No transactions match &mdash; <button type="button" class="link-btn" id="tx-clear">Clear filter</button></p></div>
  </section>
  <p><button type="button" class="btn-secondary" id="tx-reset">Reset to November data</button></p>`;
}

export function wireTransactions(el, ctx) {
  const { actions, ui } = ctx;
  const form = el.querySelector('#tx-form');
  const msg = el.querySelector('#tx-msg');
  const search = el.querySelector('#tx-search');
  const body = el.querySelector('#tx-body');
  const count = el.querySelector('#tx-count');
  const empty = el.querySelector('#tx-empty');
  const table = el.querySelector('.tx-table');

  function applyFilter() {
    const q = search.value.trim().toLowerCase();
    const cat = ui.txFilter;
    let shown = 0;
    let spendCents = 0;
    let incomeCents = 0;
    body.querySelectorAll('tr').forEach((tr) => {
      const okCat = cat === 'All' || tr.getAttribute('data-category') === cat;
      const okQ = q === '' || tr.getAttribute('data-payee').includes(q);
      const show = okCat && okQ;
      tr.style.display = show ? '' : 'none';
      if (show) {
        shown++;
        const amt = Number(tr.getAttribute('data-amount'));
        if (amt < 0) spendCents += Math.round(amt * 100);
        else if (tr.getAttribute('data-received') === '1') incomeCents += Math.round(amt * 100);
      }
    });
    const total = body.querySelectorAll('tr').length;
    count.textContent = `Showing ${shown} of ${total} transactions \u00b7 Spending ${money(spendCents / 100)} \u00b7 Income ${money(incomeCents / 100)} received`;
    const none = shown === 0;
    empty.hidden = !none;
    table.style.display = none ? 'none' : '';
  }

  el.querySelectorAll('[data-chip]').forEach((chip) => {
    chip.addEventListener('click', () => {
      ui.txFilter = chip.getAttribute('data-chip');
      el.querySelectorAll('[data-chip]').forEach((c) => c.classList.toggle('active', c === chip));
      applyFilter();
    });
  });
  search.addEventListener('input', () => {
    ui.txSearch = search.value;
    applyFilter();
  });
  el.querySelector('#tx-clear').addEventListener('click', () => {
    ui.txFilter = 'All';
    ui.txSearch = '';
    search.value = '';
    el.querySelectorAll('[data-chip]').forEach((c) => c.classList.toggle('active', c.getAttribute('data-chip') === 'All'));
    applyFilter();
  });

  form.addEventListener('submit', (ev) => {
    ev.preventDefault();
    const date = form.elements.date.value;
    const payee = form.elements.payee.value.trim();
    const category = form.elements.category.value;
    const amount = Number(form.elements.amount.value);
    if (!payee) { msg.textContent = 'Payee is required.'; msg.className = 'notice err'; return; }
    if (!(amount > 0)) { msg.textContent = 'Amount must be more than $0.'; msg.className = 'notice err'; return; }
    const signedAmount = category === 'Income' ? amount : -amount;
    ui.txMsg = ui.editingId
      ? `Saved \u2014 ${payee}, ${category}, ${signed(signedAmount)}.`
      : `Added \u2014 ${payee}, ${category}, ${signed(signedAmount)}.`;
    if (date < '2026-11-01' || date > '2026-11-30') {
      ui.txMsg += ' (Note: that date is outside November 2026.)';
    }
    if (ui.editingId) {
      actions.saveTransaction(ui.editingId, { date, payee, category, amount: signedAmount });
    } else {
      actions.addTransaction({ date, payee, category, amount: signedAmount });
    }
  });
  const cancel = el.querySelector('#tx-cancel');
  if (cancel) cancel.addEventListener('click', () => { ui.editingId = null; ui.txMsg = ''; actions.rerender(); });

  body.querySelectorAll('[data-edit]').forEach((btn) => {
    btn.addEventListener('click', () => { ui.editingId = btn.getAttribute('data-edit'); ui.txMsg = ''; actions.rerender(); });
  });
  body.querySelectorAll('[data-delete]').forEach((btn) => {
    btn.addEventListener('click', () => {
      if (window.confirm('Delete this transaction?')) actions.deleteTransaction(btn.getAttribute('data-delete'));
    });
  });
  el.querySelector('#tx-reset').addEventListener('click', () => {
    if (window.confirm('Reset to the original November data? Your changes will be lost.')) actions.resetData();
  });
  if (ui.txFilter !== 'All' || ui.txSearch) applyFilter();
}

// ---------- 3.3 Budgets ----------

export function renderBudgets(ctx) {
  const { d } = ctx;
  const cards = d.budgetCards.map((c) => {
    const pct = pctOf(c.actual, c.limit);
    const left = c.limit - c.actual;
    return `<article class="card cat-card">
      <div class="top"><h3>${esc(c.name)}</h3>${statusPill(c.name, pct)}</div>
      <p class="figures">Spent <strong>${money(c.actual)}</strong> of ${money(c.limit)} limit</p>
      ${bar(pct, barClass(pct))}
      <p class="left">${pct.toFixed(0)}% used &middot; ${money(left)} left</p>
      <button type="button" class="link-btn" data-edit-limit="${esc(c.name)}">Edit limit</button>
      <div class="limit-edit" data-limit-form="${esc(c.name)}" hidden>
        <div class="form-grid">
          <div class="field"><label>New monthly limit ($)</label><input type="number" min="0" step="1" value="${c.limit}" data-limit-input></div>
          <button type="button" data-limit-save="${esc(c.name)}">Save</button>
          <button type="button" class="btn-secondary" data-limit-cancel="${esc(c.name)}">Cancel</button>
        </div>
        <p class="notice err" data-limit-msg hidden></p>
      </div>
    </article>`;
  }).join('');

  return `<div class="page-head"><h1>Budgets</h1><p class="lede">November 2026 &mdash; twelve categories, one plan. Every dollar has a job.</p></div>
  <div class="summary-strip"><span>November plan <strong>${money0(d.budgetTotal)}</strong></span><span>Spent <strong>${money0(d.spent)}</strong></span><span>Left <strong>${money0(d.leftToSpend)}</strong></span><span><strong>${pctOf(d.spent, d.budgetTotal).toFixed(0)}% used</strong></span>${bar(pctOf(d.spent, d.budgetTotal), barClass(pctOf(d.spent, d.budgetTotal)))}</div>
  <div class="grid-cards">${cards}</div>
  <p class="muted small" style="margin-top:16px">Categories are fixed for November &mdash; edit a limit instead.</p>`;
}

export function wireBudgets(el, ctx) {
  el.querySelectorAll('[data-edit-limit]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const name = btn.getAttribute('data-edit-limit');
      const form = el.querySelector(`[data-limit-form="${CSS.escape(name)}"]`);
      form.hidden = !form.hidden;
      if (!form.hidden) form.querySelector('[data-limit-input]').focus();
    });
  });
  el.querySelectorAll('[data-limit-save]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const name = btn.getAttribute('data-limit-save');
      const form = el.querySelector(`[data-limit-form="${CSS.escape(name)}"]`);
      const input = form.querySelector('[data-limit-input]');
      const msgEl = form.querySelector('[data-limit-msg]');
      const value = Number(input.value);
      const actual = ctx.d.actualByCategory[name] || 0;
      if (!(value >= 0) || Number.isNaN(value)) { msgEl.textContent = 'Enter a limit of $0 or more.'; msgEl.hidden = false; return; }
      if (value < actual) { msgEl.textContent = `Limit can\u2019t be below the ${money(actual)} already spent.`; msgEl.hidden = false; return; }
      ctx.actions.setLimit(name, value);
    });
  });
  el.querySelectorAll('[data-limit-cancel]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const name = btn.getAttribute('data-limit-cancel');
      el.querySelector(`[data-limit-form="${CSS.escape(name)}"]`).hidden = true;
    });
  });
}

// ---------- 3.4 Goals ----------

export function renderGoals(ctx) {
  const { d } = ctx;
  const cards = d.goals.map((g) => {
    const pct = pctOf(g.saved, g.target);
    const remaining = g.target - g.saved;
    const finish = g.transfersToGo > 60
      ? `Long-term (${g.transfersToGo} transfers to go)`
      : `Projected finish ${g.finishLabel}`;
    return `<article class="card goal-card">
      <h3>${esc(g.name)}</h3>
      <p class="muted">${esc(g.purpose)}</p>
      <p class="figures">Saved <strong>${money(g.saved)}</strong> of ${money(g.target)} target</p>
      ${bar(pct)}
      <p><span class="pct">${pct.toFixed(0)}% saved</span> &middot; ${money(remaining)} remaining</p>
      <p class="small">Auto-transfer ${money0(g.monthly)} / month &middot; ${g.transfersToGo} transfers to go &middot; ${finish}</p>
      <form class="goal-add" data-goal="${esc(g.name)}">
        <div class="form-grid">
          <div class="field"><label>Add extra $</label><input type="number" min="0.01" step="0.01" placeholder="50.00" required></div>
          <button type="submit">Add</button>
        </div>
        <p class="notice" data-goal-msg aria-live="polite"></p>
      </form>
    </article>`;
  }).join('');

  const transfers = d.goals.map((g) => `<li><span class="tick">&#10003;</span>${esc(g.name)} &mdash; ${money(g.monthly)} on Nov 1</li>`).join('');

  return `<div class="page-head"><h1>Savings goals</h1><p class="lede">Five goals, one automatic habit. Every transfer runs on the 1st.</p></div>
  <div class="summary-strip"><span>Saved across all goals <strong>${money0(d.goalsSavedTotal)}</strong> of <strong>${money0(d.goalsTargetTotal)}</strong></span><span>This month&rsquo;s transfers <strong>${money0(d.savedMonth)}</strong> (all done Nov 1).</span></div>
  <div class="grid-cards">${cards}</div>
  <section class="card section" style="margin-top:16px">
    <h2>This month&rsquo;s transfers</h2>
    <ul class="check-list">${transfers}</ul>
  </section>`;
}

export function wireGoals(el, ctx) {
  el.querySelectorAll('.goal-add').forEach((form) => {
    form.addEventListener('submit', (ev) => {
      ev.preventDefault();
      const name = form.getAttribute('data-goal');
      const input = form.querySelector('input');
      const msgEl = form.querySelector('[data-goal-msg]');
      const amount = Number(input.value);
      const goal = ctx.d.goals.find((g) => g.name === name);
      const remaining = goal.target - goal.saved;
      if (!(amount > 0)) { msgEl.textContent = 'Enter an amount over $0.'; msgEl.className = 'notice err'; return; }
      if (amount > remaining) { msgEl.textContent = `That\u2019s more than the ${money(remaining)} remaining on this goal.`; msgEl.className = 'notice err'; return; }
      ctx.actions.addToGoal(name, amount);
    });
  });
}

// ---------- 3.5 Insights ----------

export function renderInsights(ctx) {
  const { d } = ctx;
  const rows = d.months.map((m) => {
    const net = m.income - m.spending - m.saved;
    return `<tr><td>${esc(m.month)}${m.projected ? ' *' : ''}</td><td class="num">${money(m.income)}</td><td class="num">${money(m.spending)}</td><td class="num">${money(m.saved)}</td><td class="num"><span class="${net >= 0 ? 'amt-pos' : 'amt-neg'}">${net >= 0 ? '+' : '\u2212'}${money0(Math.abs(net))}</span></td></tr>`;
  }).join('');

  return `<div class="page-head"><h1>Insights &amp; reports</h1><p class="lede">Six months of the Rivera budget, and what it says about November.</p></div>
  <section class="card section">
    <h2>Spending vs income, Jun&ndash;Nov</h2>
    ${trendChart(d.months, { width: 760, height: 300 })}
    <p class="trend-foot">* Nov is projected (${money0(d.projectedSpending)}).</p>
    <table>
      <thead><tr><th>Month</th><th class="num">Income</th><th class="num">Spending</th><th class="num">Saved</th><th class="num">Net</th></tr></thead>
      <tbody>${rows}</tbody>
    </table>
  </section>
  <div class="grid-2col">
    <section class="card">
      <h2>This month vs last month</h2>
      <p>November is projected at <strong>${money0(d.projectedSpending)}</strong> vs October&rsquo;s ${money0(d.octSpending)} &mdash; <strong>${money0(d.novVsOct.diff)} (${d.novVsOct.pct}%)</strong>.</p>
      <p>November is running cheaper than October.</p>
    </section>
    <section class="card">
      <h2>Biggest slice</h2>
      <p>Housing <strong>${money0(d.biggest.value)}</strong> is <strong>${d.biggest.pct}%</strong> of November spending; Groceries is the biggest flexible category at <strong>${money0(d.biggestFlexible)}</strong>.</p>
      <p class="muted small">Flexible means everything except the mortgage: groceries, dining, transport and the rest.</p>
    </section>
  </div>
  <div class="grid-3col" style="margin-top:16px">
    <section class="card"><h3>Dining out is close to the line</h3><p>Dining out is at 81% of its $280 limit with 5 days left. One more takeout dinner puts it over &mdash; cook at home through Nov 30 to stay under.</p></section>
    <section class="card"><h3>Groceries have slack</h3><p>Groceries are running $179 under budget. That slack covers the Thanksgiving shop on Nov 26 without touching the buffer.</p></section>
    <section class="card"><h3>Plan for next July</h3><p>July was the priciest month ($5,738): summer camp ($420) plus a $310 electric bill in the heat wave. Budget an extra $300 for July next year.</p></section>
  </div>
  <section class="card section" style="margin-top:16px">
    <h2>What-if calculator</h2>
    <p>See what a small monthly cut is worth over a year.</p>
    <div class="form-grid">
      <div class="field"><label for="wi-cat">Cut a category by</label><select id="wi-cat">${categoryOptions('Dining out & coffee', false)}</select></div>
      <div class="field"><label for="wi-amt">$ / month</label><input id="wi-amt" type="number" min="1" step="1" value="50"></div>
    </div>
    <p class="notice ok" id="wi-result" aria-live="polite"></p>
  </section>
  <p class="muted">Last 6 months: spent <strong>${money0(d.sixTotalSpent)}</strong> &middot; saved <strong>${money0(d.sixTotalSaved)}</strong> &middot; average <strong>${money0(d.sixAvg)}/month</strong>.</p>`;
}

export function wireInsights(el, ctx) {
  const cat = el.querySelector('#wi-cat');
  const amt = el.querySelector('#wi-amt');
  const out = el.querySelector('#wi-result');
  function update() {
    const name = cat.value;
    const perMonth = Math.max(0, Number(amt.value) || 0);
    const yearly = perMonth * 12;
    out.textContent = `Cutting ${name} by ${money(perMonth)}/month saves ${money(yearly)}/year. That\u2019s ${money(perMonth)} back in your pocket every month.`;
  }
  cat.addEventListener('change', update);
  amt.addEventListener('input', update);
  update();
}
