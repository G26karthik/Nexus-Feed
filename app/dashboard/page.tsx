"use client";

import { useState, useEffect } from "react";
import styles from "./page.module.css";

interface DigestItem {
  title: string;
  summary: string;
  sourceUrl: string;
  sourceName: string | null;
  position: number;
}

interface Digest {
  nodeId: string;
  label: string;
  breadcrumb: string;
  items: DigestItem[];
  generatedAt: string | null;
}

interface DigestResponse {
  date: string;
  digests: Digest[];
}

export default function DashboardPage() {
  const [data, setData] = useState<DigestResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/digest/today")
      .then((r) => {
        if (!r.ok) {
          if (r.status === 401) {
            fetch("/api/auth/signout", { method: "POST" }).then(() => {
              window.location.href = "/login";
            });
            return;
          }
          throw new Error("Failed to load");
        }
        return r.json();
      })
      .then((d) => {
        setData(d);
        setLoading(false);
      })
      .catch((e) => {
        setError(e.message);
        setLoading(false);
      });
  }, []);

  const handleSignOut = async () => {
    await fetch("/api/auth/signout", { method: "POST" });
    window.location.href = "/";
  };

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr + "T00:00:00");
    return d.toLocaleDateString("en-US", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  return (
    <main className={styles.page}>
      {/* Header */}
      <header className={styles.header}>
        <div className={styles.headerInner}>
          <div className={styles.headerLeft}>
            <div className={styles.logo}>
              <svg width="32" height="32" viewBox="0 0 48 48" fill="none">
                <defs>
                  <linearGradient id="hLogoGrad" x1="0" y1="0" x2="48" y2="48">
                    <stop offset="0%" stopColor="#0a84ff" />
                    <stop offset="100%" stopColor="#bf5af2" />
                  </linearGradient>
                </defs>
                <circle cx="24" cy="24" r="22" stroke="url(#hLogoGrad)" strokeWidth="2.5" fill="none" />
                <circle cx="24" cy="24" r="4" fill="url(#hLogoGrad)" />
              </svg>
              <span>Nexus Feed</span>
            </div>
          </div>
          <div className={styles.headerRight}>
            <a href="/interests" className="btn btn-ghost btn-sm" id="edit-interests">
              Edit Interests
            </a>
            <button onClick={handleSignOut} className="btn btn-ghost btn-sm" id="sign-out">
              Sign Out
            </button>
          </div>
        </div>
      </header>

      <div className={styles.content}>
        {/* Date display */}
        {data && (
          <div className={styles.dateHeader}>
            <h1 className="text-headline">{formatDate(data.date)}</h1>
            <p className="text-caption" style={{ marginTop: "4px" }}>
              Your daily digest · {data.digests.length} topic{data.digests.length !== 1 ? "s" : ""}
            </p>
          </div>
        )}

        {/* Loading state */}
        {loading && (
          <div className={styles.digestGrid}>
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className={styles.skeletonCard}>
                <div className={`skeleton ${styles.skeletonTitle}`} />
                <div className={`skeleton ${styles.skeletonBreadcrumb}`} />
                <div className={styles.skeletonItems}>
                  {Array.from({ length: 3 }).map((_, j) => (
                    <div key={j} className={styles.skeletonItem}>
                      <div className={`skeleton ${styles.skeletonItemTitle}`} />
                      <div className={`skeleton ${styles.skeletonItemSummary}`} />
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Error state */}
        {error && (
          <div className={styles.emptyState}>
            <div className={styles.emptyIcon}>⚠️</div>
            <h2 className="text-title">Something went wrong</h2>
            <p className="text-body">{error}</p>
            <button className="btn btn-primary" onClick={() => window.location.reload()} id="retry-btn">
              Try Again
            </button>
          </div>
        )}

        {/* Empty state */}
        {data && data.digests.length === 0 && (
          <div className={styles.emptyState}>
            <div className={styles.emptyIcon}>🔍</div>
            <h2 className="text-title">No interests yet</h2>
            <p className="text-body">
              Set up your interests to start receiving your personalized daily digest.
            </p>
            <a href="/onboarding" className="btn btn-primary" id="setup-interests">
              Set Up Interests
            </a>
          </div>
        )}

        {/* Digest cards */}
        {data && data.digests.length > 0 && (
          <div className={`${styles.digestGrid} stagger-children`}>
            {data.digests.map((digest) => (
              <article key={digest.nodeId} className={styles.digestCard} id={`digest-${digest.nodeId}`}>
                {/* Card header */}
                <div className={styles.cardHeader}>
                  <div className={styles.cardIcon}>
                    <div className={styles.cardDot} />
                  </div>
                  <div>
                    <h2 className={styles.cardTitle}>{digest.label}</h2>
                    <span className={styles.cardBreadcrumb}>{digest.breadcrumb}</span>
                  </div>
                </div>

                {/* Items */}
                {digest.items.length > 0 ? (
                  <div className={styles.itemList}>
                    {digest.items.map((item, idx) => (
                      <a
                        key={idx}
                        href={item.sourceUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className={styles.digestItem}
                      >
                        <div className={styles.itemPosition}>{item.position}</div>
                        <div className={styles.itemContent}>
                          <h3 className={styles.itemTitle}>{item.title}</h3>
                          <p className={styles.itemSummary}>{item.summary}</p>
                          {item.sourceName && (
                            <span className={styles.itemSource}>
                              {item.sourceName}
                              <svg width="12" height="12" viewBox="0 0 16 16" fill="currentColor" style={{ marginLeft: "4px" }}>
                                <path d="M3.75 2A1.75 1.75 0 002 3.75v8.5c0 .966.784 1.75 1.75 1.75h8.5A1.75 1.75 0 0014 12.25v-3.5a.75.75 0 00-1.5 0v3.5a.25.25 0 01-.25.25h-8.5a.25.25 0 01-.25-.25v-8.5a.25.25 0 01.25-.25h3.5a.75.75 0 000-1.5h-3.5zm6.75 0a.75.75 0 000 1.5h1.44L6.47 8.97a.75.75 0 101.06 1.06l5.47-5.47v1.44a.75.75 0 001.5 0v-3.25A.75.75 0 0013.75 2h-3.25z" />
                              </svg>
                            </span>
                          )}
                        </div>
                      </a>
                    ))}
                  </div>
                ) : (
                  <div className={styles.noItems}>
                    <p className="text-caption">No developments found today for this topic.</p>
                  </div>
                )}
              </article>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
