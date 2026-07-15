/**
 * plugin/news/lib/builderData.tsx
 *
 * Auto-discovered by hook/builderDataHooks.ts via require.context.
 * Registers LatestPosts as the server-side renderer for "blog-post" elements.
 *
 * LatestPosts is the single source of truth: it fetches from MongoDB
 * and renders JSX. No logic is duplicated here.
 *
 * SERVER-ONLY. Never import from plugin/news/index.ts or any client component.
 */

import React from "react";
import { registerBuilderElement } from "@/hook/builderDataHooks";
import LatestPosts  from "@/plugin/news/ui/latest";
import NewsStyle1   from "@/plugin/news/ui/NewsStyle1";

registerBuilderElement("blog-post", (schema) => {
    const c = schema?.content ?? {};
    return (
        <LatestPosts
            postType={c.postType    ?? ""}
            categoryIds={c.categoryIds ?? []}
            limit={c.limit       ?? 6}
            layout={c.layout      ?? "grid"}
            columns={c.columns     ?? 3}
        />
    );
});

registerBuilderElement("news-style-1", (schema) => {
    const c = schema?.content ?? {};
    const s = schema?.style   ?? {};

    const colors = {
        active:       s.activeTabColor       || "#6366f1",
        activeText:   s.activeTabTextColor   || "#ffffff",
        inactive:     s.inactiveTabColor     || "",
        inactiveText: s.inactiveTabTextColor || "",
        title:        s.titleColor           || "",
        titleHover:   s.titleHoverColor      || "",
    };

    return (
        <NewsStyle1
            title={c.title       ?? ""}
            categoryIds={c.categoryIds ?? []}
            limit={c.limit       ?? 6}
            style={c.style       ?? 1}
            colors={colors}
        />
    );
});

registerBuilderElement("blog-title", async (schema: any, data?: any) => {
    const title = data?.title || "Example Blog Post Title";
    const tag = schema.content?.tag || "h1";
    return React.createElement(tag, {}, title);
});

registerBuilderElement("blog-image", async (schema: any, data?: any) => {
    const align = schema.style?.alignment || "center";
    const w = schema.style?.width ?? 100;
    const wUnit = schema.style?.widthUnit || "%";
    const h = schema.style?.height ?? 400;
    const hUnit = schema.style?.heightUnit || "px";
    const objectFit = schema.style?.objectFit || "cover";

    const imagesVal = data?.info?.images || '';
    let imageUrl = "https://images.unsplash.com/photo-1499750310107-5fef28a66643?q=80&w=800";
    if (imagesVal) {
        try {
            const parsed = JSON.parse(imagesVal);
            if (Array.isArray(parsed) && parsed.length > 0) imageUrl = parsed[0];
        } catch {
            const split = imagesVal.split(',').map((s: string) => s.trim()).filter(Boolean);
            if (split.length > 0) imageUrl = split[0];
        }
    } else if (data?.info?.seo_image) {
        imageUrl = data.info.seo_image;
    }

    const justify = align === "left" ? "flex-start" : align === "right" ? "flex-end" : "center";
    return (
        <div style={{ display: "flex", justifyContent: justify, width: "100%" }}>
            <img
                src={imageUrl}
                alt={data?.title || "Blog image"}
                style={{
                    display: "block",
                    width: wUnit === "auto" ? "auto" : `${w}${wUnit}`,
                    height: hUnit === "auto" ? "auto" : `${h}${hUnit}`,
                    objectFit: objectFit as any,
                    boxSizing: "border-box",
                }}
            />
        </div>
    );
});

registerBuilderElement("blog-category", async (schema: any, data?: any) => {
    const color = schema.style?.color ?? "#ffffff";
    const bg = schema.style?.badgeBg ?? "#6366f1";
    const radius = schema.style?.borderRadius ?? 9999;
    const align = schema.style?.textAlign ?? "left";
    const fontSize = schema.style?.typography?.fontSize ?? 13;
    const fontWeight = schema.style?.typography?.fontWeight ?? "600";

    let catName = "Technology";
    let catLink = "#";
    
    if (data?.category) {
        try {
            const CatModel = (await import("@/models/cat")).default;
            const catDoc = await CatModel.findById(data.category).lean() as any;
            if (catDoc) {
                catName = catDoc.title;
                const PermalinkModel = (await import("@/models/permalink")).default;
                const pm = await PermalinkModel.findOne({ contentType: "blog-category" }).lean() as any;
                const prefix = pm?.prefix || "blog/category";
                const p = prefix.trim().replace(/^\/+|\/+$/g, '');
                catLink = p ? `/${p}/${catDoc.slug}` : `/${catDoc.slug}`;
            }
        } catch (err) {
            // ignore
        }
    }

    const justify = align === "left" ? "flex-start" : align === "right" ? "flex-end" : "center";
    return (
        <div style={{ display: "flex", justifyContent: justify, width: "100%" }}>
            <a
                href={catLink}
                style={{
                    display: "inline-block",
                    color,
                    backgroundColor: bg,
                    borderRadius: `${radius}px`,
                    fontSize: `${fontSize}px`,
                    fontWeight,
                    textTransform: "uppercase",
                    letterSpacing: "0.05em",
                    boxSizing: "border-box",
                    textDecoration: "none",
                }}
            >
                {catName}
            </a>
        </div>
    );
});

registerBuilderElement("blog-description", async (schema: any, data?: any) => {
    const color = schema.style?.color ?? "#374151";
    const align = schema.style?.textAlign ?? "left";
    const fontSize = schema.style?.typography?.fontSize ?? 16;
    const fontWeight = schema.style?.typography?.fontWeight ?? "400";
    const lineHeight = schema.style?.typography?.lineHeight ?? 28;

    const content = data?.info?.description || data?.info?.shortDescription || "";

    if (content) {
        return (
            <div
                style={{
                    color,
                    textAlign: align as any,
                    fontSize: `${fontSize}px`,
                    fontWeight,
                    lineHeight: `${lineHeight}px`,
                    boxSizing: "border-box",
                }}
                dangerouslySetInnerHTML={{ __html: content }}
            />
        );
    }

    return (
        <div
            style={{
                color,
                textAlign: align as any,
                fontSize: `${fontSize}px`,
                fontWeight,
                lineHeight: `${lineHeight}px`,
                boxSizing: "border-box",
            }}
        >
            No content available.
        </div>
    );
});

registerBuilderElement("blog-meta", async (schema: any, data?: any) => {
    const color = schema.style?.color ?? "#6b7280";
    const align = schema.style?.textAlign ?? "left";
    const fontSize = schema.style?.typography?.fontSize ?? 14;
    const fontWeight = schema.style?.typography?.fontWeight ?? "400";

    const showDate = schema.content?.showDate !== false;
    const showStatus = schema.content?.showStatus !== false;
    const showSlug = schema.content?.showSlug !== false;
    const showAuthor = schema.content?.showAuthor !== false;

    let authorName = "Admin";
    if (showAuthor && data?.userId) {
        try {
            const UserModel = (await import("@/models/Users")).default;
            const userDoc = await UserModel.findById(data.userId).lean() as any;
            if (userDoc) {
                authorName = userDoc.name;
            }
        } catch {
            // ignore
        }
    }

    const publishedAt = data?.createdAt
        ? new Date(data.createdAt).toLocaleDateString('en-US', {
              year: 'numeric', month: 'long', day: 'numeric',
          })
        : "October 24, 2026";

    const status = data?.status || "published";
    const slug = data?.slug || "example-blog-post";

    const justify = align === "left" ? "flex-start" : align === "right" ? "flex-end" : "center";
    return (
        <div
            style={{
                display: "flex",
                justifyContent: justify as any,
                alignItems: "center",
                flexWrap: "wrap",
                gap: "16px",
                color,
                fontSize: `${fontSize}px`,
                fontWeight,
                boxSizing: "border-box",
            }}
        >
            {showAuthor && (
                <span style={{ display: "inline-flex", alignItems: "center", gap: "6px" }}>
                    <svg style={{ width: "16px", height: "16px" }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                    {authorName}
                </span>
            )}
            {showDate && (
                <span style={{ display: "inline-flex", alignItems: "center", gap: "6px" }}>
                    <svg style={{ width: "16px", height: "16px" }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    {publishedAt}
                </span>
            )}
            {showStatus && (
                <span style={{ display: "inline-flex", alignItems: "center", gap: "6px", textTransform: "capitalize" }}>
                    <svg style={{ width: "16px", height: "16px" }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    {status}
                </span>
            )}
            {showSlug && (
                <span style={{ display: "inline-flex", alignItems: "center", gap: "6px", fontFamily: "monospace" }}>
                    <svg style={{ width: "16px", height: "16px" }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                    </svg>
                    {slug}
                </span>
            )}
        </div>
    );
});

registerBuilderElement("related", async (schema: any, data?: any) => {
    const limit = schema.content?.limit ?? 5;
    const layout = schema.content?.layout || "grid";
    const titleColor = schema.style?.titleColor ?? "#1f2937";
    const dateColor = schema.style?.dateColor ?? "#6b7280";

    let relatedPosts: any[] = [];

    if (data?.category && data?._id) {
        try {
            const PostModel = (await import("@/models/post")).default;
            const PostInfoModel = (await import("@/models/post_info")).default;
            const CatModel = (await import("@/models/cat")).default;
            const PermalinkModel = (await import("@/models/permalink")).default;

            const posts = await PostModel.find({
                type: data.type,
                category: data.category,
                _id: { $ne: data._id },
                status: "published",
            })
            .limit(limit)
            .lean() as any[];

            const pm = await PermalinkModel.findOne({ contentType: data.type }).lean() as any;
            const prefix = pm?.prefix || data.type;
            const p = prefix.trim().replace(/^\/+|\/+$/g, '');

            const catDoc = await CatModel.findById(data.category).lean() as any;
            const catName = catDoc?.title || "Technology";

            relatedPosts = await Promise.all(
                posts.map(async (post) => {
                    const infoRecords = await PostInfoModel.find({ postId: post._id }).lean() as any[];
                    const infoMap = infoRecords.reduce<Record<string, string>>((acc, r) => {
                        acc[r.name] = r.value;
                        return acc;
                    }, {});

                    let image = "https://images.unsplash.com/photo-1499750310107-5fef28a66643?q=80&w=400";
                    if (infoMap.images) {
                        try {
                            const parsed = JSON.parse(infoMap.images);
                            if (Array.isArray(parsed) && parsed.length > 0) image = parsed[0];
                        } catch {
                            const split = infoMap.images.split(',').map((s) => s.trim()).filter(Boolean);
                            if (split.length > 0) image = split[0];
                        }
                    } else if (infoMap.image) {
                        image = infoMap.image;
                    }

                    const postUrl = p ? `/${p}/${post.slug}` : `/${post.slug}`;
                    const date = post.createdAt instanceof Date
                        ? post.createdAt.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })
                        : "October 24, 2026";

                    return {
                        id: String(post._id),
                        title: post.title,
                        postUrl,
                        date,
                        image,
                        categoryName: catName,
                    };
                })
            );
        } catch {
            // fallback empty
        }
    }

    if (relatedPosts.length === 0) {
        return null;
    }

    return (
        <div className="font-sans w-full">
            <h3 className="text-lg font-bold mb-4 text-gray-800">Related Articles</h3>
            {layout === "grid" ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-5">
                    {relatedPosts.map((post) => (
                        <div key={post.id} className="bg-white border rounded-xl overflow-hidden shadow-xs hover:shadow-md transition">
                            <a href={post.postUrl} className="relative block h-40 bg-gray-100">
                                <img src={post.image} alt={post.title} className="w-full h-full object-cover" />
                            </a>
                            <div className="p-4">
                                <span className="text-[11px] font-bold text-indigo-600 uppercase">{post.categoryName}</span>
                                <h4 className="font-bold text-sm mt-1 line-clamp-2">
                                    <a href={post.postUrl} style={{ color: titleColor, textDecoration: "none" }} className="hover:underline">
                                        {post.title}
                                    </a>
                                </h4>
                                <p className="text-[12px] mt-2" style={{ color: dateColor }}>
                                    {post.date}
                                </p>
                            </div>
                        </div>
                    ))}
                </div>
            ) : (
                <div className="space-y-4">
                    {relatedPosts.map((post) => (
                        <div key={post.id} className="flex gap-4 p-3 bg-white border rounded-xl hover:shadow-sm transition">
                            <a href={post.postUrl} className="w-24 h-20 shrink-0 bg-gray-100 rounded-lg overflow-hidden block">
                                <img src={post.image} alt={post.title} className="w-full h-full object-cover" />
                            </a>
                            <div className="flex-1 min-w-0 flex flex-col justify-center">
                                <span className="text-[10px] font-bold text-indigo-600 uppercase">{post.categoryName}</span>
                                <h4 className="font-bold text-sm mt-0.5 truncate">
                                    <a href={post.postUrl} style={{ color: titleColor, textDecoration: "none" }} className="hover:underline">
                                        {post.title}
                                    </a>
                                </h4>
                                <p className="text-[11px] mt-1" style={{ color: dateColor }}>
                                    {post.date}
                                </p>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
});
