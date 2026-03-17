// candlePatterns.js
// 包含所有K线形态识别函数

// 动态分析单根K线
function analyzeCandle(open, close, high, low) {
    const bodySize = Math.abs(close - open);
    const totalRange = high - low;
    const upperShadow = high - Math.max(open, close);
    const lowerShadow = Math.min(open, close) - low;

    if (bodySize / totalRange < 0.2) {
        return { text: '十字星或实体较小，市场方向不明，多空双方胶着。', score: 0 };
    }

    if (close > open) { // 多头信号
        if (lowerShadow > upperShadow * 2 && lowerShadow / totalRange > 0.4) {
            return { text: '出现长下影线，显示下方买盘支撑强劲，多头有反攻意愿。', score: 1 };
        }
        if (bodySize / totalRange > 0.7) {
            return { text: '大阳线，多头强势，看涨动能强劲。', score: 1 };
        }
    }
    
    if (close < open) { // 空头信号
        if (upperShadow > lowerShadow * 2 && upperShadow / totalRange > 0.4) {
            return { text: '出现长上影线，显示上方卖压沉重，多头乏力。', score: -1 };
        }
        if (bodySize / totalRange > 0.7) {
            return { text: '大阴线，空头强势，看跌动能强劲。', score: -1 };
        }
    }

    return { text: '常规K线，无明显形态信号。', score: 0 };
}

// ==========================================================
// 完整的看涨和看跌K线形态判断函数
// ==========================================================

// 看涨形态
function isBullishEngulfing(open, close) {
    if (open.length < 2) return false;
    const prevOpen = open[open.length - 2];
    const prevClose = close[close.length - 2];
    const currOpen = open[open.length - 1];
    const currClose = close[close.length - 1];
    return (prevClose < prevOpen) && (currClose > currOpen) && (currOpen <= prevClose) && (currClose >= prevOpen);
}

function isDownsideTasukiGap(open, close, high, low) {
    if (open.length < 3) return false;
    const firstClose = close[close.length - 3];
    const firstOpen = open[open.length - 3];
    const secondClose = close[close.length - 2];
    const secondOpen = open[open.length - 2];
    const thirdClose = close[close.length - 1];
    const thirdOpen = open[open.length - 1];
    return (firstClose < firstOpen) && (secondClose < secondOpen) && (secondOpen < firstClose) && (thirdClose > thirdOpen) && (thirdOpen > secondClose) && (thirdClose < firstOpen);
}

function isBullishHarami(open, close) {
    if (open.length < 2) return false;
    const prevOpen = open[open.length - 2];
    const prevClose = close[close.length - 2];
    const currOpen = open[open.length - 1];
    const currClose = close[close.length - 1];
    return (prevClose < prevOpen) && (currClose > currOpen) && (currOpen >= prevClose) && (currClose <= prevOpen);
}

function isBullishHaramiCross(open, close) {
    if (open.length < 2) return false;
    const prevOpen = open[open.length - 2];
    const prevClose = close[close.length - 2];
    const currOpen = open[open.length - 1];
    const currClose = close[close.length - 1];
    const bodySize = Math.abs(currClose - currOpen);
    return (prevClose < prevOpen) && (bodySize < Math.abs(prevClose - prevOpen) * 0.1) && (currOpen >= prevClose) && (currClose <= prevOpen);
}

function isMorningStar(open, close) {
    if (open.length < 3) return false;
    const firstClose = close[close.length - 3];
    const firstOpen = open[open.length - 3];
    const secondClose = close[close.length - 2];
    const secondOpen = open[open.length - 2];
    const thirdClose = close[close.length - 1];
    const thirdOpen = open[open.length - 1];
    return (firstClose < firstOpen) && (secondClose < secondOpen) && (secondClose < firstClose) && (thirdClose > thirdOpen) && (thirdClose > (firstOpen + firstClose) / 2);
}

function isMorningDojiStar(open, close, low) {
    if (open.length < 3) return false;
    const firstClose = close[close.length - 3];
    const firstOpen = open[open.length - 3];
    const secondClose = close[close.length - 2];
    const secondOpen = open[open.length - 2];
    const thirdClose = close[close.length - 1];
    const thirdOpen = open[open.length - 1];
    const secondBodySize = Math.abs(secondClose - secondOpen);
    return (firstClose < firstOpen) && (secondBodySize / (secondOpen + secondClose) < 0.001) && (secondClose < low[low.length - 3]) && (thirdClose > thirdOpen) && (thirdClose > (firstOpen + firstClose) / 2);
}

function isBullishMarubozu(open, close, high, low) {
    const bodySize = close - open;
    const upperShadow = high - close;
    const lowerShadow = open - low;
    const totalRange = high - low;
    return (close > open) && (bodySize / totalRange > 0.9) && (upperShadow < bodySize * 0.1) && (lowerShadow < bodySize * 0.1);
}

function isPiercingLine(open, close) {
    if (open.length < 2) return false;
    const prevOpen = open[open.length - 2];
    const prevClose = close[close.length - 2];
    const currOpen = open[open.length - 1];
    const currClose = close[close.length - 1];
    return (prevClose < prevOpen) && (currClose > currOpen) && (currOpen < prevClose) && (currClose > (prevOpen + prevClose) / 2) && (currClose < prevOpen);
}

function isThreeWhiteSoldiers(open, close) {
    if (open.length < 3) return false;
    const first = { open: open[open.length - 3], close: close[close.length - 3] };
    const second = { open: open[open.length - 2], close: close[close.length - 2] };
    const third = { open: open[open.length - 1], close: close[close.length - 1] };
    return (first.close > first.open) && (second.close > second.open) && (third.close > third.open) &&
           (second.open < first.close) && (second.open > first.open) &&
           (third.open < second.close) && (third.open > second.open) &&
           (second.close > first.close) && (third.close > second.close);
}

function isBullishHammerStick(open, close, high, low) {
    const bodySize = Math.abs(close - open);
    const lowerShadow = Math.min(open, close) - low;
    const upperShadow = high - Math.max(open, close);
    const totalRange = high - low;
    return (lowerShadow > 2 * bodySize) && (upperShadow < bodySize * 0.5) && (bodySize / totalRange < 0.3);
}

function isBullishInvertedHammerStick(open, close, high, low) {
    const bodySize = Math.abs(close - open);
    const upperShadow = high - Math.max(open, close);
    const lowerShadow = Math.min(open, close) - low;
    const totalRange = high - low;
    return (upperShadow > 2 * bodySize) && (lowerShadow < bodySize * 0.5) && (bodySize / totalRange < 0.3);
}

function isHammerPattern(open, close, high, low) {
    return isBullishHammerStick(open, close, high, low);
}
// HammerPatternUnconfirmed is handled by the main analysis logic based on position

function isTweezerBottom(low) {
    if (low.length < 2) return false;
    const prevLow = low[low.length - 2];
    const currLow = low[low.length - 1];
    return Math.abs(currLow - prevLow) < prevLow * 0.0005; // 0.05% tolerance
}

// 看跌形态
function isBearishEngulfing(open, close) {
    if (open.length < 2) return false;
    const prevOpen = open[open.length - 2];
    const prevClose = close[close.length - 2];
    const currOpen = open[open.length - 1];
    const currClose = close[close.length - 1];
    return (prevClose > prevOpen) && (currClose < currOpen) && (currOpen >= prevClose) && (currClose <= prevOpen);
}

function isBearishHarami(open, close) {
    if (open.length < 2) return false;
    const prevOpen = open[open.length - 2];
    const prevClose = close[close.length - 2];
    const currOpen = open[open.length - 1];
    const currClose = close[close.length - 1];
    return (prevClose > prevOpen) && (currClose < currOpen) && (currOpen <= prevClose) && (currClose >= prevOpen);
}

function isBearishHaramiCross(open, close) {
    if (open.length < 2) return false;
    const prevOpen = open[open.length - 2];
    const prevClose = close[close.length - 2];
    const currOpen = open[open.length - 1];
    const currClose = close[close.length - 1];
    const bodySize = Math.abs(currClose - currOpen);
    return (prevClose > prevOpen) && (bodySize / Math.abs(prevClose - prevOpen) < 0.1) && (currOpen <= prevClose) && (currClose >= prevOpen);
}

function isEveningStar(open, close) {
    if (open.length < 3) return false;
    const firstClose = close[close.length - 3];
    const firstOpen = open[open.length - 3];
    const secondClose = close[close.length - 2];
    const secondOpen = open[open.length - 2];
    const thirdClose = close[close.length - 1];
    const thirdOpen = open[open.length - 1];
    return (firstClose > firstOpen) && (secondClose > secondOpen) && (secondOpen > firstClose) && (thirdClose < thirdOpen) && (thirdClose < (firstOpen + firstClose) / 2);
}

function isEveningDojiStar(open, close, high) {
    if (open.length < 3) return false;
    const firstClose = close[close.length - 3];
    const firstOpen = open[open.length - 3];
    const secondClose = close[close.length - 2];
    const secondOpen = open[open.length - 2];
    const thirdClose = close[close.length - 1];
    const thirdOpen = open[open.length - 1];
    const secondBodySize = Math.abs(secondClose - secondOpen);
    return (firstClose > firstOpen) && (secondBodySize / (secondOpen + secondClose) < 0.001) && (secondClose > high[high.length - 3]) && (thirdClose < thirdOpen) && (thirdClose < (firstOpen + firstClose) / 2);
}

function isBearishMarubozu(open, close, high, low) {
    const bodySize = open - close;
    const upperShadow = high - Math.max(open, close);
    const lowerShadow = Math.min(open, close) - low;
    const totalRange = high - low;
    return (close < open) && (bodySize / totalRange > 0.95) && (upperShadow / totalRange < 0.05) && (lowerShadow / totalRange < 0.05);
}

function isThreeBlackCrows(open, close) {
    if (open.length < 3) return false;
    const first = { open: open[open.length - 3], close: close[close.length - 3] };
    const second = { open: open[open.length - 2], close: close[close.length - 2] };
    const third = { open: open[open.length - 1], close: close[close.length - 1] };
    return (first.close < first.open) && (second.close < second.open) && (third.close < third.open) &&
           (second.open < first.open) && (second.open > first.close) &&
           (third.open < second.open) && (third.open > second.close) &&
           (second.close < first.close) && (third.close < second.close);
}

function isHangingMan(open, close, high, low) {
    return isBullishHammerStick(open, close, high, low); // Same shape as hammer
}
function isHangingManUnconfirmed(open, close, high, low) {
    return isHangingMan(open, close, high, low);
}

function isShootingStar(open, close, high, low) {
    return isBullishInvertedHammerStick(open, close, high, low); // Same shape as inverted hammer
}
function isShootingStarUnconfirmed(open, close, high, low) {
    return isShootingStar(open, close, high, low);
}

function isTweezerTop(high) {
    if (high.length < 2) return false;
    const prevHigh = high[high.length - 2];
    const currHigh = high[high.length - 1];
    return Math.abs(currHigh - prevHigh) < prevHigh * 0.0005; // 0.05% tolerance
}

// 分析特定的反转K线形态，根据形态和趋势赋予信号分数
function analyzeReversalPatterns(data) {
    const reversalSignals = [];
    let totalScore = 0;
    
    const latestOpen = data.open[data.open.length - 1];
    const latestClose = data.close[data.close.length - 1];
    const latestHigh = data.high[data.high.length - 1];
    const latestLow = data.low[data.low.length - 1];
    const prevClose = data.close[data.close.length - 2];
    
    // 看涨形态信号
    if (isBullishEngulfing(data.open, data.close)) {
        reversalSignals.push('看涨吞没形态 (Bullish Engulfing)');
        totalScore += 2;
    }
    if (isMorningStar(data.open, data.close)) {
        reversalSignals.push('晨星形态 (Morning Star)');
        totalScore += 3;
    }
    if (isMorningDojiStar(data.open, data.close, data.low)) {
        reversalSignals.push('十字晨星 (Morning Doji Star)');
        totalScore += 3.5;
    }
    if (isPiercingLine(data.open, data.close)) {
        reversalSignals.push('刺穿线 (Piercing Line)');
        totalScore += 2;
    }
    if (isBullishHarami(data.open, data.close)) {
        reversalSignals.push('看涨孕线 (Bullish Harami)');
        totalScore += 1;
    }
    if (isBullishHaramiCross(data.open, data.close)) {
        reversalSignals.push('看涨十字孕线 (Bullish Harami Cross)');
        totalScore += 1.5;
    }
    if (isBullishMarubozu(latestOpen, latestClose, latestHigh, latestLow)) {
        reversalSignals.push('看涨光头光脚大阳线 (Bullish Marubozu)');
        totalScore += 2;
    }
    if (isThreeWhiteSoldiers(data.open, data.close)) {
        reversalSignals.push('三白兵 (Three White Soldiers)');
        totalScore += 3;
    }
    if (isBullishHammerStick(latestOpen, latestClose, latestHigh, latestLow) && prevClose < latestOpen) {
        reversalSignals.push('看涨锤子线 (Bullish Hammer Stick)');
        totalScore += 2;
    }
    if (isBullishInvertedHammerStick(latestOpen, latestClose, latestHigh, latestLow) && prevClose < latestOpen) {
        reversalSignals.push('看涨倒锤子线 (Bullish Inverted Hammer Stick)');
        totalScore += 2;
    }
    if (isDownsideTasukiGap(data.open, data.close, data.high, data.low)) {
        reversalSignals.push('下降中继缺口 (Downside Tasuki Gap)');
        totalScore += 1.5;
    }
    if (isTweezerBottom(data.low)) {
        reversalSignals.push('镊子底 (Tweezer Bottom)');
        totalScore += 1.5;
    }

    // 看跌形态信号
    if (isBearishEngulfing(data.open, data.close)) {
        reversalSignals.push('看跌吞没形态 (Bearish Engulfing)');
        totalScore -= 2;
    }
    if (isEveningStar(data.open, data.close)) {
        reversalSignals.push('黄昏星 (Evening Star)');
        totalScore -= 3;
    }
    if (isEveningDojiStar(data.open, data.close, data.high)) {
        reversalSignals.push('十字黄昏星 (Evening Doji Star)');
        totalScore -= 3.5;
    }
    if (isBearishHarami(data.open, data.close)) {
        reversalSignals.push('看跌孕线 (Bearish Harami)');
        totalScore -= 1;
    }
    if (isBearishHaramiCross(data.open, data.close)) {
        reversalSignals.push('看跌十字孕线 (Bearish Harami Cross)');
        totalScore -= 1.5;
    }
    if (isBearishMarubozu(latestOpen, latestClose, latestHigh, latestLow)) {
        reversalSignals.push('看跌光头光脚大阴线 (Bearish Marubozu)');
        totalScore -= 2;
    }
    if (isThreeBlackCrows(data.open, data.close)) {
        reversalSignals.push('三黑鸦 (Three Black Crows)');
        totalScore -= 3;
    }
    if (isHangingMan(latestOpen, latestClose, latestHigh, latestLow) && latestClose < latestOpen) {
        reversalSignals.push('吊人线 (Hanging Man)');
        totalScore -= 2;
    }
    if (isShootingStar(latestOpen, latestClose, latestHigh, latestLow) && latestClose < latestOpen) {
        reversalSignals.push('射击之星 (Shooting Star)');
        totalScore -= 2;
    }
    if (isTweezerTop(data.high)) {
        reversalSignals.push('镊子顶 (Tweezer Top)');
        totalScore -= 1.5;
    }
    
    // 处理未确认形态
    if (isBullishHammerStick(latestOpen, latestClose, latestHigh, latestLow) && prevClose > latestOpen) {
        reversalSignals.push('未确认的锤子线 (Hammer Unconfirmed)');
        totalScore += 1;
    }
    if (isHangingMan(latestOpen, latestClose, latestHigh, latestLow) && latestClose > latestOpen) {
        reversalSignals.push('未确认的吊人线 (Hanging Man Unconfirmed)');
        totalScore -= 1;
    }
    
    const finalSignals = [];
    if (totalScore > 0) {
        reversalSignals.forEach(signal => {
            if (!signal.includes('看跌') && !signal.includes('三黑鸦') && !signal.includes('黄昏星')) {
                finalSignals.push(signal);
            }
        });
    } else if (totalScore < 0) {
        reversalSignals.forEach(signal => {
            if (!signal.includes('看涨') && !signal.includes('三白兵') && !signal.includes('晨星')) {
                finalSignals.push(signal);
            }
        });
    } else {
        finalSignals.push(...reversalSignals);
    }

    return { signals: finalSignals, score: totalScore };
}

// 将所有函数导出
module.exports = {
    analyzeCandle,
    analyzeReversalPatterns,
    isBullishEngulfing, isDownsideTasukiGap, isBullishHarami, isBullishHaramiCross, 
    isMorningStar, isMorningDojiStar, isBullishMarubozu, isPiercingLine,
    isThreeWhiteSoldiers, isBullishHammerStick, isBullishInvertedHammerStick, 
    isHammerPattern, isTweezerBottom, isBearishEngulfing, isBearishHarami,
    isBearishHaramiCross, isEveningStar, isEveningDojiStar, isBearishMarubozu,
    isThreeBlackCrows, isHangingMan, isShootingStar, isTweezerTop
};