/**
 * Format numerical amounts to Indian Rupee (₹) by default or specified currency.
 * Matches requested standard: ₹25,400, ₹8,500, ₹16,500
 */
export const formatCurrency = (amount, currency = 'INR') => {
  if (amount === undefined || amount === null || isNaN(amount)) {
    return '₹0.00';
  }

  const num = typeof amount === 'string' ? parseFloat(amount) : amount;

  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: currency,
    minimumFractionDigits: num % 1 === 0 ? 0 : 2,
    maximumFractionDigits: 2
  }).format(num);
};

export const formatPercentage = (val) => {
  if (val === undefined || val === null || isNaN(val)) return '0%';
  const num = typeof val === 'string' ? parseFloat(val) : val;
  return `${num > 0 ? '+' : ''}${num.toFixed(1)}%`;
};

