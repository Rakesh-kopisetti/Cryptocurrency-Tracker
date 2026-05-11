import { useEffect, useMemo } from 'react';
import { CoinDetailModal } from './components/CoinDetailModal';
import { MarketTable } from './components/MarketTable';
import { PortfolioPanel } from './components/PortfolioPanel';
import { useCryptoLifecycle } from './hooks/useCryptoLifecycle';
import { useCryptoStore } from './store/useCryptoStore';

export default function App() {
  const coins = useCryptoStore((state) => state.coins);
  const loading = useCryptoStore((state) => state.loading);
  const error = useCryptoStore((state) => state.error);
  const search = useCryptoStore((state) => state.search);
  const setSearch = useCryptoStore((state) => state.setSearch);
  const view = useCryptoStore((state) => state.view);
  const setView = useCryptoStore((state) => state.setView);
  const theme = useCryptoStore((state) => state.theme);
  const toggleTheme = useCryptoStore((state) => state.toggleTheme);
  const websocketState = useCryptoStore((state) => state.websocketState);
  const selectCoin = useCryptoStore((state) => state.selectCoin);

  const subscriptionList = useMemo(
    () =>
      coins.length > 0
        ? coins
            .slice(0, 20)
            .map((coin) => coin.binanceSymbol)
            .filter(Boolean)
            .join(',')
        : '',
    [coins]
  );

  useCryptoLifecycle(subscriptionList);

  useEffect(() => {
    document.body.classList.toggle('dark', theme === 'dark');
  }, [theme]);

  const filteredCoins = useMemo(() => {
    const query = search.trim().toLowerCase();

    return coins.filter((coin) => {
      if (!query) {
        return true;
      }

      return coin.name.toLowerCase().includes(query) || coin.symbol.toLowerCase().includes(query) || coin.binanceSymbol.toLowerCase().includes(query);
    });
  }, [coins, search]);

  return (
    <div className="app-shell">
      <header className="top-bar">
        <div>
          <p className="eyebrow">Real-time market intelligence</p>
          <h1>Cryptocurrency Tracker</h1>
          <p className="subtitle">CoinGecko for initial data, Binance for live trade updates, localStorage for portfolio and alerts.</p>
        </div>

        <div className="top-actions">
          <span className={`status-pill ${websocketState.toLowerCase()}`}>WebSocket: {websocketState}</span>
          <button type="button" data-testid="theme-switcher" className="primary-button" onClick={toggleTheme}>
            {theme === 'dark' ? 'Light mode' : 'Dark mode'}
          </button>
        </div>
      </header>

      <nav className="view-switcher" aria-label="Dashboard views">
        <button type="button" className={view === 'market' ? 'view-button active' : 'view-button'} onClick={() => setView('market')}>
          Market
        </button>
        <button type="button" className={view === 'portfolio' ? 'view-button active' : 'view-button'} onClick={() => setView('portfolio')}>
          Portfolio
        </button>
      </nav>

      <main className="dashboard-grid">
        <section className="panel search-panel">
          <label htmlFor="search-input" className="search-label">
            Search coins
          </label>
          <input
            id="search-input"
            data-testid="search-input"
            type="search"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search by name, symbol, or ticker"
          />
          {loading ? <p className="helper-text">Loading market data…</p> : null}
          {error ? <p className="error-banner">{error}</p> : null}
        </section>

        <section className="content-grid">
          <div className="main-column">{view === 'market' ? <MarketTable coins={filteredCoins} onSelect={selectCoin} /> : <PortfolioPanel coins={coins} />}</div>

          {view === 'market' ? (
            <aside className="side-column">
              <PortfolioPanel coins={coins} />
            </aside>
          ) : null}
        </section>
      </main>

      <CoinDetailModal />
    </div>
  );
}