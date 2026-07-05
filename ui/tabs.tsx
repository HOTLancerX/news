"use client";

import { useState } from "react";

// ─── Shared types (exported — used by all Style components) ───────────────────

export interface Tab {
    _id: string;
    title: string;
    url: string;
}

export interface TabPost {
    _id: string;
    title: string;
    slug: string;
    postUrl: string;
    categoryTitle: string | null;
    categoryUrl: string | null;
    createdAt: string;
    image: string;
    excerpt: string;
}

export interface NewsColors {
    /** Active tab pill background */
    active?:             string;
    /** Active tab pill text */
    activeText?:         string;
    /** Inactive tab pill background */
    inactive?:           string;
    /** Inactive tab pill text */
    inactiveText?:       string;
    /** Title text color */
    title?:              string;
    /** Title hover color */
    titleHover?:         string;
}

// ─── NewsHeader ───────────────────────────────────────────────────────────────
// Reusable header shared by all Style variants.
//
// Visibility rules:
//   no title           → renders nothing
//   title + tabs <= 1  → title only, no tab strip
//   title + tabs > 1   → title + interactive tab buttons

interface NewsHeaderProps {
    title:      string;
    tabs:       Tab[];
    activeId:   string;
    onTabChange: (id: string) => void;
    colors?:    NewsColors;
}

export function NewsHeader({
    title,
    tabs,
    activeId,
    onTabChange,
    colors = {},
}: NewsHeaderProps) {
    if (!title) return null;

    const showTabs         = tabs.length > 1;
    const activeColor      = colors.active      || "#6366f1";
    const activeTextColor  = colors.activeText  || "#ffffff";
    const inactiveColor    = colors.inactive    || undefined;
    const inactiveTextColor = colors.inactiveText || undefined;
    const titleColor       = colors.title       || undefined;

    return (
        <div
            className={`flex items-center justify-between gap-4 mb-5 ${
                showTabs ? "border-b border-gray-100 pb-3" : ""
            }`}
        >
            <h2
                className="text-xl font-bold shrink-0"
                style={titleColor ? { color: titleColor } : undefined}
            >
                {title}
            </h2>

            {showTabs && (
                <div className="flex flex-wrap gap-2">
                    {tabs.map((tab) => {
                        const isActive = activeId === tab._id;
                        return (
                            <button
                                key={tab._id}
                                onClick={() => onTabChange(tab._id)}
                                className="px-3 py-1.5 rounded-full text-xs font-semibold transition-colors cursor-pointer border-0 outline-none"
                                style={
                                    isActive
                                        ? { background: activeColor, color: activeTextColor }
                                        : {
                                            background: inactiveColor  || "#f3f4f6",
                                            color:      inactiveTextColor || "#4b5563",
                                          }
                                }
                            >
                                {tab.title}
                            </button>
                        );
                    })}
                </div>
            )}
        </div>
    );
}

// ─── NewsTabs ─────────────────────────────────────────────────────────────────
// Wrapper used by all Style components.
// Owns the active-tab state, delegates post rendering via render prop.

export interface NewsTabsProps {
    title:           string;
    tabs:            Tab[];
    postsByCategory: Record<string, TabPost[]>;
    colors?:         NewsColors;
    renderPosts:     (posts: TabPost[]) => React.ReactNode;
}

export default function NewsTabs({
    title,
    tabs,
    postsByCategory,
    colors = {},
    renderPosts,
}: NewsTabsProps) {
    const [activeId, setActiveId] = useState<string>(tabs[0]?._id ?? "");

    if (!title) return null;

    const posts = postsByCategory[activeId] ?? [];

    return (
        <div className="w-full">
            <NewsHeader
                title={title}
                tabs={tabs}
                activeId={activeId}
                onTabChange={setActiveId}
                colors={colors}
            />
            {posts.length === 0 ? (
                <div className="py-8 text-center text-sm text-gray-400">
                    No posts found.
                </div>
            ) : (
                renderPosts(posts)
            )}
        </div>
    );
}
