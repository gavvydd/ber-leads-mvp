"use client";
export type Lead = {
  id: string;
  created_at: string;
  county: string | null;
  town: string | null;
  eircode: string | null;
  property_type: string | null;
  purpose: string | null;
  size_band: string | null;
  bedrooms: number | null;
  timing: string | null;
  extras: string[] | null;
  name: string | null;
  phone: string | null;
  email: string | null;
};

import { useEffect, useMemo, useState } from "react";

type SortKey = "created_at" | "county" | "purpose";
type SortDir = "desc" | "asc";

function safeLower(v: unknown) {
  return String(v ?? "").toLowerCase();
}

function formatDateClientOnly(iso: string) {
  // Avoid hydration issues by formatting ONLY on client after mount.
  // We’ll render ISO in initial HTML and replace it after mount.
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleString(); // uses user locale
}

function toCsvValue(v: unknown) {
  const s = String(v ?? "");
  // Escape quotes and wrap in quotes
  return `"${s.replaceAll(`"`, `""`)}"`;
}

function downloadCsv(filename: string, rows: string[][]) {
  const csv = rows.map((r) => r.map(toCsvValue).join(",")).join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

async function copyToClipboard(text: string) {
  try {
    await navigator.clipboard.writeText(text);
  } catch {
    // fallback
    const ta = document.createElement("textarea");
    ta.value = text;
    document.body.appendChild(ta);
    ta.select();
    document.execCommand("copy");
    document.body.removeChild(ta);
  }
}

export default function AdminClient({ leads }: { leads: Lead[] }) {
  const [mounted, setMounted] = useState(false);

  // Filters
  const [q, setQ] = useState("");
  const [county, setCounty] = useState("");
  const [purpose, setPurpose] = useState("");

  // Sorting
  const [sortKey, setSortKey] = useState<SortKey>("created_at");
  const [sortDir, setSortDir] = useState<SortDir>("desc");

  useEffect(() => setMounted(true), []);

  const counties = useMemo(() => {
    const set = new Set<string>();
    for (const l of leads) if (l.county) set.add(l.county);
    return Array.from(set).sort((a, b) => a.localeCompare(b));
  }, [leads]);

  const purposes = useMemo(() => {
    const set = new Set<string>();
    for (const l of leads) if (l.purpose) set.add(l.purpose);
    return Array.from(set).sort((a, b) => a.localeCompare(b));
  }, [leads]);

  const filtered = useMemo(() => {
    const qq = q.trim().toLowerCase();

    return leads.filter((l) => {
      if (county && (l.county ?? "") !== county) return false;
      if (purpose && (l.purpose ?? "") !== purpose) return false;

      if (!qq) return true;

      const hay = [
        l.county,
        l.town,
        l.eircode,
        l.property_type,
        l.purpose,
        l.size_band,
        l.timing,
        (l.extras ?? []).join(", "),
        l.name,
        l.phone,
        l.email,
        l.id,
      ]
        .map(safeLower)
        .join(" | ");

      return hay.includes(qq);
    });
  }, [leads, q, county, purpose]);

  const sorted = useMemo(() => {
    const arr = [...filtered];

    arr.sort((a, b) => {
      let av = "";
      let bv = "";

      if (sortKey === "created_at") {
        const at = new Date(a.created_at).getTime();
        const bt = new Date(b.created_at).getTime();
        return sortDir === "desc" ? bt - at : at - bt;
      }

      if (sortKey === "county") {
        av = a.county ?? "";
        bv = b.county ?? "";
      } else if (sortKey === "purpose") {
        av = a.purpose ?? "";
        bv = b.purpose ?? "";
      }

      const cmp = av.localeCompare(bv);
      return sortDir === "desc" ? -cmp : cmp;
    });

    return arr;
  }, [filtered, sortKey, sortDir]);

  const total = leads.length;
  const shown = sorted.length;

  const headerCell: React.CSSProperties = {
    textAlign: "left",
    padding: "14px 12px",
    fontSize: 12,
    letterSpacing: 0.2,
    color: "rgba(0,0,0,0.62)",
    borderBottom: "1px solid rgba(0,0,0,0.06)",
    position: "sticky",
    top: 0,
    background: "#fcfcfc",
    whiteSpace: "nowrap",
    zIndex: 1,
  };

  const cell: React.CSSProperties = {
    padding: "12px 12px",
    borderBottom: "1px solid rgba(0,0,0,0.06)",
    fontSize: 14,
    verticalAlign: "top",
    color: "rgba(0,0,0,0.86)",
  };

  function SortButton({ k, label }: { k: SortKey; label: string }) {
    const active = sortKey === k;
    return (
      <button
        type="button"
        onClick={() => {
          if (sortKey !== k) {
            setSortKey(k);
            setSortDir("desc");
          } else {
            setSortDir((d) => (d === "desc" ? "asc" : "desc"));
          }
        }}
        style={{
          border: "1px solid rgba(0,0,0,0.10)",
          background: active ? "rgba(0,0,0,0.06)" : "#fff",
          borderRadius: 999,
          padding: "10px 12px",
          fontWeight: 850,
          cursor: "pointer",
          fontSize: 13,
        }}
      >
        {label}{" "}
        {active ? (
          <span style={{ opacity: 0.65 }}>{sortDir === "desc" ? "↓" : "↑"}</span>
        ) : null}
      </button>
    );
  }

  return (
    <main suppressHydrationWarning style={{ background: "#fafafa", minHeight: "100vh" }}>

      <div style={{ maxWidth: 1280, margin: "0 auto", padding: "48px 16px" }}>
        {/* Header */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            gap: 16,
            alignItems: "baseline",
            flexWrap: "wrap",
          }}
        >
          <div>
            <h1 style={{ fontSize: 46, fontWeight: 950, letterSpacing: -1.1, margin: 0 }}>
              Admin Dashboard
            </h1>
            <p style={{ color: "rgba(0,0,0,0.60)", marginTop: 10, marginBottom: 0 }}>
              Leads: showing <b>{shown}</b> of <b>{total}</b> (max 200 loaded)
            </p>
          </div>

          <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
            <SortButton k="created_at" label="Sort: Created" />
            <SortButton k="county" label="Sort: County" />
            <SortButton k="purpose" label="Sort: Purpose" />

            <button
              type="button"
              onClick={() => {
                const rows: string[][] = [
                  [
                    "created_at",
                    "county",
                    "town",
                    "eircode",
                    "property_type",
                    "purpose",
                    "size_band",
                    "bedrooms",
                    "timing",
                    "extras",
                    "name",
                    "phone",
                    "email",
                    "id",
                  ],
                  ...sorted.map((l) => [
                    l.created_at,
                    l.county ?? "",
                    l.town ?? "",
                    l.eircode ?? "",
                    l.property_type ?? "",
                    l.purpose ?? "",
                    l.size_band ?? "",
                    l.bedrooms?.toString() ?? "",
                    l.timing ?? "",
                    (l.extras ?? []).join(", "),
                    l.name ?? "",
                    l.phone ?? "",
                    l.email ?? "",
                    l.id,
                  ]),
                ];
                downloadCsv(`leads-${new Date().toISOString().slice(0, 10)}.csv`, rows);
              }}
              style={{
                border: "1px solid rgba(0,0,0,0.10)",
                background: "#111",
                color: "#fff",
                borderRadius: 999,
                padding: "10px 12px",
                fontWeight: 900,
                cursor: "pointer",
                fontSize: 13,
              }}
            >
              Export CSV
            </button>
          </div>
        </div>

        {/* Controls */}
        <div
          style={{
            marginTop: 18,
            display: "grid",
            gridTemplateColumns: "1.6fr 1fr 1fr auto",
            gap: 12,
          }}
        >
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search: name, phone, email, town, eircode…"
            style={{
              width: "100%",
              borderRadius: 16,
              padding: "12px 14px",
              border: "1px solid rgba(0,0,0,0.10)",
              background: "#fff",
              fontSize: 14,
              outline: "none",
            }}
          />

          <select
            value={county}
            onChange={(e) => setCounty(e.target.value)}
            style={{
              width: "100%",
              borderRadius: 16,
              padding: "12px 14px",
              border: "1px solid rgba(0,0,0,0.10)",
              background: "#fff",
              fontSize: 14,
              outline: "none",
            }}
          >
            <option value="">All counties</option>
            {counties.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>

          <select
            value={purpose}
            onChange={(e) => setPurpose(e.target.value)}
            style={{
              width: "100%",
              borderRadius: 16,
              padding: "12px 14px",
              border: "1px solid rgba(0,0,0,0.10)",
              background: "#fff",
              fontSize: 14,
              outline: "none",
            }}
          >
            <option value="">All purposes</option>
            {purposes.map((p) => (
              <option key={p} value={p}>
                {p}
              </option>
            ))}
          </select>

          <button
            type="button"
            onClick={() => {
              setQ("");
              setCounty("");
              setPurpose("");
              setSortKey("created_at");
              setSortDir("desc");
            }}
            style={{
              border: "1px solid rgba(0,0,0,0.10)",
              background: "#fff",
              borderRadius: 16,
              padding: "12px 14px",
              fontWeight: 900,
              cursor: "pointer",
              fontSize: 13,
              whiteSpace: "nowrap",
            }}
          >
            Reset
          </button>
        </div>

        {/* Table */}
        <div
          style={{
            marginTop: 16,
            background: "#fff",
            border: "1px solid rgba(0,0,0,0.08)",
            borderRadius: 20,
            overflow: "auto",
            boxShadow: "0 10px 30px rgba(0,0,0,0.06)",
          }}
        >
          <table style={{ width: "100%", borderCollapse: "separate", borderSpacing: 0, minWidth: 1200 }}>
            <thead>
              <tr style={{ background: "#fcfcfc" }}>
                <th style={headerCell}>Created</th>
                <th style={headerCell}>County</th>
                <th style={headerCell}>Town</th>
                <th style={headerCell}>Eircode</th>
                <th style={headerCell}>Type</th>
                <th style={headerCell}>Purpose</th>
                <th style={headerCell}>Size (m²)</th>
                <th style={headerCell}>Bedrooms</th>
                <th style={headerCell}>Date/Time</th>
                <th style={headerCell}>Extras</th>
                <th style={headerCell}>Name</th>
                <th style={headerCell}>Phone</th>
                <th style={headerCell}>Email</th>
                <th style={headerCell}>ID</th>
                <th style={headerCell}>Actions</th>
              </tr>
            </thead>

            <tbody>
              {sorted.length === 0 ? (
                <tr>
                  <td colSpan={15} style={{ padding: 18, color: "rgba(0,0,0,0.55)" }}>
                    No leads match your filters.
                  </td>
                </tr>
              ) : (
                sorted.map((l, idx) => (
                  <tr
                    key={l.id}
                    style={{
                      background: idx % 2 === 0 ? "#fff" : "rgba(0,0,0,0.015)",
                    }}
                  >
                    <td style={{ ...cell, whiteSpace: "nowrap" }}>
                      {/* Hydration-safe: show ISO until mounted, then show locale */}
                      <span suppressHydrationWarning>
                        {mounted ? formatDateClientOnly(l.created_at) : l.created_at}
                      </span>
                    </td>

                    <td style={cell}>{l.county ?? ""}</td>
                    <td style={cell}>{l.town ?? ""}</td>
                    <td style={cell}>{l.eircode ?? ""}</td>
                    <td style={cell}>{l.property_type ?? ""}</td>
                    <td style={cell}>{l.purpose ?? ""}</td>
                    <td style={cell}>{l.size_band ?? ""}</td>
                    <td style={cell}>{l.bedrooms ?? ""}</td>
                    <td style={cell}>{l.timing ?? ""}</td>
                    <td style={cell}>{(l.extras ?? []).join(", ")}</td>
                    <td style={cell}>{l.name ?? ""}</td>
                    <td style={{ ...cell, whiteSpace: "nowrap" }}>{l.phone ?? ""}</td>
                    <td style={{ ...cell, whiteSpace: "nowrap" }}>{l.email ?? ""}</td>
                    <td style={{ ...cell, whiteSpace: "nowrap", fontSize: 12, color: "rgba(0,0,0,0.65)" }}>
                      {l.id}
                    </td>

                    <td style={{ ...cell, whiteSpace: "nowrap" }}>
                      <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                        <button
                          type="button"
                          onClick={() => copyToClipboard(l.phone ?? "")}
                          disabled={!l.phone}
                          style={{
                            border: "1px solid rgba(0,0,0,0.10)",
                            background: "#fff",
                            borderRadius: 999,
                            padding: "8px 10px",
                            fontWeight: 900,
                            cursor: l.phone ? "pointer" : "not-allowed",
                            opacity: l.phone ? 1 : 0.4,
                            fontSize: 12,
                          }}
                        >
                          Copy phone
                        </button>

                        <button
                          type="button"
                          onClick={() => copyToClipboard(l.email ?? "")}
                          disabled={!l.email}
                          style={{
                            border: "1px solid rgba(0,0,0,0.10)",
                            background: "#fff",
                            borderRadius: 999,
                            padding: "8px 10px",
                            fontWeight: 900,
                            cursor: l.email ? "pointer" : "not-allowed",
                            opacity: l.email ? 1 : 0.4,
                            fontSize: 12,
                          }}
                        >
                          Copy email
                        </button>

                        <button
                          type="button"
                          onClick={() => copyToClipboard(l.eircode ?? "")}
                          disabled={!l.eircode}
                          style={{
                            border: "1px solid rgba(0,0,0,0.10)",
                            background: "#fff",
                            borderRadius: 999,
                            padding: "8px 10px",
                            fontWeight: 900,
                            cursor: l.eircode ? "pointer" : "not-allowed",
                            opacity: l.eircode ? 1 : 0.4,
                            fontSize: 12,
                          }}
                        >
                          Copy eircode
                        </button>

                        <button
                          type="button"
                          onClick={() => copyToClipboard(l.id)}
                          style={{
                            border: "1px solid rgba(0,0,0,0.10)",
                            background: "#111",
                            color: "#fff",
                            borderRadius: 999,
                            padding: "8px 10px",
                            fontWeight: 900,
                            cursor: "pointer",
                            fontSize: 12,
                          }}
                        >
                          Copy ID
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <p style={{ marginTop: 12, color: "rgba(0,0,0,0.50)", fontSize: 12 }}>
          This page uses the service role key on the server. Do not expose it in client components.
        </p>
      </div>
    </main>
  );
}
