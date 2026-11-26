// HearthLedger — the Rivera family's November 2026 budget, as real figures.
// Every number here is hard-coded from the design spec (section 2) and verified
// against the category sums. Amounts are dollars; spending is negative, income
// is positive. Transactions are listed in the spec's order (grouped by category);
// the app sorts them newest-first with a stable sort, so same-date rows keep
// this order.

export const DATA = {
  household: {
    name: 'Rivera family',
    members: 'Maya Rivera (RN, St. David\u2019s Hospital) and Daniel Rivera (teacher, Austin ISD), kids Sofia (9) and Leo (6)',
    place: 'Austin, Texas',
  },
  month: '2026-11',
  monthLabel: 'November 2026',
  updated: '2026-11-25',
  updatedLabel: 'Nov 25, 2026',
  daysInMonth: 30,
  daysElapsed: 25,
  daysLeft: 5,

  // Monthly take-home, after tax. Planned total $6,705.00; the $45 interest
  // posts Nov 30, so $6,660.00 is received as of Nov 25.
  income: [
    { source: 'Maya Rivera \u2014 St. David\u2019s Hospital (RN)', amount: 3420.0, payday: 'Biweekly: Nov 7 + Nov 21 ($1,710.00 each)' },
    { source: 'Daniel Rivera \u2014 Austin ISD (teacher)', amount: 2980.0, payday: 'Monthly: Nov 15' },
    { source: 'Daniel \u2014 weekend tutoring (3 students)', amount: 260.0, payday: 'Nov 20' },
    { source: 'Ally Bank \u2014 savings interest', amount: 45.0, payday: 'Nov 30 (scheduled, not yet received)' },
  ],

  // November spending budget. limit = plan, actual = spent Nov 1-25.
  // Actuals are the sums of the transactions below; the app recomputes them
  // from the transactions so an added row moves every total at once.
  categories: [
    { name: 'Housing', limit: 1950.0, actual: 1950.0, note: 'Mortgage + escrow, paid in full Nov 1' },
    { name: 'Groceries', limit: 820.0, actual: 641.0, note: '' },
    { name: 'Dining out & coffee', limit: 280.0, actual: 228.0, note: '' },
    { name: 'Transport', limit: 620.0, actual: 487.0, note: 'Gas, insurance, upkeep' },
    { name: 'Utilities', limit: 440.0, actual: 386.0, note: 'Electric, water, gas, internet, phones' },
    { name: 'Kids & school', limit: 380.0, actual: 301.0, note: '' },
    { name: 'Health', limit: 200.0, actual: 142.0, note: 'Pharmacy, copays' },
    { name: 'Entertainment & subscriptions', limit: 170.0, actual: 138.0, note: '' },
    { name: 'Home & household', limit: 230.0, actual: 173.0, note: '' },
    { name: 'Personal & clothing', limit: 180.0, actual: 121.0, note: '' },
    { name: 'Giving & gifts', limit: 140.0, actual: 95.0, note: '' },
    { name: 'Miscellaneous', limit: 195.0, actual: 64.0, note: '' },
  ],

  // Savings goals. Auto-transfers ran Nov 1; all five executed.
  goals: [
    { name: 'Emergency fund', purpose: 'A rainy-day cushion for the unexpected.', monthly: 350, target: 12000, saved: 8450 },
    { name: 'Florida family vacation', purpose: 'Family trip to Florida, July 2027.', monthly: 200, target: 3200, saved: 1875 },
    { name: 'New car fund', purpose: 'Replace the 2016 Civic, 2028.', monthly: 150, target: 9000, saved: 2300 },
    { name: 'Kids\u2019 college', purpose: '529 plan for Sofia and Leo.', monthly: 100, target: 25000, saved: 4120 },
    { name: 'Extra mortgage principal', purpose: 'Pay the house off in 2039 instead of 2049.', monthly: 300, target: 30000, saved: 6800 },
  ],

  // Six-month trend, Jun-Nov 2026. Nov spending is projected ($5,281).
  months: [
    { month: 'Jun 2026', short: 'Jun', income: 6705, spending: 5412, saved: 1100, projected: false },
    { month: 'Jul 2026', short: 'Jul', income: 6705, spending: 5738, saved: 1100, projected: false },
    { month: 'Aug 2026', short: 'Aug', income: 6960, spending: 5891, saved: 1100, projected: false },
    { month: 'Sep 2026', short: 'Sep', income: 6705, spending: 5204, saved: 1100, projected: false },
    { month: 'Oct 2026', short: 'Oct', income: 6705, spending: 5486, saved: 1100, projected: false },
    { month: 'Nov 2026', short: 'Nov', income: 6705, spending: 5281, saved: 1100, projected: true },
  ],

  // 59 rows: 54 spending + 5 income, Nov 1-25 (plus the scheduled Nov 30 interest).
  transactions: [
    // Housing — $1,950.00 (1 row)
    { id: 't01', date: '2026-11-01', payee: 'First National Bank \u2014 Mortgage payment', category: 'Housing', amount: -1950.0 },
    // Groceries — $641.00 (6 rows)
    { id: 't02', date: '2026-11-02', payee: 'H-E-B Grocery', category: 'Groceries', amount: -142.38 },
    { id: 't03', date: '2026-11-06', payee: 'H-E-B Grocery', category: 'Groceries', amount: -98.54 },
    { id: 't04', date: '2026-11-09', payee: 'Trader Joe\u2019s', category: 'Groceries', amount: -67.21 },
    { id: 't05', date: '2026-11-13', payee: 'H-E-B Grocery', category: 'Groceries', amount: -121.86 },
    { id: 't06', date: '2026-11-17', payee: 'Costco', category: 'Groceries', amount: -134.52 },
    { id: 't07', date: '2026-11-21', payee: 'H-E-B Grocery', category: 'Groceries', amount: -76.49 },
    // Dining out & coffee — $228.00 (7 rows)
    { id: 't08', date: '2026-11-03', payee: 'Torchy\u2019s Tacos \u2014 family dinner', category: 'Dining out & coffee', amount: -48.2 },
    { id: 't09', date: '2026-11-07', payee: 'Starbucks \u2014 Maya\u2019s coffee', category: 'Dining out & coffee', amount: -12.75 },
    { id: 't10', date: '2026-11-11', payee: 'Chipotle \u2014 lunch', category: 'Dining out & coffee', amount: -31.4 },
    { id: 't11', date: '2026-11-15', payee: 'Domino\u2019s \u2014 pizza night', category: 'Dining out & coffee', amount: -38.65 },
    { id: 't12', date: '2026-11-19', payee: 'Starbucks \u2014 Daniel\u2019s coffee', category: 'Dining out & coffee', amount: -9.8 },
    { id: 't13', date: '2026-11-22', payee: 'Home Slice Pizza', category: 'Dining out & coffee', amount: -52.3 },
    { id: 't14', date: '2026-11-24', payee: 'Whataburger \u2014 lunch', category: 'Dining out & coffee', amount: -34.9 },
    // Transport — $487.00 (6 rows)
    { id: 't15', date: '2026-11-04', payee: 'Shell \u2014 gas', category: 'Transport', amount: -52.1 },
    { id: 't16', date: '2026-11-08', payee: 'Chevron \u2014 gas', category: 'Transport', amount: -48.75 },
    { id: 't17', date: '2026-11-12', payee: 'Geico \u2014 car insurance (monthly)', category: 'Transport', amount: -186.0 },
    { id: 't18', date: '2026-11-15', payee: 'Shell \u2014 gas', category: 'Transport', amount: -55.4 },
    { id: 't19', date: '2026-11-18', payee: 'Jiffy Lube \u2014 oil change', category: 'Transport', amount: -89.99 },
    { id: 't20', date: '2026-11-22', payee: 'Chevron \u2014 gas', category: 'Transport', amount: -54.76 },
    // Utilities — $386.00 (4 rows)
    { id: 't21', date: '2026-11-03', payee: 'Austin Energy \u2014 electric', category: 'Utilities', amount: -142.18 },
    { id: 't22', date: '2026-11-05', payee: 'City of Austin \u2014 water', category: 'Utilities', amount: -68.4 },
    { id: 't23', date: '2026-11-10', payee: 'AT&T \u2014 internet + phones', category: 'Utilities', amount: -128.0 },
    { id: 't24', date: '2026-11-16', payee: 'Texas Gas Service \u2014 gas', category: 'Utilities', amount: -47.42 },
    // Kids & school — $301.00 (5 rows)
    { id: 't25', date: '2026-11-04', payee: 'Austin ISD \u2014 school lunches', category: 'Kids & school', amount: -84.0 },
    { id: 't26', date: '2026-11-09', payee: 'Sofia\u2019s ballet \u2014 monthly tuition', category: 'Kids & school', amount: -95.0 },
    { id: 't27', date: '2026-11-14', payee: 'Target \u2014 Leo\u2019s shoes', category: 'Kids & school', amount: -42.5 },
    { id: 't28', date: '2026-11-20', payee: 'Lakeshore Learning \u2014 school supplies', category: 'Kids & school', amount: -38.75 },
    { id: 't29', date: '2026-11-23', payee: 'Leo\u2019s soccer \u2014 registration', category: 'Kids & school', amount: -40.75 },
    // Health — $142.00 (4 rows)
    { id: 't30', date: '2026-11-06', payee: 'CVS Pharmacy \u2014 prescriptions', category: 'Health', amount: -28.4 },
    { id: 't31', date: '2026-11-13', payee: 'Dr. Patel \u2014 Sofia checkup copay', category: 'Health', amount: -35.0 },
    { id: 't32', date: '2026-11-18', payee: 'CVS Pharmacy \u2014 vitamins', category: 'Health', amount: -22.6 },
    { id: 't33', date: '2026-11-21', payee: 'Smile Dental \u2014 Leo cleaning copay', category: 'Health', amount: -56.0 },
    // Entertainment & subscriptions — $138.00 (7 rows)
    { id: 't34', date: '2026-11-01', payee: 'Netflix', category: 'Entertainment & subscriptions', amount: -15.49 },
    { id: 't35', date: '2026-11-01', payee: 'Spotify Family', category: 'Entertainment & subscriptions', amount: -16.99 },
    { id: 't36', date: '2026-11-05', payee: 'Alamo Drafthouse \u2014 movie night', category: 'Entertainment & subscriptions', amount: -46.0 },
    { id: 't37', date: '2026-11-12', payee: 'Amazon Prime Video rental', category: 'Entertainment & subscriptions', amount: -5.99 },
    { id: 't38', date: '2026-11-15', payee: 'Hulu', category: 'Entertainment & subscriptions', amount: -7.99 },
    { id: 't39', date: '2026-11-19', payee: 'Austin Public Library \u2014 late fee', category: 'Entertainment & subscriptions', amount: -3.5 },
    { id: 't40', date: '2026-11-22', payee: 'AMC \u2014 kids movie', category: 'Entertainment & subscriptions', amount: -42.04 },
    // Home & household — $173.00 (5 rows)
    { id: 't41', date: '2026-11-07', payee: 'Target \u2014 cleaning supplies', category: 'Home & household', amount: -38.22 },
    { id: 't42', date: '2026-11-12', payee: 'Home Depot \u2014 air filters', category: 'Home & household', amount: -24.98 },
    { id: 't43', date: '2026-11-16', payee: 'Amazon \u2014 light bulbs + batteries', category: 'Home & household', amount: -31.45 },
    { id: 't44', date: '2026-11-20', payee: 'H-E-B \u2014 paper goods', category: 'Home & household', amount: -29.87 },
    { id: 't45', date: '2026-11-24', payee: 'Home Depot \u2014 garden hose', category: 'Home & household', amount: -48.48 },
    // Personal & clothing — $121.00 (4 rows)
    { id: 't46', date: '2026-11-08', payee: 'Old Navy \u2014 Sofia\u2019s jeans', category: 'Personal & clothing', amount: -34.0 },
    { id: 't47', date: '2026-11-14', payee: 'Great Clips \u2014 Daniel haircut', category: 'Personal & clothing', amount: -22.0 },
    { id: 't48', date: '2026-11-17', payee: 'Target \u2014 Maya\u2019s work shoes', category: 'Personal & clothing', amount: -49.99 },
    { id: 't49', date: '2026-11-23', payee: 'Ulta \u2014 shampoo', category: 'Personal & clothing', amount: -15.01 },
    // Giving & gifts — $95.00 (2 rows)
    { id: 't50', date: '2026-11-10', payee: 'Central Texas Food Bank \u2014 donation', category: 'Giving & gifts', amount: -50.0 },
    { id: 't51', date: '2026-11-19', payee: 'Birthday gift \u2014 Abuela Rosa', category: 'Giving & gifts', amount: -45.0 },
    // Miscellaneous — $64.00 (3 rows)
    { id: 't52', date: '2026-11-05', payee: 'USPS \u2014 shipping a package', category: 'Miscellaneous', amount: -12.35 },
    { id: 't53', date: '2026-11-15', payee: 'Amazon \u2014 phone case', category: 'Miscellaneous', amount: -18.99 },
    { id: 't54', date: '2026-11-21', payee: 'Walgreens \u2014 odds and ends', category: 'Miscellaneous', amount: -32.66 },
    // Income — $6,705.00 planned / $6,660.00 received (5 rows)
    { id: 't55', date: '2026-11-07', payee: 'Maya \u2014 St. David\u2019s Hospital paycheck', category: 'Income', amount: 1710.0 },
    { id: 't56', date: '2026-11-15', payee: 'Daniel \u2014 Austin ISD paycheck', category: 'Income', amount: 2980.0 },
    { id: 't57', date: '2026-11-20', payee: 'Daniel \u2014 tutoring (3 students)', category: 'Income', amount: 260.0 },
    { id: 't58', date: '2026-11-21', payee: 'Maya \u2014 St. David\u2019s Hospital paycheck', category: 'Income', amount: 1710.0 },
    { id: 't59', date: '2026-11-30', payee: 'Ally Bank \u2014 interest', category: 'Income', amount: 45.0, status: 'Scheduled' },
  ],
};

// Donut slice colors, in slice order (spec section 4.1). Tints are literal hexes.
export const DONUT_COLORS = ['#1E4D3B', '#C96F4A', '#D9A441', '#7FA08F', '#22302B', '#E0A583', '#D8CDB8'];

// A color per category, used for the legend dots and the category pills.
export const CATEGORY_COLORS = {
  Housing: '#1E4D3B',
  Groceries: '#C96F4A',
  'Dining out & coffee': '#D9A441',
  Transport: '#7FA08F',
  Utilities: '#22302B',
  'Kids & school': '#E0A583',
  Health: '#8A6D3B',
  'Entertainment & subscriptions': '#B3402E',
  'Home & household': '#5B7A6A',
  'Personal & clothing': '#A85D3F',
  'Giving & gifts': '#7A9A8B',
  Miscellaneous: '#D8CDB8',
  Income: '#1E4D3B',
};

// The six small categories folded into the donut's "Other" slice.
export const DONUT_OTHER = ['Health', 'Entertainment & subscriptions', 'Home & household', 'Personal & clothing', 'Giving & gifts', 'Miscellaneous'];
