// strategyConfig.js
// 策略参数配置，便于调整无需修改代码

module.exports = {
    // 超买超卖阈值
    overboughtThresholds: {
        rsi6: 75,
        rsi14: 70,
        kdjJ: 90,
        bollUpper: 1.0, // 价格突破布林上轨
        rsiSevere: 85,
        rsi14Severe: 75
    },
    oversoldThresholds: {
        rsi6: 25,
        rsi14: 30,
        kdjJ: 10,
        bollLower: 0.0, // 价格跌破布林下轨
        rsiSevere: 15,
        rsi14Severe: 25
    },
    
    // 信号评分权重
    signalWeights: {
        ma: 2.0,
        macd: 2.0,
        rsi: 1.0,
        kdj: 1.0,
        volume: 1.0,
        candlePattern: 1.0,
        reversalPattern: 1.0,
        fundingRate: 1.0,
        longShortRatio: 1.0,
        takerVolume: 1.5
    },
    
    // 趋势强度因子
    trendStrength: {
        strongAdx: 25,
        strongFactor: 1.2,
        weakFactor: 0.8
    },
    
    // 多空持仓人数比阈值
    longShortRatioThresholds: {
        overOptimistic: 1.5,  // 过于乐观，看跌
        overPessimistic: 0.7, // 过于悲观，看涨
        neutralRange: [0.7, 1.5] // 中性区间
    },
    
    // 主动买卖量阈值
    takerVolumeThresholds: {
        strongBuy: 1.2,  // 买入力量强劲
        strongSell: 0.8, // 卖出力量强劲
        neutralRange: [0.8, 1.2] // 中性区间
    },
    
    // 资金费率阈值
    fundingRateThresholds: {
        highPositive: 0.01,   // 正值过高，看跌
        highNegative: -0.01,  // 负值过高，看涨
        neutralRange: [-0.01, 0.01] // 中性区间
    },
    
    // 交易策略参数
    tradingStrategy: {
        stopLossPercent: 0.03,      // 止损百分比
        minRiskRewardRatio: 1.5,    // 最小盈亏比
        atrStopMultiplier: 0.5,     // ATR止损乘数
        supportResistanceBuffer: 0.015, // 支撑阻力缓冲百分比
        maxTargets: 3               // 最大目标数量
    },
    
    // 多时间框架分析配置
    multiTimeframe: {
        // 主时间框架对应的更高时间框架
        higherTimeframes: {
            '1m': '5m',
            '3m': '15m',
            '5m': '15m',
            '15m': '1h',
            '30m': '4h',
            '1h': '4h',
            '2h': '1d',
            '4h': '1d',
            '6h': '1d',
            '8h': '1d',
            '12h': '1d',
            '1d': '1w'
        },
        // 短线操作建议的时间框架组合
        shortTermCombinations: {
            '1m': ['5m', '15m'],
            '5m': ['15m', '1h'],
            '15m': ['1h', '4h'],
            '30m': ['1h', '4h'],
            '1h': ['4h', '1d']
        },
        // 趋势确认所需的时间框架一致性
        trendConfirmation: {
            requiredMatch: 2, // 需要多少个时间框架趋势一致
            weightHigherTF: 1.5 // 更高时间框架的权重
        }
    },
    
    // 成交量分析参数
    volumeAnalysis: {
        highVolumeMultiplier: 1.5,  // 高成交量倍数
        lowVolumeMultiplier: 0.5,   // 低成交量倍数
        volumeSMAPeriod: 20         // 成交量均线周期
    },
    
    // 报告输出配置
    reportConfig: {
        decimalPlaces: 6,
        includeRawData: false,
        verboseMode: true
    }
};