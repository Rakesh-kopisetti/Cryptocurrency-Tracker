import { useMemo } from 'react';
import { PriceChart } from './Charts';
import { useCryptoStore } from '../store/useCryptoStore';
import { formatCurrency, formatPercent } from '../utils/format';

export function CoinDetailModal() {
  const selectedCoinId = useCryptoStore((state) => state.selectedCoinId);
  const coins = useCryptoStore((state) => state.coins);
  const closeCoinDetail = useCryptoStore((state) => state.closeCoinDetail);

  const coin = useMemo(() => coins.find((entry) => entry.id === selectedCoinId) ?? null, [coins, selectedCoinId]);

  if (!coin) {
    return null;
  }

  return (
    <div className="modal-backdrop" role="presentation" onClick={closeCoinDetail}>
      <section className="modal-card" role="dialog" aria-modal="true" aria-label={`${coin.name} details`} onClick={(event) => event.stopPropagation()}>
        <div className="modal-header">
          <div>
            <h2>{coin.name}</h2>
            <p>
              {coin.symbol} · {coin.binanceSymbol}
            </p>
          </div>
          <button type="button" className="ghost-button" onClick={closeCoinDetail}>
            Close
          </button>
        </div>

        <div className="detail-stats">
          <div>
            <span className="label">Price</span>
            <strong>{formatCurrency(coin.currentPrice)}</strong>
          </div>
          <div>
            <span className="label">24h change</span>
            <strong className={coin.priceChange24h >= 0 ? 'positive' : 'negative'}>{formatPercent(coin.priceChange24h)}</strong>
          </div>
        </div>

        <div className="detail-chart">
          <PriceChart values={coin.sparkline.slice(-36)} testId="price-chart" height={260} stroke="#ff9f1c" />
        </div>
      </section>
    </div>
  );
}