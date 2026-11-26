export const rupees = (n) => '₹' + Math.round(n).toLocaleString('en-IN');
export const cover = (lakh) => (lakh >= 100 ? `₹${lakh / 100} Cr` : `₹${lakh} Lakh`);

export const ROOM = { 'no-limit': 'Any room, no limit', 'single-private': 'Single private room', shared: 'Shared room', '1pct': '1% of cover per day' };
export const RESTORE = { unlimited: 'Unlimited', once: 'Once a year', none: 'Not available' };
export const PRIORITY = { premium: 'Lowest premium', coverage: 'Widest coverage', claims: 'Reliable claims', network: 'Most hospitals' };

export const memberLabel = (key, gender) =>
  ({ self: 'Self', spouse: gender === 'female' ? 'Husband' : 'Wife', son: 'Son', daughter: 'Daughter', father: 'Father', mother: 'Mother' })[key];
