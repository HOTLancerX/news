/**
 * plugin/news/ui/NewsStyle1.tsx
 *
 * Server Component — fetches all data server-side, then delegates rendering
 * to the selected style component (Style1 … Style10).
 *
 * Adding Style2–10 later requires zero changes here — just create the file
 * and add it to the STYLES map.
 */

import connectDB from "@/lib/mongodb";
import Post from "@/models/post";
import PostInfo from "@/models/post_info";
import Cat from "@/models/cat";
import Permalink from "@/models/permalink";
import type { Types } from "mongoose";
import type { Tab, TabPost, NewsColors } from "./tabs";
import Style1 from "./Style1";

// ─── Style registry ───────────────────────────────────────────────────────────

const STYLES: Record<number, React.ComponentType<{
    title:           string;
    tabs:            Tab[];
    postsByCategory: Record<string, TabPost[]>;
    colors?:         NewsColors;
}>> = {
    1: Style1,
};

// ─── Props ────────────────────────────────────────────────────────────────────

export interface NewsStyle1Props {
    title:       string;
    categoryIds: string[];
    limit:       number;
    /** 1–10, defaults to 1 */
    style:       number;
    colors?:     NewsColors;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function buildUrl(prefix: string, slug: string): string {
    const trimmed = (prefix ?? "").trim().replace(/^\/+|\/+$/g, "");
    return trimmed ? `/${trimmed}/${slug}` : `/${slug}`;
}

function resolveImage(info: Record<string, string>): string {
    if (info.images) {
        try {
            const arr = JSON.parse(info.images);
            if (Array.isArray(arr) && arr[0]) return arr[0] as string;
        } catch { /* fall through */ }
    }
    return info.image ?? "";
}

// ─── Data fetcher ─────────────────────────────────────────────────────────────

async function fetchData(props: Pick<NewsStyle1Props, "categoryIds" | "limit">): Promise<{
    tabs: Tab[];
    postsByCategory: Record<string, TabPost[]>;
}> {
    await connectDB();

    const safeLimit = Math.min(Math.max(Number(props.limit) || 6, 1), 48);

    const [postPermalink, catPermalink] = await Promise.all([
        Permalink.findOne({ contentType: "blog" }).lean() as Promise<any>,
        Permalink.findOne({ contentType: "blog-category" }).lean() as Promise<any>,
    ]);

    const postPrefix = (postPermalink?.prefix ?? "").trim().replace(/^\/+|\/+$/g, "");
    const catPrefix  = (catPermalink?.prefix  ?? "").trim().replace(/^\/+|\/+$/g, "");

    // Resolve category docs
    let catDocs: any[] = [];

    if (props.categoryIds.length > 0) {
        const { Types: MongoTypes } = await import("mongoose");
        const validIds = props.categoryIds
            .filter((id) => MongoTypes.ObjectId.isValid(id))
            .map((id) => new MongoTypes.ObjectId(id));

        catDocs = await Cat.find({ _id: { $in: validIds }, status: "published" })
            .select("_id title slug")
            .lean();

        const order = new Map(props.categoryIds.map((id, i) => [id, i]));
        catDocs.sort((a: any, b: any) =>
            (order.get(a._id.toString()) ?? 999) - (order.get(b._id.toString()) ?? 999)
        );
    } else {
        catDocs = await Cat.find({ type: "blog-category", status: "published" })
            .select("_id title slug")
            .sort({ title: 1 })
            .lean();
    }

    const tabs: Tab[] = catDocs.map((c: any) => ({
        _id:   (c._id as Types.ObjectId).toString(),
        title: c.title,
        url:   buildUrl(catPrefix, c.slug),
    }));

    if (tabs.length === 0) return { tabs: [], postsByCategory: {} };

    const { Types: MongoTypes } = await import("mongoose");

    const allPostsByCategory = await Promise.all(
        tabs.map((tab) =>
            Post.find({
                type:     "blog",
                status:   "published",
                category: new MongoTypes.ObjectId(tab._id),
            })
                .select("_id title slug createdAt")
                .sort({ createdAt: -1 })
                .limit(safeLimit)
                .lean()
        )
    );

    const allPosts = allPostsByCategory.flat();
    const infoMap: Record<string, Record<string, string>> = {};

    if (allPosts.length > 0) {
        const postIds = allPosts.map((p) => p._id as Types.ObjectId);
        const infos   = await PostInfo.find({
            postId: { $in: postIds },
            name:   { $in: ["image", "images", "excerpt"] },
        })
            .select("postId name value")
            .lean();

        for (const info of infos) {
            const key = (info.postId as Types.ObjectId).toString();
            if (!infoMap[key]) infoMap[key] = {};
            infoMap[key][info.name] = info.value;
        }
    }

    const postsByCategory: Record<string, TabPost[]> = {};

    tabs.forEach((tab, i) => {
        postsByCategory[tab._id] = allPostsByCategory[i].map((p) => {
            const id   = (p._id as Types.ObjectId).toString();
            const info = infoMap[id] ?? {};
            return {
                _id:           id,
                title:         p.title,
                slug:          p.slug,
                postUrl:       buildUrl(postPrefix, p.slug),
                categoryTitle: tab.title,
                categoryUrl:   tab.url,
                createdAt:     (p.createdAt as Date).toISOString(),
                image:         resolveImage(info),
                excerpt:       info.excerpt ?? "",
            };
        });
    });

    return { tabs, postsByCategory };
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default async function NewsStyle1({
    title,
    categoryIds,
    limit,
    style = 1,
    colors,
}: NewsStyle1Props) {
    if (!title) return null;

    const { tabs, postsByCategory } = await fetchData({ categoryIds, limit });

    const StyleComponent = STYLES[style] ?? Style1;

    return (
        <StyleComponent
            title={title}
            tabs={tabs}
            postsByCategory={postsByCategory}
            colors={colors}
        />
    );
}
