"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import styles from "./page.module.css";

export default function OnboardingPage() {
  const router = useRouter();
  const [selectedInterests, setSelectedInterests] = useState<string[]>([]);
  const [recommendations, setRecommendations] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [customTopic, setCustomTopic] = useState("");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Initial trending topics load
  useEffect(() => {
    fetch("/api/topics/trending", { cache: "no-store" })
      .then((r) => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        return r.json();
      })
      .then((data) => {
        if (!data.topics || !Array.isArray(data.topics)) {
          throw new Error("Invalid API format");
        }
        setRecommendations(data.topics);
        setLoading(false);
      })
      .catch((err) => {
        setErrorMsg(err.message);
        setLoading(false);
      });
  }, []);

  // Fetch new recommendations based on selections
  const fetchRecommendations = async (currentSelections: string[]) => {
    setLoading(true);
    try {
      const res = await fetch("/api/topics/recommend", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ selected: currentSelections }),
      });
      const data = await res.json();
      if (data.topics) {
        setRecommendations(data.topics);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSelect = (topic: string) => {
    if (selectedInterests.includes(topic) || selectedInterests.length >= 10) return;
    const newSelections = [...selectedInterests, topic];
    setSelectedInterests(newSelections);
    fetchRecommendations(newSelections);
  };

  const handleRemove = (topic: string) => {
    const newSelections = selectedInterests.filter(t => t !== topic);
    setSelectedInterests(newSelections);
    fetchRecommendations(newSelections);
  };

  const handleAddCustom = () => {
    const trimmed = customTopic.trim();
    if (!trimmed || selectedInterests.includes(trimmed) || selectedInterests.length >= 10) return;
    const newSelections = [...selectedInterests, trimmed];
    setSelectedInterests(newSelections);
    setCustomTopic("");
    fetchRecommendations(newSelections);
  };

  const handleSave = async () => {
    if (selectedInterests.length === 0) return;
    setSaving(true);
    setErrorMsg(null);
    try {
      // Map to old expected format: [{ label, breadcrumb, depth }]
      const selections = selectedInterests.map(t => ({
        label: t,
        breadcrumb: t,
        depth: 0
      }));
      
      const res = await fetch("/api/interests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ selections }),
      });
      
      if (!res.ok) {
        if (res.status === 401) {
          await fetch("/api/auth/signout", { method: "POST" });
          window.location.href = "/login";
          return;
        }
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || `HTTP ${res.status} - Failed to save interests`);
      }
      
      // eslint-disable-next-line react-hooks/immutability
      router.push("/dashboard");
    } catch (err: unknown) {
      console.error(err);
      setErrorMsg(err instanceof Error ? err.message : "Failed to save interests.");
      setSaving(false);
    }
  };

  return (
    <main className={styles.page}>
      <div className={styles.container}>
        <div className={styles.header}>
          <h1 className="text-headline">What do you care about?</h1>
          <p className="text-body" style={{ marginTop: "8px" }}>
            Select up to 10 interests. We&apos;ll instantly adapt our recommendations based on what you choose.
          </p>
        </div>

        {/* Selected Interests Area */}
        <div className={styles.selectedArea}>
          <h2 className="text-title" style={{ marginBottom: "16px" }}>Your Interests ({selectedInterests.length}/10)</h2>
          <div className={styles.selectedChips}>
            {selectedInterests.map(topic => (
              <div key={topic} className={styles.selectedChip} onClick={() => handleRemove(topic)}>
                {topic}
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M18 6L6 18M6 6l12 12" />
                </svg>
              </div>
            ))}
            {selectedInterests.length === 0 && (
              <p className="text-tertiary" style={{ fontSize: "0.9rem", fontStyle: "italic", paddingTop: "8px" }}>
                Nothing selected yet...
              </p>
            )}
          </div>
        </div>

        {/* Custom Input */}
        <div className={styles.customInput}>
          <input
            type="text"
            className="input"
            placeholder="Or type your own topic..."
            value={customTopic}
            onChange={(e) => setCustomTopic(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleAddCustom()}
            disabled={selectedInterests.length >= 10 || loading}
          />
          <button
            className="btn btn-secondary btn-sm"
            onClick={handleAddCustom}
            disabled={!customTopic.trim() || selectedInterests.length >= 10 || loading}
          >
            Add
          </button>
        </div>

        {/* Error */}
        {errorMsg && (
          <div style={{ color: "var(--accent-red)", marginBottom: "16px", padding: "16px", background: "rgba(255,69,58,0.1)", borderRadius: "8px" }}>
            <p><strong>Error loading topics:</strong> {errorMsg}</p>
            <button className="btn btn-sm btn-secondary" onClick={() => window.location.reload()} style={{ marginTop: "8px" }}>Retry</button>
          </div>
        )}

        {/* Recommendations Area */}
        <div className={styles.recommendationsArea}>
          <h2 className="text-title" style={{ marginBottom: "16px" }}>Recommended for you</h2>
          <div className={styles.grid}>
            {loading ? (
              Array.from({ length: 10 }).map((_, i) => (
                <div key={i} className={`skeleton ${styles.cardSkeleton}`} />
              ))
            ) : recommendations.length > 0 ? (
              recommendations.map((topic, i) => (
                <button
                  key={`${topic}-${i}`}
                  className={`${styles.recCard} animate-fade-in-up`}
                  style={{ animationDelay: `${i * 30}ms` }}
                  onClick={() => handleSelect(topic)}
                  disabled={selectedInterests.length >= 10}
                >
                  <span className={styles.cardIcon}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                    </svg>
                  </span>
                  <span className={styles.cardText}>{topic}</span>
                </button>
              ))
            ) : (
              <p className="text-body">No recommendations found.</p>
            )}
          </div>
        </div>

        {/* Save Bar */}
        <div className={styles.saveBar}>
          <button
            className="btn btn-primary btn-lg"
            disabled={selectedInterests.length === 0 || saving}
            onClick={handleSave}
          >
            {saving ? "Setting up your feed..." : `Continue with ${selectedInterests.length} interest${selectedInterests.length !== 1 ? "s" : ""}`}
          </button>
        </div>
      </div>
    </main>
  );
}
