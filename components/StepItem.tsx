
import React from 'react';
import { MathStep } from '../types';
import MathDisplay from './MathDisplay';
import { Lightbulb, Info, Target } from 'lucide-react';

interface StepItemProps {
  step: MathStep;
  index: number;
}

const StepItem: React.FC<StepItemProps> = ({ step, index }) => {
  return (
    <div className="relative pl-8 pb-8 last:pb-0" role="listitem">
      {/* Timeline connector */}
      <div className="absolute left-3 top-0 bottom-0 w-0.5 bg-indigo-100 last:hidden" aria-hidden="true"></div>
      
      {/* Step circle */}
      <div 
        className="absolute left-0 top-0 w-6 h-6 rounded-full bg-indigo-500 border-4 border-white shadow-sm flex items-center justify-center text-[10px] text-white font-bold"
        aria-label={`Step ${index + 1}`}
      >
        {index + 1}
      </div>

      <div className="bg-white rounded-xl border border-slate-100 p-4 shadow-sm hover:shadow-md transition-shadow">
        <div className="mb-4 text-center py-3 bg-slate-50 rounded-lg">
          <MathDisplay math={step.math} block className="text-xl text-indigo-900" />
        </div>

        <div className="space-y-3">
          <section className="flex gap-3">
            <div className="mt-1 flex-shrink-0">
              <Info className="w-4 h-4 text-blue-500" aria-hidden="true" />
            </div>
            <div>
              <p className="text-sm font-semibold text-slate-700">What we do:</p>
              <p className="text-slate-600 text-sm leading-relaxed">{step.explanation}</p>
            </div>
          </section>

          <section className="flex gap-3">
            <div className="mt-1 flex-shrink-0">
              <Target className="w-4 h-4 text-emerald-500" aria-hidden="true" />
            </div>
            <div>
              <p className="text-sm font-semibold text-slate-700">Why we do it:</p>
              <p className="text-slate-600 text-sm leading-relaxed italic">{step.why}</p>
            </div>
          </section>

          {step.symbolsIntroduced && step.symbolsIntroduced.length > 0 && (
            <section className="flex gap-3 pt-2">
              <div className="mt-1 flex-shrink-0">
                <Lightbulb className="w-4 h-4 text-amber-500" aria-hidden="true" />
              </div>
              <div className="flex flex-wrap gap-2">
                {step.symbolsIntroduced.map((symbol, idx) => (
                  <span 
                    key={idx} 
                    className="px-2 py-0.5 bg-amber-50 text-amber-700 text-[11px] font-medium rounded-full border border-amber-100"
                    role="note"
                  >
                    Symbol Tip: {symbol}
                  </span>
                ))}
              </div>
            </section>
          )}
        </div>
      </div>
    </div>
  );
};

export default StepItem;
