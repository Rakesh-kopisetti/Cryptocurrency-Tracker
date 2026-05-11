export type ThemeMode = 'light' | 'dark';
export type ViewMode = 'market' | 'portfolio';
export type WebSocketState = 'CONNECTING' | 'OPEN' | 'CLOSING' | 'CLOSED';
export type AlertCondition = 'above' | 'below';

export interface CoinMarket {
  id: string;
  symbol: string;
  name: string;
  binanceSymbol: string;
  currentPrice: number;
  priceChange24h: number;
  sparkline: number[];
}

export interface PortfolioEntry {
  id: string;
  quantity: number;
  purchasePrice: number;
}

export interface PriceAlert {
  id: string;
  targetPrice: number;
  condition: AlertCondition;
}

export interface AlertNotification {
  key: string;
  alertId: string;
  message: string;
}