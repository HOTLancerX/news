"use client";

/**
 * plugin/news/ui/NewsStyle1Client.tsx
 *
 * Client-side data fetcher for the builder canvas preview.
 * Fetches per-category posts from the Express API and renders them
 * through the exact same Style1 component used server-side.
 *
 * This is the Elementor pattern: the canvas preview IS the real component —
 * no separate static preview, no duplicated markup.
 */

import { useState, useEffect } from "react";
import { Icon } from "@iconify/react";
import { xFetch } from "@/lib/express";
import Style1 from "./Style1";
import type { Tab, TabPost, NewsColors } from "./tabs";

// ─── Types ────────────────────────────────────────────────────────────────────

interface ApiPost {
    _id: string;
    title: string;
    slug: string;
    postUrl: string;
    category: string | null;
    categoryTitle: string | null;
    categoryUrl: string | null;
    createdAt: string;
    info: { image: string; excerpt: string };
}

// ─── Props (mirrors NewsStyle1Props) ─────────────────────────────────────────

interface NewsStyle1ClientProps {
    title:       string;
    categoryIds: string[];
    limit:       number;
    style:       number;
    colors?:     NewsColors;
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function NewsStyle1Client({
    title,
    categoryIds,
    limit,
    style: _style,
    colors,
}: NewsStyle1ClientProps) {
    const [tabs, setTabs]                       = useState<Tab[]>([]);
    const [postsByCategory, setPostsByCategory] = useState<Record<string, TabPost[]>>({});
    const [loading, setLoading]                 = useState(true);

    // ── Fetch tabs + per-category posts ───────────────────────────────────────
    useEffect(() => {
        setLoading(true);
        setTabs([]);
        setPostsByCategory({});

        xFetch("/builder-post/cats?type=blog-category")
            .then((r) => r.json())
            .then(async (data) => {
                const allCats: { _id: string; title: string; slug: string }[] = data.cats ?? [];

                // Resolve ordered tab list: selected IDs first, else all
                const orderedTabs: Tab[] = categoryIds.length
                    ? categoryIds
                        .map((id) => allCats.find((c) => c._id === id))
                        .filter(Boolean)
                        .map((c) => ({ _id: c!._id, title: c!.title, url: `/${c!.slug}` }))
                    : allCats.map((c) => ({ _id: c._id, title: c.title, url: `/${c.slug}` }));

                setTabs(orderedTabs);

                // Fetch posts per tab in parallel
                const safeLimit = Math.min(Number(limit) || 6, 20);
                const results   = await Promise.all(
                    orderedTabs.map((tab) => {
                        const params = new URLSearchParams({
                            type:  "blog",
                            limit: String(safeLimit),
                            cats:  tab._id,
                        });
                        return xFetch(`/builder-post?${params}`)
                            .then((r) => r.json())
                            .then((d) => ({
                                id:    tab._id,
                                posts: ((d.posts ?? []) as ApiPost[]).map((p): TabPost => ({
                                    _id:           p._id,
                                    title:         p.title,
                                    slug:          p.slug,
                                    postUrl:       p.postUrl,
                                    categoryTitle: p.categoryTitle,
                                    categoryUrl:   p.categoryUrl,
                                    createdAt:     p.createdAt,
                                    image:         p.info?.image  ?? "",
                                    excerpt:       p.info?.excerpt ?? "",
                                })),
                            }))
                            .catch(() => ({ id: tab._id, posts: [] as TabPost[] }));
                    })
                );

                const map: Record<string, TabPost[]> = {};
                for (const { id, posts } of results) map[id] = posts;
                setPostsByCategory(map);
                setLoading(false);
            })
            .catch(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [JSON.stringify(categoryIds), limit]);

    // ── Loading state ─────────────────────────────────────────────────────────
    if (loading) {
        return (
            <div className="flex items-center justify-center py-10 gap-2 text-gray-400">
                <Icon icon="svg-spinners:ring-resize" width={20} />
                <span className="text-xs">Loading…</span>
            </div>
        );
    }

    if (!title) {
        return (
            <div className="flex flex-col items-center justify-center py-8 gap-2 text-gray-400 border-2 border-dashed border-gray-200 rounded-lg">
                <Icon icon="solar:newspaper-bold" width={28} className="opacity-40" />
                <p className="text-xs">Set a section title to display this element.</p>
            </div>
        );
    }

    // ── Render — same Style1 component used server-side ───────────────────────
    return (
        <Style1
            title={title}
            tabs={tabs}
            postsByCategory={postsByCategory}
            colors={colors}
        />
    );
}
