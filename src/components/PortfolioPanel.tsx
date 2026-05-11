import { useMemo } from 'react';
import type { CoinMarket } from '../types';
import { useCryptoStore } from '../store/useCryptoStore';
import { formatCurrency } from '../utils/format';

type PortfolioPanelProps = {
  coins: CoinMarket[];
};

export function PortfolioPanel({ coins }: PortfolioPanelProps) {
  const portfolio = useCryptoStore((state) => state.portfolio);
  const setPortfolioEntry = useCryptoStore((state) => state.setPortfolioEntry);
  const removePortfolioEntry = useCryptoStore((state) => state.removePortfolioEntry);
  const alerts = useCryptoStore((state) => state.alerts);
  const setAlert = useCryptoStore((state) => state.setAlert);
  const removeAlert = useCryptoStore((state) => state.removeAlert);
  const notifications = useCryptoStore((state) => state.notifications);
  const dismissNotification = useCryptoStore((state) => state.dismissNotification);

  const holdings = useMemo(
    () =>
      portfolio.map((entry) => {
        const coin = coins.find((candidate) => candidate.id === entry.id);
        const price = coin?.currentPrice ?? entry.purchasePrice;
        const value = entry.quantity * price;
        const costBasis = entry.quantity * entry.purchasePrice;
        const profitLoss = value - costBasis;

        return { ...entry, price, value, costBasis, profitLoss, coin };
      }),
    [coins, portfolio]
  );

  const totals = useMemo(() => {
    return holdings.reduce(
      (accumulator, entry) => {
        accumulator.value += entry.value;
        accumulator.costBasis += entry.costBasis;
        return accumulator;
      },
      { value: 0, costBasis: 0 }
    );
  }, [holdings]);

  const totalProfitLoss = totals.value - totals.costBasis;

  return (
    <section className="panel portfolio-panel" aria-labelledby="portfolio-heading">
      <div className="panel-header">
        <div>
          <h2 id="portfolio-heading">Portfolio</h2>
          <p>Stored in localStorage under cryptoPortfolio.</p>
        </div>
      </div>

      <div className="portfolio-summary">
        <div>
          <span className="label">Total value</span>
          <strong data-testid="portfolio-total-value">{formatCurrency(totals.value)}</strong>
        </div>
        <div>
          <span className="label">Profit/Loss</span>
          <strong data-testid="portfolio-pl" className={totalProfitLoss >= 0 ? 'positive' : 'negative'}>
            {formatCurrency(totalProfitLoss)}
          </strong>
        </div>
      </div>

      <div className="input-grid">
        <PortfolioForm coins={coins} onSave={setPortfolioEntry} />
        <AlertForm coins={coins} onSave={setAlert} />
      </div>

      <div className="portfolio-list">
        {holdings.length === 0 ? <p className="empty-state">No holdings saved yet.</p> : null}
        {holdings.map((entry) => (
          <article key={entry.id} className="portfolio-item" data-testid={`portfolio-item-${entry.id}`}>
            <div>
              <strong>{entry.coin?.name ?? entry.id}</strong>
              <p>
                {entry.quantity} units at {formatCurrency(entry.purchasePrice)}
              </p>
            </div>
            <div>
              <span className="label">Current</span>
              <strong>{formatCurrency(entry.price)}</strong>
              <span className={entry.profitLoss >= 0 ? 'positive' : 'negative'}>{formatCurrency(entry.profitLoss)}</span>
            </div>
            <button type="button" className="ghost-button" onClick={() => removePortfolioEntry(entry.id)}>
              Remove
            </button>
          </article>
        ))}
      </div>

      <div className="alerts-list">
        <h3>Active Alerts</h3>
        {alerts.length === 0 ? <p className="empty-state">No saved alerts.</p> : null}
        {alerts.map((alert) => (
          <div key={`${alert.id}-${alert.targetPrice}-${alert.condition}`} className="alert-item">
            <span>
              {alert.id} {alert.condition} {formatCurrency(alert.targetPrice)}
            </span>
            <button type="button" className="ghost-button" onClick={() => removeAlert(alert.id, alert.targetPrice, alert.condition)}>
              Remove
            </button>
          </div>
        ))}
      </div>

      <div className="notifications-list" aria-live="polite">
        {notifications.map((notification) => (
          <div key={notification.key} className="notification-toast" data-testid={`alert-notification-${notification.alertId}`}>
            <span>{notification.message}</span>
            <button type="button" className="ghost-button" onClick={() => dismissNotification(notification.key)}>
              Dismiss
            </button>
          </div>
        ))}
      </div>
    </section>
  );
}

function PortfolioForm({ coins, onSave }: { coins: CoinMarket[]; onSave: (entry: { id: string; quantity: number; purchasePrice: number }) => void }) {
  const defaultCoin = coins[0]?.id ?? 'bitcoin';

  return (
    <form
      className="card-form"
      onSubmit={(event) => {
        event.preventDefault();
        const formData = new FormData(event.currentTarget);
        const id = String(formData.get('portfolioCoin'));
        const quantity = Number(formData.get('portfolioQuantity'));
        const purchasePrice = Number(formData.get('portfolioPurchasePrice'));

        if (!id || !Number.isFinite(quantity) || quantity <= 0 || !Number.isFinite(purchasePrice) || purchasePrice <= 0) {
          return;
        }

        onSave({ id, quantity, purchasePrice });
        event.currentTarget.reset();
      }}
    >
      <h3>Add to Portfolio</h3>
      <label>
        Coin
        <select name="portfolioCoin" defaultValue={defaultCoin}>
          {coins.map((coin) => (
            <option key={coin.id} value={coin.id}>
              {coin.name}
            </option>
          ))}
        </select>
      </label>
      <label>
        Quantity
        <input name="portfolioQuantity" type="number" step="0.0001" min="0" placeholder="0.5" />
      </label>
      <label>
        Avg. purchase price
        <input name="portfolioPurchasePrice" type="number" step="0.01" min="0" placeholder="50000" />
      </label>
      <button type="submit" className="primary-button">
        Save Holding
      </button>
    </form>
  );
}

function AlertForm({ coins, onSave }: { coins: CoinMarket[]; onSave: (entry: { id: string; targetPrice: number; condition: 'above' | 'below' }) => void }) {
  const defaultCoin = coins[0]?.id ?? 'bitcoin';

  return (
    <form
      className="card-form"
      onSubmit={(event) => {
        event.preventDefault();
        const formData = new FormData(event.currentTarget);
        const id = String(formData.get('alertCoin'));
        const targetPrice = Number(formData.get('alertTargetPrice'));
        const condition = String(formData.get('alertCondition')) as 'above' | 'below';

        if (!id || !Number.isFinite(targetPrice) || targetPrice <= 0) {
          return;
        }

        onSave({ id, targetPrice, condition });
        event.currentTarget.reset();
      }}
    >
      <h3>Create Price Alert</h3>
      <label>
        Coin
        <select name="alertCoin" defaultValue={defaultCoin}>
          {coins.map((coin) => (
            <option key={coin.id} value={coin.id}>
              {coin.name}
            </option>
          ))}
        </select>
      </label>
      <label>
        Condition
        <select name="alertCondition" defaultValue="above">
          <option value="above">Above</option>
          <option value="below">Below</option>
        </select>
      </label>
      <label>
        Target price
        <input name="alertTargetPrice" type="number" step="0.01" min="0" placeholder="100000" />
      </label>
      <button type="submit" className="primary-button">
        Save Alert
      </button>
    </form>
  );
}