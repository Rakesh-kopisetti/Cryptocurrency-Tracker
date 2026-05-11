import { memo } from 'react';
import type { CoinMarket } from '../types';
import { SparklineChart } from './Charts';
import { formatCurrency, formatPercent } from '../utils/format';

type MarketTableProps = {
  coins: CoinMarket[];
  onSelect: (id: string) => void;
};

const Row = memo(function Row({ coin, onSelect }: { coin: CoinMarket; onSelect: (id: string) => void }) {
  return (
    <button type="button" className="crypto-row" data-testid={`crypto-row-${coin.binanceSymbol}`} onClick={() => onSelect(coin.id)}>
      <div className="row-asset">
        <strong>{coin.name}</strong>
        <span>{coin.symbol}</span>
      </div>
      <div className="row-price" data-testid={`price-${coin.binanceSymbol}`}>
        {formatCurrency(coin.currentPrice)}
      </div>
      <div
        className={`row-change ${coin.priceChange24h >= 0 ? 'positive' : 'negative'}`}
        data-testid={`price-change-24h-${coin.binanceSymbol}`}
        data-direction={coin.priceChange24h >= 0 ? 'up' : 'down'}
      >
        {formatPercent(coin.priceChange24h)}
      </div>
      <div className="row-chart">
        <SparklineChart values={coin.sparkline.slice(-18)} testId={`sparkline-${coin.binanceSymbol}`} height={44} stroke={coin.priceChange24h >= 0 ? '#16a34a' : '#ef4444'} />
      </div>
    </button>
  );
});

export function MarketTable({ coins, onSelect }: MarketTableProps) {
  return (
    <section className="panel market-panel" aria-labelledby="market-heading">
      <div className="panel-header">
        <div>
          <h2 id="market-heading">Market Overview</h2>
          <p>Top cryptocurrencies with live prices and sparkline trends.</p>
        </div>
      </div>

      <div className="table-header" aria-hidden="true">
        <span>Asset</span>
        <span>Price</span>
        <span>24h</span>
        <span>Trend</span>
      </div>

      <div className="table-body">
        {coins.map((coin) => (
          <Row key={coin.id} coin={coin} onSelect={onSelect} />
        ))}
      </div>
    </section>
  );
}