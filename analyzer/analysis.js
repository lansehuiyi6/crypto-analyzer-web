// analysis.js
// 主程序入口 - 重构为模块化版本

const { 
    fetchMarketData,
    calculateIndicators,
    analyzeTrendAndLevels,
    generateSignals,
    analyzeMultiTimeframe,
    generateTradingStrategy,
    determineDirection,
    analyzeFundingFlow
} = require('./analysisModules');

const { analyzeCandle, analyzeReversalPatterns } = require('./candlePatterns');
const config = require('./strategyConfig');

/**
 * 生成分析报告
 */
function generateReport(symbol, interval, marketData, indicators, trendData, 
                       signals, direction, reasoning, tradingStrategy, multiTimeframeAnalysis) {
    
    const { currentPrice, latestVolume, volumeSMA, latestPriceChange } = indicators;
    const { tickerData, fundingRate } = marketData;
    const { signalScore, signals: signalList } = signals;
    const { fibonacciLevels, dynamicLevels, support1, support2, resistance1, resistance2 } = trendData;
    
    const last24hChange = parseFloat(tickerData.priceChangePercent);
    
    // 过滤支撑阻力位
    const combinedSupport = [dynamicLevels.support, support2, support1]
        .filter(v => v > 0 && v < currentPrice * 1.001)
        .sort((a, b) => b - a);

    const combinedResistance = [dynamicLevels.resistance, resistance1, resistance2]
        .filter(v => v < Infinity && v > currentPrice * 0.999)
        .sort((a, b) => a - b);

    console.log(`
--- ${symbol} ${interval} 行情走势分析报告 ---
`);
    console.log(`根据实时行情数据`);
    console.log(`当前价格：${currentPrice.toFixed(config.reportConfig.decimalPlaces)} USDT`);
    console.log(`24小时涨跌：${last24hChange >= 0 ? '+' : ''}${last24hChange.toFixed(config.reportConfig.decimalPlaces)}%`);
    console.log(`主要支撑位：${combinedSupport.map(s => s.toFixed(config.reportConfig.decimalPlaces) + ' USDT').join('、')}`);
    console.log(`主要压力位：${combinedResistance.map(r => r.toFixed(config.reportConfig.decimalPlaces) + ' USDT').join('、')}`);
    
    console.log(`斐波那契回调位：`);
    const fibLevelsOrdered = Object.entries(fibonacciLevels).sort(([keyA], [keyB]) => parseFloat(keyA) - parseFloat(keyB));
    fibLevelsOrdered.forEach(([level, value]) => {
        console.log(`  - ${level} 回调位：${value.toFixed(config.reportConfig.decimalPlaces)} USDT`);
    });
    
    // 当前趋势
    let trendDescription = '';
    if (trendData.trend.includes('偏多')) trendDescription = '明确上升（短期加速冲高，但已接近关键阻力区）';
    else if (trendData.trend.includes('偏空')) trendDescription = '明确下降（短期加速下跌，但已接近关键支撑区）';
    else trendDescription = '震荡（多空双方胶着）';
    console.log(`当前趋势：${trendDescription}（ADX: ${indicators.adx.adx.toFixed(config.reportConfig.decimalPlaces)}, 趋势强度: ${indicators.adx.adx > config.trendStrength.strongAdx ? '强' : '弱'}）`);

    console.log(`
--- 详细解释 ---`);
    console.log(`技术指标综合：`);
    
    // MA Description
    let maDescription = '';
    if (indicators.ma5 > indicators.ma10 && indicators.ma10 > indicators.ma20) {
        maDescription = `MA5（${indicators.ma5.toFixed(config.reportConfig.decimalPlaces)}）> MA10（${indicators.ma10.toFixed(config.reportConfig.decimalPlaces)}）> MA20（${indicators.ma20.toFixed(config.reportConfig.decimalPlaces)}），呈标准多头排列，显示中期上升趋势强劲。当前价格（${currentPrice.toFixed(config.reportConfig.decimalPlaces)}）已大幅高于MA5（${indicators.ma5.toFixed(config.reportConfig.decimalPlaces)}），短期偏离均线较远，存在技术性回调或盘整需求。`;
    } else if (indicators.ma5 < indicators.ma10 && indicators.ma10 < indicators.ma20) {
        maDescription = `MA5（${indicators.ma5.toFixed(config.reportConfig.decimalPlaces)}）< MA10（${indicators.ma10.toFixed(config.reportConfig.decimalPlaces)}）< MA20（${indicators.ma20.toFixed(config.reportConfig.decimalPlaces)}），呈标准空头排列，显示中期下降趋势强劲。当前价格（${currentPrice.toFixed(config.reportConfig.decimalPlaces)}）已大幅低于MA5（${indicators.ma5.toFixed(config.reportConfig.decimalPlaces)}），短期偏离均线较远，存在技术性反弹或盘整需求。`;
    } else {
        maDescription = `均线系统（MA5=${indicators.ma5.toFixed(config.reportConfig.decimalPlaces)}, MA10=${indicators.ma10.toFixed(config.reportConfig.decimalPlaces)}, MA20=${indicators.ma20.toFixed(config.reportConfig.decimalPlaces)}）纠缠，趋势不明。`;
    }
    console.log(`均线系统：${maDescription}`);

    // MACD Description
    let macdSignalText = indicators.macd.MACD > indicators.macd.signal ? '金叉' : '死叉';
    let macdHistText = indicators.macd.histogram > 0 ? '正值' : '负值';
    let macdHistInterpretation = '';

    if (indicators.macd.MACD > indicators.macd.signal && indicators.macd.histogram > 0) {
        macdHistInterpretation = `多头动能增强，市场偏强。`;
    } else if (indicators.macd.MACD < indicators.macd.signal && indicators.macd.histogram < 0) {
        macdHistInterpretation = `空头动能增强，市场偏弱。`;
    } else if (indicators.macd.MACD > indicators.macd.signal && indicators.macd.histogram < 0) {
        macdHistInterpretation = `MACD金叉，但柱状线为负值并收敛，可能预示下跌动能衰竭，关注反弹。`;
    } else if (indicators.macd.MACD < indicators.macd.signal && indicators.macd.histogram > 0) {
        macdHistInterpretation = `MACD死叉，但柱状线为正值并收敛，可能预示上涨动能衰竭，关注回调。`;
    } else {
        macdHistInterpretation = `动能方向不明确，市场胶着。`;
    }
    
    console.log(`MACD：DIF（${indicators.macd.MACD.toFixed(config.reportConfig.decimalPlaces)}）${indicators.macd.MACD > indicators.macd.signal ? '>' : '<'} DEA（${indicators.macd.signal.toFixed(config.reportConfig.decimalPlaces)}），形成${macdSignalText}，柱状线（${indicators.macd.histogram.toFixed(config.reportConfig.decimalPlaces)}）为${macdHistText}。这表明${macdHistInterpretation}`);
    
    // BOLL Description
    let bollPosition = '';
    const bollBandwidth = indicators.boll.upper - indicators.boll.lower;
    const bandwidthPct = (bollBandwidth / indicators.boll.middle) * 100;
    let bandwidthInterpretation = '';

    if (bandwidthPct < 1.0) {
        bandwidthInterpretation = `布林带带宽（${bollBandwidth.toFixed(2)}，${bandwidthPct.toFixed(2)}%）极窄，市场处于低波动收敛状态，预示着即将出现大级别突破或选择方向。`;
    } else if (bandwidthPct > 3.0) {
        bandwidthInterpretation = `布林带带宽（${bollBandwidth.toFixed(2)}，${bandwidthPct.toFixed(2)}%）较宽，市场处于高波动扩张状态，趋势明确但可能面临回调。`;
    } else {
        bandwidthInterpretation = `布林带带宽（${bollBandwidth.toFixed(2)}，${bandwidthPct.toFixed(2)}%）中等，市场波动正常。`;
    }

    if (currentPrice > indicators.boll.upper) {
        bollPosition = `价格突破上轨（${indicators.boll.upper.toFixed(config.reportConfig.decimalPlaces)}），进入超买区域，%B指标为${((currentPrice - indicators.boll.lower) / bollBandwidth).toFixed(2)}（>1），显示价格已超出常态波动区间，短期超买风险较高。`;
    } else if (currentPrice < indicators.boll.lower) {
        bollPosition = `价格跌破下轨（${indicators.boll.lower.toFixed(config.reportConfig.decimalPlaces)}），进入超卖区域，%B指标为${((currentPrice - indicators.boll.lower) / bollBandwidth).toFixed(2)}（<0），显示价格已超出常态波动区间，短期超卖风险较高。`;
    } else {
        bollPosition = `价格位于中轨（${indicators.boll.middle.toFixed(config.reportConfig.decimalPlaces)}）${currentPrice > indicators.boll.middle ? '上方' : '下方'}。`;
    }
    console.log(`BOLL：${bollPosition} ${bandwidthInterpretation} 若价格回落至中轨附近，将是重要支撑测试位。`);
    
    // RSI Description
    let rsiDesc = '';
    let rsiAction = '';
    if (indicators.rsi6 > config.overboughtThresholds.rsiSevere || indicators.rsi14 > config.overboughtThresholds.rsi14Severe) { 
        rsiDesc = '严重超买'; 
        rsiAction = '回调风险极高，不建议追涨'; 
    }
    else if (indicators.rsi6 < config.oversoldThresholds.rsiSevere || indicators.rsi14 < config.oversoldThresholds.rsi14Severe) { 
        rsiDesc = '严重超卖'; 
        rsiAction = '反弹需求强烈，关注抄底机会'; 
    }
    else if (indicators.rsi6 > config.overboughtThresholds.rsi6 || indicators.rsi14 > config.overboughtThresholds.rsi14) { 
        rsiDesc = '超买'; 
        rsiAction = '回调压力增加，谨慎乐观'; 
    }
    else if (indicators.rsi6 < config.oversoldThresholds.rsi6 || indicators.rsi14 < config.oversoldThresholds.rsi14) { 
        rsiDesc = '超卖'; 
        rsiAction = '反弹动能积蓄，逢低关注'; 
    }
    else { 
        rsiDesc = '中性'; 
        rsiAction = '市场力量均衡，无明确方向'; 
    }
    
    console.log(`RSI：RSI6（${indicators.rsi6.toFixed(config.reportConfig.decimalPlaces)}）、RSI14（${indicators.rsi14.toFixed(config.reportConfig.decimalPlaces)}），均处于${rsiDesc}区域。这表明短期市场${rsiAction}。`);

    // KDJ Description
    let kdjDesc = '';
    if (indicators.kdj.j > 95) kdjDesc = '高位钝化，J值已达极限，卖盘动量可能随时衰竭';
    else if (indicators.kdj.j < 5) kdjDesc = '低位钝化，J值已达极限，买盘动量可能随时衰竭';
    else if (indicators.kdj.k > indicators.kdj.d) kdjDesc = '金叉运行中';
    else kdjDesc = '死叉运行中';
    console.log(`KDJ：K（${indicators.kdj.k.toFixed(config.reportConfig.decimalPlaces)}）、D（${indicators.kdj.d.toFixed(config.reportConfig.decimalPlaces)}）、J（${indicators.kdj.j.toFixed(config.reportConfig.decimalPlaces)}），${kdjDesc}，显示短期市场处于${indicators.kdj.j > 80 ? '超买' : indicators.kdj.j < 20 ? '超卖' : '平衡'}状态。`);
    
    console.log(`
资金与量价分析：`);
    
    // 资金费率
    console.log(`资金费率：${fundingRate.toFixed(config.reportConfig.decimalPlaces)}%（${fundingRate > config.fundingRateThresholds.highPositive ? '中性偏多' : fundingRate < config.fundingRateThresholds.highNegative ? '中性偏空' : '中性'}）`);

    // 成交量变化
    let volumeChangeDesc = '成交量变化：';
    if (latestVolume > volumeSMA * config.volumeAnalysis.highVolumeMultiplier && latestPriceChange > 0) {
        volumeChangeDesc += '放量上涨，确认多头信号。';
    } else if (latestVolume > volumeSMA * config.volumeAnalysis.highVolumeMultiplier && latestPriceChange < 0) {
        volumeChangeDesc += '放量下跌，确认空头信号。';
    } else if (latestVolume < volumeSMA * config.volumeAnalysis.lowVolumeMultiplier && latestPriceChange > 0) {
        volumeChangeDesc += '缩量上涨，多头动能不足，可能面临回调。';
    } else if (latestVolume < volumeSMA * config.volumeAnalysis.lowVolumeMultiplier && latestPriceChange < 0) {
        volumeChangeDesc += '缩量下跌，空头动能减弱，可能存在反弹。';
    } else if (latestPriceChange > 0 && latestVolume < volumeSMA) {
        volumeChangeDesc += '近期出现缩量反弹，多头动能减弱，反弹力度可能有限。';
    } else if (latestPriceChange < 0 && latestVolume < volumeSMA) {
        volumeChangeDesc += '近期出现缩量下跌，空头动能有所衰竭，可能止跌。';
    } else {
        volumeChangeDesc += `当前成交量（${latestVolume.toFixed(config.reportConfig.decimalPlaces)}）与${config.volumeAnalysis.volumeSMAPeriod}周期均量（${volumeSMA.toFixed(config.reportConfig.decimalPlaces)}）相当。`;
    }
    console.log(volumeChangeDesc);
    
    // K线形态
    const candleAnalysis = analyzeCandle(
        indicators.openPrices[indicators.openPrices.length - 1],
        indicators.closePrices[indicators.closePrices.length - 1],
        indicators.highPrices[indicators.highPrices.length - 1],
        indicators.lowPrices[indicators.lowPrices.length - 1]
    );
    console.log(`K线形态：${candleAnalysis.text}`);

    // 多时间框架分析
    if (multiTimeframeAnalysis && multiTimeframeAnalysis.success) {
        console.log(`
多时间框架分析：`);
        console.log(`时间框架一致性：${multiTimeframeAnalysis.consistency}`);
        console.log(`整体趋势：${multiTimeframeAnalysis.overallTrend}`);
        console.log(`短线操作建议：${multiTimeframeAnalysis.shortTermAdvice}`);
        
        if (config.reportConfig.verboseMode) {
            console.log(`详细分析：`);
            multiTimeframeAnalysis.timeframes.forEach(tf => {
                console.log(`  ${tf.timeframe}: ${tf.trend} (价格: ${tf.price}, MA20: ${tf.ma20}, 偏离: ${tf.priceVsMA})`);
            });
        }
    }

    console.log(`
--- 分析结果 ---`);
    console.log(`综合信号评分：${signalScore.toFixed(config.reportConfig.decimalPlaces)}分`);
    console.log(`方向：${direction}`);
    console.log(`理由：${reasoning}。`);

    if (signalList.length > 0) {
        console.log(`关键信号：`);
        signalList.forEach(s => console.log(` - ${s}`));
    }

    console.log(`
--- 详细交易策略 ---`);
    console.log(tradingStrategy.advice);
    
    if (tradingStrategy.stopLoss > 0) {
        console.log(`止损位：${tradingStrategy.stopLoss.toFixed(config.reportConfig.decimalPlaces)} USDT（${tradingStrategy.direction.includes('看空') ? '高于' : '低于'}${tradingStrategy.direction.includes('看空') ? '阻力区上沿' : '支撑区下沿'}${config.tradingStrategy.stopLossPercent*100}%）。理由：ATR（${indicators.atr.toFixed(2)}）显示日内波动较大，止损需覆盖正常波动噪音。`);
    }
    
    if (tradingStrategy.riskRewardRatios.length > 0) {
        console.log(`目标价位：`);
        
        const goodRRTargets = tradingStrategy.riskRewardRatios.filter(item => item.isGood);
        const otherTargets = tradingStrategy.riskRewardRatios.filter(item => !item.isGood);

        if (goodRRTargets.length > 0) {
            console.log(`  符合盈亏比要求（>=1:${config.tradingStrategy.minRiskRewardRatio}）的目标：`);
            goodRRTargets.forEach((item, i) => {
                console.log(`    第${i+1}目标：${item.target} USDT（潜在收益 ${item.rewardPct.replace('+', '')}）→ 盈亏比 ${item.rr}。`);
            });
        }

        if (otherTargets.length > 0) {
            console.log(`  其他潜在目标（盈亏比 < 1:${config.tradingStrategy.minRiskRewardRatio}）：`);
            otherTargets.forEach((item, i) => {
                console.log(`    目标${i + 1}：${item.target} USDT（潜在收益 ${item.rewardPct.replace('+', '')}）→ 盈亏比 ${item.rr}。`);
            });
        }

        if (tradingStrategy.riskRewardRatios.length === 0) {
            console.log(`  未找到可行的交易目标。`);
        } else if (goodRRTargets.length === 0 && otherTargets.length > 0) {
            console.log(`  注意：当前所有潜在目标均未达到1:${config.tradingStrategy.minRiskRewardRatio}盈亏比要求。`);
        }

        const trendAdvice = tradingStrategy.direction.includes('看空') 
            ? `若放量跌破前低，可持仓看向更低支撑。请耐心等待价格反弹至理想阻力区间，并出现遇阻信号后再考虑入场。`
            : `若放量突破前高，可持仓看向更高阻力。请耐心等待价格回调至理想入场区间，并出现企稳信号后再考虑入场。`;
        
        console.log(`  提示：${trendAdvice}`);
    }
    
    // 整合多时间框架建议
    if (tradingStrategy.multiTimeframeAdvice) {
        console.log(`
多时间框架策略建议：`);
        console.log(`  ${tradingStrategy.multiTimeframeAdvice}`);
    }

    console.log(`
提示：本次分析仅供参考，不构成任何投资建议！`);
}

/**
 * 主分析函数
 */
async function runAnalysis() {
    const args = process.argv.slice(2);
    const symbol = args[0] ? args[0].toUpperCase() : 'BTCUSDT';
    const interval = args[1] || '15m';

    try {
        console.log(`正在从币安获取 ${symbol} 永续合约 ${interval} K线数据和资金费率...`);

        // 1. 并行获取市场数据
        const marketData = await fetchMarketData(symbol, interval);
        if (!marketData.success) {
            console.error('获取市场数据失败，请检查网络连接或API配置。');
            return;
        }

        // 2. 计算技术指标
        const indicators = calculateIndicators(marketData.klines);

        // 3. 分析趋势和支撑阻力位
        const trendData = await analyzeTrendAndLevels(symbol, interval, marketData.klines, indicators);

        // 4. 获取资金流向数据
        const flow = await analyzeFundingFlow(symbol, interval);
        
        // 5. 生成交易信号
        const signals = generateSignals(indicators, marketData, trendData);
        
        // 添加资金流向信号
        signals.signalScore += flow.signal;
        signals.signals.push(`资金流向：${flow.text}`);

        // 6. 分析反转形态（用于方向判断）
        const reversalAnalysis = analyzeReversalPatterns({
            open: indicators.openPrices.slice(-10),
            high: indicators.highPrices.slice(-10),
            low: indicators.lowPrices.slice(-10),
            close: indicators.closePrices.slice(-10)
        });

        // 7. 判断方向和理由
        const { direction, reasoning } = determineDirection(signals.signalScore, indicators, reversalAnalysis);

        // 8. 多时间框架分析
        const multiTimeframeAnalysis = await analyzeMultiTimeframe(symbol, interval);

        // 9. 生成交易策略
        const tradingStrategy = generateTradingStrategy(
            direction, 
            indicators.currentPrice, 
            trendData, 
            indicators, 
            multiTimeframeAnalysis
        );

        // 10. 生成并输出报告
        generateReport(
            symbol, 
            interval, 
            marketData, 
            indicators, 
            trendData, 
            signals, 
            direction, 
            reasoning, 
            tradingStrategy, 
            multiTimeframeAnalysis
        );

    } catch (error) {
        console.error('在执行脚本时发生错误:', error.message);
        console.error('错误堆栈:', error.stack);
        
        // 提供降级建议
        console.log(`
⚠️ 分析过程中出现错误，建议：
1. 检查网络连接
2. 验证API配置
3. 尝试稍后重试
4. 检查币安API服务状态`);
    }
}

// 运行分析
if (require.main === module) {
    runAnalysis();
}

module.exports = { runAnalysis };