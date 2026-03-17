// config.js
// 包含所有配置常量，便于集中管理

const BINANCE_KLINE_API_URL = 'https://fapi.binance.com/fapi/v1/klines';
const BINANCE_FUNDING_RATE_API_URL = 'https://fapi.binance.com/fapi/v1/premiumIndex';
const BINANCE_TICKER_API_URL = 'https://fapi.binance.com/fapi/v1/ticker/24hr';
const BINANCE_LONG_SHORT_RATIO_URL = 'https://fapi.binance.com/futures/data/topLongShortAccountRatio';
const BINANCE_TAKER_VOL_URL = 'https://fapi.binance.com/futures/data/takerlongshortRatio';
const BINANCE_TOP_LONG_SHORT_POSITION_URL = 'https://fapi.binance.com/futures/data/topLongShortPositionRatio';
const BINANCE_OPEN_INTEREST_HIST_URL = 'https://fapi.binance.com/futures/data/openInterestHist';
const LIMIT = 200; // 获取最近200根K线数据，以保证指标计算准确性

module.exports = {
    BINANCE_KLINE_API_URL,
    BINANCE_FUNDING_RATE_API_URL,
    BINANCE_TICKER_API_URL,
    BINANCE_LONG_SHORT_RATIO_URL,
    BINANCE_TAKER_VOL_URL,
    LIMIT
};
