import type { CoinMarket } from '../types';

function makeSeries(base: number, swing: number): number[] {
  return Array.from({ length: 24 }, (_, index) => {
    const drift = Math.sin(index / 3) * swing * 0.25 + Math.cos(index / 4) * swing * 0.12;
    return Number((base + drift + index * swing * 0.015).toFixed(2));
  });
}

const fallbackBaseCoins = [
  { id: 'bitcoin', symbol: 'btc', name: 'Bitcoin', price: 68450, change: 2.14, swing: 1700 },
  { id: 'ethereum', symbol: 'eth', name: 'Ethereum', price: 3480, change: 1.84, swing: 120 },
  { id: 'tether', symbol: 'usdt', name: 'Tether', price: 1, change: 0.01, swing: 0.01 },
  { id: 'bnb', symbol: 'bnb', name: 'BNB', price: 585, change: 1.02, swing: 24 },
  { id: 'solana', symbol: 'sol', name: 'Solana', price: 168, change: 3.45, swing: 7 },
  { id: 'xrp', symbol: 'xrp', name: 'XRP', price: 0.54, change: -0.82, swing: 0.03 },
  { id: 'cardano', symbol: 'ada', name: 'Cardano', price: 0.46, change: 0.72, swing: 0.02 },
  { id: 'dogecoin', symbol: 'doge', name: 'Dogecoin', price: 0.16, change: 4.26, swing: 0.01 },
  { id: 'tron', symbol: 'trx', name: 'TRON', price: 0.14, change: 1.15, swing: 0.01 },
  { id: 'avalanche-2', symbol: 'avax', name: 'Avalanche', price: 36.2, change: 2.41, swing: 2 },
  { id: 'chainlink', symbol: 'link', name: 'Chainlink', price: 15.4, change: 1.16, swing: 0.9 },
  { id: 'litecoin', symbol: 'ltc', name: 'Litecoin', price: 82.4, change: -0.55, swing: 4 },
  { id: 'toncoin', symbol: 'ton', name: 'Toncoin', price: 6.71, change: 0.92, swing: 0.3 },
  { id: 'polkadot', symbol: 'dot', name: 'Polkadot', price: 6.14, change: -1.24, swing: 0.3 },
  { id: 'uniswap', symbol: 'uni', name: 'Uniswap', price: 11.32, change: 1.76, swing: 0.5 },
  { id: 'bitcoin-cash', symbol: 'bch', name: 'Bitcoin Cash', price: 435, change: 0.66, swing: 18 },
  { id: 'stellar', symbol: 'xlm', name: 'Stellar', price: 0.12, change: 1.11, swing: 0.01 },
  { id: 'near', symbol: 'near', name: 'NEAR Protocol', price: 6.48, change: 2.21, swing: 0.3 },
  { id: 'aptos', symbol: 'apt', name: 'Aptos', price: 11.76, change: 3.12, swing: 0.6 },
  { id: 'internet-computer', symbol: 'icp', name: 'Internet Computer', price: 13.94, change: 1.09, swing: 0.7 }
];

export const fallbackCoins: CoinMarket[] = fallbackBaseCoins.map((coin) => ({
  id: coin.id,
  symbol: coin.symbol.toUpperCase(),
  name: coin.name,
  binanceSymbol: `${coin.symbol.toUpperCase()}USDT`,
  currentPrice: coin.price,
  priceChange24h: coin.change,
  sparkline: makeSeries(coin.price, coin.swing)
}));