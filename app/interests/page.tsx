"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import styles from "../onboarding/page.module.css";

interface TreeNode {
  label: string;
  breadcrumb: string;
  depth: number;
  children: TreeNode[] | null;
  isExpanding: boolean;
  isSelected: boolean;
}

interface SavedInterest {
  id: string;
  label: string;
  breadcrumb: string;
  depth: number;
}

export default function EditInterestsPage() {
  const router = useRouter();
  const [topics, setTopics] = useState<TreeNode[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCount, setSelectedCount] = useState(0);
  const [saving, setSaving] = useState(false);
  const [customTopic, setCustomTopic] = useState("");
  const [existingInterests, setExistingInterests] = useState<SavedInterest[]>([]);

  const countSelected = useCallback((nodes: TreeNode[]): number => {
    let count = 0;
    for (const node of nodes) {
      if (node.isSelected) count++;
      if (node.children) count += countSelected(node.children);
    }
    return count;
  }, []);

  // Load existing interests and trending topics
  useEffect(() => {
    Promise.all([
      fetch("/api/interests").then((r) => r.json()),
      fetch("/api/topics/trending").then((r) => r.json()),
    ]).then(([interestsData, trendingData]) => {
      const saved: SavedInterest[] = interestsData.interests || [];
      setExistingInterests(saved);

      // Create nodes from saved interests (pre-selected)
      const savedNodes: TreeNode[] = saved.map((s: SavedInterest) => ({
        label: s.label,
        breadcrumb: s.breadcrumb,
        depth: s.depth,
        children: null,
        isExpanding: false,
        isSelected: true,
      }));

      // Create nodes from trending (not pre-selected)
      const trendingNodes: TreeNode[] = (trendingData.topics || [])
        .filter((t: string) => !saved.some((s: SavedInterest) => s.label === t))
        .map((t: string) => ({
          label: t,
          breadcrumb: t,
          depth: 0,
          children: null,
          isExpanding: false,
          isSelected: false,
        }));

      const allNodes = [...savedNodes, ...trendingNodes];
      setTopics(allNodes);
      setSelectedCount(saved.length);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  const expandNode = async (path: number[]) => {
    const newTopics = JSON.parse(JSON.stringify(topics));
    let node = newTopics[path[0]];
    for (let i = 1; i < path.length; i++) {
      node = node.children![path[i]];
    }

    if (node.children !== null) {
      node.children = null;
      setTopics(newTopics);
      return;
    }

    node.isExpanding = true;
    setTopics([...newTopics]);

    try {
      const res = await fetch("/api/topics/expand", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          topic: node.label,
          breadcrumb: node.breadcrumb,
          depth: node.depth + 1,
        }),
      });
      const data = await res.json();
      node.children = (data.subTopics || []).map((st: string) => ({
        label: st,
        breadcrumb: `${node.breadcrumb} > ${st}`,
        depth: node.depth + 1,
        children: null,
        isExpanding: false,
        isSelected: false,
      }));
    } catch {
      node.children = [];
    }

    node.isExpanding = false;
    setTopics([...newTopics]);
  };

  const toggleSelect = (path: number[]) => {
    const newTopics = JSON.parse(JSON.stringify(topics));
    let node = newTopics[path[0]];
    for (let i = 1; i < path.length; i++) {
      node = node.children![path[i]];
    }

    const currentTotal = countSelected(newTopics);
    if (!node.isSelected && currentTotal >= 10) return;

    node.isSelected = !node.isSelected;
    setTopics(newTopics);
    setSelectedCount(countSelected(newTopics));
  };

  const addCustomTopic = () => {
    if (!customTopic.trim()) return;
    const newNode: TreeNode = {
      label: customTopic.trim(),
      breadcrumb: customTopic.trim(),
      depth: 0,
      children: null,
      isExpanding: false,
      isSelected: false,
    };
    setTopics([newNode, ...topics]);
    setCustomTopic("");
  };

  const collectSelected = (nodes: TreeNode[]): { label: string; breadcrumb: string; depth: number }[] => {
    const selected: { label: string; breadcrumb: string; depth: number }[] = [];
    for (const node of nodes) {
      if (node.isSelected) {
        selected.push({ label: node.label, breadcrumb: node.breadcrumb, depth: node.depth });
      }
      if (node.children) {
        selected.push(...collectSelected(node.children));
      }
    }
    return selected;
  };

  const handleSave = async () => {
    const selections = collectSelected(topics);
    if (selections.length === 0) return;

    setSaving(true);
    try {
      await fetch("/api/interests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ selections }),
      });
      router.push("/dashboard");
    } catch {
      setSaving(false);
    }
  };

  const renderNode = (node: TreeNode, path: number[], level: number = 0) => (
    <div
      key={path.join("-")}
      className={styles.treeNode}
      style={{ animationDelay: `${path[path.length - 1] * 60}ms` }}
    >
      <div
        className={`${styles.nodeRow} ${node.isSelected ? styles.nodeSelected : ""}`}
        style={{ paddingLeft: `${level * 24 + 12}px` }}
      >
        <button className={styles.expandBtn} onClick={() => expandNode(path)}>
          {node.isExpanding ? (
            <svg className={styles.spinner} width="16" height="16" viewBox="0 0 16 16">
              <circle cx="8" cy="8" r="6" stroke="currentColor" strokeWidth="2" fill="none" strokeDasharray="28" strokeDashoffset="8" />
            </svg>
          ) : (
            <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor"
              style={{ transform: node.children !== null ? "rotate(90deg)" : "rotate(0deg)", transition: "transform 0.2s ease" }}>
              <path d="M6 4l4 4-4 4" stroke="currentColor" strokeWidth="1.5" fill="none" strokeLinecap="round" />
            </svg>
          )}
        </button>
        <span className={styles.nodeLabel} onClick={() => expandNode(path)}>{node.label}</span>
        {node.depth > 0 && <span className={styles.depthChip}>L{node.depth}</span>}
        <button
          className={`${styles.selectBtn} ${node.isSelected ? styles.selectActive : ""}`}
          onClick={() => toggleSelect(path)}
          disabled={!node.isSelected && selectedCount >= 10}
        >
          {node.isSelected ? (
            <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
              <path d="M13.78 4.22a.75.75 0 010 1.06l-7.25 7.25a.75.75 0 01-1.06 0L2.22 9.28a.75.75 0 011.06-1.06L6 10.94l6.72-6.72a.75.75 0 011.06 0z" />
            </svg>
          ) : (
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <circle cx="8" cy="8" r="6" stroke="currentColor" strokeWidth="1.5" />
            </svg>
          )}
        </button>
      </div>
      {node.children && node.children.length > 0 && (
        <div className={styles.childrenWrapper}>
          {node.children.map((child, i) => renderNode(child, [...path, i], level + 1))}
        </div>
      )}
    </div>
  );

  return (
    <main className={styles.page}>
      <div className={styles.container}>
        <div className={styles.header}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <h1 className="text-headline">Edit Interests</h1>
            <a href="/dashboard" className="btn btn-ghost btn-sm">← Back</a>
          </div>
          <p className="text-body" style={{ marginTop: "8px" }}>
            Modify your interests. Changes will take effect on tomorrow&apos;s digest.
          </p>
          {existingInterests.length > 0 && (
            <p className="text-caption" style={{ marginTop: "8px" }}>
              Your current interests are pre-selected below.
            </p>
          )}
        </div>

        <div className={styles.customInput}>
          <input
            type="text"
            className="input"
            placeholder="Or type your own topic..."
            value={customTopic}
            onChange={(e) => setCustomTopic(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && addCustomTopic()}
          />
          <button className="btn btn-secondary btn-sm" onClick={addCustomTopic} disabled={!customTopic.trim()}>
            Add
          </button>
        </div>

        <div className={styles.counter}>
          <div className={styles.counterBar}>
            <div className={styles.counterFill} style={{ width: `${(selectedCount / 10) * 100}%` }} />
          </div>
          <span className="text-caption">{selectedCount}/10 interests selected</span>
        </div>

        <div className={styles.treeContainer}>
          {loading ? (
            <div className={styles.loadingGrid}>
              {Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className={`skeleton ${styles.skeletonCard}`} />
              ))}
            </div>
          ) : (
            <div className="stagger-children">
              {topics.map((topic, i) => renderNode(topic, [i], 0))}
            </div>
          )}
        </div>

        <div className={styles.saveBar}>
          <button
            className="btn btn-primary btn-lg"
            disabled={selectedCount === 0 || saving}
            onClick={handleSave}
          >
            {saving ? "Saving..." : `Save ${selectedCount} interest${selectedCount !== 1 ? "s" : ""}`}
          </button>
        </div>
      </div>
    </main>
  );
}
