import { create } from 'zustand';
import type { AlertNotification, CoinMarket, PortfolioEntry, PriceAlert, ThemeMode, ViewMode, WebSocketState } from '../types';
import { safeStorageGet, safeStorageRemove, safeStorageSet } from '../utils/storage';

const portfolioStorageKey = 'cryptoPortfolio';
const alertStorageKey = 'cryptoAlerts';
const themeStorageKey = 'cryptoTheme';

type CryptoState = {
  coins: CoinMarket[];
  loading: boolean;
  error: string | null;
  search: string;
  view: ViewMode;
  theme: ThemeMode;
  websocketState: WebSocketState;
  selectedCoinId: string | null;
  portfolio: PortfolioEntry[];
  alerts: PriceAlert[];
  notifications: AlertNotification[];
  setCoins: (coins: CoinMarket[]) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  setSearch: (search: string) => void;
  setView: (view: ViewMode) => void;
  setTheme: (theme: ThemeMode) => void;
  toggleTheme: () => void;
  setWebSocketState: (state: WebSocketState) => void;
  selectCoin: (id: string) => void;
  closeCoinDetail: () => void;
  updatePrice: (binanceSymbol: string, price: number) => void;
  setPortfolioEntry: (entry: PortfolioEntry) => void;
  removePortfolioEntry: (id: string) => void;
  setAlert: (alert: PriceAlert) => void;
  removeAlert: (alertId: string, targetPrice: number, condition: string) => void;
  addNotification: (notification: AlertNotification) => void;
  dismissNotification: (key: string) => void;
};

const initialPortfolio = safeStorageGet<PortfolioEntry[]>(portfolioStorageKey, []);
const initialAlerts = safeStorageGet<PriceAlert[]>(alertStorageKey, []);
const initialTheme = safeStorageGet<ThemeMode>(themeStorageKey, 'light');

function writePortfolio(portfolio: PortfolioEntry[]): void {
  safeStorageSet(portfolioStorageKey, portfolio);
}

function writeAlerts(alerts: PriceAlert[]): void {
  safeStorageSet(alertStorageKey, alerts);
}

function writeTheme(theme: ThemeMode): void {
  safeStorageSet(themeStorageKey, theme);
}

function mergeHoldings(entries: PortfolioEntry[], next: PortfolioEntry): PortfolioEntry[] {
  const existingIndex = entries.findIndex((entry) => entry.id === next.id);

  if (existingIndex === -1) {
    return [...entries, next];
  }

  const existing = entries[existingIndex];
  const totalQuantity = existing.quantity + next.quantity;
  const weightedAverage = (existing.quantity * existing.purchasePrice + next.quantity * next.purchasePrice) / totalQuantity;
  const updated = { ...existing, quantity: totalQuantity, purchasePrice: Number(weightedAverage.toFixed(2)) };

  return entries.map((entry, index) => (index === existingIndex ? updated : entry));
}

function triggerKey(alert: PriceAlert): string {
  return `${alert.id}-${alert.condition}-${alert.targetPrice}`;
}

export const useCryptoStore = create<CryptoState>((set, get) => ({
  coins: [],
  loading: true,
  error: null,
  search: '',
  view: 'market',
  theme: initialTheme,
  websocketState: 'CONNECTING',
  selectedCoinId: null,
  portfolio: initialPortfolio,
  alerts: initialAlerts,
  notifications: [],
  setCoins: (coins) => set({ coins }),
  setLoading: (loading) => set({ loading }),
  setError: (error) => set({ error }),
  setSearch: (search) => set({ search }),
  setView: (view) => set({ view }),
  setTheme: (theme) => {
    writeTheme(theme);
    set({ theme });
  },
  toggleTheme: () => {
    const nextTheme = get().theme === 'dark' ? 'light' : 'dark';
    writeTheme(nextTheme);
    set({ theme: nextTheme });
  },
  setWebSocketState: (state) => set({ websocketState: state }),
  selectCoin: (id) => set({ selectedCoinId: id }),
  closeCoinDetail: () => set({ selectedCoinId: null }),
  updatePrice: (binanceSymbol, price) =>
    set((state) => {
      let notification: AlertNotification | null = null;

      const coins = state.coins.map((coin) => {
        if (coin.binanceSymbol !== binanceSymbol) {
          return coin;
        }

        const nextSparkline = [...coin.sparkline, price].slice(-48);
        return {
          ...coin,
          currentPrice: price,
          sparkline: nextSparkline
        };
      });

      const coin = coins.find((candidate) => candidate.binanceSymbol === binanceSymbol);

      if (coin) {
        for (const alert of state.alerts) {
          if (alert.id !== coin.id) {
            continue;
          }

          const key = triggerKey(alert);
          const alreadyVisible = state.notifications.some((entry) => entry.key === key);
          const hitAbove = alert.condition === 'above' && price >= alert.targetPrice;
          const hitBelow = alert.condition === 'below' && price <= alert.targetPrice;

          if ((hitAbove || hitBelow) && !alreadyVisible) {
            notification = {
              key,
              alertId: alert.id,
              message: `${coin.name} is ${alert.condition} ${alert.targetPrice.toLocaleString('en-US', { style: 'currency', currency: 'USD' })}`
            };
            break;
          }
        }
      }

      return {
        coins,
        notifications: notification ? [...state.notifications, notification] : state.notifications
      };
    }),
  setPortfolioEntry: (entry) => {
    const nextPortfolio = mergeHoldings(get().portfolio, entry);
    writePortfolio(nextPortfolio);
    set({ portfolio: nextPortfolio });
  },
  removePortfolioEntry: (id) => {
    const nextPortfolio = get().portfolio.filter((entry) => entry.id !== id);
    writePortfolio(nextPortfolio);
    set({ portfolio: nextPortfolio });
  },
  setAlert: (alert) => {
    const alerts = get().alerts.filter((entry) => !(entry.id === alert.id && entry.condition === alert.condition));
    const nextAlerts = [...alerts, alert];
    writeAlerts(nextAlerts);
    set({ alerts: nextAlerts });
  },
  removeAlert: (alertId, targetPrice, condition) => {
    const nextAlerts = get().alerts.filter(
      (alert) => !(alert.id === alertId && alert.targetPrice === targetPrice && alert.condition === condition)
    );
    writeAlerts(nextAlerts);
    set({ alerts: nextAlerts });
  },
  addNotification: (notification) => set((state) => ({ notifications: [...state.notifications, notification] })),
  dismissNotification: (key) => set((state) => ({ notifications: state.notifications.filter((notification) => notification.key !== key) }))
}));

export function hydrateStoredState(): void {
  const storedPortfolio = safeStorageGet<PortfolioEntry[]>(portfolioStorageKey, []);
  const storedAlerts = safeStorageGet<PriceAlert[]>(alertStorageKey, []);
  const storedTheme = safeStorageGet<ThemeMode>(themeStorageKey, 'light');

  useCryptoStore.setState({ portfolio: storedPortfolio, alerts: storedAlerts, theme: storedTheme });
}

export function clearStoredSessionState(): void {
  safeStorageRemove('cryptoPortfolio');
  safeStorageRemove('cryptoAlerts');
}