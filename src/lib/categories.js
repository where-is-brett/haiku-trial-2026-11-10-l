// src/lib/categories.js

// Category keys and their labels, in the order the request lists them.
export const CATEGORIES = {
  groceries: 'Groceries',
  eating_out: 'Eating out',
  transport: 'Transport',
  bills: 'Bills',
  shopping: 'Shopping',
  health: 'Health',
  income: 'Income',
  other: 'Other',
};

// Returns the label for a category key, such as 'Eating out' for 'eating_out'.
export function labelOf(key) {
  return CATEGORIES[key];
}

// Shop names and their category, in the order the request lists them.
const SHOPS = [
  ['Greenbarrow Fresh', 'groceries'],
  ['Pennywhistle Market', 'groceries'],
  ['Lowtide Grocers', 'groceries'],
  ['Harvest Lane Foods', 'groceries'],
  ['Pasta', 'eating_out'],
  ['Pizza & Co', 'eating_out'],
  ['Kestrel Coffee Bar', 'eating_out'],
  ['Saltbush Noodle House', 'eating_out'],
  ['Ember Grill', 'eating_out'],
  ['Waverly Fuel Stop', 'transport'],
  ['Tramline Fares', 'transport'],
  ['Lantern Rideshare', 'transport'],
  ['Northgate Parking', 'transport'],
  ['Brightfield Power', 'bills'],
  ['Clearwater Utilities', 'bills'],
  ['Skyline Broadband', 'bills'],
  ['Hollis Insurance', 'bills'],
  ['Marlowe Homewares', 'shopping'],
  ['Quillon Books', 'shopping'],
  ['Fernhill Outfitters', 'shopping'],
  ['Pixel Parade Tech', 'shopping'],
  ['Larkspur Pharmacy', 'health'],
  ['Elmgrove Physio', 'health'],
  ['Cobalt Dental', 'health'],
  ['Sunnyvale Optical', 'health'],
  ['Brightwave Payroll', 'income'],
  ['Tidepool Interest', 'income'],
  ['Oakridge Dividends', 'income'],
];

// Returns the key of the first shop whose name the description contains, ignoring case; 'other' if none does.
export function categoryOf(description) {
  const text = String(description ?? '').toLowerCase();
  const shop = SHOPS.find(([name]) => text.includes(name.toLowerCase()));
  return shop ? shop[1] : 'other';
}
