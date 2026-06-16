/**
 * plugin/news/lib/serverHooks.ts — Server-only hook registration.
 *
 * Auto-discovered by hook/serverDataHooks.ts via require.context.
 * Registers data providers for blog category types.
 *
 * NEVER import this file from plugin/news/index.ts or any client component.
 */

import { registerServerDataHook } from "@/hook/serverDataHooks";
import mongoose from "mongoose";
import Post     from "@/models/post";
import PostInfo from "@/models/post_info";
import Cat      from "@/models/cat";
import Template from "@/models/template";

// ── Types ─────────────────────────────────────────────────────────────────────

interface BlogPost {
    _id:       string;
    title:     string;
    slug:      string;
    createdAt: string;
    info:      Record<string, string>;
}

interface BlogCatPageData {
    posts:     BlogPost[];
    subCats:   { _id: string; title: string; slug: string }[];
    ancestors: { _id: string; title: string; slug: string }[];
    activeBox: { label: string; pluginNx: string } | null;
}

// ── Helpers ───────────────────────────────────────────────────────────────────

async function getDescendantIds(catId: string): Promise<mongoose.Types.ObjectId[]> {
    const result: mongoose.Types.ObjectId[] = [new mongoose.Types.ObjectId(catId)];
    const queue = [catId];
    while (queue.length > 0) {
        const parentId = queue.shift()!;
        const children = await Cat
            .find({ parentId: new mongoose.Types.ObjectId(parentId) })
            .select("_id").lean() as any[];
        for (const c of children) {
            result.push(c._id);
            queue.push(String(c._id));
        }
    }
    return result;
}

async function buildAncestorChain(catId: string) {
    const chain: { _id: string; title: string; slug: string }[] = [];
    let current: any = await Cat.findById(catId).lean();
    while (current) {
        chain.unshift({ _id: String(current._id), title: current.title ?? '', slug: current.slug ?? '' });
        if (!current.parentId) break;
        current = await Cat.findById(current.parentId).lean();
    }
    return chain;
}

async function getActiveBlogBoxTemplate() {
    const doc = await Template.findOne({ type: "blog-box", isDefault: true }).lean() as any;
    if (!doc) return null;
    return { label: doc.label as string, pluginNx: doc.pluginNx as string };
}

// ── Data provider ─────────────────────────────────────────────────────────────

async function getBlogCategoryPageData(catId: string, _slug: string): Promise<BlogCatPageData> {
    const allCatIds = await getDescendantIds(catId);

    const rawPosts = await Post.find({
        category: { $in: allCatIds },
        type:     "blog",
        status:   "published",
    }).lean() as any[];

    const infoRecords = rawPosts.length > 0
        ? await PostInfo.find({ postId: { $in: rawPosts.map((p: any) => p._id) } }).lean() as any[]
        : [];

    const infoByPost: Record<string, Record<string, string>> = {};
    for (const r of infoRecords) {
        const key = String(r.postId);
        if (!infoByPost[key]) infoByPost[key] = {};
        infoByPost[key][r.name] = r.value;
    }

    const posts: BlogPost[] = rawPosts.map((p: any) => ({
        _id:       String(p._id),
        title:     p.title     ?? "",
        slug:      p.slug      ?? "",
        createdAt: p.createdAt ? new Date(p.createdAt).toISOString() : "",
        info:      infoByPost[String(p._id)] ?? {},
    }));

    const rawSubCats = await Cat.find({
        parentId: new mongoose.Types.ObjectId(catId),
        type:     "blog-category",
        status:   "published",
    }).lean() as any[];

    const subCats = rawSubCats.map((c: any) => ({
        _id: String(c._id), title: c.title ?? "", slug: c.slug ?? "",
    }));

    const [ancestors, activeBox] = await Promise.all([
        buildAncestorChain(catId),
        getActiveBlogBoxTemplate(),
    ]);

    return { posts, subCats, ancestors, activeBox };
}

// ── Register ──────────────────────────────────────────────────────────────────
registerServerDataHook("blog-category", getBlogCategoryPageData);

// ── Blog post — category name + url for the category badge ───────────────────
registerServerDataHook("blog", async (_id, _slug, data) => {
    if (!data?.category) return { categoryName: null, categorySlug: null };
    const cat = await Cat.findById(data.category).select("title slug").lean() as any;
    if (!cat) return { categoryName: null, categorySlug: null };
    return {
        categoryName: cat.title ?? null,
        categorySlug: cat.slug  ?? null,
    };
});
