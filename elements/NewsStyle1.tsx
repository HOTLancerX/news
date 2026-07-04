"use client";

import { useState, useEffect } from "react";
import { Icon } from "@iconify/react";
import {
    Text,
    NumberControl,
    Dimensions,
    AlignSelf,
    Section,
    ColorPickerPopup,
} from "@/components/builder/controls";
import { xFetch } from "@/lib/express";

// ─── Types ────────────────────────────────────────────────────────────────────

interface Cat {
    _id: string;
    title: string;
    slug: string;
}

// ─── Category sorter: select + drag-to-reorder ────────────────────────────────

function CategorySorter({
    value,
    onChange,
}: {
    value: string[];
    onChange: (v: string[]) => void;
}) {
    const [cats, setCats] = useState<Cat[]>([]);
    const [loading, setLoading] = useState(false);
    const [dragIdx, setDragIdx] = useState<number | null>(null);

    useEffect(() => {
        setLoading(true);
        xFetch("/builder-post/cats?type=blog-category")
            .then((r) => r.json())
            .then((data) => { setCats(data.cats ?? []); setLoading(false); })
            .catch(() => setLoading(false));
    }, []);

    const toggle = (id: string) =>
        onChange(value.includes(id) ? value.filter((v) => v !== id) : [...value, id]);

    // Drag-to-reorder among selected items only
    const handleDragStart = (idx: number) => setDragIdx(idx);

    const handleDrop = (toIdx: number) => {
        if (dragIdx === null || dragIdx === toIdx) return;
        const next = [...value];
        const [moved] = next.splice(dragIdx, 1);
        next.splice(toIdx, 0, moved);
        onChange(next);
        setDragIdx(null);
    };

    if (loading) {
        return (
            <div className="flex items-center gap-2 text-xs text-gray-400 px-1 py-2">
                <Icon icon="svg-spinners:ring-resize" width={14} />
                Loading categories…
            </div>
        );
    }

    if (cats.length === 0) {
        return <p className="text-xs text-gray-400 px-1">No categories found.</p>;
    }

    // Build ordered selected list + unselected list
    const selectedIds   = value.filter((id) => cats.some((c) => c._id === id));
    const unselectedCats = cats.filter((c) => !selectedIds.includes(c._id));
    const catById        = Object.fromEntries(cats.map((c) => [c._id, c]));

    return (
        <div className="flex flex-col gap-1">
            {/* "All" toggle */}
            <label className="flex items-center gap-2 px-1 py-1 rounded cursor-pointer hover:bg-gray-50">
                <input
                    type="checkbox"
                    checked={value.length === 0}
                    onChange={() => onChange([])}
                    className="w-3.5 h-3.5 accent-indigo-500"
                />
                <span className="text-xs text-gray-700 font-medium">All categories</span>
            </label>
            <div className="border-t border-gray-100 my-1" />

            {/* Selected — draggable to reorder */}
            {selectedIds.length > 0 && (
                <>
                    <p className="text-[10px] text-gray-400 px-1 uppercase tracking-wide font-semibold">
                        Selected (drag to reorder)
                    </p>
                    {selectedIds.map((id, idx) => {
                        const cat = catById[id];
                        if (!cat) return null;
                        return (
                            <div
                                key={id}
                                draggable
                                onDragStart={() => handleDragStart(idx)}
                                onDragOver={(e) => e.preventDefault()}
                                onDrop={() => handleDrop(idx)}
                                className={`flex items-center gap-2 px-1 py-1 rounded cursor-grab hover:bg-indigo-50 ${
                                    dragIdx === idx ? "opacity-50" : ""
                                }`}
                            >
                                <Icon icon="mdi:drag" width={14} className="text-gray-300 shrink-0" />
                                <input
                                    type="checkbox"
                                    checked
                                    onChange={() => toggle(id)}
                                    className="w-3.5 h-3.5 accent-indigo-500"
                                />
                                <span className="text-xs text-gray-700">{cat.title}</span>
                                <span className="ml-auto text-[10px] text-indigo-400 font-semibold">
                                    #{idx + 1}
                                </span>
                            </div>
                        );
                    })}
                    {unselectedCats.length > 0 && (
                        <div className="border-t border-gray-100 my-1" />
                    )}
                </>
            )}

            {/* Unselected */}
            {unselectedCats.map((cat) => (
                <label
                    key={cat._id}
                    className="flex items-center gap-2 px-1 py-1 rounded cursor-pointer hover:bg-gray-50"
                >
                    <span className="w-3.5 shrink-0" /> {/* spacer for drag icon */}
                    <input
                        type="checkbox"
                        checked={false}
                        onChange={() => toggle(cat._id)}
                        className="w-3.5 h-3.5 accent-indigo-500"
                    />
                    <span className="text-xs text-gray-700">{cat.title}</span>
                </label>
            ))}
        </div>
    );
}

// ─── Canvas preview ───────────────────────────────────────────────────────────

interface PreviewPost {
    _id: string;
    title: string;
    info: { image?: string; excerpt?: string };
}

function NewsStyle1Preview({ schema }: { schema: any }) {
    const [posts, setPosts] = useState<PreviewPost[]>([]);
    const [loading, setLoading] = useState(false);

    const { categoryIds, limit } = schema.content;

    useEffect(() => {
        setLoading(true);
        const params = new URLSearchParams({ type: "blog", limit: String(limit || 6) });
        if (categoryIds?.length) params.set("cats", categoryIds.join(","));
        xFetch(`/builder-post?${params}`)
            .then((r) => r.json())
            .then((data) => { setPosts(data.posts ?? []); setLoading(false); })
            .catch(() => setLoading(false));
    }, [JSON.stringify(categoryIds), limit]);

    const { title, style, colors } = schema.content;
    const bgColor     = colors?.bg      || "";
    const activeColor = colors?.active  || "#6366f1";
    const titleColor  = colors?.title   || "";

    if (loading) {
        return (
            <div className="flex items-center justify-center py-8 gap-2 text-gray-400">
                <Icon icon="svg-spinners:ring-resize" width={20} />
                <span className="text-xs">Loading…</span>
            </div>
        );
    }

    const featured  = posts[0];
    const sidePosts = posts.slice(1);

    return (
        <div
            className="w-full rounded-lg p-3"
            style={bgColor ? { background: bgColor } : undefined}
        >
            {/* Title */}
            {title && (
                <h2
                    className="text-xl font-bold mb-4"
                    style={titleColor ? { color: titleColor } : undefined}
                >
                    {title}
                </h2>
            )}

            {/* Tab strip preview */}
            <div className="flex gap-2 mb-4 pb-3 border-b border-gray-100">
                <span
                    className="px-3 py-1.5 rounded-full text-xs font-semibold text-white"
                    style={{ background: activeColor }}
                >
                    Category 1
                </span>
                <span className="px-3 py-1.5 rounded-full text-xs font-semibold bg-gray-100 text-gray-600">
                    Category 2
                </span>
            </div>

            {/* Style label */}
            <p className="text-[10px] text-gray-400 mb-3 uppercase tracking-wide">Style {style ?? 1}</p>

            {posts.length === 0 && (
                <div className="py-6 text-center text-xs text-gray-400 border-2 border-dashed border-gray-200 rounded-lg">
                    No posts found — select categories and set limit above.
                </div>
            )}

            {featured && (
                <div className="flex gap-4">
                    <div className="w-1/2">
                        <div className="flex flex-col rounded-lg border border-gray-100 overflow-hidden bg-white shadow-sm">
                            {featured.info?.image ? (
                                <div className="aspect-video bg-gray-100 overflow-hidden">
                                    <img src={featured.info.image} alt={featured.title} className="w-full h-full object-cover" />
                                </div>
                            ) : (
                                <div className="aspect-video bg-gray-100 flex items-center justify-center text-gray-200">
                                    <Icon icon="solar:document-bold" width={32} />
                                </div>
                            )}
                            <div className="p-3">
                                <p className="text-xs font-bold text-gray-900 line-clamp-2">{featured.title}</p>
                            </div>
                        </div>
                    </div>
                    <div className="w-1/2 flex flex-col divide-y divide-gray-100">
                        {sidePosts.map((post) => (
                            <div key={post._id} className="flex gap-2 py-2">
                                {post.info?.image && (
                                    <div className="shrink-0 w-14 h-11 rounded overflow-hidden bg-gray-100">
                                        <img src={post.info.image} alt={post.title} className="w-full h-full object-cover" />
                                    </div>
                                )}
                                <p className="text-xs font-semibold text-gray-800 line-clamp-2 leading-snug">{post.title}</p>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}

// ─── Element definition ───────────────────────────────────────────────────────

const newsStyle1Element = {
    type:     "news-style-1",
    category: "News",
    label:    "News Style 1",
    icon:     "solar:newspaper-bold",

    schema: {
        content: {
            style:       1,
            title:       "",
            categoryIds: [] as string[],
            limit:       6,
            colors: {
                bg:     "",          // section background
                active: "#6366f1",   // active tab pill
                title:  "",          // title text color
            },
        },
        advanced: {
            margin:    { top: 0, right: 0, bottom: 0, left: 0, unit: "px" },
            padding:   { top: 0, right: 0, bottom: 0, left: 0, unit: "px" },
            alignSelf: "auto",
        },
    },

    controls: [
        {
            tab:     "Layout",
            section: "Content",
            controls: [
                {
                    name:       "style",
                    responsive: false,
                    render:     (value: any, onChange: any) => (
                        <Section label="Style" defaultOpen>
                            <select
                                value={value ?? 1}
                                onChange={(e) => onChange(Number(e.target.value))}
                                className="w-full px-2.5 py-2 border border-gray-200 rounded text-[13px] outline-none bg-white"
                            >
                                {Array.from({ length: 10 }, (_, i) => i + 1).map((n) => (
                                    <option key={n} value={n}>Style {n}</option>
                                ))}
                            </select>
                        </Section>
                    ),
                },
                {
                    name:       "title",
                    responsive: false,
                    render:     (value: any, onChange: any) => (
                        <Section label="Section Title" defaultOpen>
                            <Text label="Title" value={value ?? ""} onChange={onChange} />
                        </Section>
                    ),
                },
                {
                    name:       "categoryIds",
                    responsive: false,
                    render:     (value: any, onChange: any) => (
                        <Section label="Categories" defaultOpen>
                            <CategorySorter value={value ?? []} onChange={onChange} />
                        </Section>
                    ),
                },
                {
                    name:       "limit",
                    responsive: false,
                    render:     (value: any, onChange: any) => (
                        <Section label="Number of Posts">
                            <NumberControl
                                label="Limit"
                                value={value ?? 6}
                                onChange={onChange}
                                min={2}
                                max={20}
                            />
                        </Section>
                    ),
                },
            ],
        },

        {
            tab:     "Layout",
            section: "Colors",
            controls: [
                {
                    name:       "colors",
                    responsive: false,
                    render:     (value: any, onChange: any) => {
                        const v = value ?? {};
                        const set = (key: string, color: string) =>
                            onChange({ ...v, [key]: color });
                        return (
                            <Section label="Colors" defaultOpen>
                                <div className="flex flex-col gap-3">
                                    <ColorPickerPopup
                                        label="Background"
                                        value={v.bg ?? ""}
                                        onChange={(c) => set("bg", c)}
                                    />
                                    <ColorPickerPopup
                                        label="Active Tab"
                                        value={v.active ?? "#6366f1"}
                                        onChange={(c) => set("active", c)}
                                    />
                                    <ColorPickerPopup
                                        label="Title Color"
                                        value={v.title ?? ""}
                                        onChange={(c) => set("title", c)}
                                    />
                                </div>
                            </Section>
                        );
                    },
                },
            ],
        },

        {
            tab:     "Advanced",
            section: "Spacing",
            controls: [
                {
                    name:       "margin",
                    responsive: true,
                    render:     (value: any, onChange: any) => (
                        <Dimensions type="margin" value={value} onChange={onChange} />
                    ),
                },
                {
                    name:       "padding",
                    responsive: true,
                    render:     (value: any, onChange: any) => (
                        <Dimensions type="padding" value={value} onChange={onChange} />
                    ),
                },
                {
                    name:       "alignSelf",
                    responsive: true,
                    render:     (value: any, onChange: any) => (
                        <AlignSelf value={value} onChange={onChange} />
                    ),
                },
            ],
        },
    ],

    render: (element: any) => <NewsStyle1Preview schema={element.schema} />,
};

export default newsStyle1Element;
