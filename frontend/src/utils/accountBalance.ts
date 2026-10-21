export const adjustedInitialBalance = (initialBalance: number, currentBalance: number, targetBalance: number) =>
    Math.round((initialBalance + targetBalance - currentBalance) * 100) / 100;
