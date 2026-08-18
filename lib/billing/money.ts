const CURRENCY_MINOR_UNITS: Readonly<Record<string, number>> = Object.freeze({
  JPY: 0,
  KRW: 0,
  VND: 0,
  CLP: 0,
  KWD: 3,
});

export function getCurrencyMinorUnits(currency: string) {
  return CURRENCY_MINOR_UNITS[currency.toUpperCase()] ?? 2;
}

export function minorUnitMultiplier(currency: string) {
  return 10 ** getCurrencyMinorUnits(currency);
}

export function formatMoney(amountSubunits: number, currency: string) {
  return new Intl.NumberFormat(undefined, {
    style: "currency",
    currency,
    minimumFractionDigits: getCurrencyMinorUnits(currency),
    maximumFractionDigits: getCurrencyMinorUnits(currency),
  }).format(amountSubunits / minorUnitMultiplier(currency));
}

export function minimumChargeSubunits(currency: string) {
  return Math.max(1, minorUnitMultiplier(currency));
}
