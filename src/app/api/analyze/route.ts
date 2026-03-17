
// src/app/api/analyze/route.ts
import { NextResponse } from 'next/server';

const analysisModules = require('../../../../analyzer/analysisModules');
const strategyConfig = require('../../../../analyzer/strategyConfig');
const candlePatterns = require('../../../../analyzer/candlePatterns');

/**
 * 模拟原 analysis.js 中的 generateReport 逻辑，生成纯文本报告
 */
function generateTextReport(symbol: string, interval: string, marketData: any, indicators: any, trendData: any, 
                          signals: any, direction: string, reasoning: string, tradingStrategy: any, multiTimeframeAnalysis: any) {
    
    const { currentPrice, latestVolume, volumeSMA, latestPriceChange } = indicators;
    const { tickerData, fundingRate } = marketData;
    const { signalScore, signals: signalList } = signals;
    const { fibonacciLevels, dynamicLevels, support1, support2, resistance1, resistance2 } = trendData;
    
    const last24hChange = parseFloat(tickerData.priceChangePercent);
    const decimalPlaces = strategyConfig.reportConfig.decimalPlaces;
    
    const combinedSupport = [dynamicLevels.support, support2, support1]
        .filter((v: any) => v > 0 && v < currentPrice * 1.001)
        .sort((a: any, b: any) => b - a);

    const combinedResistance = [dynamicLevels.resistance, resistance1, resistance2]
        .filter((v: any) => v < Infinity && v > currentPrice * 0.999)
        .sort((a: any, b: any) => a - b);

    let output = `正在从币安获取 ${symbol} 永续合约 ${interval} K线数据和资金费率...\n`;
    
    // 模拟破位警告 (如果有逻辑的话)
    if (currentPrice < dynamicLevels.support) {
        output += `警告：价格破位实时低点 ${dynamicLevels.support.toFixed(decimalPlaces)}，支撑下移至 ${dynamicLevels.support.toFixed(decimalPlaces)}\n`;
    }

    output += `\n--- ${symbol} ${interval} 行情走势分析报告 ---\n\n`;
    output += `根据实时行情数据\n`;
    output += `当前价格：${currentPrice.toFixed(decimalPlaces)} USDT\n`;
    output += `24小时涨跌：${last24hChange >= 0 ? '+' : ''}${last24hChange.toFixed(decimalPlaces)}%\n`;
    output += `主要支撑位：${combinedSupport.map((s: any) => s.toFixed(decimalPlaces) + ' USDT').join('、')}\n`;
    output += `主要压力位：${combinedResistance.map((r: any) => r.toFixed(decimalPlaces) + ' USDT').join('、')}\n`;
    
    output += `斐波那契回调位：\n`;
    const fibLevelsOrdered = Object.entries(fibonacciLevels).sort(([keyA], [keyB]) => parseFloat(keyA) - parseFloat(keyB));
    fibLevelsOrdered.forEach(([level, value]: [string, any]) => {
        output += ` - ${level} 回调位：${value.toFixed(decimalPlaces)} USDT\n`;
    });
    
    let trendDescription = '';
    if (trendData.trend.includes('偏多')) trendDescription = '明确上升（短期加速冲高，但已接近关键阻力区）';
    else if (trendData.trend.includes('偏空')) trendDescription = '明确下降（短期加速下跌，但已接近关键支撑区）';
    else trendDescription = '震荡（多空双方胶着）';
    output += `当前趋势：${trendDescription}（ADX: ${indicators.adx.adx.toFixed(decimalPlaces)}, 趋势强度: ${indicators.adx.adx > strategyConfig.trendStrength.strongAdx ? '强' : '弱'}）\n`;

    output += `\n--- 详细解释 ---\n技术指标综合：\n`;
    
    // MA
    let maDescription = '';
    if (indicators.ma5 > indicators.ma10 && indicators.ma10 > indicators.ma20) {
        maDescription = `MA5（${indicators.ma5.toFixed(decimalPlaces)}）> MA10（${indicators.ma10.toFixed(decimalPlaces)}）> MA20（${indicators.ma20.toFixed(decimalPlaces)}），呈标准多头排列，显示中期上升趋势强劲。当前价格（${currentPrice.toFixed(decimalPlaces)}）已大幅高于MA5（${indicators.ma5.toFixed(decimalPlaces)}），短期偏离均线较远，存在技术性回调 or 盘整需求。`;
    } else if (indicators.ma5 < indicators.ma10 && indicators.ma10 < indicators.ma20) {
        maDescription = `MA5（${indicators.ma5.toFixed(decimalPlaces)}）< MA10（${indicators.ma10.toFixed(decimalPlaces)}）< MA20（${indicators.ma20.toFixed(decimalPlaces)}），呈标准空头排列，显示中期下降趋势强劲。当前价格（${currentPrice.toFixed(decimalPlaces)}）已大幅低于MA5（${indicators.ma5.toFixed(decimalPlaces)}），短期偏离均线较远，存在技术性反弹 or 盘整需求。`;
    } else {
        maDescription = `均线系统（MA5=${indicators.ma5.toFixed(decimalPlaces)}, MA10=${indicators.ma10.toFixed(decimalPlaces)}, MA20=${indicators.ma20.toFixed(decimalPlaces)}）纠缠，趋势不明。`;
    }
    output += `均线系统：${maDescription}\n`;

    // MACD
    let macdSignalText = indicators.macd.MACD > indicators.macd.signal ? '金叉' : '死叉';
    let macdHistText = indicators.macd.histogram > 0 ? '正值' : '负值';
    let macdHistInterpretation = '';
    if (indicators.macd.MACD > indicators.macd.signal && indicators.macd.histogram > 0) macdHistInterpretation = `多头动能增强，市场偏强。`;
    else if (indicators.macd.MACD < indicators.macd.signal && indicators.macd.histogram < 0) macdHistInterpretation = `空头动能增强，市场偏弱。`;
    else if (indicators.macd.MACD > indicators.macd.signal && indicators.macd.histogram < 0) macdHistInterpretation = `MACD金叉，但柱状线为负值并收敛，可能预示下跌动能衰竭，关注反弹。`;
    else if (indicators.macd.MACD < indicators.macd.signal && indicators.macd.histogram > 0) macdHistInterpretation = `MACD死叉，但柱状线为正值并收敛，可能预示上涨动能衰竭，关注回调。`;
    else macdHistInterpretation = `动能方向不明确，市场胶着。`;
    output += `MACD：DIF（${indicators.macd.MACD.toFixed(decimalPlaces)}）${indicators.macd.MACD > indicators.macd.signal ? '>' : '<'} DEA（${indicators.macd.signal.toFixed(decimalPlaces)}），形成${macdSignalText}，柱状线（${indicators.macd.histogram.toFixed(decimalPlaces)}）为${macdHistText}。这表明${macdHistInterpretation}\n`;
    
    // BOLL
    let bollPosition = '';
    const bollBandwidth = indicators.boll.upper - indicators.boll.lower;
    const bandwidthPct = (bollBandwidth / indicators.boll.middle) * 100;
    let bandwidthInterpretation = bandwidthPct < 1.0 ? `布林带带宽（${bollBandwidth.toFixed(2)}，${bandwidthPct.toFixed(2)}%）极窄，市场处于低波动收敛状态，预示着即将出现大级别突破或选择方向。` : (bandwidthPct > 3.0 ? `布林带带宽（${bollBandwidth.toFixed(2)}，${bandwidthPct.toFixed(2)}%）较宽，市场处于高波动扩张状态，趋势明确但可能面临回调。` : `布林带带宽（${bollBandwidth.toFixed(2)}，${bandwidthPct.toFixed(2)}%）中等，市场波动正常。`);
    if (currentPrice > indicators.boll.upper) bollPosition = `价格突破上轨（${indicators.boll.upper.toFixed(decimalPlaces)}），进入超买区域，%B指标为${((currentPrice - indicators.boll.lower) / bollBandwidth).toFixed(2)}（>1），显示价格已超出常态波动区间，短期超买风险较高。`;
    else if (currentPrice < indicators.boll.lower) bollPosition = `价格跌破下轨（${indicators.boll.lower.toFixed(decimalPlaces)}），进入超卖区域，%B指标为${((currentPrice - indicators.boll.lower) / bollBandwidth).toFixed(2)}（<0），显示价格已超出常态波动区间，短期超卖风险较高。`;
    else bollPosition = `价格位于中轨（${indicators.boll.middle.toFixed(decimalPlaces)}）${currentPrice > indicators.boll.middle ? '上方' : '下方'}。`;
    output += `BOLL：${bollPosition} ${bandwidthInterpretation} 若价格回落至中轨附近，将是重要支撑测试位。\n`;
    
    // RSI
    let rsiDesc = '', rsiAction = '';
    if (indicators.rsi6 > strategyConfig.overboughtThresholds.rsiSevere || indicators.rsi14 > strategyConfig.overboughtThresholds.rsi14Severe) { rsiDesc = '严重超买'; rsiAction = '回调风险极高，不建议追涨'; }
    else if (indicators.rsi6 < strategyConfig.oversoldThresholds.rsiSevere || indicators.rsi14 < strategyConfig.oversoldThresholds.rsi14Severe) { rsiDesc = '严重超卖'; rsiAction = '反弹需求强烈，关注抄底机会'; }
    else if (indicators.rsi6 > strategyConfig.overboughtThresholds.rsi6 || indicators.rsi14 > strategyConfig.overboughtThresholds.rsi14) { rsiDesc = '超买'; rsiAction = '回调压力增加，谨慎乐观'; }
    else if (indicators.rsi6 < strategyConfig.oversoldThresholds.rsi6 || indicators.rsi14 < strategyConfig.oversoldThresholds.rsi14) { rsiDesc = '超卖'; rsiAction = '反弹动能积蓄，逢低关注'; }
    else { rsiDesc = '中性'; rsiAction = '市场力量均衡，无明确方向'; }
    output += `RSI：RSI6（${indicators.rsi6.toFixed(decimalPlaces)}）、RSI14（${indicators.rsi14.toFixed(decimalPlaces)}），均处于${rsiDesc}区域。这表明短期市场${rsiAction}。\n`;

    // KDJ
    let kdjDesc = indicators.kdj.j > 95 ? '高位钝化，J值已达极限，卖盘动量可能随时衰竭' : (indicators.kdj.j < 5 ? '低位钝化，J值已达极限，买盘动量可能随时衰竭' : (indicators.kdj.k > indicators.kdj.d ? '金叉运行中' : '死叉运行中'));
    output += `KDJ：K（${indicators.kdj.k.toFixed(decimalPlaces)}）、D（${indicators.kdj.d.toFixed(decimalPlaces)}）、J（${indicators.kdj.j.toFixed(decimalPlaces)}），${kdjDesc}，显示短期市场处于${indicators.kdj.j > 80 ? '超买' : indicators.kdj.j < 20 ? '超卖' : '平衡'}状态。\n`;
    
    output += `\n资金与量价分析：\n`;
    output += `资金费率：${fundingRate.toFixed(decimalPlaces)}%（${fundingRate > strategyConfig.fundingRateThresholds.highPositive ? '中性偏多' : fundingRate < strategyConfig.fundingRateThresholds.highNegative ? '中性偏空' : '中性'}）\n`;
    
    let volumeChangeDesc = '成交量变化：';
    if (latestVolume > volumeSMA * strategyConfig.volumeAnalysis.highVolumeMultiplier && latestPriceChange > 0) volumeChangeDesc += '放量上涨，确认多头信号。';
    else if (latestVolume > volumeSMA * strategyConfig.volumeAnalysis.highVolumeMultiplier && latestPriceChange < 0) volumeChangeDesc += '放量下跌，确认空头信号。';
    else if (latestVolume < volumeSMA * strategyConfig.volumeAnalysis.lowVolumeMultiplier && latestPriceChange > 0) volumeChangeDesc += '缩量上涨，多头动能不足，可能面临回调。';
    else if (latestVolume < volumeSMA * strategyConfig.volumeAnalysis.lowVolumeMultiplier && latestPriceChange < 0) volumeChangeDesc += '缩量下跌，空头动能减弱，可能存在反弹。';
    else if (latestPriceChange > 0 && latestVolume < volumeSMA) volumeChangeDesc += '近期出现缩量反弹，多头动能减弱，反弹力度可能有限。';
    else if (latestPriceChange < 0 && latestVolume < volumeSMA) volumeChangeDesc += '近期出现缩量下跌，空头动能有所衰竭，可能止跌。';
    else volumeChangeDesc += `当前成交量（${latestVolume.toFixed(decimalPlaces)}）与${strategyConfig.volumeAnalysis.volumeSMAPeriod}周期均量（${volumeSMA.toFixed(decimalPlaces)}）相当。`;
    output += `${volumeChangeDesc}\n`;
    
    const candleAnalysis = candlePatterns.analyzeCandle(indicators.openPrices[indicators.openPrices.length - 1], indicators.closePrices[indicators.closePrices.length - 1], indicators.highPrices[indicators.highPrices.length - 1], indicators.lowPrices[indicators.lowPrices.length - 1]);
    output += `K线形态：${candleAnalysis.text}\n`;

    if (multiTimeframeAnalysis && multiTimeframeAnalysis.success) {
        output += `\n多时间框架分析：\n`;
        output += `时间框架一致性：${multiTimeframeAnalysis.consistency}\n`;
        output += `整体趋势：${multiTimeframeAnalysis.overallTrend}\n`;
        output += `短线操作建议：${multiTimeframeAnalysis.shortTermAdvice}\n`;
        if (strategyConfig.reportConfig.verboseMode) {
            output += `详细分析：\n`;
            multiTimeframeAnalysis.timeframes.forEach((tf: any) => {
                output += ` ${tf.timeframe}: ${tf.trend} (价格: ${tf.price}, MA20: ${tf.ma20}, 偏离: ${tf.priceVsMA})\n`;
            });
        }
    }

    output += `\n--- 分析结果 ---\n`;
    output += `综合信号评分：${signalScore.toFixed(decimalPlaces)}分\n`;
    output += `方向：${direction}\n`;
    output += `理由：${reasoning}。\n`;
    if (signalList.length > 0) {
        output += `关键信号：\n`;
        signalList.forEach((s: any) => output += ` - ${s}\n`);
    }

    output += `\n--- 详细交易策略 ---\n`;
    output += `${tradingStrategy.advice}\n`;
    if (tradingStrategy.stopLoss > 0) {
        output += `止损位：${tradingStrategy.stopLoss.toFixed(decimalPlaces)} USDT（${tradingStrategy.direction.includes('看空') ? '高于' : '低于'}${tradingStrategy.direction.includes('看空') ? '阻力区上沿' : '支撑区下沿'}${strategyConfig.tradingStrategy.stopLossPercent*100}%）。理由：ATR（${indicators.atr.toFixed(2)}）显示日内波动较大，止损需覆盖正常波动噪音。\n`;
    }
    
    if (tradingStrategy.riskRewardRatios.length > 0) {
        output += `目标价位：\n`;
        const goodRRTargets = tradingStrategy.riskRewardRatios.filter((item: any) => item.isGood);
        const otherTargets = tradingStrategy.riskRewardRatios.filter((item: any) => !item.isGood);
        if (goodRRTargets.length > 0) {
            output += ` 符合盈亏比要求（>=1:${strategyConfig.tradingStrategy.minRiskRewardRatio}）的目标：\n`;
            goodRRTargets.forEach((item: any, i: number) => output += `  第${i+1}目标：${item.target} USDT（潜在收益 ${item.rewardPct.replace('+', '')}）→ 盈亏比 ${item.rr}。\n`);
        }
        if (otherTargets.length > 0) {
            output += ` 其他潜在目标（盈亏比 < 1:${strategyConfig.tradingStrategy.minRiskRewardRatio}） Jockey的目标：\n`;
            otherTargets.forEach((item: any, i: number) => output += `  目标${i + 1}：${item.target} USDT（潜在收益 ${item.rewardPct.replace('+', '')}）→ 盈亏比 ${item.rr}。\n`);
        }
        output += ` 提示：${tradingStrategy.direction.includes('看空') ? `若放量跌破前低，可持仓看向更低支撑。请耐心等待价格反弹至理想阻力区间，并出现遇阻信号后再考虑入场。` : `若放量突破前高，可持仓看向更高阻力。请耐心等待价格回调至理想入场区间，并出现企稳信号后再考虑入场。`}\n`;
    }
    
    if (tradingStrategy.multiTimeframeAdvice) {
        output += `\n多时间框架策略建议：\n ${tradingStrategy.multiTimeframeAdvice}\n`;
    }

    output += `\n提示：本次分析仅供参考，不构成任何投资建议！`;
    return output;
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { symbol, period } = body;

    if (!symbol || !period) {
      return NextResponse.json({ error: 'Symbol and period are required' }, { status: 400 });
    }

    const marketData = await analysisModules.fetchMarketData(symbol, period);
    if (!marketData.success) {
      return NextResponse.json({ error: `Failed to fetch market data: ${marketData.error || 'Unknown error'}` }, { status: 500 });
    }

    const indicators = analysisModules.calculateIndicators(marketData.klines);
    const trendData = await analysisModules.analyzeTrendAndLevels(symbol, period, marketData.klines, indicators);
    const fundingFlow = await analysisModules.analyzeFundingFlow(symbol, period);
    
    const signalsResult = analysisModules.generateSignals(
        indicators,
        { ...marketData, fundingRate: fundingFlow.fundingRate },
        trendData
    );
    
    if (fundingFlow.signal !== 0) {
        signalsResult.signalScore += fundingFlow.signal;
        signalsResult.signals.push(`资金流向：${fundingFlow.text}`);
    }

    const reversalAnalysis = candlePatterns.analyzeReversalPatterns({
        open: indicators.openPrices.slice(-10),
        high: indicators.highPrices.slice(-10),
        low: indicators.lowPrices.slice(-10),
        close: indicators.closePrices.slice(-10)
    });

    const { direction, reasoning } = analysisModules.determineDirection(
        signalsResult.signalScore,
        indicators,
        reversalAnalysis
    );

    const multiTimeframeAnalysis = await analysisModules.analyzeMultiTimeframe(symbol, period);
    const tradingStrategy = analysisModules.generateTradingStrategy(
        direction,
        indicators.currentPrice,
        trendData,
        indicators,
        multiTimeframeAnalysis
    );
    
    const textReport = generateTextReport(
        symbol, period, marketData, indicators, trendData,
        signalsResult, direction, reasoning, tradingStrategy, multiTimeframeAnalysis
    );

    return NextResponse.json({ 
        report: textReport,
        rawData: { /* 可以保留结构化数据备用 */ }
    });

  } catch (error: any) {
    console.error('API Error:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
