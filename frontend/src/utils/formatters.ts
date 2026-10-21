const currencyFormatter = new Intl.NumberFormat('it-IT', {
    style: 'currency',
    currency: 'EUR',
});

/**
 * Formats a number as Euro currency (it-IT locale).
 */
export const formatCurrency = (amount: number): string => currencyFormatter.format(amount);

/**
 * Formats the absolute value of a number as Euro currency.
 */
export const formatAbsoluteCurrency = (amount: number): string => currencyFormatter.format(Math.abs(amount));
