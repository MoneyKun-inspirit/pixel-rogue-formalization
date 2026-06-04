import { RotateCcw } from "lucide-react";

interface RunSummaryPanelProps {
  heroName: string;
  ending: "defeat" | "victory";
  summaryLines: string[];
  onRestart: () => void;
}

export function RunSummaryPanel({ heroName, ending, summaryLines, onRestart }: RunSummaryPanelProps) {
  return (
    <div className="absolute inset-0 flex items-center justify-center bg-slate-950/75 px-6">
      <div className="w-full max-w-2xl rounded-[32px] border border-white/10 bg-[#09111f]/95 p-8 text-center shadow-[0_30px_120px_rgba(2,8,24,0.78)]">
        <p className="font-display text-xs uppercase tracking-[0.42em] text-cyan-200/70">{ending === "victory" ? "试玩完成" : "本局结束"}</p>
        <h3 className="mt-3 font-display text-4xl text-white">{heroName}</h3>
        <p className="mt-3 text-sm text-slate-300">
          {ending === "victory" ? "你成功撑到了试玩终点，当前构筑已经具备爽感。" : "怪群强度压过了当前构筑，可以换职业或换一套技能路线再试。"}
        </p>
        <div className="mt-6 space-y-3 rounded-[24px] border border-white/8 bg-white/5 p-5 text-left text-sm text-slate-200">
          {summaryLines.map((line) => (
            <p key={line}>{line}</p>
          ))}
        </div>
        <button
          type="button"
          onClick={onRestart}
          className="mt-6 inline-flex items-center gap-2 rounded-full border border-cyan-300/40 bg-cyan-300/10 px-5 py-3 text-sm text-cyan-100 transition hover:bg-cyan-300/20"
        >
          <RotateCcw className="size-4" />
          再来一局
        </button>
      </div>
    </div>
  );
}
