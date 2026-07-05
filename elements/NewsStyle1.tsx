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
    Tabs,
    Typography,
    Border,
} from "@/components/builder/controls";
import { xFetch } from "@/lib/express";
import NewsStyle1Client from "@/plugin/news/ui/NewsStyle1Client";

// ─── Category sorter: select + drag-to-reorder ────────────────────────────────

interface Cat {
    _id: string;
    title: string;
    slug: string;
}

function CategorySorter({
    value,
    onChange,
}: {
    value: string[];
    onChange: (v: string[]) => void;
}) {
    const [cats, setCats]       = useState<Cat[]>([]);
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

    const selectedIds    = value.filter((id) => cats.some((c) => c._id === id));
    const unselectedCats = cats.filter((c) => !selectedIds.includes(c._id));
    const catById        = Object.fromEntries(cats.map((c) => [c._id, c]));

    return (
        <div className="flex flex-col gap-1">
            <label className="flex items-center gap-2 px-1 py-1 rounded cursor-pointer hover:bg-gray-50">
                <input type="checkbox" checked={value.length === 0}
                    onChange={() => onChange([])} className="w-3.5 h-3.5 accent-indigo-500" />
                <span className="text-xs text-gray-700 font-medium">All categories</span>
            </label>
            <div className="border-t border-gray-100 my-1" />

            {selectedIds.length > 0 && (
                <>
                    <p className="text-[10px] text-gray-400 px-1 uppercase tracking-wide font-semibold">
                        Selected (drag to reorder)
                    </p>
                    {selectedIds.map((id, idx) => {
                        const cat = catById[id];
                        if (!cat) return null;
                        return (
                            <div key={id} draggable
                                onDragStart={() => setDragIdx(idx)}
                                onDragOver={(e) => e.preventDefault()}
                                onDrop={() => handleDrop(idx)}
                                className={`flex items-center gap-2 px-1 py-1 rounded cursor-grab hover:bg-indigo-50 ${dragIdx === idx ? "opacity-50" : ""}`}
                            >
                                <Icon icon="mdi:drag" width={14} className="text-gray-300 shrink-0" />
                                <input type="checkbox" checked onChange={() => toggle(id)} className="w-3.5 h-3.5 accent-indigo-500" />
                                <span className="text-xs text-gray-700">{cat.title}</span>
                                <span className="ml-auto text-[10px] text-indigo-400 font-semibold">#{idx + 1}</span>
                            </div>
                        );
                    })}
                    {unselectedCats.length > 0 && <div className="border-t border-gray-100 my-1" />}
                </>
            )}

            {unselectedCats.map((cat) => (
                <label key={cat._id} className="flex items-center gap-2 px-1 py-1 rounded cursor-pointer hover:bg-gray-50">
                    <span className="w-3.5 shrink-0" />
                    <input type="checkbox" checked={false} onChange={() => toggle(cat._id)} className="w-3.5 h-3.5 accent-indigo-500" />
                    <span className="text-xs text-gray-700">{cat.title}</span>
                </label>
            ))}
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
        },
        style: {
            // Title
            titleColor:          "",
            titleHoverColor:     "",
            titleTypography:     {
                fontFamily: "", fontSize: 20, fontSizeUnit: "px",
                fontWeight: "700", textTransform: "", fontStyle: "",
                textDecoration: "", lineHeight: 0, lineHeightUnit: "px",
                letterSpacing: 0, letterSpacingUnit: "px",
                wordSpacing: 0, wordSpacingUnit: "px",
            },
            // Active tab pill
            activeTabColor:      "#6366f1",
            activeTabTextColor:  "#ffffff",
            // Inactive tab pill
            inactiveTabColor:    "",
            inactiveTabTextColor: "",
            // Border under header
            border:              {},
        },
        advanced: {
            margin:    { top: 0, right: 0, bottom: 0, left: 0, unit: "px" },
            padding:   { top: 0, right: 0, bottom: 0, left: 0, unit: "px" },
            alignSelf: "auto",
        },
    },

    controls: [

        // ═══════════════════════════════════════════════════════ LAYOUT ══════
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
                            <NumberControl label="Limit" value={value ?? 6} onChange={onChange} min={2} max={20} />
                        </Section>
                    ),
                },
            ],
        },

        // ════════════════════════════════════════════════════════ STYLE ══════
        {
            tab:     "Style",
            section: "Title",
            controls: [
                {
                    name:       "titleColor",
                    responsive: false,
                    render:     (value: any, onChange: any, { schema, updateSchema }: any) => (
                        <Section label="Title Color" defaultOpen>
                            <Tabs tabs={[
                                {
                                    label:   "Normal",
                                    content: <ColorPickerPopup label="Color" value={value ?? ""} onChange={onChange} />,
                                },
                                {
                                    label:   "Hover",
                                    content: <ColorPickerPopup label="Color"
                                        value={schema.style?.titleHoverColor ?? ""}
                                        onChange={(v: string) => updateSchema("style", "titleHoverColor", v)} />,
                                },
                            ]} />
                        </Section>
                    ),
                },
                {
                    name:       "titleTypography",
                    responsive: true,
                    render:     (value: any, onChange: any) => (
                        <Section label="Title Typography">
                            <Typography value={value} onChange={onChange} />
                        </Section>
                    ),
                },
            ],
        },

        {
            tab:     "Style",
            section: "Active Tab",
            controls: [
                {
                    name:       "activeTabColor",
                    responsive: false,
                    render:     (value: any, onChange: any) => (
                        <Section label="Active Tab" defaultOpen>
                            <div className="flex flex-col gap-3">
                                <ColorPickerPopup label="Background" value={value ?? "#6366f1"} onChange={onChange} />
                            </div>
                        </Section>
                    ),
                },
                {
                    name:       "activeTabTextColor",
                    responsive: false,
                    render:     (value: any, onChange: any) => (
                        <Section label="Active Tab Text">
                            <ColorPickerPopup label="Text Color" value={value ?? "#ffffff"} onChange={onChange} />
                        </Section>
                    ),
                },
            ],
        },

        {
            tab:     "Style",
            section: "Inactive Tab",
            controls: [
                {
                    name:       "inactiveTabColor",
                    responsive: false,
                    render:     (value: any, onChange: any) => (
                        <Section label="Inactive Tab" defaultOpen>
                            <ColorPickerPopup label="Background" value={value ?? ""} onChange={onChange} />
                        </Section>
                    ),
                },
                {
                    name:       "inactiveTabTextColor",
                    responsive: false,
                    render:     (value: any, onChange: any) => (
                        <Section label="Inactive Tab Text">
                            <ColorPickerPopup label="Text Color" value={value ?? ""} onChange={onChange} />
                        </Section>
                    ),
                },
            ],
        },

        {
            tab:     "Style",
            section: "Border",
            controls: [
                {
                    name:       "border",
                    responsive: false,
                    render:     (value: any, onChange: any) => (
                        <Section label="Header Border">
                            <Border value={value ?? {}} onChange={onChange} />
                        </Section>
                    ),
                },
            ],
        },

        // ══════════════════════════════════════════════════════ ADVANCED ═════
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

    render: (element: any) => {
        const c = element.schema?.content ?? {};
        const s = element.schema?.style   ?? {};
        return (
            <NewsStyle1Client
                title={c.title       ?? ""}
                categoryIds={c.categoryIds ?? []}
                limit={c.limit       ?? 6}
                style={c.style       ?? 1}
                colors={{
                    active:       s.activeTabColor       || "#6366f1",
                    activeText:   s.activeTabTextColor   || "#ffffff",
                    inactive:     s.inactiveTabColor     || "",
                    inactiveText: s.inactiveTabTextColor || "",
                    title:        s.titleColor           || "",
                    titleHover:   s.titleHoverColor      || "",
                }}
            />
        );
    },
};

export default newsStyle1Element;
