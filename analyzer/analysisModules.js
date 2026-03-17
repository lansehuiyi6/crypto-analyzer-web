// analysisModules.js
// 模块化的分析函数，从主文件中拆分出来

const technicalindicators = require('technicalindicators');
const { getKlines, get24hTicker, getFundingRate, getLongShortRatio, getTakerVolume } = require('./apiClient');
const { calculatePivotPoints, calculateFibonacciLevels, calculateDynamicLevels, findSwingPoints } = require('./utils');
const { analyzeCandle, analyzeReversalPatterns } = require('./candlePatterns');
const config = require('./strategyConfig');

/**
 * 获取市场数据（并行方式）
 */
async function fetchMarketData(symbol, interval) {
    try {
        const [klines, tickerData, fundingRate, longShortRatio, takerVolume] = await Promise.all([
            getKlines(symbol, interval),
            get24hTicker(symbol),
            getFundingRate(symbol),
            getLongShortRatio(symbol, interval),
            getTakerVolume(symbol, interval)
        ]);
        
        return {
            klines,
            tickerData,
            fundingRate,
            longShortRatio,
            takerVolume,
            success: true
        };
    } catch (error) {
        console.error('获取市场数据时发生错误:', error.message);
        // 返回降级数据，避免脚本完全失败
        return {
            klines: [],
            tickerData: { priceChangePercent: '0' },
            fundingRate: 0,
            longShortRatio: 1.0,
            takerVolume: { buySellRatio: 1.0, buyVolume: 0, sellVolume: 0 },
            success: false,
            error: error.message
        };
    }
}

/**
 * 计算技术指标
 */
function calculateIndicators(klines) {
    if (!klines || klines.length < 50) {
        throw new Error('K线数据不足，无法计算技术指标');
    }
    
    const closePrices = klines.map(kline => parseFloat(kline[4]));
    const openPrices = klines.map(kline => parseFloat(kline[1]));
    const highPrices = klines.map(kline => parseFloat(kline[2]));
    const lowPrices = klines.map(kline => parseFloat(kline[3]));
    const volumes = klines.map(kline => parseFloat(kline[5]));
    
    const latestKline = klines[klines.length - 1];
    const currentPrice = parseFloat(latestKline[4]);
    const latestVolume = volumes[volumes.length - 1];
    
    // 移动平均线
    const ma5 = technicalindicators.SMA.calculate({ period: 5, values: closePrices }).pop();
    const ma10 = technicalindicators.SMA.calculate({ period: 10, values: closePrices }).pop();
    const ma20 = technicalindicators.SMA.calculate({ period: 20, values: closePrices }).pop();
    
    // MACD
    const fullMacd = technicalindicators.MACD.calculate({ 
        values: closePrices, 
        fastPeriod: 12, 
        slowPeriod: 26, 
        signalPeriod: 9, 
        SimpleMA: false 
    });
    const macd = fullMacd.pop();
    
    // 布林带
    const boll = technicalindicators.BollingerBands.calculate({ 
        period: 20, 
        values: closePrices, 
        stdDev: 2 
    }).pop();
    
    // RSI
    const rsi6 = technicalindicators.RSI.calculate({ period: 6, values: closePrices }).pop();
    const rsi14 = technicalindicators.RSI.calculate({ period: 14, values: closePrices }).pop();
    
    // KDJ
    const kdj = technicalindicators.Stochastic.calculate({ 
        high: highPrices, 
        low: lowPrices, 
        close: closePrices, 
        period: 14, 
        signalPeriod: 3 
    }).pop();
    kdj.j = 3 * kdj.k - 2 * kdj.d;
    
    // ADX（趋势强度）
    const adx = technicalindicators.ADX.calculate({ 
        high: highPrices, 
        low: lowPrices, 
        close: closePrices, 
        period: 14 
    }).pop();
    
    // ATR（平均真实波幅）
    const atrInput = { high: highPrices, low: lowPrices, close: closePrices, period: 14 };
    const atrValue = technicalindicators.ATR.calculate(atrInput);
    const atr = atrValue[atrValue.length - 1] || 0;
    
    // 成交量均线
    const volumeSMA = technicalindicators.SMA.calculate({ 
        period: config.volumeAnalysis.volumeSMAPeriod, 
        values: volumes 
    }).pop();
    
    // 最新价格变化
    const latestPriceChange = closePrices[closePrices.length - 1] - closePrices[closePrices.length - 2];
    
    return {
        currentPrice,
        latestVolume,
        ma5, ma10, ma20,
        macd,
        boll,
        rsi6, rsi14,
        kdj,
        adx,
        atr,
        volumeSMA,
        latestPriceChange,
        closePrices,
        openPrices,
        highPrices,
        lowPrices,
        volumes
    };
}

/**
 * 分析趋势和支撑阻力位
 */
async function analyzeTrendAndLevels(symbol, interval, klines, indicators) {
    const { currentPrice, boll } = indicators;
    
    // 获取更高时间框架数据用于枢轴点计算
    const pivotInterval = getPivotInterval(interval);
    const dailyKlines = await getKlines(symbol, pivotInterval, 2);
    
    if (!dailyKlines || dailyKlines.length < 2) {
        throw new Error('无法获取更高时间框架数据用于枢轴点计算');
    }
    
    const prevDaily = dailyKlines[0];
    const pp = calculatePivotPoints(
        parseFloat(prevDaily[2]), 
        parseFloat(prevDaily[3]), 
        parseFloat(prevDaily[4])
    );
    
    const fibLevels = calculateFibonacciLevels(klines);
    
    const { swingHigh, swingLow } = findSwingPoints(
        indicators.highPrices, 
        indicators.lowPrices, 
        60
    );
    
    const dynamicResult = calculateDynamicLevels(
        klines, 
        boll, 
        fibLevels, 
        currentPrice, 
        indicators.highPrices, 
        indicators.lowPrices, 
        indicators.volumes
    );
    
    // 判断趋势
    let trend = '震荡';
    if (indicators.ma5 < indicators.ma10 && indicators.ma10 < indicators.ma20) {
        trend = '震荡偏空';
    } else if (indicators.ma5 > indicators.ma10 && indicators.ma10 > indicators.ma20) {
        trend = '震荡偏多';
    }
    
    return {
        pivotPoints: pp,
        fibonacciLevels: fibLevels,
        swingPoints: { swingHigh, swingLow },
        dynamicLevels: dynamicResult,
        trend,
        support1: pp.s1,
        support2: pp.s2,
        resistance1: pp.r1,
        resistance2: pp.r2
    };
}

/**
 * 生成交易信号
 */
function generateSignals(indicators, marketData, trendData) {
    const { adx } = indicators;
    const { fundingRate, longShortRatio, takerVolume } = marketData;
    
    const trendStrengthFactor = adx.adx > config.trendStrength.strongAdx 
        ? config.trendStrength.strongFactor 
        : config.trendStrength.weakFactor;
    
    let signalScore = 0;
    let signals = [];
    
    // 均线信号
    if (indicators.ma5 > indicators.ma10 && indicators.ma10 > indicators.ma20) {
        signalScore += config.signalWeights.ma * trendStrengthFactor;
        signals.push('均线系统呈多头排列，看涨。');
    } else if (indicators.ma5 < indicators.ma10 && indicators.ma10 < indicators.ma20) {
        signalScore -= config.signalWeights.ma * trendStrengthFactor;
        signals.push('均线系统呈空头排列，看跌。');
    } else {
        signals.push('均线系统纠缠，方向不明。');
    }
    
    // MACD信号
    if (indicators.macd.MACD > indicators.macd.signal && indicators.macd.histogram > 0) {
        signalScore += config.signalWeights.macd * trendStrengthFactor;
        signals.push('MACD金叉，柱状体上扬，看涨。');
    } else if (indicators.macd.MACD < indicators.macd.signal && indicators.macd.histogram < 0) {
        signalScore -= config.signalWeights.macd * trendStrengthFactor;
        signals.push('MACD死叉，柱状体下扬，看跌。');
    } else {
        signals.push('MACD信号不明确。');
    }
    
    // RSI和KDJ信号
    if (indicators.rsi6 < config.oversoldThresholds.rsi6) {
        signalScore += config.signalWeights.rsi * trendStrengthFactor;
        signals.push('RSI进入超卖区，存在反弹需求。');
    }
    if (indicators.kdj.k < 20 && indicators.kdj.d < 20) {
        signalScore += config.signalWeights.kdj * trendStrengthFactor;
        signals.push('KDJ超卖，潜在金叉信号。');
    }
    if (indicators.rsi6 > config.overboughtThresholds.rsi6) {
        signalScore -= config.signalWeights.rsi * trendStrengthFactor;
        signals.push('RSI进入超买区，存在回调风险。');
    }
    if (indicators.kdj.k > 80 && indicators.kdj.d > 80) {
        signalScore -= config.signalWeights.kdj * trendStrengthFactor;
        signals.push('KDJ超买，潜在死叉信号。');
    }
    
    // K线形态信号
    const candleAnalysis = analyzeCandle(
        indicators.openPrices[indicators.openPrices.length - 1],
        indicators.closePrices[indicators.closePrices.length - 1],
        indicators.highPrices[indicators.highPrices.length - 1],
        indicators.lowPrices[indicators.lowPrices.length - 1]
    );
    signalScore += candleAnalysis.score * trendStrengthFactor;
    signals.push(`K线形态分析：${candleAnalysis.text}`);
    
    // 反转形态信号
    const reversalAnalysis = analyzeReversalPatterns({
        open: indicators.openPrices.slice(-10),
        high: indicators.highPrices.slice(-10),
        low: indicators.lowPrices.slice(-10),
        close: indicators.closePrices.slice(-10)
    });
    signalScore += reversalAnalysis.score * trendStrengthFactor;
    if (reversalAnalysis.signals.length > 0) {
        signals.push(`识别出反转形态：${reversalAnalysis.signals.join('、')}`);
    } else {
        signals.push('未识别出明显反转形态。');
    }
    
    // 成交量信号
    if (indicators.latestVolume > indicators.volumeSMA * config.volumeAnalysis.highVolumeMultiplier) {
        if (indicators.latestPriceChange > 0) {
            signalScore += config.signalWeights.volume * trendStrengthFactor;
            signals.push('放量上涨，确认多头信号。');
        } else {
            signalScore -= config.signalWeights.volume * trendStrengthFactor;
            signals.push('放量下跌，确认空头信号。');
        }
    }
    
    // 资金费率信号
    if (fundingRate > config.fundingRateThresholds.highPositive) {
        signalScore -= config.signalWeights.fundingRate;
        signals.push('资金费率正值过高，多头付费，存在空头机会。');
    } else if (fundingRate < config.fundingRateThresholds.highNegative) {
        signalScore += config.signalWeights.fundingRate;
        signals.push('资金费率负值过高，空头付费，存在多头机会。');
    } else {
        signals.push('资金费率中性，无极端多空情绪。');
    }
    
    // 多空持仓人数比信号
    if (longShortRatio > config.longShortRatioThresholds.overOptimistic) {
        signalScore -= config.signalWeights.longShortRatio * trendStrengthFactor;
        signals.push(`多空持仓人数比（${longShortRatio.toFixed(2)}）过高，表明散户情绪可能过于乐观，需警惕回调风险。`);
    } else if (longShortRatio < config.longShortRatioThresholds.overPessimistic) {
        signalScore += config.signalWeights.longShortRatio * trendStrengthFactor;
        signals.push(`多空持仓人数比（${longShortRatio.toFixed(2)}）过低，表明散户情绪可能过于悲观，存在超跌反弹可能。`);
    } else {
        signals.push(`多空持仓人数比（${longShortRatio.toFixed(2)}）处于相对均衡状态。`);
    }
    
    // 主动买卖量信号
    if (takerVolume.buySellRatio > config.takerVolumeThresholds.strongBuy) {
        signalScore += config.signalWeights.takerVolume * trendStrengthFactor;
        signals.push(`主动买入量（${takerVolume.buyVolume.toFixed(2)}）显著大于主动卖出量（${takerVolume.sellVolume.toFixed(2)}），表明买方力量强劲。`);
    } else if (takerVolume.buySellRatio < config.takerVolumeThresholds.strongSell) {
        signalScore -= config.signalWeights.takerVolume * trendStrengthFactor;
        signals.push(`主动卖出量（${takerVolume.sellVolume.toFixed(2)}）显著大于主动买入量（${takerVolume.buyVolume.toFixed(2)}），表明卖方力量强劲。`);
    } else {
        signals.push(`主动买卖量相对均衡（比例 ${takerVolume.buySellRatio.toFixed(2)}）。`);
    }
    
    return { signalScore, signals, trendStrengthFactor };
}

/**
 * 多时间框架分析
 */
async function analyzeMultiTimeframe(symbol, mainInterval) {
    const timeframes = config.multiTimeframe.shortTermCombinations[mainInterval];
    if (!timeframes) {
        return { success: false, message: `不支持的时间框架: ${mainInterval}` };
    }
    
    const analysisResults = [];
    
    try {
        // 并行分析所有相关时间框架
        const promises = timeframes.map(async (tf) => {
            try {
                const klines = await getKlines(symbol, tf, 100);
                if (!klines || klines.length < 20) return null;
                
                const closePrices = klines.map(k => parseFloat(k[4]));
                const ma20 = technicalindicators.SMA.calculate({ period: 20, values: closePrices }).pop();
                const currentPrice = parseFloat(klines[klines.length - 1][4]);
                
                // 简单趋势判断
                let trend = '震荡';
                if (currentPrice > ma20 * 1.02) trend = '偏多';
                else if (currentPrice < ma20 * 0.98) trend = '偏空';
                
                return {
                    timeframe: tf,
                    trend,
                    price: currentPrice,
                    ma20: ma20,
                    priceVsMA: ((currentPrice - ma20) / ma20 * 100).toFixed(2) + '%'
                };
            } catch (error) {
                console.error(`分析时间框架 ${tf} 时出错:`, error.message);
                return null;
            }
        });
        
        const results = await Promise.all(promises);
        const validResults = results.filter(r => r !== null);
        
        // 分析时间框架一致性
        let bullishCount = 0;
        let bearishCount = 0;
        let neutralCount = 0;
        
        validResults.forEach(result => {
            if (result.trend === '偏多') bullishCount++;
            else if (result.trend === '偏空') bearishCount++;
            else neutralCount++;
        });
        
        let overallTrend = '震荡';
        if (bullishCount >= config.multiTimeframe.trendConfirmation.requiredMatch) {
            overallTrend = '多头';
        } else if (bearishCount >= config.multiTimeframe.trendConfirmation.requiredMatch) {
            overallTrend = '空头';
        }
        
        // 生成短线操作建议
        let shortTermAdvice = '';
        if (overallTrend === '多头') {
            shortTermAdvice = '各时间框架趋势一致看多，适合逢低做多，关注小级别回调入场机会。';
        } else if (overallTrend === '空头') {
            shortTermAdvice = '各时间框架趋势一致看空，适合逢高做空，关注小级别反弹入场机会。';
        } else {
            shortTermAdvice = '时间框架趋势不一致，市场处于震荡或转换阶段，建议观望或区间操作。';
        }
        
        return {
            success: true,
            timeframes: validResults,
            overallTrend,
            bullishCount,
            bearishCount,
            neutralCount,
            shortTermAdvice,
            consistency: validResults.length >= 2 ? '高' : '低'
        };
        
    } catch (error) {
        console.error('多时间框架分析失败:', error.message);
        return { success: false, error: error.message };
    }
}

/**
 * 生成交易策略
 */
function generateTradingStrategy(direction, currentPrice, trendData, indicators, multiTimeframeAnalysis) {
    const { dynamicLevels, support1, resistance1, support2, resistance2, pivotPoints } = trendData;
    const { atr, ma10 } = indicators;
    
    const isOverbought = indicators.rsi6 > config.overboughtThresholds.rsi6 || 
                        indicators.kdj.j > config.overboughtThresholds.kdjJ || 
                        currentPrice > indicators.boll.upper;
    
    const isOversold = indicators.rsi6 < config.oversoldThresholds.rsi6 || 
                      indicators.kdj.j < config.oversoldThresholds.kdjJ || 
                      currentPrice < indicators.boll.lower;
    
    // 过滤支撑阻力位
    const combinedSupport = [dynamicLevels.support, support2, support1]
        .filter(v => v > 0 && v < currentPrice * 1.001)
        .sort((a, b) => b - a);
    
    const combinedResistance = [dynamicLevels.resistance, resistance1, resistance2]
        .filter(v => v < Infinity && v > currentPrice * 0.999)
        .sort((a, b) => a - b);
    
    let strategy = {
        direction: direction,
        isOverbought,
        isOversold,
        entryPrice: currentPrice,
        stopLoss: 0,
        targets: [],
        riskRewardRatios: [],
        advice: ''
    };
    
    if (direction.includes('看涨') || direction.includes('震荡偏多')) {
        strategy.entryPrice = isOverbought ? (combinedSupport[0] || ma10) : currentPrice;
        
        const { stopLoss, targets } = generateTargets(
            strategy.entryPrice, 
            dynamicLevels.support, 
            dynamicLevels.resistance, 
            pivotPoints, 
            atr, 
            direction
        );
        
        strategy.stopLoss = stopLoss;
        strategy.targets = targets;
        strategy.riskRewardRatios = calculateRR(strategy.entryPrice, stopLoss, targets);
        
        strategy.advice = isOverbought 
            ? `⚠️ 当前处于超买区，【避免现价追高】。理想做多点位（回踩）：${strategy.entryPrice.toFixed(6)} USDT 附近（参考主要支撑或MA10）。`
            : `理想做多点位：${strategy.entryPrice.toFixed(6)} USDT 附近。`;
        
        strategy.advice += ` 激进策略：若价格快速回落至${(currentPrice - atr * 0.5).toFixed(6)}附近企稳可试多。`;
        
    } else if (direction.includes('看空') || direction.includes('震荡偏空')) {
        strategy.entryPrice = isOversold ? (combinedResistance[0] || ma10) : currentPrice;
        
        const { stopLoss, targets } = generateTargets(
            strategy.entryPrice, 
            dynamicLevels.support, 
            dynamicLevels.resistance, 
            pivotPoints, 
            atr, 
            direction
        );
        
        strategy.stopLoss = stopLoss;
        strategy.targets = targets;
        strategy.riskRewardRatios = calculateRR(strategy.entryPrice, stopLoss, targets);
        
        strategy.advice = isOversold
            ? `⚠️ 当前处于超卖区，【避免现价追空】。理想做空点位（反弹）：${strategy.entryPrice.toFixed(6)} USDT 附近（参考主要压力或MA10）。`
            : `理想做空点位：${strategy.entryPrice.toFixed(6)} USDT 附近。`;
        
        strategy.advice += ` 激进策略：若价格快速反弹至${(currentPrice + atr * 0.5).toFixed(6)}附近遇阻可试空。`;
        
    } else {
        // 震荡行情
        const entryLong = combinedSupport[0] || support1;
        const entryShort = combinedResistance[0] || resistance1;
        
        strategy.advice = `【震荡行情策略】\n`;
        strategy.advice += `多头：等待回调至 ${entryLong.toFixed(6)} 附近企稳入场\n`;
        strategy.advice += `空头：等待反弹至 ${entryShort.toFixed(6)} 附近遇阻入场`;
    }
    
    // 整合多时间框架分析建议
    if (multiTimeframeAnalysis && multiTimeframeAnalysis.success) {
        strategy.multiTimeframeAdvice = multiTimeframeAnalysis.shortTermAdvice;
    }
    
    return strategy;
}

/**
 * 生成目标价位
 */
function generateTargets(currentPrice, dynamicSupport, dynamicResistance, pp, atr, direction) {
    const isBearish = direction.includes('看空') || direction.includes('破位') || direction.includes('震荡偏空');
    
    const supports = [dynamicSupport, pp.s1, pp.s2, pp.s3 || 0]
        .concat([dynamicSupport - atr * 0.5, dynamicSupport - atr * 1.0, dynamicSupport - atr * 1.5])
        .filter(v => v > 0 && v < Infinity);
    
    const resistances = [dynamicResistance, pp.r1, pp.r2, pp.r3 || Infinity]
        .concat([dynamicResistance + atr * 0.5, dynamicResistance + atr * 1.0])
        .filter(v => v > 0 && v < Infinity);

    const uniqueSupports = [...new Set(supports)].sort((a, b) => a - b);
    const uniqueResistances = [...new Set(resistances)].sort((a, b) => a - b);

    let stopLoss, targets;

    if (isBearish) {
        stopLoss = uniqueResistances.find(r => r > currentPrice) || dynamicResistance + atr * 0.5;
        targets = uniqueSupports.filter(s => s < currentPrice);

        while (targets.length < config.tradingStrategy.maxTargets) {
            const last = targets.length > 0 ? targets[targets.length - 1] : currentPrice;
            targets.push(last - atr * (0.8 + targets.length * 0.2));
        }
        targets = targets.slice(0, config.tradingStrategy.maxTargets).sort((a, b) => b - a);
    } else {
        stopLoss = uniqueSupports.find(s => s < currentPrice) || dynamicSupport - atr * 0.5;
        targets = uniqueResistances.filter(r => r > currentPrice);

        while (targets.length < config.tradingStrategy.maxTargets) {
            const last = targets.length > 0 ? targets[targets.length - 1] : currentPrice;
            targets.push(last + atr * (0.8 + targets.length * 0.2));
        }
        targets = targets.slice(0, config.tradingStrategy.maxTargets).sort((a, b) => a - b);
    }

    if (isNaN(stopLoss) || stopLoss <= 0) {
        stopLoss = isBearish ? currentPrice * (1 + config.tradingStrategy.stopLossPercent) 
                            : currentPrice * (1 - config.tradingStrategy.stopLossPercent);
    }

    return { stopLoss, targets };
}

/**
 * 计算盈亏比
 */
function calculateRR(currentPrice, stopLoss, targets) {
    const risk = Math.abs(currentPrice - stopLoss);
    const isLong = stopLoss < currentPrice;

    return targets.map((target, i) => {
        const reward = Math.abs(target - currentPrice);
        const rewardPct = (reward / currentPrice) * 100;
        const rrRatio = reward / risk;
        const rr = rrRatio.toFixed(2);

        return {
            level: `目标${i + 1}`,
            price: currentPrice.toFixed(6),
            target: target.toFixed(6),
            rewardPct: isLong ? `+${rewardPct.toFixed(3)}%` : `-${rewardPct.toFixed(3)}%`,
            rr: `1:${rr}`,
            isGood: rrRatio >= config.tradingStrategy.minRiskRewardRatio
        };
    });
}

/**
 * 判断方向和理由
 */
function determineDirection(signalScore, indicators, reversalAnalysis) {
    const isKDJOverbought = indicators.kdj.k > 80 && indicators.kdj.d > 80;
    const hasBearishReversal = reversalAnalysis.signals.some(s => s.includes('看跌'));
    
    let direction, reasoning;
    
    if (signalScore >= 4 && !isKDJOverbought && !hasBearishReversal) {
        direction = '看涨（多头趋势强劲）';
        reasoning = '趋势强劲，技术指标多项看涨，但需警惕短期回调风险';
    } else if (signalScore >= 2) {
        if (isKDJOverbought || hasBearishReversal) {
            direction = '震荡（高位承压，警惕回调）';
            reasoning = '中期趋势向好，但短期指标严重超买或出现看跌反转形态，建议等待回调企稳后再介入。';
        } else {
            direction = '震荡偏多（短期存在反弹需求）';
            reasoning = '中期趋势向好，短期指标出现超买信号，需等待回调后介入';
        }
    } else if (signalScore <= -4) {
        direction = '看空（空头趋势强劲）';
        reasoning = '趋势疲软，技术指标多项看跌，但需警惕短期反弹风险';
    } else if (signalScore <= -2) {
        direction = '震荡偏空（短期承压，但未破关键支撑）';
        reasoning = '中期趋势向下，短期指标出现超卖信号，需等待反弹后介入';
    } else {
        direction = '震荡（多空双方胶着）';
        reasoning = '多空力量均衡，市场方向不明，需等待明确信号';
    }
    
    return { direction, reasoning };
}

/**
 * 获取枢轴点时间间隔
 */
function getPivotInterval(currentInterval) {
    return config.multiTimeframe.higherTimeframes[currentInterval] || '1d';
}

/**
 * 分析资金流向
 */
async function analyzeFundingFlow(symbol, interval = '15m') {
    try {
        const pivotKlines = await getKlines(symbol, getPivotInterval(interval), 2);
        if (!pivotKlines || pivotKlines.length < 2) {
            return { text: 'OI数据不足，无法进行资金流分析', signal: 0 };
        }

        const prev = pivotKlines[0];
        const curr = pivotKlines[1];

        const prevOI = parseFloat(prev[10]);
        const currOI = parseFloat(curr[10]);

        if (isNaN(prevOI) || isNaN(currOI) || prevOI === 0) {
            return { text: 'OI数据无效或持仓量为零，无法分析', signal: 0 };
        }

        const prevClose = parseFloat(prev[4]);
        const currClose = parseFloat(curr[4]);

        if (isNaN(prevClose) || isNaN(currClose)) {
            return { text: '价格数据无效，无法分析', signal: 0 };
        }

        const oiChange = currOI - prevOI;
        const oiChangePct = (oiChange / prevOI) * 100;
        const priceChangePct = ((currClose - prevClose) / prevClose) * 100;

        let text = '';
        let signal = 0;

        if (oiChangePct > 3 && priceChangePct > 1.0) {
            text = `资金大幅流入（OI +${oiChangePct.toFixed(2)}%），价格上涨（+${priceChangePct.toFixed(2)}%），多头力量强劲。`;
            signal = 1.8;
        } else if (oiChangePct > 3 && priceChangePct < -1.0) {
            text = `资金流入（OI +${oiChangePct.toFixed(2)}%），价格下跌（-${priceChangePct.toFixed(2)}%），空头控盘迹象。`;
            signal = -1.8;
        } else if (oiChangePct < -3 && priceChangePct > 1.0) {
            text = `多头主动离场（OI -${Math.abs(oiChangePct).toFixed(2)}%），价格上涨，可能为逼空或止损盘。`;
            signal = 1.0;
        } else if (oiChangePct < -3 && priceChangePct < -1.0) {
            text = `空头主动离场（OI -${Math.abs(oiChangePct).toFixed(2)}%），价格下跌，可能为套牢盘或获利了结。`;
            signal = -1.0;
        } else if (oiChangePct > 1 && oiChangePct < 3) {
            text = `资金温和流入（OI +${oiChangePct.toFixed(2)}%），价格变动不大，观望。`;
            signal = 0.2;
        } else if (oiChangePct < -1 && oiChangePct > -3) {
            text = `资金温和流出（OI -${Math.abs(oiChangePct).toFixed(2)}%），价格变动不大，观望。`;
            signal = -0.2;
        } else {
            text = `持仓量变化中性 (OI ${oiChange > 0 ? '+' : ''}${oiChangePct.toFixed(2)}%)，价格${priceChangePct > 0 ? '上涨' : priceChangePct < 0 ? '下跌' : '持平'}（${priceChangePct.toFixed(2)}%），市场胶着。`;
            signal = 0;
        }

        return { text, signal, oiChangePct, priceChangePct };

    } catch (error) {
        console.error("Error analyzing funding flow:", error.message);
        return { text: 'OI分析失败，请检查API配置或数据格式', signal: 0 };
    }
}

module.exports = {
    fetchMarketData,
    calculateIndicators,
    analyzeTrendAndLevels,
    generateSignals,
    analyzeMultiTimeframe,
    generateTradingStrategy,
    determineDirection,
    getPivotInterval,
    analyzeFundingFlow,
    calculateRR,
    generateTargets
};