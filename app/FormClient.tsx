"use client";

import { useMemo, useState } from "react";
import { supabase } from "@/lib/supabaseClient";

type FormState = {
  county: string;
  town: string;
  eircode: string;

  preferredDate: string; // "flexible" OR ISO "YYYY-MM-DD"
  preferredTime: string; // label like "Any time"

  propertyType: string;
  purpose: string;

  sizeBandM2: string; // label like "Under 80 m²"
  bedrooms: string;

  extras: string[];
  heatPump: string;

  name: string;
  phone: string;
  email: string;
};

const COUNTIES = [
  "Carlow","Cavan","Clare","Cork","Donegal","Dublin","Galway","Kerry","Kildare","Kilkenny","Laois","Leitrim","Limerick","Longford","Louth","Mayo","Meath","Monaghan","Offaly","Roscommon","Sligo","Tipperary","Waterford","Westmeath","Wexford","Wicklow"
];

const PROPERTY_TYPES = ["Detached", "Semi-Detached", "Terraced", "Apartment"];

const PURPOSES = [
  "Sale",
  "Rental",
  "Mortgage",
  "New build",
  "Grant / retrofit",
  "Curiosity / energy upgrade",
];

const SIZE_BANDS_M2 = [
  "Under 80 m²",
  "80–100 m²",
  "100–120 m²",
  "120–150 m²",
  "150–180 m²",
  "180–220 m²",
  "220+ m²",
];

const BEDROOMS = ["Studio", "1", "2", "3", "4", "5+"];

const EXTRAS = [
  "Attic conversion",
  "Garage conversion",
  "Conservatory",
  "1-storey extension",
  "2-storey extension",
  "Granny flat / annex",
];

function makeNextDaysLabels(days: number) {
  const out: { label: string; iso: string }[] = [];
  const now = new Date();

  for (let i = 0; i < days; i++) {
    const d = new Date(now);
    d.setHours(12, 0, 0, 0); // prevents timezone edge cases
    d.setDate(now.getDate() + i);

    const iso = d.toISOString().slice(0, 10); // stable key

    // stable label based on ISO (not locale)
    const [y, m, day] = iso.split("-").map(Number);
    const labelDate = new Date(y, m - 1, day, 12, 0, 0);
    const label = labelDate.toLocaleDateString("en-IE", {
      weekday: "short",
      day: "numeric",
      month: "short",
    });

    out.push({ label, iso });
  }

  return out;
}


export default function HomePage() {
  const dateOptions = useMemo(() => makeNextDaysLabels(10), []);
  const timeOptions = useMemo(
    () => ["Any time", "8am – 10am", "10am – 2pm", "2pm – 6pm", "6pm – 8pm"],
    []
  );

  const [step, setStep] = useState(0);
  const [status, setStatus] = useState<string>("");
  const [loading, setLoading] = useState(false);

  const [form, setForm] = useState<FormState>({
    county: "",
    town: "",
    eircode: "",

    preferredDate: "",
    preferredTime: "",

    propertyType: "",
    purpose: "",

    sizeBandM2: "",
    bedrooms: "",

    extras: [],
    heatPump: "",

    name: "",
    phone: "",
    email: "",
  });

  const steps = [
    { title: "Address", subtitle: "Where is the property?" },
    { title: "Preferred date", subtitle: "Pick a day that suits you." },
    { title: "Preferred time", subtitle: "Pick a time window." },
    { title: "Property type", subtitle: "So we can match the right assessor." },
    { title: "Purpose", subtitle: "Why do you need the BER?" },
    { title: "Approx. size (m²)", subtitle: "A quick estimate is enough." },
    { title: "Bedrooms", subtitle: "Include all bedrooms regardless of use." },
    { title: "Extras", subtitle: "Any additions or features?" },
    { title: "Heat pump", subtitle: "Is a heat pump installed?" },
    { title: "Contact", subtitle: "Where should quotes be sent?" },
  ];

  const progress = Math.round(((step + 1) / steps.length) * 100);

  function next() {
    setStatus("");

    if (step === 0) {
      if (!form.county) return setStatus("Please select a county.");
      if (!form.town || form.town.trim().length < 2) return setStatus("Please type the closest town.");
      if (!form.eircode || form.eircode.trim().length < 3) return setStatus("Please enter an Eircode (or area).");
    }
    if (step === 1 && !form.preferredDate) return setStatus("Please select a preferred date.");
    if (step === 2 && !form.preferredTime) return setStatus("Please select a preferred time.");
    if (step === 3 && !form.propertyType) return setStatus("Please select a property type.");
    if (step === 4 && !form.purpose) return setStatus("Please select a purpose.");
    if (step === 5 && !form.sizeBandM2) return setStatus("Please select an approximate size.");
    if (step === 6 && !form.bedrooms) return setStatus("Please select bedrooms.");
    if (step === 8 && !form.heatPump) return setStatus("Please select heat pump option.");
    if (step === 9) {
      if (!form.name.trim()) return setStatus("Please enter your name.");
      if (!form.phone.trim()) return setStatus("Please enter your phone.");
      if (!form.email.trim() || !form.email.includes("@")) return setStatus("Please enter a valid email.");
    }

    setStep((s) => Math.min(s + 1, steps.length - 1));
  }

  function back() {
    setStatus("");
    setStep((s) => Math.max(0, s - 1));
  }

  function toggleExtra(x: string) {
    setForm((f) => {
      const exists = f.extras.includes(x);
      return { ...f, extras: exists ? f.extras.filter((e) => e !== x) : [...f.extras, x] };
    });
  }

  async function submit() {
    setStatus("");
    setLoading(true);
    try {
      const timing = `${form.preferredDate} • ${form.preferredTime}`;

      const payload = {
        county: form.county || null,
        town: form.town.trim() || null,
        eircode: form.eircode.trim() || null,

        property_type: form.propertyType || null,
        purpose: form.purpose || null,

        size_band: form.sizeBandM2 || null,
        bedrooms: form.bedrooms === "Studio" ? 0 : form.bedrooms === "5+" ? 5 : Number(form.bedrooms),

        timing,
        extras: form.extras.length ? form.extras : null,

        name: form.name.trim() || null,
        phone: form.phone.trim() || null,
        email: form.email.trim() || null,
      };

      const { error } = await supabase.from("leads").insert([payload]);
      if (error) throw error;

      setStatus("✅ Request submitted. Assessors will contact you soon.");
      setStep(0);
      setForm({
        county: "",
        town: "",
        eircode: "",
        preferredDate: "",
        preferredTime: "",
        propertyType: "",
        purpose: "",
        sizeBandM2: "",
        bedrooms: "",
        extras: [],
        heatPump: "",
        name: "",
        phone: "",
        email: "",
      });
    } catch (e: any) {
      setStatus(e?.message || "Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  const Card = ({ children }: { children: React.ReactNode }) => (
    <div
      style={{
        background: "#ffffff",
        border: "1px solid rgba(0,0,0,0.08)",
        borderRadius: 24,
        boxShadow: "0 14px 40px rgba(0,0,0,0.06)",
        padding: 22,
      }}
    >
      {children}
    </div>
  );

  const OptionButton = ({
    label,
    active,
    onClick,
  }: {
    label: string;
    active: boolean;
    onClick: () => void;
  }) => (
    <button
      onClick={onClick}
      type="button"
      style={{
        width: "100%",
        textAlign: "left",
        padding: "16px 16px",
        borderRadius: 18,
        border: active ? "1px solid rgba(0,0,0,0.18)" : "1px solid rgba(0,0,0,0.08)",
        background: active ? "rgba(0,0,0,0.04)" : "#fff",
        boxShadow: active ? "0 10px 24px rgba(0,0,0,0.08)" : "none",
        fontWeight: 650,
        fontSize: 15,
        cursor: "pointer",
      }}
    >
      {label}
    </button>
  );

  const inputStyle: React.CSSProperties = {
    marginTop: 8,
    width: "100%",
    borderRadius: 18,
    padding: "14px 14px",
    border: "1px solid rgba(0,0,0,0.10)",
    background: "#fff",
    fontSize: 15,
    outline: "none",
  };

  return (
    <main style={{ background: "#fafafa", minHeight: "100vh" }}>
      <div style={{ maxWidth: 980, margin: "0 auto", padding: "54px 16px" }}>
        <h1 style={{ fontSize: 54, fontWeight: 900, letterSpacing: -1.2, margin: 0, lineHeight: 1.02 }}>
          Get BER quotes—fast, simple, and competitive.
        </h1>
        <p style={{ marginTop: 12, fontSize: 18, color: "rgba(0,0,0,0.62)", maxWidth: 760 }}>
          Submit one request. We share it with relevant assessors so you get competitive quotes without ringing around.
        </p>

        <div style={{ marginTop: 26 }}>
          <Card>
            <div style={{ display: "flex", justifyContent: "space-between", gap: 12, alignItems: "center" }}>
              <div style={{ color: "rgba(0,0,0,0.65)", fontSize: 13, fontWeight: 650 }}>
                Step {step + 1} of {steps.length}
              </div>
              <div style={{ color: "rgba(0,0,0,0.55)", fontSize: 13, fontWeight: 650 }}>{progress}%</div>
            </div>

            <div style={{ marginTop: 10, height: 10, background: "rgba(0,0,0,0.06)", borderRadius: 999 }}>
              <div
                style={{
                  width: `${progress}%`,
                  height: "100%",
                  background: "#111",
                  borderRadius: 999,
                  transition: "width 200ms ease",
                }}
              />
            </div>

            <div style={{ marginTop: 22 }}>
              <h2 style={{ margin: 0, fontSize: 34, fontWeight: 850, letterSpacing: -0.6 }}>
                {steps[step].title}
              </h2>
              <p style={{ marginTop: 8, marginBottom: 0, color: "rgba(0,0,0,0.62)", fontSize: 16 }}>
                {steps[step].subtitle}
              </p>
            </div>

            <div style={{ marginTop: 18 }}>
              {step === 0 && (
                <div style={{ display: "grid", gap: 14 }}>
                  <div>
                    <label style={{ fontSize: 13, fontWeight: 700, color: "rgba(0,0,0,0.65)" }}>County</label>
                    <select
                      value={form.county}
                      onChange={(e) => setForm((f) => ({ ...f, county: e.target.value }))}
                      style={inputStyle}
                    >
                      <option value="">Select county</option>
                      {COUNTIES.map((c) => (
                        <option key={c} value={c}>{c}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label style={{ fontSize: 13, fontWeight: 700, color: "rgba(0,0,0,0.65)" }}>
                      Closest town / area
                    </label>
                    <input
                      value={form.town}
                      onChange={(e) => setForm((f) => ({ ...f, town: e.target.value }))}
                      placeholder="e.g. Carrick-on-Shannon"
                      style={inputStyle}
                    />
                    <div style={{ marginTop: 6, fontSize: 12, color: "rgba(0,0,0,0.50)" }}>
                      Just type the nearest town to the property.
                    </div>
                  </div>

                  <div>
                    <label style={{ fontSize: 13, fontWeight: 700, color: "rgba(0,0,0,0.65)" }}>Eircode</label>
                    <input
                      value={form.eircode}
                      onChange={(e) => setForm((f) => ({ ...f, eircode: e.target.value.toUpperCase() }))}
                      placeholder="e.g. A65 F4E2"
                      style={inputStyle}
                    />
                  </div>
                </div>
              )}

              {step === 1 && (
                <div style={{ display: "grid", gap: 12, gridTemplateColumns: "1fr 1fr" }}>
                  <OptionButton
                    label="I’m flexible"
                    active={form.preferredDate === "I’m flexible"}
                    onClick={() => setForm((f) => ({ ...f, preferredDate: "I’m flexible" }))}
                  />
                  <div />
                  {dateOptions.map((d) => (
                    <OptionButton
                      key={d.iso}
                      label={d.label}
                      active={form.preferredDate === d.label}
                      onClick={() => setForm((f) => ({ ...f, preferredDate: d.label }))}
                    />
                  ))}
                </div>
              )}

              {step === 2 && (
                <div style={{ display: "grid", gap: 12, gridTemplateColumns: "1fr 1fr" }}>
                  {timeOptions.map((t) => (
                    <OptionButton
                      key={t}
                      label={t}
                      active={form.preferredTime === t}
                      onClick={() => setForm((f) => ({ ...f, preferredTime: t }))}
                    />
                  ))}
                </div>
              )}

              {step === 3 && (
                <div style={{ display: "grid", gap: 12, gridTemplateColumns: "1fr 1fr" }}>
                  {PROPERTY_TYPES.map((t) => (
                    <OptionButton
                      key={t}
                      label={t}
                      active={form.propertyType === t}
                      onClick={() => setForm((f) => ({ ...f, propertyType: t }))}
                    />
                  ))}
                </div>
              )}

              {step === 4 && (
                <div>
                  <label style={{ fontSize: 13, fontWeight: 700, color: "rgba(0,0,0,0.65)" }}>Purpose</label>
                  <select
                    value={form.purpose}
                    onChange={(e) => setForm((f) => ({ ...f, purpose: e.target.value }))}
                    style={inputStyle}
                  >
                    <option value="">Select purpose</option>
                    {PURPOSES.map((p) => (
                      <option key={p} value={p}>{p}</option>
                    ))}
                  </select>
                </div>
              )}

              {step === 5 && (
                <div style={{ display: "grid", gap: 12, gridTemplateColumns: "1fr 1fr" }}>
                  {SIZE_BANDS_M2.map((b) => (
                    <OptionButton
                      key={b}
                      label={b}
                      active={form.sizeBandM2 === b}
                      onClick={() => setForm((f) => ({ ...f, sizeBandM2: b }))}
                    />
                  ))}
                </div>
              )}

              {step === 6 && (
                <div style={{ display: "grid", gap: 12, gridTemplateColumns: "1fr 1fr" }}>
                  {BEDROOMS.map((b) => (
                    <OptionButton
                      key={b}
                      label={b}
                      active={form.bedrooms === b}
                      onClick={() => setForm((f) => ({ ...f, bedrooms: b }))}
                    />
                  ))}
                </div>
              )}

              {step === 7 && (
                <div style={{ display: "grid", gap: 12, gridTemplateColumns: "1fr 1fr" }}>
                  {EXTRAS.map((x) => (
                    <OptionButton
                      key={x}
                      label={x}
                      active={form.extras.includes(x)}
                      onClick={() => toggleExtra(x)}
                    />
                  ))}
                  <OptionButton
                    label="None"
                    active={form.extras.length === 0}
                    onClick={() => setForm((f) => ({ ...f, extras: [] }))}
                  />
                </div>
              )}

              {step === 8 && (
                <div style={{ display: "grid", gap: 12, gridTemplateColumns: "1fr 1fr" }}>
                  {["No", "Air Source", "Ground Source"].map((hp) => (
                    <OptionButton
                      key={hp}
                      label={hp}
                      active={form.heatPump === hp}
                      onClick={() => setForm((f) => ({ ...f, heatPump: hp }))}
                    />
                  ))}
                </div>
              )}

              {step === 9 && (
                <div style={{ display: "grid", gap: 14 }}>
                  <div>
                    <label style={{ fontSize: 13, fontWeight: 700, color: "rgba(0,0,0,0.65)" }}>Name</label>
                    <input
                      value={form.name}
                      onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                      placeholder="Your name"
                      style={inputStyle}
                    />
                  </div>

                  <div style={{ display: "grid", gap: 12, gridTemplateColumns: "1fr 1fr" }}>
                    <div>
                      <label style={{ fontSize: 13, fontWeight: 700, color: "rgba(0,0,0,0.65)" }}>Phone</label>
                      <input
                        value={form.phone}
                        onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
                        placeholder="08x xxx xxxx"
                        style={inputStyle}
                      />
                    </div>

                    <div>
                      <label style={{ fontSize: 13, fontWeight: 700, color: "rgba(0,0,0,0.65)" }}>Email</label>
                      <input
                        value={form.email}
                        onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                        placeholder="you@email.com"
                        style={inputStyle}
                      />
                    </div>
                  </div>

                  <div style={{ marginTop: 6, fontSize: 12, color: "rgba(0,0,0,0.55)" }}>
                    By continuing, you consent to being contacted about your BER request.
                  </div>
                </div>
              )}
            </div>

            {status && (
              <div
                style={{
                  marginTop: 16,
                  padding: "12px 14px",
                  borderRadius: 16,
                  background: status.startsWith("✅") ? "rgba(16,185,129,0.10)" : "rgba(239,68,68,0.10)",
                  border: status.startsWith("✅")
                    ? "1px solid rgba(16,185,129,0.18)"
                    : "1px solid rgba(239,68,68,0.18)",
                  color: "rgba(0,0,0,0.75)",
                  fontWeight: 650,
                  fontSize: 13,
                }}
              >
                {status}
              </div>
            )}

            <div style={{ marginTop: 18, display: "flex", justifyContent: "space-between", gap: 12 }}>
              <button
                type="button"
                onClick={back}
                disabled={step === 0 || loading}
                style={{
                  padding: "14px 18px",
                  borderRadius: 999,
                  border: "1px solid rgba(0,0,0,0.10)",
                  background: "#fff",
                  fontWeight: 800,
                  cursor: step === 0 ? "not-allowed" : "pointer",
                  opacity: step === 0 ? 0.45 : 1,
                }}
              >
                Back
              </button>

              {step < steps.length - 1 ? (
                <button
                  type="button"
                  onClick={next}
                  disabled={loading}
                  style={{
                    padding: "14px 20px",
                    borderRadius: 999,
                    border: "1px solid rgba(0,0,0,0.10)",
                    background: "#111",
                    color: "#fff",
                    fontWeight: 900,
                    cursor: "pointer",
                  }}
                >
                  Continue
                </button>
              ) : (
                <button
                  type="button"
                  onClick={submit}
                  disabled={loading}
                  style={{
                    padding: "14px 20px",
                    borderRadius: 999,
                    border: "1px solid rgba(0,0,0,0.10)",
                    background: loading ? "rgba(0,0,0,0.60)" : "#111",
                    color: "#fff",
                    fontWeight: 900,
                    cursor: loading ? "not-allowed" : "pointer",
                  }}
                >
                  {loading ? "Submitting..." : "Request quotes"}
                </button>
              )}
            </div>
          </Card>

          <p style={{ textAlign: "center", marginTop: 16, color: "rgba(0,0,0,0.45)", fontSize: 13 }}>
            Built to be simple for customers — and valuable for assessors.
          </p>
        </div>
      </div>
    </main>
  );
}
