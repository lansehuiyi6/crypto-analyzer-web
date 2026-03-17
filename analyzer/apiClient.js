// apiClient.js
// 封装所有API请求逻辑

const axios = require('axios');
const { BINANCE_KLINE_API_URL, BINANCE_FUNDING_RATE_API_URL, BINANCE_TICKER_API_URL, BINANCE_LONG_SHORT_RATIO_URL, BINANCE_TAKER_VOL_URL, BINANCE_TOP_LONG_SHORT_POSITION_URL, BINANCE_OPEN_INTEREST_HIST_URL, LIMIT } = require('./config');

async function getKlines(symbol, interval, limit = LIMIT) {
    try {
        const response = await axios.get(BINANCE_KLINE_API_URL, {
            params: { symbol, interval, limit }
        });
        if (!response.data || (limit && response.data.length < limit)) {
            throw new Error('获取K线数据失败，请检查API连接或参数。');
        }
        return response.data;
    } catch (error) {
        console.error('获取K线数据时发生错误:', error.message);
        throw error;
    }
}

async function get24hTicker(symbol) {
    try {
        const response = await axios.get(BINANCE_TICKER_API_URL, {
            params: { symbol }
        });
        return response.data;
    } catch (error) {
        console.error('获取24小时行情数据时发生错误:', error.message);
        throw error;
    }
}

async function getFundingRate(symbol) {
    try {
        const response = await axios.get(BINANCE_FUNDING_RATE_API_URL, {
            params: { symbol }
        });
        return parseFloat(response.data.lastFundingRate) * 100;
    } catch (error) {
        console.error('获取资金费率时发生错误:', error.message);
        throw error;
    }
}

async function getFundingRate(symbol) {
    try {
        const response = await axios.get(BINANCE_FUNDING_RATE_API_URL, {
            params: { symbol }
        });
        return parseFloat(response.data.lastFundingRate) * 100;
    } catch (error) {
        console.error('获取资金费率时发生错误:', error.message);
        throw error;
    }
}

async function getLongShortRatio(symbol, period = '5m', limit = 1) {
    try {
        const response = await axios.get(BINANCE_LONG_SHORT_RATIO_URL, {
            params: { symbol, period, limit }
        });
        return response.data && response.data.length > 0 ? parseFloat(response.data[0].longShortRatio) : 1.0;
    } catch (error) {
        console.error('获取多空持仓人数比时发生错误:', error.message);
        // 返回默认值，避免脚本中断
        return 1.0;
    }
}

async function getTakerVolume(symbol, period = '5m', limit = 1) {
    try {
        const response = await axios.get(BINANCE_TAKER_VOL_URL, {
            params: { symbol, period, limit }
        });
        if (!response.data || response.data.length === 0) {
            return { buySellRatio: 1.0, buyVolume: 0, sellVolume: 0 };
        }
        const latest = response.data[0];
        return {
            buySellRatio: parseFloat(latest.buySellRatio),
            buyVolume: parseFloat(latest.buyVol || 0),
            sellVolume: parseFloat(latest.sellVol || 0),
        };
    } catch (error) {
        console.error('获取主动买卖量时发生错误:', error.message);
        // 返回默认值，避免脚本中断
        return { buySellRatio: 1.0, buyVolume: 0, sellVolume: 0 };
    }
}

module.exports = {
    getKlines,
    get24hTicker,
    getFundingRate,
    getLongShortRatio,
    getTakerVolume
};