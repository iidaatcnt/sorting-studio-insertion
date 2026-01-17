'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Play,
  Pause,
  RotateCcw,
  StepForward,
  StepBack,
  Github,
  Info,
  Code2,
  Zap,
  Lightbulb,
  ArrowRightLeft,
  ArrowDown,
  Upload,
  Share2,
  Shuffle
} from 'lucide-react';

// --- Types ---
type SortState = 'pick' | 'compare' | 'shift' | 'insert' | 'sorted' | 'init' | 'complete';

interface SortingStep {
  array: number[];
  indices: number[]; // 注目している要素 (j, j+1 など)
  keyIdx?: number;   // 挿入しようとしている要素の元のインデックス
  keyVal?: number;   // 挿入しようとしている値
  type: SortState;
  description: string;
  codeLine?: number;
}

// --- Constants ---
const ARRAY_SIZE = 10;
const INITIAL_SPEED = 600;

const CODE_PYTHON = [
  "def insertion_sort(arr):",
  "    for i in range(1, len(arr)):",
  "        key = arr[i]",
  "        j = i - 1",
  "        while j >= 0 and key < arr[j]:",
  "            arr[j + 1] = arr[j]",
  "            j -= 1",
  "        arr[j + 1] = key"
];

// --- Algorithm Logic ---
const generateSteps = (initialArray: number[]): SortingStep[] => {
  const steps: SortingStep[] = [];
  const arr = [...initialArray];
  const n = arr.length;

  steps.push({
    array: [...arr],
    indices: [],
    type: 'init',
    description: '配列の準備ができました。挿入ソートを開始します。',
    codeLine: 0
  });

  for (let i = 1; i < n; i++) {
    const key = arr[i];

    steps.push({
      array: [...arr],
      indices: [i],
      keyIdx: i,
      keyVal: key,
      type: 'pick',
      description: `インデックス ${i} の値 ${key} を「挿入する値（キー）」として選び出します。`,
      codeLine: 2
    });

    let j = i - 1;

    while (j >= 0 && arr[j] > key) {
      steps.push({
        array: [...arr],
        indices: [j],
        keyVal: key,
        type: 'compare',
        description: `キー ${key} と左側の ${arr[j]} を比較します。${arr[j]} の方が大きいので、右にずらします。`,
        codeLine: 4
      });

      arr[j + 1] = arr[j];

      steps.push({
        array: [...arr],
        indices: [j + 1],
        keyVal: key,
        type: 'shift',
        description: `${arr[j]} を右に1つずらして、挿入するための空きスペースを作ります。`,
        codeLine: 5
      });

      j--;
    }

    if (j >= 0) {
      steps.push({
        array: [...arr],
        indices: [j],
        keyVal: key,
        type: 'compare',
        description: `キー ${key} と ${arr[j]} を比較します。${arr[j]} はキーより小さい（または同じ）ので、ここで挿入位置が決まりました。`,
        codeLine: 4
      });
    }

    arr[j + 1] = key;

    steps.push({
      array: [...arr],
      indices: [j + 1],
      keyVal: key,
      type: 'insert',
      description: `空いた位置（インデックス ${j + 1}）にキー ${key} を挿入しました。`,
      codeLine: 7
    });

    steps.push({
      array: [...arr],
      indices: Array.from({ length: i + 1 }, (_, k) => k),
      type: 'sorted',
      description: `左側の ${i + 1} つの要素が部分的に整列されました。`,
      codeLine: 1
    });
  }

  steps.push({
    array: [...arr],
    indices: Array.from({ length: n }, (_, k) => k),
    type: 'complete',
    description: 'すべての要素が正しい位置に挿入され、並び替えが完了しました！',
    codeLine: 0
  });

  return steps;
};

// --- Helper: Parse data input ---
const parseDataInput = (input: string): number[] | null => {
  const nums = input
    .split(/[,\s]+/)
    .map(s => s.trim())
    .filter(s => s !== '')
    .map(s => parseInt(s, 10))
    .filter(n => !isNaN(n) && n >= 1 && n <= 99);

  if (nums.length !== ARRAY_SIZE) return null;
  return nums;
};

// --- Main App ---
export default function InsertionSortStudio() {
  const [array, setArray] = useState<number[]>([]);
  const [steps, setSteps] = useState<SortingStep[]>([]);
  const [currentStep, setCurrentStep] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [speed, setSpeed] = useState(INITIAL_SPEED);
  const [dataInput, setDataInput] = useState('');
  const [inputError, setInputError] = useState('');
  const [showDataPanel, setShowDataPanel] = useState(true);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Initialize from URL parameter or random
  const initializeArray = useCallback((customArray?: number[]) => {
    const newArray = customArray || Array.from({ length: ARRAY_SIZE }, () => Math.floor(Math.random() * 85) + 10);
    const newSteps = generateSteps(newArray);
    setArray(newArray);
    setSteps(newSteps);
    setCurrentStep(0);
    setIsPlaying(false);
    setDataInput(newArray.join(', '));
    setInputError('');
  }, []);

  // Check URL for data parameter on mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const urlParams = new URLSearchParams(window.location.search);
      const dataParam = urlParams.get('data');
      if (dataParam) {
        const parsed = parseDataInput(dataParam);
        if (parsed) {
          initializeArray(parsed);
          setShowDataPanel(false);
          return;
        }
      }
    }
    initializeArray();
  }, [initializeArray]);

  // Generate random array
  const generateRandom = useCallback(() => {
    initializeArray();
  }, [initializeArray]);

  // Apply custom data input
  const applyDataInput = useCallback(() => {
    const parsed = parseDataInput(dataInput);
    if (!parsed) {
      setInputError(`${ARRAY_SIZE}個の数値（1〜99）をカンマ区切りで入力してください`);
      return;
    }
    initializeArray(parsed);
    setShowDataPanel(false);
  }, [dataInput, initializeArray]);

  // Handle file upload
  const handleFileUpload = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      const parsed = parseDataInput(text);
      if (parsed) {
        initializeArray(parsed);
        setShowDataPanel(false);
      } else {
        setInputError(`ファイルには${ARRAY_SIZE}個の数値（1〜99）が必要です`);
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  }, [initializeArray]);

  // Copy share URL to clipboard
  const copyShareUrl = useCallback(() => {
    if (typeof window !== 'undefined') {
      const url = new URL(window.location.href);
      url.searchParams.set('data', array.join(','));
      navigator.clipboard.writeText(url.toString());
      alert('共有URLをコピーしました！\n他のソートアルゴリズムのURLに ?data=' + array.join(',') + ' を追加すると同じデータで比較できます。');
    }
  }, [array]);

  const stepForward = useCallback(() => setCurrentStep(prev => Math.min(prev + 1, steps.length - 1)), [steps.length]);
  const stepBackward = useCallback(() => setCurrentStep(prev => Math.max(prev - 1, 0)), []);

  useEffect(() => {
    if (isPlaying && currentStep < steps.length - 1) {
      timerRef.current = setInterval(() => {
        setCurrentStep(prev => {
          if (prev >= steps.length - 1) {
            setIsPlaying(false);
            return prev;
          }
          return prev + 1;
        });
      }, 1001 - speed);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [isPlaying, currentStep, steps.length, speed]);

  const step = steps[currentStep] || { array: [], indices: [], type: 'init', description: '' };

  return (
    <div className="min-h-screen bg-[#f8fafc] text-slate-900 font-sans selection:bg-indigo-500/30">
      {/* Header */}
      <header className="border-b border-slate-200 bg-white/50 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center shadow-lg shadow-indigo-600/20">
              <ArrowRightLeft className="text-white w-5 h-5" />
            </div>
            <h1 className="font-black italic tracking-tighter text-xl uppercase tracking-widest text-indigo-600">挿入ソート (Insertion Sort)</h1>
          </div>
          <div className="flex items-center gap-6">
            <div className="hidden md:flex items-center gap-2 text-[10px] mono uppercase text-slate-400">
              <span>Status:</span>
              <span className={isPlaying ? 'text-emerald-600' : 'text-amber-600'}>
                {isPlaying ? '実行中' : '停止中'}
              </span>
            </div>
            <a href="https://github.com/iidaatcnt/sorting-studio-insertion" target="_blank" rel="noreferrer" className="text-slate-400 hover:text-slate-900 transition-colors">
              <Github size={20} />
            </a>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-12 grid grid-cols-1 lg:grid-cols-12 gap-12">
        {/* Left: Visualization & Controls */}
        <div className="lg:col-span-8 flex flex-col gap-8">

          {/* Data Input Panel */}
          {showDataPanel && (
            <div className="p-6 bg-white rounded-3xl border border-slate-200 shadow-lg">
              <div className="flex items-center gap-3 mb-4">
                <Upload className="text-indigo-600 w-5 h-5" />
                <h2 className="font-bold text-sm text-slate-700">データ入力（{ARRAY_SIZE}個の数値）</h2>
              </div>
              <div className="flex flex-col gap-4">
                <div>
                  <input
                    type="text"
                    value={dataInput}
                    onChange={(e) => { setDataInput(e.target.value); setInputError(''); }}
                    placeholder="例: 25, 41, 48, 50, 54, 61, 70, 76, 84, 92"
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  />
                  {inputError && <p className="text-red-500 text-xs mt-2">{inputError}</p>}
                </div>
                <div className="flex flex-wrap gap-3">
                  <button
                    onClick={applyDataInput}
                    className="px-4 py-2 bg-indigo-600 text-white rounded-xl text-sm font-medium hover:bg-indigo-500 transition-colors"
                  >
                    適用
                  </button>
                  <button
                    onClick={generateRandom}
                    className="px-4 py-2 bg-slate-100 text-slate-600 rounded-xl text-sm font-medium hover:bg-slate-200 transition-colors flex items-center gap-2"
                  >
                    <Shuffle size={16} />
                    ランダム生成
                  </button>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".txt,.csv"
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="px-4 py-2 bg-slate-100 text-slate-600 rounded-xl text-sm font-medium hover:bg-slate-200 transition-colors flex items-center gap-2"
                  >
                    <Upload size={16} />
                    ファイル読込
                  </button>
                </div>
                <p className="text-xs text-slate-400">
                  💡 同じデータで他のソートと比較するには、URLに <code className="bg-slate-100 px-1 rounded">?data=25,41,48...</code> を追加してください
                </p>
              </div>
            </div>
          )}

          <div className="relative aspect-video lg:aspect-square max-h-[500px] bg-white rounded-3xl border border-slate-200 p-12 flex items-end justify-center gap-2 overflow-hidden group shadow-xl">
            <div className="absolute top-6 left-6 flex items-center gap-2 mono text-[10px] text-slate-400 uppercase font-bold">
              <div className="w-1.5 h-1.5 rounded-full bg-indigo-600 animate-pulse" />
              挿入ソート・シミュレーター
            </div>

            <AnimatePresence mode="popLayout" initial={false}>
              {step.array.map((val, idx) => {
                const isSelected = step.indices.includes(idx);
                const isKey = step.keyIdx === idx && (step.type === 'pick' || step.type === 'compare');

                let colorClass = "bg-slate-100";
                let yOffset = 0;

                if (isSelected) {
                  if (step.type === 'compare') colorClass = "bg-indigo-400 shadow-[0_0_20px_rgba(129,140,248,0.3)]";
                  if (step.type === 'shift') colorClass = "bg-amber-400 shadow-[0_0_20px_rgba(251,191,36,0.3)]";
                  if (step.type === 'insert') colorClass = "bg-indigo-600 shadow-[0_0_25px_rgba(79,70,229,0.5)]";
                  if (step.type === 'sorted') colorClass = "bg-emerald-500 shadow-[0_0_20px_rgba(16,185,129,0.3)]";
                  if (step.type === 'complete') colorClass = "bg-indigo-600 shadow-[0_0_30px_rgba(79,70,229,0.5)]";
                }

                if (step.type === 'pick' && isKey) {
                  colorClass = "bg-indigo-400 shadow-[0_0_25px_rgba(129,140,248,0.5)]";
                  yOffset = -100; // Lift up for selection
                }

                return (
                  <motion.div
                    key={`${idx}-${val}`}
                    layout
                    transition={{ type: 'spring', damping: 25, stiffness: 400 }}
                    style={{ height: `${val}%`, y: yOffset }}
                    className={`flex-1 min-w-[30px] rounded-t-lg relative ${colorClass} transition-colors duration-200`}
                  >
                    <div className={`absolute -top-8 left-1/2 -translate-x-1/2 text-[10px] font-bold ${isSelected || isKey ? 'text-indigo-600' : 'text-slate-400'}`}>
                      {val}
                    </div>
                    {isSelected && step.type === 'insert' && (
                      <div className="absolute inset-x-0 -top-12 flex justify-center text-indigo-400 animate-bounce">
                        <ArrowDown size={16} />
                      </div>
                    )}
                  </motion.div>
                );
              })}
            </AnimatePresence>
            <div className="absolute inset-0 pointer-events-none opacity-[0.03] bg-[linear-gradient(rgba(0,0,0,0.1)_1px,transparent_1px),linear-gradient(90deg,rgba(0,0,0,0.1)_1px,transparent_1px)] bg-[length:40px_40px]" />
          </div>

          <div className="p-8 bg-white rounded-3xl border border-slate-200 flex flex-col gap-8 shadow-lg">
            <div className="flex flex-col md:flex-row items-center gap-8">
              <div className="flex items-center gap-2">
                <button onClick={stepBackward} className="p-3 bg-slate-100 text-slate-600 rounded-xl hover:bg-slate-200 transition-colors"><StepBack size={20} /></button>
                <button onClick={() => setIsPlaying(!isPlaying)} className="w-16 h-16 bg-indigo-600 text-white rounded-2xl flex items-center justify-center hover:bg-indigo-500 transition-all active:scale-95 shadow-xl shadow-indigo-600/20">
                  {isPlaying ? <Pause fill="currentColor" /> : <Play fill="currentColor" className="ml-1" />}
                </button>
                <button onClick={stepForward} className="p-3 bg-slate-100 text-slate-600 rounded-xl hover:bg-slate-200 transition-colors"><StepForward size={20} /></button>
                <button onClick={() => setShowDataPanel(!showDataPanel)} className="p-3 bg-slate-100 text-slate-600 rounded-xl hover:bg-slate-200 transition-colors ml-2" title="データ入力パネル"><RotateCcw size={20} /></button>
                <button onClick={copyShareUrl} className="p-3 bg-indigo-100 text-indigo-600 rounded-xl hover:bg-indigo-200 transition-colors ml-2" title="共有URLをコピー"><Share2 size={20} /></button>
              </div>

              <div className="flex-1 w-full">
                <div className="flex items-center justify-between mono text-[10px] text-slate-400 uppercase tracking-widest mb-2 font-bold">
                  <span>再生スピード</span>
                  <span className="text-indigo-600">{Math.round((speed / 980) * 100)}%</span>
                </div>
                <input type="range" min="20" max="980" value={speed} onChange={(e) => setSpeed(parseInt(e.target.value))} className="w-full appearance-none bg-slate-100 h-1.5 rounded-full accent-indigo-600 cursor-pointer" />
              </div>
            </div>

            <div className="p-5 bg-slate-50 rounded-2xl border border-slate-100 flex gap-4">
              <Info size={18} className="text-slate-400 shrink-0 mt-0.5" />
              <p className="text-sm text-slate-600 leading-relaxed font-medium">{step.description}</p>
            </div>
          </div>
        </div>

        {/* Right: Code & Theory */}
        <div className="lg:col-span-4 flex flex-col gap-8">
          <div className="p-8 bg-white border border-slate-200 rounded-3xl shadow-lg">
            <div className="flex items-center gap-3 mb-6">
              <Lightbulb className="text-amber-500 w-5 h-5" />
              <h2 className="font-bold text-xs uppercase tracking-widest text-slate-400">学習ガイド</h2>
            </div>
            <div className="p-5 bg-slate-50 rounded-2xl border border-slate-100 mb-6">
              <h3 className="text-indigo-600 font-bold mb-2 text-sm">挿入ソート</h3>
              <p className="text-xs text-slate-500 leading-relaxed font-medium">
                整列済みの部分に対して、新しい要素を適切な位置に「挿入」していく方法です。
                手持ちのトランプを1枚ずつ正しい順序に差し込む動作と同じ理屈です。
              </p>
            </div>
            <div className="grid grid-cols-2 gap-3 mono text-[10px] uppercase">
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                <span className="text-slate-400 block mb-1 font-bold">Complexity</span>
                <span className="text-indigo-600 font-black">O(N²)</span>
              </div>
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                <span className="text-slate-400 block mb-1 font-bold">Stability</span>
                <span className="text-slate-700 font-black">Stable</span>
              </div>
            </div>
          </div>

          <div className="p-8 bg-[#0f172a] border border-slate-800 rounded-3xl shadow-2xl flex-1 flex flex-col min-h-[400px]">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <Code2 className="text-slate-400 w-5 h-5" />
                <h2 className="font-bold text-xs uppercase tracking-widest text-slate-500">Python 実装例</h2>
              </div>
              <div className="w-1.5 h-1.5 rounded-full bg-indigo-500/50 shadow-[0_0_10px_rgba(99,102,241,0.5)]" />
            </div>

            <div className="flex-1 bg-black/20 p-6 rounded-2xl mono text-[11px] leading-loose overflow-auto border border-slate-800 scrollbar-hide text-slate-300">
              {CODE_PYTHON.map((line, i) => (
                <div
                  key={i}
                  className={`flex gap-6 transition-all duration-300 ${step.codeLine === i ? 'text-indigo-400 bg-indigo-500/10 -mx-6 px-6 border-l-2 border-indigo-400' : 'text-slate-600'}`}
                >
                  <span className="text-slate-800 tabular-nums w-4 select-none">{i + 1}</span>
                  <pre className="whitespace-pre">{line}</pre>
                </div>
              ))}
            </div>
            <div className="mt-4 text-center">
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest whitespace-nowrap overflow-hidden text-ellipsis">Insertion Sort // Core Logic</span>
            </div>
          </div>
        </div>
      </main>

      <footer className="mt-20 border-t border-slate-200 py-12 px-6 text-center">
        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.4em]">Fundamental Wisdom for the AI Era // Algorithm Literacy // しろいプログラミング教室</p>
      </footer>
    </div>
  );
}
