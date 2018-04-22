// @flow

import querystring from 'querystring';
import DataLoader from 'dataloader';
import type { Price } from '../../common/types/Price';
import LocaleMap from '../../common/types/enums/LocaleMap';

export async function buildBookingUrl(
  passengers: number,
  price: Price,
  token: string,
  locale: ?string,
  dataLoader?: DataLoader<*, *>,
): Promise<string> {
  const { amount, currency } = price;
  let priceInEur = amount;

  // Convert price amount into default EUR currency
  if (currency !== 'EUR' && dataLoader) {
    priceInEur = await convertToEur(price, dataLoader);
  }

  const query = querystring.stringify({
    passengers: `${passengers}-0-0`,
    price: priceInEur,
    token,
  });
  const urlLocale =
    typeof locale === 'string' ? LocaleMap[locale.replace('_', '-')] : 'en';
  return `https://www.kiwi.com/${urlLocale}/booking?${query}`;
}

async function convertToEur(
  price: Price,
  ratesLoader: DataLoader<*, *>,
): Promise<number> {
  const rate = await ratesLoader.load(price.currency);
  return Math.round(price.amount * Number(rate));
}
