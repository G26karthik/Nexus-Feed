"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import styles from "./page.module.css";

interface TreeNode {
  label: string;
  breadcrumb: string;
  depth: number;
  children: TreeNode[] | null;
  isExpanding: boolean;
  isSelected: boolean;
}

export default function OnboardingPage() {
  const router = useRouter();
  const [topics, setTopics] = useState<TreeNode[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCount, setSelectedCount] = useState(0);
  const [saving, setSaving] = useState(false);
  const [customTopic, setCustomTopic] = useState("");

  // Count selected
  const countSelected = useCallback((nodes: TreeNode[]): number => {
    let count = 0;
    for (const node of nodes) {
      if (node.isSelected) count++;
      if (node.children) count += countSelected(node.children);
    }
    return count;
  }, []);

  // Load trending topics
  useEffect(() => {
    fetch("/api/topics/trending", { cache: "no-store" })
      .then((r) => r.json())
      .then((data) => {
        const nodes: TreeNode[] = (data.topics || []).map((t: string) => ({
          label: t,
          breadcrumb: t,
          depth: 0,
          children: null,
          isExpanding: false,
          isSelected: false,
        }));
        setTopics(nodes);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  // Expand a topic
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

  // Toggle selection
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

  // Add custom topic
  const addCustomTopic = async () => {
    const topicLabel = customTopic.trim();
    if (!topicLabel) return;
    
    const newNode: TreeNode = {
      label: topicLabel,
      breadcrumb: topicLabel,
      depth: 0,
      children: null,
      isExpanding: true,
      isSelected: false,
    };
    
    setTopics((prev) => [newNode, ...prev]);
    setCustomTopic("");

    try {
      const res = await fetch("/api/topics/expand", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          topic: topicLabel,
          breadcrumb: topicLabel,
          depth: 1,
        }),
      });
      const data = await res.json();
      
      setTopics((prev) => {
        const updated = JSON.parse(JSON.stringify(prev));
        const node = updated.find((n: TreeNode) => n.breadcrumb === topicLabel);
        if (node) {
          node.children = (data.subTopics || []).map((st: string) => ({
            label: st,
            breadcrumb: `${topicLabel} > ${st}`,
            depth: 1,
            children: null,
            isExpanding: false,
            isSelected: false,
          }));
          node.isExpanding = false;
        }
        return updated;
      });
    } catch {
      setTopics((prev) => {
        const updated = JSON.parse(JSON.stringify(prev));
        const node = updated.find((n: TreeNode) => n.breadcrumb === topicLabel);
        if (node) {
          node.children = [];
          node.isExpanding = false;
        }
        return updated;
      });
    }
  };

  // Collect selected nodes
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

  // Save
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

  // Render tree node
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
        {/* Expand button */}
        <button
          className={styles.expandBtn}
          onClick={() => expandNode(path)}
          aria-label={`Expand ${node.label}`}
          id={`expand-${path.join("-")}`}
        >
          {node.isExpanding ? (
            <svg className={styles.spinner} width="16" height="16" viewBox="0 0 16 16">
              <circle cx="8" cy="8" r="6" stroke="currentColor" strokeWidth="2" fill="none" strokeDasharray="28" strokeDashoffset="8" />
            </svg>
          ) : (
            <svg
              width="16"
              height="16"
              viewBox="0 0 16 16"
              fill="currentColor"
              style={{
                transform: node.children !== null ? "rotate(90deg)" : "rotate(0deg)",
                transition: "transform 0.2s ease",
              }}
            >
              <path d="M6 4l4 4-4 4" stroke="currentColor" strokeWidth="1.5" fill="none" strokeLinecap="round" />
            </svg>
          )}
        </button>

        {/* Label */}
        <span className={styles.nodeLabel} onClick={() => expandNode(path)}>
          {node.label}
        </span>

        {/* Breadcrumb chip */}
        {node.depth > 0 && (
          <span className={styles.depthChip}>L{node.depth}</span>
        )}

        {/* Select checkbox */}
        <button
          className={`${styles.selectBtn} ${node.isSelected ? styles.selectActive : ""}`}
          onClick={() => toggleSelect(path)}
          disabled={!node.isSelected && selectedCount >= 10}
          aria-label={`Select ${node.label}`}
          id={`select-${path.join("-")}`}
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

      {/* Children */}
      {node.children && node.children.length > 0 && (
        <div className={styles.childrenWrapper}>
          {node.children.map((child, i) =>
            renderNode(child, [...path, i], level + 1)
          )}
        </div>
      )}
    </div>
  );

  return (
    <main className={styles.page}>
      <div className={styles.container}>
        {/* Header */}
        <div className={styles.header}>
          <h1 className="text-headline">
            What do you care about?
          </h1>
          <p className="text-body" style={{ marginTop: "8px", maxWidth: "500px" }}>
            Explore topics and drill down as deep as you want. Select up to 10 interests for your daily digest.
          </p>
        </div>

        {/* Custom topic input */}
        <div className={styles.customInput}>
          <input
            type="text"
            className="input"
            placeholder="Or type your own topic..."
            value={customTopic}
            onChange={(e) => setCustomTopic(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && addCustomTopic()}
            id="custom-topic-input"
          />
          <button
            className="btn btn-secondary btn-sm"
            onClick={addCustomTopic}
            disabled={!customTopic.trim()}
            id="add-custom-topic"
          >
            Add
          </button>
        </div>

        {/* Selection counter */}
        <div className={styles.counter}>
          <div className={styles.counterBar}>
            <div
              className={styles.counterFill}
              style={{ width: `${(selectedCount / 10) * 100}%` }}
            />
          </div>
          <span className="text-caption">
            {selectedCount}/10 interests selected
          </span>
        </div>

        {/* Topic tree */}
        <div className={styles.treeContainer}>
          {loading ? (
            <div className={styles.loadingGrid}>
              {Array.from({ length: 12 }).map((_, i) => (
                <div key={i} className={`skeleton ${styles.skeletonCard}`} />
              ))}
            </div>
          ) : (
            <div className="stagger-children">
              {topics.map((topic, i) => renderNode(topic, [i], 0))}
            </div>
          )}
        </div>

        {/* Save button */}
        <div className={styles.saveBar}>
          <button
            className="btn btn-primary btn-lg"
            disabled={selectedCount === 0 || saving}
            onClick={handleSave}
            id="save-interests"
          >
            {saving ? "Setting up your feed..." : `Continue with ${selectedCount} interest${selectedCount !== 1 ? "s" : ""}`}
          </button>
        </div>
      </div>
    </main>
  );
}
