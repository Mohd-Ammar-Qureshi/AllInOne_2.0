/** Every price in the app is shown in Indian rupees, e.g. ₹1,25,000.00. */
export const formatPrice = (price: number): string =>
  new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
  }).format(price);

export const formatStatusLabel = (status: string): string =>
  status
    .split('_')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');

export const truncateText = (text: string, maxLength: number): string =>
  text.length <= maxLength ? text : `${text.slice(0, maxLength).trim()}...`;

/** "29 Sep 2026" — short, unambiguous date for list rows. */
export const formatShortDate = (isoDate: string): string =>
  new Date(isoDate).toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });