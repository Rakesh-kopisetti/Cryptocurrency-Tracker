/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly REACT_APP_BINANCE_WS_URL?: string;
  readonly REACT_APP_COINGECKO_API_URL?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

declare global {
  interface Window {
    getWebSocketState?: () => string;
  }
}

export {};