"use client";

import { useState, useEffect } from "react";
import { Icon } from "@iconify/react";
import {
    NumberControl,
    ButtonGroup,
    Dimensions,
    AlignSelf,
    Section,
} from "@/components/builder/controls";
import { xFetch } from "@/lib/express";
import { getAllPostTypes, getAllCatTypes } from "@/hook";

// ─── Post type selector (driven by registered post types) ────────────────────

interface PostTypeSelectorProps {
    value: string;
    onChange: (v: string) => void;
}

function PostTypeSelector({ value, onChange }: PostTypeSelectorProps) {
    const postTypes = getAllPostTypes();

    if (postTypes.length === 0) {
        return <p className="text-xs text-gray-400 px-1">No post types registered.</p>;
    }

    return (
        <div className="flex flex-col gap-1">
            {postTypes.map((pt) => (
                <label
                    key={pt.key}
                    className={`flex items-center gap-2 px-2 py-1.5 rounded-lg cursor-pointer border transition-colors ${
                        value === pt.key
                            ? "border-indigo-300 bg-indigo-50"
                            : "border-transparent hover:bg-gray-50"
                    }`}
                >
                    <input
                        type="radio"
                        name="postType"
                        value={pt.key}
                        checked={value === pt.key}
                        onChange={() => onChange(pt.key)}
                        className="w-3.5 h-3.5 accent-indigo-500"
                    />
                    {pt.icon && (
                        <Icon icon={pt.icon} width={14} className="text-gray-500 shrink-0" />
                    )}
                    <span className="text-xs text-gray-700">{pt.label}</span>
                    <span className="ml-auto text-[10px] text-gray-300 font-mono">{pt.key}</span>
                </label>
            ))}
        </div>
    );
}

interface Cat {
    _id: string;
    title: string;
}

interface CatSelectProps {
    postType: string;
    value: string[];       // selected category IDs
    onChange: (v: string[]) => void;
}

function CategoryMultiSelect({ postType, value, onChange }: CatSelectProps) {
    const [cats, setCats] = useState<Cat[]>([]);
    const [loading, setLoading] = useState(false);

    // Resolve the category type key from the registered cat types
    const catTypes = getAllCatTypes();
    const catType = catTypes.find((ct) => ct.postType === postType)?.key ?? "";

    useEffect(() => {
        if (!catType) { setCats([]); return; }
        setLoading(true);
        xFetch(`/builder-post/cats?type=${encodeURIComponent(catType)}`)
            .then((r) => r.json())
            .then((data) => {
                setCats(data.cats ?? []);
                setLoading(false);
            })
            .catch(() => setLoading(false));
    }, [catType]);

    const toggle = (id: string) => {
        onChange(
            value.includes(id) ? value.filter((v) => v !== id) : [...value, id]
        );
    };

    if (!postType) {
        return (
            <p className="text-xs text-gray-400 px-1">Select a post type first.</p>
        );
    }

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

    return (
        <div className="flex flex-col gap-1">
            {/* "All" option */}
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
            {cats.map((cat) => (
                <label
                    key={cat._id}
                    className="flex items-center gap-2 px-1 py-1 rounded cursor-pointer hover:bg-gray-50"
                >
                    <input
                        type="checkbox"
                        checked={value.includes(cat._id)}
                        onChange={() => toggle(cat._id)}
                        className="w-3.5 h-3.5 accent-indigo-500"
                    />
                    <span className="text-xs text-gray-700">{cat.title}</span>
                </label>
            ))}
        </div>
    );
}

// ─── Preview renderer (used inside the builder canvas) ───────────────────────

interface PostPreview {
    _id: string;
    title: string;
    slug: string;
    createdAt: string;
    info: { image?: string; excerpt?: string };
}

function BlockPostPreview({ schema }: { schema: any }) {
    const [posts, setPosts] = useState<PostPreview[]>([]);
    const [loading, setLoading] = useState(false);

    const { postType, categoryIds, limit } = schema.content;

    useEffect(() => {
        if (!postType) return;
        setLoading(true);

        const params = new URLSearchParams({
            type: postType,
            limit: String(limit || 6),
            postInfoFields: "image,excerpt",
        });
        if (categoryIds?.length) params.set("cats", categoryIds.join(","));

        xFetch(`/builder-post?${params}`)
            .then((r) => r.json())
            .then((data) => {
                setPosts(data.posts ?? []);
                setLoading(false);
            })
            .catch(() => setLoading(false));
    }, [postType, JSON.stringify(categoryIds), limit]);

    if (!postType) {
        return (
            <div className="flex flex-col items-center justify-center py-10 gap-2 text-gray-400 border-2 border-dashed border-gray-200 rounded-lg">
                <Icon icon="solar:document-bold" width={32} className="opacity-40" />
                <p className="text-xs">Configure the Block Post element</p>
            </div>
        );
    }

    if (loading) {
        return (
            <div className="flex items-center justify-center py-8 gap-2 text-gray-400">
                <Icon icon="svg-spinners:ring-resize" width={20} />
                <span className="text-xs">Loading posts…</span>
            </div>
        );
    }

    if (posts.length === 0) {
        return (
            <div className="py-8 text-center text-xs text-gray-400">
                No published posts found.
            </div>
        );
    }

    const layout = schema.content.layout ?? "grid";
    const columns = schema.content.columns ?? 3;

    const colClass: Record<number, string> = {
        2: "grid-cols-2",
        3: "grid-cols-3",
        4: "grid-cols-4",
    };

    if (layout === "grid") {
        return (
            <div className={`grid gap-4 ${colClass[columns] ?? colClass[3]}`}>
                {posts.map((post) => (
                    <div key={post._id} className="flex flex-col rounded-lg border border-gray-100 overflow-hidden bg-white shadow-sm">
                        {post.info.image && (
                            <div className="aspect-video bg-gray-100 overflow-hidden">
                                <img src={post.info.image} alt={post.title} className="w-full h-full object-cover" />
                            </div>
                        )}
                        <div className="p-3 flex flex-col gap-1">
                            <p className="text-xs font-semibold text-gray-800 line-clamp-2 leading-snug">{post.title}</p>
                            {post.info.excerpt && (
                                <p className="text-[11px] text-gray-400 line-clamp-2">{post.info.excerpt}</p>
                            )}
                            <time className="text-[11px] text-gray-300 mt-1">
                                {new Date(post.createdAt).toLocaleDateString()}
                            </time>
                        </div>
                    </div>
                ))}
            </div>
        );
    }

    if (layout === "list") {
        return (
            <div className="flex flex-col divide-y divide-gray-100">
                {posts.map((post) => (
                    <div key={post._id} className="flex gap-3 py-3">
                        {post.info.image && (
                            <div className="shrink-0 w-16 h-12 rounded overflow-hidden bg-gray-100">
                                <img src={post.info.image} alt={post.title} className="w-full h-full object-cover" />
                            </div>
                        )}
                        <div className="flex flex-col gap-0.5">
                            <p className="text-xs font-semibold text-gray-800 line-clamp-2 leading-snug">{post.title}</p>
                            <time className="text-[11px] text-gray-400">
                                {new Date(post.createdAt).toLocaleDateString()}
                            </time>
                        </div>
                    </div>
                ))}
            </div>
        );
    }

    // compact
    return (
        <ul className="space-y-1">
            {posts.map((post) => (
                <li key={post._id} className="flex items-start gap-2">
                    <span className="mt-1.5 shrink-0 w-1.5 h-1.5 rounded-full bg-indigo-400" />
                    <span className="text-xs text-gray-700 line-clamp-1">{post.title}</span>
                </li>
            ))}
        </ul>
    );
}

// ─── Element definition ───────────────────────────────────────────────────────

const blockPostElement = {
    type: "blog-post",
    category: "News",
    label: "Blog Post",
    icon: "solar:widget-bold",

    schema: {
        content: {
            postType: "",
            categoryIds: [] as string[],   // selected category IDs (empty = all)
            limit: 6,
            layout: "grid",                // "grid" | "list" | "compact"
            columns: 3,                    // grid columns: 2 | 3 | 4
        },
        advanced: {
            margin: { top: 0, right: 0, bottom: 0, left: 0, unit: "px" },
            padding: { top: 0, right: 0, bottom: 0, left: 0, unit: "px" },
            alignSelf: "auto",
        },
    },

    controls: [
        // ── LAYOUT ──────────────────────────────────────────────────────────
        {
            tab: "Layout",
            section: "Query",
            controls: [
                {
                    name: "postType",
                    responsive: false,
                    render: (value: any, onChange: any) => (
                        <Section label="Post Type" defaultOpen>
                            <PostTypeSelector value={value ?? ""} onChange={onChange} />
                        </Section>
                    ),
                },
                {
                    name: "categoryIds",
                    responsive: false,
                    render: (value: any, onChange: any, { schema, updateSchema }: any) => (
                        <Section label="Categories" defaultOpen>
                            <CategoryMultiSelect
                                postType={schema.content.postType}
                                value={value ?? []}
                                onChange={onChange}
                            />
                        </Section>
                    ),
                },
                {
                    name: "limit",
                    responsive: false,
                    render: (value: any, onChange: any) => (
                        <Section label="Number of Posts">
                            <NumberControl
                                label="Limit"
                                value={value ?? 6}
                                onChange={onChange}
                                min={1}
                                max={48}
                            />
                        </Section>
                    ),
                },
            ],
        },

        // ── DISPLAY ──────────────────────────────────────────────────────────
        {
            tab: "Layout",
            section: "Display",
            controls: [
                {
                    name: "layout",
                    responsive: false,
                    render: (value: any, onChange: any) => (
                        <Section label="Layout" defaultOpen>
                            <ButtonGroup
                                value={value ?? "grid"}
                                onChange={onChange}
                                label="Style"
                                grid={2}
                                options={[
                                    { value: "grid",    icon: "mdi:view-grid-outline" },
                                    { value: "list",    icon: "mdi:view-list-outline" },
                                    { value: "compact", icon: "mdi:format-list-bulleted" },
                                ]}
                            />
                        </Section>
                    ),
                },
                {
                    name: "columns",
                    responsive: false,
                    render: (value: any, onChange: any, { schema }: any) => {
                        if (schema.content.layout !== "grid") return null;
                        return (
                            <Section label="Columns">
                                <ButtonGroup
                                    value={String(value ?? 3)}
                                    onChange={(v: string) => onChange(Number(v))}
                                    label="Grid Columns"
                                    grid={2}
                                    options={[
                                        { value: "2", label: "2" },
                                        { value: "3", label: "3" },
                                        { value: "4", label: "4" },
                                    ]}
                                />
                            </Section>
                        );
                    },
                },
            ],
        },

        // ── ADVANCED ────────────────────────────────────────────────────────
        {
            tab: "Advanced",
            section: "Spacing",
            controls: [
                {
                    name: "margin",
                    responsive: true,
                    render: (value: any, onChange: any) => (
                        <Dimensions type="margin" value={value} onChange={onChange} />
                    ),
                },
                {
                    name: "padding",
                    responsive: true,
                    render: (value: any, onChange: any) => (
                        <Dimensions type="padding" value={value} onChange={onChange} />
                    ),
                },
                {
                    name: "alignSelf",
                    responsive: true,
                    render: (value: any, onChange: any) => (
                        <AlignSelf value={value} onChange={onChange} />
                    ),
                },
            ],
        },
    ],

    // ── Canvas render (preview inside the builder editor) ──────────────────
    render: (element: any) => {
        // SSR path: server data pre-rendered by latest.tsx via Builder.tsx
        // is passed as _serverNode and rendered directly.
        if (element._serverNode !== undefined) {
            return element._serverNode;
        }

        // Builder canvas preview — fetches from Express API client-side
        return <BlockPostPreview schema={element.schema} />;
    },
};

export default blockPostElement;
