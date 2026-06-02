import { useEffect, useState } from "react";

export default function DimBar({ label, value, delay = 0 }) {
  const [w, setW] = useState(0);

  useEffect(() => {
    const t = setTimeout(() => setW(value * 10), delay + 100);
    return () => clearTimeout(t);
  }, [value, delay]);

  const col = value >= 8 ? "#10B981" : value >= 6 ? "#3B82F6" : value >= 4 ? "#F59E0B" : "#EF4444";

  return (
    <div style={{ marginBottom: 12 }}>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 5 }}>
        <span style={{ fontSize: 12, fontWeight: 500, color: "#94A3B8" }}>{label}</span>
        <span style={{ fontSize: 12, fontWeight: 700, color: col }}>
          {value}
          <span style={{ color: "#CBD5E1", fontWeight: 400 }}>/10</span>
        </span>
      </div>
      <div style={{ height: 4, background: "#1E293B", borderRadius: 99, overflow: "hidden" }}>
        <div
          style={{
            height: "100%",
            width: `${w}%`,
            background: `linear-gradient(90deg,${col}99,${col})`,
            borderRadius: 99,
            transition: "width 0.8s cubic-bezier(.4,0,.2,1)",
          }}
        />
      </div>
    </div>
  );
}
