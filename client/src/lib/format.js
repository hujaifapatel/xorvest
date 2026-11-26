export const rupees = (n) => '₹' + Math.round(n).toLocaleString('en-IN');

export const cover = (lakh) => (lakh >= 100 ? `₹${lakh / 100} crore` : `₹${lakh} lakh`);

export function roman(n) {
  const table = [
    [10, 'X'], [9, 'IX'], [5, 'V'], [4, 'IV'], [1, 'I'],
  ];
  let out = '';
  for (const [v, s] of table) while (n >= v) { out += s; n -= v; }
  return out;
}

const WORDS = ['no', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine'];
export const inWords = (n) => WORDS[n] ?? String(n);

export const ROOM = {
  'no-limit': 'Any room, no limit',
  'single-private': 'Single private room',
  shared: 'Shared room',
  '1pct': '1% of cover per day',
};

export const RESTORE = { unlimited: 'Unlimited', once: 'Once a year', none: 'None' };
