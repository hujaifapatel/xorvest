// Sample plans keyed to banks in banks.js. Plan names, prices and terms are
// illustrative; they are not products offered by these banks.

const base = { floater: true, copayPct: 0, declines: [], ayush: true };

export const PLANS = [
  // HDFC Bank
  { ...base, bank: 'hdfc', slug: 'hdfc-optimum-family', name: 'Optimum Family Health', category: 'premier', maxEntryAge: 65, sumInsuredOptions: [10, 15, 20, 25, 50, 100], baseRate: 6500, roomRent: 'no-limit', pedWaitingYears: 2, pedReductionRider: true, maternity: { covered: true, waitingYears: 3, limit: 100000 }, opd: { covered: true, limit: 10000 }, restore: 'unlimited', ncb: { perYear: 50, max: 100 }, consumables: true, preHospDays: 60, postHospDays: 180, healthCheckup: true },
  { ...base, bank: 'hdfc', slug: 'hdfc-essential-care', name: 'Essential Care', category: 'essential', maxEntryAge: 60, sumInsuredOptions: [5, 7, 10, 15], baseRate: 3500, roomRent: 'single-private', pedWaitingYears: 3, restore: 'once', ncb: { perYear: 10, max: 50 }, preHospDays: 30, postHospDays: 60 },

  // State Bank of India
  { ...base, bank: 'sbi', slug: 'sbi-arogya-plus', name: 'Arogya Plus Floater', category: 'comprehensive', maxEntryAge: 65, sumInsuredOptions: [5, 10, 15, 20, 25], baseRate: 4300, roomRent: 'no-limit', pedWaitingYears: 2, restore: 'once', ncb: { perYear: 10, max: 100 }, consumables: true, preHospDays: 60, postHospDays: 90 },
  { ...base, bank: 'sbi', slug: 'sbi-senior-shield', name: 'Senior Shield', category: 'senior', maxEntryAge: 75, sumInsuredOptions: [5, 10, 15, 25], baseRate: 4600, roomRent: 'single-private', copayPct: 20, pedWaitingYears: 1, restore: 'none', ncb: { perYear: 10, max: 50 }, preHospDays: 30, postHospDays: 60, healthCheckup: true },

  // ICICI Bank
  { ...base, bank: 'icici', slug: 'icici-complete-health', name: 'Complete Health', category: 'comprehensive', maxEntryAge: 60, sumInsuredOptions: [5, 10, 15, 20, 25], baseRate: 5000, roomRent: 'no-limit', pedWaitingYears: 2, maternity: { covered: true, waitingYears: 3, limit: 60000 }, opd: { covered: true, limit: 7500 }, restore: 'unlimited', ncb: { perYear: 33, max: 100 }, preHospDays: 60, postHospDays: 120, healthCheckup: true },
  { ...base, bank: 'icici', slug: 'icici-elite-reserve', name: 'Elite Reserve', category: 'premier', maxEntryAge: 65, sumInsuredOptions: [10, 15, 20, 25, 50, 100], baseRate: 6900, roomRent: 'no-limit', pedWaitingYears: 3, pedReductionRider: true, maternity: { covered: true, waitingYears: 2, limit: 150000 }, opd: { covered: true, limit: 15000 }, restore: 'unlimited', ncb: { perYear: 50, max: 200 }, consumables: true, preHospDays: 90, postHospDays: 180, healthCheckup: true },

  // Axis Bank
  { ...base, bank: 'axis', slug: 'axis-family-first', name: 'Family First', category: 'comprehensive', maxEntryAge: 65, sumInsuredOptions: [5, 7, 10, 15, 20, 25], baseRate: 4500, roomRent: 'single-private', pedWaitingYears: 2, maternity: { covered: true, waitingYears: 2, limit: 75000 }, restore: 'unlimited', ncb: { perYear: 25, max: 100 }, consumables: true, preHospDays: 60, postHospDays: 90, healthCheckup: true },
  { ...base, bank: 'axis', slug: 'axis-chronic-care', name: 'Chronic Care (Diabetes & BP)', category: 'comprehensive', maxEntryAge: 70, sumInsuredOptions: [5, 10, 15, 25], baseRate: 5700, roomRent: 'single-private', copayPct: 10, pedWaitingYears: 1, restore: 'once', ncb: { perYear: 10, max: 50 }, opd: { covered: true, limit: 5000 }, preHospDays: 30, postHospDays: 90, healthCheckup: true },

  // Kotak Mahindra Bank
  { ...base, bank: 'kotak', slug: 'kotak-secure-plus', name: 'Secure Plus', category: 'comprehensive', maxEntryAge: 65, sumInsuredOptions: [5, 10, 15, 20, 25, 50], baseRate: 4900, roomRent: 'no-limit', pedWaitingYears: 3, pedReductionRider: true, restore: 'unlimited', ncb: { perYear: 20, max: 100 }, consumables: true, preHospDays: 60, postHospDays: 90, healthCheckup: true },
  { ...base, bank: 'kotak', slug: 'kotak-young-star', name: 'Young Star', category: 'essential', maxEntryAge: 40, sumInsuredOptions: [5, 10, 15, 25], baseRate: 2900, roomRent: 'no-limit', pedWaitingYears: 3, declines: ['cardiac', 'diabetes'], restore: 'unlimited', ncb: { perYear: 50, max: 100 }, consumables: true, preHospDays: 30, postHospDays: 60 },

  // Yes Bank
  { ...base, bank: 'yes', slug: 'yes-health-basic', name: 'Health Basic', category: 'essential', maxEntryAge: 55, sumInsuredOptions: [3, 5, 7, 10], baseRate: 2600, roomRent: '1pct', copayPct: 10, copayFromAge: 50, pedWaitingYears: 4, declines: ['cardiac'], restore: 'none', ncb: { perYear: 10, max: 50 }, preHospDays: 30, postHospDays: 60, ayush: false },
  { ...base, bank: 'yes', slug: 'yes-prime-floater', name: 'Prime Floater', category: 'comprehensive', maxEntryAge: 65, sumInsuredOptions: [5, 10, 15, 20, 25], baseRate: 4000, roomRent: 'single-private', pedWaitingYears: 3, maternity: { covered: true, waitingYears: 4, limit: 50000 }, restore: 'once', ncb: { perYear: 20, max: 100 }, preHospDays: 60, postHospDays: 90 },

  // Bank of Baroda
  { ...base, bank: 'bob', slug: 'bob-parivar-suraksha', name: 'Parivar Suraksha', category: 'comprehensive', maxEntryAge: 65, sumInsuredOptions: [5, 7, 10, 15, 20], baseRate: 4200, roomRent: 'no-limit', pedWaitingYears: 2, restore: 'once', ncb: { perYear: 10, max: 100 }, consumables: true, preHospDays: 60, postHospDays: 90 },
  { ...base, bank: 'bob', slug: 'bob-varishtha', name: 'Varishtha Senior Care', category: 'senior', floater: false, maxEntryAge: 80, sumInsuredOptions: [5, 10, 15, 25], baseRate: 4200, roomRent: 'single-private', copayPct: 20, pedWaitingYears: 1, restore: 'once', ncb: { perYear: 10, max: 50 }, preHospDays: 30, postHospDays: 60, healthCheckup: true },

  // Punjab National Bank
  { ...base, bank: 'pnb', slug: 'pnb-swasthya', name: 'Swasthya Classic', category: 'essential', maxEntryAge: 65, sumInsuredOptions: [3, 5, 7, 10, 15], baseRate: 3100, roomRent: 'shared', copayPct: 5, pedWaitingYears: 3, restore: 'once', ncb: { perYear: 5, max: 50 }, preHospDays: 30, postHospDays: 60 },
  { ...base, bank: 'pnb', slug: 'pnb-family-care', name: 'Family Care Gold', category: 'comprehensive', maxEntryAge: 65, sumInsuredOptions: [5, 10, 15, 20, 25], baseRate: 3900, roomRent: 'single-private', pedWaitingYears: 3, maternity: { covered: true, waitingYears: 3, limit: 50000 }, restore: 'once', ncb: { perYear: 20, max: 100 }, preHospDays: 60, postHospDays: 90, healthCheckup: true },
];
