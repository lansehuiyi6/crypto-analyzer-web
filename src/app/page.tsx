'use client';
import { useState } from 'react';

export default function Home() {
  const [symbol, setSymbol] = useState<string>('BTCUSDT');
  const [period, setPeriod] = useState<string>('15m');
  const [report, setReport] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const handleAnalyze = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ symbol, period }),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error || '分析请求失败');
      
      setReport(data.report);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-white dark:bg-black text-black dark:text-white p-4 font-sans">
      <main className="max-w-4xl mx-auto space-y-6">
        <h1 className="text-2xl font-bold">Crypto Market Analysis</h1>
        
        <div className="flex flex-wrap gap-4 items-end bg-zinc-50 dark:bg-zinc-900 p-4 rounded-lg border border-zinc-200 dark:border-zinc-800">
          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium">Trading Pair</label>
            <input
              type="text"
              value={symbol}
              onChange={(e) => setSymbol(e.target.value.toUpperCase())}
              className="px-3 py-2 bg-white dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 rounded shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          
          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium">Time Period</label>
            <select
              value={period}
              onChange={(e) => setPeriod(e.target.value)}
              className="px-3 py-2 bg-white dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 rounded shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {['1m', '5m', '15m', '30m', '1h', '2h', '4h', '1d'].map(p => (
                <option key={p} value={p}>{p}</option>
              ))}
            </select>
          </div>

          <button
            onClick={handleAnalyze}
            disabled={isLoading}
            className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded font-medium transition-colors disabled:opacity-50"
          >
            {isLoading ? 'Analyzing...' : 'Get Analysis'}
          </button>
        </div>

        {error && (
          <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 rounded">
            Error: {error}
          </div>
        )}

        {report && (
          <div className="bg-zinc-50 dark:bg-zinc-900 p-6 rounded-lg border border-zinc-200 dark:border-zinc-800">
            <pre className="whitespace-pre-wrap font-mono text-sm leading-relaxed">
              {report}
            </pre>
          </div>
        )}
      </main>
    </div>
  );
}
