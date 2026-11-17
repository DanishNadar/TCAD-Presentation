"use client";
import { motion } from "motion/react";
import { ExternalLink, Swords, Database, ShieldCheck } from "lucide-react";
import { SceneHeader } from "@/components/ui/SceneHeader";
import { EvidenceBadge } from "@/components/ui/EvidenceBadge";
import { paperMeta } from "@/lib/research/publishedResults";
import { arxivUrl, authorsRepoUrl, paperUrl } from "@/lib/research/sources";

const contributions = [
  {
    Icon: Swords,
    color: "var(--color-anomaly)",
    title: "Real-time fabrication attacks",
    body: "Spoof or remove objects against early fusion (black-box ray casting) and intermediate fusion (white-box adversarial optimization). Attack for frame i is prepared during frame i−1 — no visible delay.",
  },
  {
    Icon: Database,
    color: "var(--color-sensor)",
    title: "Adv-OPV2V + real-world tests",
    body: "Benchmark built from OPV2V (CARLA): 10-frame scenarios with 3–5 CAVs. Real-vehicle validation with 3 Lincoln MKZs at the MCity testbed.",
  },
  {
    Icon: ShieldCheck,
    color: "var(--color-collab)",
    title: "CAD — Collaborative Anomaly Detection",
    body: "Shares lightweight occupancy maps and checks geometric consistency between vehicles and against the fused perception output.",
  },
];

export function S04Paper() {
  return (
    <div className="absolute inset-0 px-16 pb-10 pt-12">
      <SceneHeader
        kicker="04 · The original research"
        accent="var(--color-collab)"
        title="The paper we build on"
        right={<EvidenceBadge kind="published" detail="USENIX Security 2024" />}
      />

      <div className="mt-8 flex gap-12">
        {/* Stylised paper sheet */}
        <div style={{ perspective: 1400 }} className="shrink-0">
          <motion.div
            initial={{ rotateY: -24, rotateX: 8, opacity: 0, y: 30 }}
            animate={{ rotateY: -12, rotateX: 4, opacity: 1, y: 0 }}
            transition={{ duration: 1.1, ease: [0.22, 1, 0.36, 1] }}
            className="relative h-[620px] w-[470px] rounded-md border border-line bg-[#e9edf3] p-9 text-[#0b1220] shadow-[0_40px_120px_-30px_rgba(79,140,255,0.45)]"
          >
            <div className="text-center font-mono text-[10px] uppercase tracking-[0.18em] text-[#5b6474]">
              {paperMeta.venue} · {paperMeta.year} · pp. {paperMeta.pages}
            </div>
            <div className="mt-4 text-center font-display text-[24px] font-bold leading-tight">{paperMeta.title}</div>
            <div className="mt-4 text-center text-[13px] leading-snug text-[#2a3446]">{paperMeta.authors.join(", ")}</div>
            <div className="mt-1 text-center text-[11px] italic text-[#5b6474]">{paperMeta.affiliations}</div>
            <div className="mt-6 text-[11px] font-bold uppercase tracking-wider">Abstract</div>
            <div className="mt-2 space-y-[7px]">
              {Array.from({ length: 15 }).map((_, i) => {
                const highlight = i === 4 ? "anomaly" : i === 9 ? "collab" : i === 12 ? "sensor" : null;
                return (
                  <motion.div
                    key={i}
                    initial={{ scaleX: 0 }}
                    animate={{ scaleX: 1 }}
                    transition={{ delay: 0.5 + i * 0.04, duration: 0.5 }}
                    style={{
                      transformOrigin: "left",
                      width: `${i % 5 === 4 ? 62 : 92 + ((i * 7) % 8)}%`,
                      background: highlight ? `var(--color-${highlight})` : "#c3cad6",
                      opacity: highlight ? 0.85 : 1,
                    }}
                    className="h-[6px] rounded-full"
                  />
                );
              })}
            </div>
            <div className="mt-6 grid grid-cols-2 gap-3">
              <div className="h-[110px] rounded border border-[#c3cad6] bg-[#dfe4ec] p-2">
                <div className="h-full w-full rounded-sm" style={{ background: "radial-gradient(circle at 40% 55%, rgba(34,211,238,.5), transparent 60%)" }} />
              </div>
              <div className="h-[110px] rounded border border-[#c3cad6] bg-[#dfe4ec] p-2">
                <div className="flex h-full items-end gap-1">
                  {[60, 85, 72, 95, 40, 82].map((h, i) => (
                    <motion.div
                      key={i}
                      initial={{ height: 0 }}
                      animate={{ height: `${h}%` }}
                      transition={{ delay: 1.2 + i * 0.08 }}
                      className="flex-1 rounded-t-sm bg-[#4f8cff]"
                    />
                  ))}
                </div>
              </div>
            </div>
          </motion.div>
        </div>

        <div className="flex flex-1 flex-col">
          <div className="font-display text-[30px] font-semibold leading-tight">
            On Data Fabrication in Collaborative Vehicular Perception:{" "}
            <span className="text-ink-2">Attacks and Countermeasures</span>
          </div>
          <div className="mt-3 text-[17px] text-ink-2">
            Qingzhao Zhang, Shuowei Jin, Ruiyang Zhu, Jiachen Sun, Xumiao Zhang, Qi Alfred Chen, Z. Morley Mao
          </div>
          <div className="mt-1 text-[15px] text-ink-3">University of Michigan · UC Irvine · Google — 33rd USENIX Security Symposium, 2024</div>

          <div className="mt-6 rounded-xl border border-line bg-panel/70 p-4 text-[16px] leading-snug text-ink-2">
            <span className="text-ink">Research problem:</span> collaborative perception makes safety-critical perception depend on data from remote,
            untrusted vehicles. How damaging is data fabrication, and how can a receiver detect it?
          </div>

          <div className="mt-5 space-y-3">
            {contributions.map(({ Icon, color, title, body }, i) => (
              <motion.div
                key={title}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.6 + i * 0.18 }}
                className="flex gap-4 rounded-xl border border-line bg-panel/70 p-4"
              >
                <Icon size={22} style={{ color }} className="mt-0.5 shrink-0" />
                <div>
                  <div className="font-display text-[19px] font-medium">{title}</div>
                  <p className="text-[15px] leading-snug text-ink-2">{body}</p>
                </div>
              </motion.div>
            ))}
          </div>

          <p className="mt-4 text-[13.5px] text-ink-3">
            Every “Published” number in this deck is the authors' and traces to <span className="font-mono">research-data/published/*.csv</span> (Table 3, Abstract, §6.4). Adv-OPV2V data are not bundled.
          </p>
          <div className="mt-auto flex gap-3 pt-3">
            <a href={paperUrl} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 rounded-lg border border-collab/50 px-4 py-2 text-[15px] text-collab hover:bg-collab/10">
              <ExternalLink size={15} /> USENIX paper page
            </a>
            <a href={arxivUrl} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 rounded-lg border border-line px-4 py-2 text-[15px] text-ink-2 hover:text-ink">
              <ExternalLink size={15} /> arXiv:2309.12955
            </a>
            <a href={authorsRepoUrl} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 rounded-lg border border-line px-4 py-2 text-[15px] text-ink-2 hover:text-ink">
              <ExternalLink size={15} /> Authors' code &amp; Adv-OPV2V
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
