// utils.js
// 包含通用的辅助函数

// 手动计算枢轴点 (Pivot Points)
function calculatePivotPoints(high, low, close) {
    const pp = (high + low + close) / 3;
    const r1 = 2 * pp - low;
    const s1 = 2 * pp - high;
    const r2 = pp + (high - low);
    const s2 = pp - (high - low);
    const r3 = r1 + (high - low);
    const s3 = s1 - (high - low);
    return { pp, r1, s1, r2, s2, r3, s3 };
}

// 斐波那契回调位计算
function calculateFibonacciLevels0(klines) {
    const highs = klines.map(k => parseFloat(k[2]));
    const lows = klines.map(k => parseFloat(k[3]));
    const recentHigh = Math.max(...highs);
    const recentLow = Math.min(...lows);
    const lastClose = parseFloat(klines[klines.length - 1][4]);
    const prevClose = parseFloat(klines[klines.length - 2][4]);
    const isUptrend = lastClose > prevClose;

    let diff;
    let base;
    let fibLevels = {};

    if (isUptrend) {
        diff = recentHigh - recentLow;
        base = recentLow;
        fibLevels = {
            '23.6%': base + (diff * 0.236),
            '38.2%': base + (diff * 0.382),
            '50%': base + (diff * 0.5),
            '61.8%': base + (diff * 0.618),
            '78.6%': base + (diff * 0.786),
        };
    } else {
        diff = recentHigh - recentLow;
        base = recentHigh;
        fibLevels = {
            '23.6%': base - (diff * 0.236),
            '38.2%': base - (diff * 0.382),
            '50%': base - (diff * 0.5),
            '61.8%': base - (diff * 0.618),
            '78.6%': base - (diff * 0.786),
        };
    }

    return fibLevels;
}

function calculateFibonacciLevels(klines) {
    const closes = klines.map(k => parseFloat(k[4]));
    const highs = klines.map(k => parseFloat(k[2]));
    const lows = klines.map(k => parseFloat(k[3]));

    // 找最近趋势转折点（从上涨到下跌）
    let trendHigh = highs[highs.length - 1];
    let trendLow = lows[lows.length - 1];
    let i = closes.length - 2;

    while (i > 10) {
        if (closes[i] > closes[i-1] && closes[i+1] < closes[i]) {
            trendHigh = highs[i];
            trendLow = Math.min(...lows.slice(i));
            break;
        }
        i--;
    }

    const diff = trendHigh - trendLow;
    const base = trendHigh; // 下跌趋势，从高点向下

    return {
        '23.6%': base - diff * 0.236,
        '38.2%': base - diff * 0.382,
        '50%': base - diff * 0.5,
        '61.8%': base - diff * 0.618,
        '78.6%': base - diff * 0.786,
    };
}

function calculateDynamicLevels(klines, boll, fibLevels, currentPrice, highPrices, lowPrices, volumes) {
    const closes = klines.map(k => parseFloat(k[4]));
    const recentCloses = closes.slice(-30); // 最近 2.5 小时（5m）

    // === 1. 实时摆动点（最近20根，1.5小时内）===
    const recentHighs = highPrices.slice(-20);
    const recentLows = lowPrices.slice(-20);
    const realTimeHigh = Math.max(...recentHighs);
    const realTimeLow = Math.min(...recentLows);

    // === 2. 放量低点（更可信）===
    const technicalindicators = require('technicalindicators');
    const volSMA = technicalindicators.SMA.calculate({ period: 10, values: volumes.slice(-20) }).pop();
    let volumeLow = currentPrice;
    for (let i = klines.length - 20; i < klines.length; i++) {
        if (volumes[i] > volSMA * 1.3 && lowPrices[i] < volumeLow) {
            volumeLow = lowPrices[i];
        }
    }

    // === 3. 布林带动态边界 ===
    const bollSupport = boll.lower;
    const bollResistance = boll.upper;

    // === 4. 斐波那契动态判断（仅当在趋势内）===
    const fibSupport = fibLevels['78.6%'] || 0;
    const fibResistance = fibLevels['23.6%'] || Infinity;

    // === 5. 关键：根据当前价格位置，动态选择支撑/压力 ===
    let support, resistance;

    if (currentPrice < realTimeLow * 1.003) {
        // 价格已破实时低点 → 进入空头加速，支撑下移
        support = Math.max(volumeLow, bollSupport * 0.99);
        resistance = Math.min(realTimeHigh, bollResistance);
        console.log(`警告：价格破位实时低点 ${realTimeLow.toFixed(2)}，支撑下移至 ${support.toFixed(2)}`);
    } else {
        // 价格仍在区间内 → 正常支撑
        const supportCandidates = [realTimeLow, volumeLow, bollSupport, fibSupport]
            .filter(v => v < currentPrice * 1.01); // 过滤无效高位
        support = supportCandidates.length > 0 ? Math.max(...supportCandidates) : realTimeLow;

        const resistanceCandidates = [realTimeHigh, bollResistance, fibResistance]
            .filter(v => v > currentPrice * 0.99);
        resistance = resistanceCandidates.length > 0 ? Math.min(...resistanceCandidates) : realTimeHigh;
    }

    return { support, resistance, realTimeLow, realTimeHigh };
}

function findSwingPoints(highs, lows, length = 20) {
    const recentHighs = highs.slice(-length);
    const recentLows = lows.slice(-length);
    const swingHigh = Math.max(...recentHighs);
    const swingLow = Math.min(...recentLows);
    return { swingHigh, swingLow };
}

module.exports = {
    calculatePivotPoints,
    calculateFibonacciLevels,
    calculateDynamicLevels,
    findSwingPoints
};