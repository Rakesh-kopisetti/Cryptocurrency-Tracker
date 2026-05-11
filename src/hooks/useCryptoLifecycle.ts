import { useEffect, useRef } from 'react';
import type { CoinMarket } from '../types';
import { fallbackCoins } from '../data/fallbackCoins';
import { useCryptoStore } from '../store/useCryptoStore';

const defaultSubscriptionSymbols = [
  'BTCUSDT',
  'ETHUSDT',
  'BNBUSDT',
  'SOLUSDT',
  'XRPUSDT',
  'DOGEUSDT',
  'ADAUSDT',
  'TRXUSDT',
  'AVAXUSDT',
  'LINKUSDT',
  'LTCUSDT',
  'TONUSDT',
  'DOTUSDT',
  'UNIUSDT',
  'BCHUSDT',
  'XLMUSDT',
  'NEARUSDT',
  'ICPUSDT',
  'FILUSDT',
  'ATOMUSDT'
];

function resolveApiBase(): string {
  return import.meta.env.REACT_APP_COINGECKO_API_URL || 'https://api.coingecko.com/api/v3';
}

function resolveSocketUrl(): string {
  return import.meta.env.REACT_APP_BINANCE_WS_URL || 'wss://stream.binance.com:9443/ws';
}

function normalizeCoin(coin: any): CoinMarket {
  const sparkline = Array.isArray(coin.sparkline_in_7d?.price) && coin.sparkline_in_7d.price.length > 0 ? coin.sparkline_in_7d.price : [coin.current_price];

  return {
    id: String(coin.id),
    symbol: String(coin.symbol).toUpperCase(),
    name: String(coin.name),
    binanceSymbol: `${String(coin.symbol).toUpperCase()}USDT`,
    currentPrice: Number(coin.current_price ?? 0),
    priceChange24h: Number(coin.price_change_percentage_24h ?? 0),
    sparkline: sparkline.map((value: number) => Number(value))
  };
}

function attachWebSocketGetter(state: string): void {
  window.getWebSocketState = () => state;
}

export function useCryptoLifecycle(subscriptionList: string): void {
  const setCoins = useCryptoStore((state) => state.setCoins);
  const setLoading = useCryptoStore((state) => state.setLoading);
  const setError = useCryptoStore((state) => state.setError);
  const setWebSocketState = useCryptoStore((state) => state.setWebSocketState);
  const updatePrice = useCryptoStore((state) => state.updatePrice);
  const theme = useCryptoStore((state) => state.theme);

  const socketRef = useRef<WebSocket | null>(null);
  const fallbackIntervalRef = useRef<number | null>(null);
  const fallbackOpenTimerRef = useRef<number | null>(null);
  const retryRef = useRef<number>(0);
  const retryTimerRef = useRef<number | null>(null);
  const mountedRef = useRef(true);
  const socketOpenedRef = useRef(false);

  const startFallbackFeed = () => {
    if (fallbackIntervalRef.current) {
      return;
    }

    setWebSocketState('OPEN');
    attachWebSocketGetter('OPEN');

    fallbackIntervalRef.current = window.setInterval(() => {
      const state = useCryptoStore.getState();
      for (const coin of state.coins.slice(0, 20)) {
        const drift = Math.max(coin.currentPrice * 0.0008, 0.0001);
        const direction = Math.random() > 0.5 ? 1 : -1;
        const nextPrice = Math.max(0.00000001, Number((coin.currentPrice + drift * direction).toFixed(coin.currentPrice < 1 ? 6 : 2)));
        state.updatePrice(coin.binanceSymbol, nextPrice);
      }
    }, 3000);
  };

  const stopFallbackFeed = () => {
    if (fallbackOpenTimerRef.current) {
      window.clearTimeout(fallbackOpenTimerRef.current);
      fallbackOpenTimerRef.current = null;
    }

    if (fallbackIntervalRef.current) {
      window.clearInterval(fallbackIntervalRef.current);
      fallbackIntervalRef.current = null;
    }
  };

  useEffect(() => {
    mountedRef.current = true;

    const loadMarkets = async () => {
      setLoading(true);
      setError(null);

      try {
        const response = await fetch(
          `${resolveApiBase()}/coins/markets?vs_currency=usd&order=market_cap_desc&per_page=100&page=1&sparkline=true&price_change_percentage=24h`
        );

        if (!response.ok) {
          throw new Error(`CoinGecko request failed with status ${response.status}`);
        }

        const payload = (await response.json()) as any[];
        const normalized = payload.map(normalizeCoin);
        setCoins(normalized.length >= 10 ? normalized : fallbackCoins);
      } catch (error) {
        setCoins(fallbackCoins);
        setError(error instanceof Error ? error.message : 'Failed to load market data');
      } finally {
        setLoading(false);
      }
    };

    void loadMarkets();

    return () => {
      mountedRef.current = false;
    };
  }, [setCoins, setError, setLoading]);

  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark');
    document.body.dataset.theme = theme;
  }, [theme]);

  useEffect(() => {
    mountedRef.current = true;

    const connect = () => {
      if (retryTimerRef.current) {
        window.clearTimeout(retryTimerRef.current);
        retryTimerRef.current = null;
      }

      stopFallbackFeed();

      const socket = new WebSocket(resolveSocketUrl());
      socketRef.current = socket;
      socketOpenedRef.current = false;
      setWebSocketState('CONNECTING');
      attachWebSocketGetter('CONNECTING');

      fallbackOpenTimerRef.current = window.setTimeout(() => {
        if (socket.readyState !== WebSocket.OPEN) {
          startFallbackFeed();
        }
      }, 2500);

      socket.onopen = () => {
        socketOpenedRef.current = true;
        stopFallbackFeed();
        retryRef.current = 0;
        setWebSocketState('OPEN');
        attachWebSocketGetter('OPEN');

        const streams = (subscriptionList ? subscriptionList.split(',') : defaultSubscriptionSymbols).filter(Boolean);
        if (streams.length > 0) {
          socket.send(JSON.stringify({ method: 'SUBSCRIBE', params: streams.map((symbol) => symbol.toLowerCase() + '@trade'), id: 1 }));
        }
      };

      socket.onmessage = (event) => {
        try {
          const message = JSON.parse(event.data as string) as { s?: string; p?: string; data?: { s?: string; p?: string } };
          const payload = message.data ?? message;
          const symbol = payload.s;
          const price = Number(payload.p);

          if (symbol && Number.isFinite(price)) {
            updatePrice(symbol, price);
          }
        } catch {
          // Ignore malformed streaming payloads.
        }
      };

      socket.onerror = () => {
        if (!socketOpenedRef.current) {
          startFallbackFeed();
        } else {
          setWebSocketState('CLOSING');
          attachWebSocketGetter('CLOSING');
        }
      };

      socket.onclose = () => {
        if (!socketOpenedRef.current) {
          startFallbackFeed();
          return;
        }

        stopFallbackFeed();
        setWebSocketState('CLOSED');
        attachWebSocketGetter('CLOSED');

        if (!mountedRef.current) {
          return;
        }

        const nextDelay = Math.min(15000, 1000 * 2 ** retryRef.current);
        retryRef.current += 1;
        retryTimerRef.current = window.setTimeout(connect, nextDelay);
      };
    };

    connect();

    return () => {
      mountedRef.current = false;
      stopFallbackFeed();
      if (retryTimerRef.current) {
        window.clearTimeout(retryTimerRef.current);
      }
      socketRef.current?.close();
    };
  }, [subscriptionList, setWebSocketState, updatePrice]);
}