import { useState } from "react";
import { useAccount, useWriteContract, useWaitForTransactionReceipt, useReadContract } from "wagmi";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import { arcTestnet } from "./wagmi";

const ADDR = (import.meta.env.VITE_CONTRACT_ADDRESS as `0x${string}`) || "0x0000000000000000000000000000000000000000";
const ABI = [
  { name: "createPledge", type: "function", stateMutability: "nonpayable", inputs: [{ name: "pledge", type: "string" }, { name: "category", type: "string" }], outputs: [{ name: "", type: "uint256" }] },
  { name: "supportPledge", type: "function", stateMutability: "nonpayable", inputs: [{ name: "pledgeId", type: "uint256" }], outputs: [] },
  { name: "getRecentPledges", type: "function", stateMutability: "view", inputs: [{ name: "count", type: "uint256" }],
    outputs: [{ name: "", type: "tuple[]", components: [{ name: "id", type: "uint256" }, { name: "creator", type: "address" }, { name: "pledge", type: "string" }, { name: "category", type: "string" }, { name: "supporters", type: "uint256" }, { name: "createdAt", type: "uint256" }] }] },
  { name: "totalPledges", type: "function", stateMutability: "view", inputs: [], outputs: [{ name: "", type: "uint256" }] },
  { name: "hasSupported", type: "function", stateMutability: "view", inputs: [{ name: "", type: "uint256" }, { name: "", type: "address" }], outputs: [{ name: "", type: "bool" }] },
] as const;

const CATEGORIES = ["Health","Environment","Community","Education","Technology","Social"];
function timeAgo(ts: bigint) { const s=Math.floor(Date.now()/1000-Number(ts)); if(s<60)return"just now"; if(s<3600)return`${Math.floor(s/60)}m ago`; return`${Math.floor(s/3600)}h ago`; }
const CAT_COLORS: Record<string,string> = { Health:"#22c55e",Environment:"#16a34a",Community:"#06b6d4",Education:"#3b82f6",Technology:"#a855f7",Social:"#f97316" };

export default function App() {
  const { isConnected } = useAccount();
  const [pledge, setPledge] = useState(""); const [category, setCategory] = useState("Health"); const [done, setDone] = useState(false);
  const [supported, setSupported] = useState<Record<string, boolean>>({});
  const { data: hash, isPending, writeContract, error } = useWriteContract();
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash });
  const { data: pledges, refetch } = useReadContract({ address: ADDR, abi: ABI, functionName: "getRecentPledges", args: [BigInt(20)], query: { refetchInterval: 15000 } });
  const { data: total } = useReadContract({ address: ADDR, abi: ABI, functionName: "totalPledges" });

  if (isSuccess && !done) { setDone(true); refetch(); setTimeout(() => { setDone(false); setPledge(""); }, 3000); }
  const list = (pledges as any[] | undefined)?.slice().reverse() ?? [];
  const isLoading = isPending || isConfirming;

  return (
    <div className="min-h-screen bg-[#080b14]">
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-[-150px] left-1/2 -translate-x-1/2 w-[500px] h-[500px] rounded-full bg-[#22c55e]/6 blur-[120px]" />
      </div>
      <header className="flex items-center justify-between px-6 py-4 border-b border-white/10 sticky top-0 z-50 bg-[#080b14]/80 backdrop-blur-sm">
        <div className="flex items-center gap-2">
          <span className="text-2xl">🤝</span>
          <span className="font-bold text-white text-lg">onchain<span className="text-[#22c55e]">Pledge</span></span>
          <span className="hidden sm:block text-xs text-slate-500 bg-slate-800/60 px-2 py-0.5 rounded-full border border-slate-700">Arc Testnet</span>
        </div>
        <ConnectButton showBalance={false} chainStatus="icon" accountStatus="avatar" />
      </header>
      <main className="relative z-10 max-w-xl mx-auto px-4 py-8">
        <div className="text-center mb-8">
          <div className="text-6xl mb-4">🤝</div>
          <h1 className="text-4xl font-black text-white mb-3">Make a <span className="text-[#22c55e]">Pledge</span></h1>
          <p className="text-slate-400 text-sm">Commit to causes on Arc. Your pledge is permanent and public.</p>
        </div>
        <div className="grid grid-cols-2 gap-3 mb-6">
          {[{ label: "Total Pledges", value: total?.toString() ?? "—", icon: "🤝" }, { label: "Network", value: "Arc Testnet", icon: "⛓️" }].map(s => (
            <div key={s.label} className="bg-slate-900/60 border border-white/8 rounded-xl px-4 py-3 text-center">
              <div className="text-lg mb-0.5">{s.icon}</div><div className="text-white font-bold text-lg">{s.value}</div><div className="text-slate-500 text-xs mt-0.5">{s.label}</div>
            </div>
          ))}
        </div>
        <div className="bg-gradient-to-br from-slate-900 to-slate-800/50 border border-white/10 rounded-2xl p-6 mb-6 shadow-2xl">
          <h2 className="text-xl font-bold text-white mb-4">Make a Pledge 🤝</h2>
          <div className="space-y-3 mb-4">
            <textarea value={pledge} onChange={e => setPledge(e.target.value)} placeholder="I pledge to..." rows={3} maxLength={280}
              className="w-full bg-slate-800/80 border border-slate-700 rounded-xl px-4 py-3 text-white placeholder-slate-500 text-sm outline-none focus:border-[#22c55e]/60 transition-all resize-none" />
            <div>
              <label className="text-slate-400 text-xs mb-2 block">Category</label>
              <div className="flex flex-wrap gap-2">
                {CATEGORIES.map(c => (
                  <button key={c} onClick={() => setCategory(c)}
                    className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-all border ${category===c ? "text-white border-transparent" : "text-slate-400 border-slate-700 hover:text-white"}`}
                    style={category===c ? { backgroundColor: CAT_COLORS[c] } : {}}>
                    {c}
                  </button>
                ))}
              </div>
            </div>
          </div>
          {!isConnected ? <p className="text-slate-500 text-sm text-center py-2">Connect wallet to pledge</p>
          : done ? <div className="flex items-center justify-center gap-2 py-3 rounded-xl bg-[#22c55e]/15 border border-[#22c55e]/40 text-[#22c55e] font-semibold">✅ Pledge made on-chain!</div>
          : <button onClick={() => writeContract({ address: ADDR, abi: ABI, functionName: "createPledge", args: [pledge, category] })}
              disabled={isLoading || !pledge || pledge.length < 10}
              className="w-full py-3 rounded-xl font-bold text-sm bg-[#22c55e] text-black hover:bg-[#4ade80] active:scale-[0.98] disabled:opacity-50 transition-all flex items-center justify-center gap-2">
              {isLoading ? <><svg className="spinner w-4 h-4 border-2 border-current border-t-transparent rounded-full" viewBox="0 0 24 24" />{isPending ? "Confirm…" : "Pledging…"}</> : "🤝 Make Pledge"}
            </button>}
          {error && <p className="mt-2 text-red-400 text-xs text-center">{error.message?.includes("User rejected") ? "Cancelled" : error.message?.slice(0, 80)}</p>}
        </div>
        <h2 className="text-lg font-bold text-white mb-4">Recent Pledges</h2>
        <div className="space-y-3">
          {list.length === 0 && <div className="text-center py-10 text-slate-500"><p className="text-4xl mb-2">🤝</p><p>No pledges yet — be the first!</p></div>}
          {list.map((p: any) => (
            <div key={p.id.toString()} className="bg-slate-900/70 border border-white/8 rounded-2xl p-4">
              <div className="flex items-start justify-between gap-3 mb-2">
                <p className="text-white text-sm flex-1">{p.pledge}</p>
                <span className="text-xs px-2 py-0.5 rounded-full font-semibold shrink-0" style={{ backgroundColor: `${CAT_COLORS[p.category] || "#22c55e"}20`, color: CAT_COLORS[p.category] || "#22c55e", border: `1px solid ${CAT_COLORS[p.category] || "#22c55e"}40` }}>
                  {p.category}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <p className="text-slate-600 text-xs font-mono">{p.creator.slice(0,6)}…{p.creator.slice(-4)} · {timeAgo(p.createdAt)}</p>
                <button onClick={() => { if (!supported[p.id.toString()] && isConnected) { writeContract({ address: ADDR, abi: ABI, functionName: "supportPledge", args: [p.id] }); setSupported(s => ({...s,[p.id.toString()]:true})); } }}
                  disabled={supported[p.id.toString()] || !isConnected}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all bg-[#22c55e]/10 border border-[#22c55e]/20 text-[#22c55e] hover:bg-[#22c55e]/20 disabled:opacity-50 disabled:cursor-default">
                  🤝 {Number(p.supporters)}{supported[p.id.toString()] ? " ✓" : ""}
                </button>
              </div>
            </div>
          ))}
        </div>
        <footer className="mt-12 text-center text-xs text-slate-600">
          <p>Built on <a href="https://arc.network" className="hover:text-slate-400">Arc Network</a> · Chain ID {arcTestnet.id}</p>
        </footer>
      </main>
    </div>
  );
}
