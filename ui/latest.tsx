/**
 * plugin/news/ui/latest.tsx
 *
 * Server Component — fetches and renders the latest posts for the
 * Block Post builder element entirely on the server (no Express API call).
 * Queries MongoDB directly via Mongoose models.
 *
 * - Post URLs built from the stored permalink prefix (e.g. /blog/my-slug)
 * - Category badge is a clickable link (e.g. /blog-category/my-cat)
 * - Images resolved from PostInfo "images" (JSON array) or "image" field
 */

import connectDB from "@/lib/mongodb";
import Post from "@/models/post";
import PostInfo from "@/models/post_info";
import Cat from "@/models/cat";
import Permalink from "@/models/permalink";
import Link from "next/link";
import type { Types } from "mongoose";
import { getAllCatTypes } from "@/hook";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface LatestPostsProps {
    /** Post type key, e.g. "blog" */
    postType: string;
    /** Selected category IDs — empty array means all categories */
    categoryIds: string[];
    /** Number of posts to show */
    limit: number;
    /** Layout variant */
    layout: "grid" | "list" | "compact";
    /** Number of columns in grid mode */
    columns: 2 | 3 | 4;
}

interface PostRow {
    _id: string;
    title: string;
    slug: string;
    postUrl: string;
    category: string | null;
    categoryTitle?: string;
    categoryUrl?: string;
    createdAt: string;
    image?: string;
    excerpt?: string;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function buildUrl(prefix: string, slug: string): string {
    const trimmed = prefix.trim().replace(/^\/+|\/+$/g, "");
    return trimmed ? `/${trimmed}/${slug}` : `/${slug}`;
}

function resolveImage(info: Record<string, string>): string {
    // Prefer "images" JSON array (same as Blog boxes), fall back to "image"
    if (info.images) {
        try {
            const arr = JSON.parse(info.images);
            if (Array.isArray(arr) && arr[0]) return arr[0] as string;
        } catch { /* fall through */ }
    }
    return info.image ?? "";
}

// ─── Data fetcher ─────────────────────────────────────────────────────────────

async function fetchPosts(props: LatestPostsProps): Promise<PostRow[]> {
    await connectDB();

    const filter: Record<string, unknown> = {
        type: props.postType,
        status: "published",
    };

    if (props.categoryIds.length > 0) {
        const { Types: MongoTypes } = await import("mongoose");
        const validIds = props.categoryIds
            .filter((id) => MongoTypes.ObjectId.isValid(id))
            .map((id) => new MongoTypes.ObjectId(id));
        if (validIds.length > 0) filter.category = { $in: validIds };
    }

    const posts = await Post.find(filter)
        .select("_id title slug category createdAt")
        .sort({ createdAt: -1 })
        .limit(Math.min(props.limit, 48))
        .lean();

    if (posts.length === 0) return [];

    // ── Resolve permalink prefixes from DB ────────────────────────────────────
    // Find the cat type that belongs to this post type
    const catTypes = getAllCatTypes();
    const catTypeKey =
        catTypes.find((ct) => ct.postType === props.postType)?.key ?? "";

    const [postPermalink, catPermalink] = await Promise.all([
        Permalink.findOne({ contentType: props.postType }).lean() as Promise<any>,
        catTypeKey
            ? (Permalink.findOne({ contentType: catTypeKey }).lean() as Promise<any>)
            : Promise.resolve(null),
    ]);

    const postPrefix = (postPermalink?.prefix ?? "").trim().replace(/^\/+|\/+$/g, "");
    const catPrefix  = (catPermalink?.prefix  ?? "").trim().replace(/^\/+|\/+$/g, "");

    // ── Batch-fetch PostInfo for image + images + excerpt ─────────────────────
    const postIds = posts.map((p) => p._id as Types.ObjectId);
    const infos = await PostInfo.find({
        postId: { $in: postIds },
        name: { $in: ["image", "images", "excerpt"] },
    })
        .select("postId name value")
        .lean();

    const infoMap: Record<string, Record<string, string>> = {};
    for (const info of infos) {
        const key = (info.postId as Types.ObjectId).toString();
        if (!infoMap[key]) infoMap[key] = {};
        infoMap[key][info.name] = info.value;
    }

    // ── Batch-fetch category titles + slugs ───────────────────────────────────
    const catIds = [
        ...new Set(
            posts.map((p) => p.category?.toString()).filter(Boolean) as string[]
        ),
    ];
    const cats = catIds.length
        ? await Cat.find({ _id: { $in: catIds } })
              .select("_id title slug")
              .lean()
        : [];

    const catMap: Record<string, { title: string; slug: string }> = {};
    for (const c of cats) {
        catMap[(c._id as Types.ObjectId).toString()] = {
            title: c.title,
            slug:  c.slug,
        };
    }

    return posts.map((p) => {
        const id    = (p._id as Types.ObjectId).toString();
        const catId = p.category?.toString() ?? null;
        const info  = infoMap[id] ?? {};
        const cat   = catId ? catMap[catId] : null;

        return {
            _id:           id,
            title:         p.title,
            slug:          p.slug,
            postUrl:       buildUrl(postPrefix, p.slug),
            category:      catId,
            categoryTitle: cat?.title,
            categoryUrl:   cat ? buildUrl(catPrefix, cat.slug) : undefined,
            createdAt:     (p.createdAt as Date).toISOString(),
            image:         resolveImage(info) || undefined,
            excerpt:       info.excerpt || undefined,
        };
    });
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function PostCard({ post }: { post: PostRow }) {
    return (
        <article className="group flex flex-col overflow-hidden rounded-xl border border-gray-100 bg-white shadow-sm hover:shadow-md transition-shadow">
            {/* Image */}
            <Link href={post.postUrl} className="block overflow-hidden aspect-video bg-gray-100">
                {post.image ? (
                    <img
                        src={post.image}
                        alt={post.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-200">
                        <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M19 3H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V5a2 2 0 0 0-2-2zm-8.5 12.5-2-2.5L5 17h14l-4.5-6z"/>
                        </svg>
                    </div>
                )}
            </Link>

            <div className="flex flex-col flex-1 p-4 gap-2">
                {/* Category badge — clickable */}
                {post.categoryTitle && post.categoryUrl && (
                    <Link
                        href={post.categoryUrl}
                        className="text-xs font-semibold text-indigo-500 uppercase tracking-wide hover:text-indigo-700 transition-colors no-underline w-fit"
                    >
                        {post.categoryTitle}
                    </Link>
                )}

                {/* Title */}
                <Link href={post.postUrl} className="no-underline">
                    <h3 className="text-sm font-bold text-gray-900 leading-snug group-hover:text-indigo-600 transition-colors line-clamp-2">
                        {post.title}
                    </h3>
                </Link>

                {post.excerpt && (
                    <p className="text-xs text-gray-500 leading-relaxed line-clamp-3">
                        {post.excerpt}
                    </p>
                )}

                <time className="mt-auto text-xs text-gray-400 pt-2 border-t border-gray-50">
                    {new Date(post.createdAt).toLocaleDateString(undefined, {
                        year: "numeric", month: "short", day: "numeric",
                    })}
                </time>
            </div>
        </article>
    );
}

function PostListRow({ post }: { post: PostRow }) {
    return (
        <article className="group flex gap-4 py-3 border-b border-gray-100 last:border-0">
            {post.image && (
                <Link
                    href={post.postUrl}
                    className="shrink-0 w-20 h-16 overflow-hidden rounded-lg bg-gray-100 block"
                >
                    <img
                        src={post.image}
                        alt={post.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                </Link>
            )}
            <div className="flex-1 min-w-0 flex flex-col gap-1">
                {post.categoryTitle && post.categoryUrl && (
                    <Link
                        href={post.categoryUrl}
                        className="text-xs font-semibold text-indigo-500 uppercase tracking-wide hover:text-indigo-700 transition-colors no-underline w-fit"
                    >
                        {post.categoryTitle}
                    </Link>
                )}
                <Link href={post.postUrl} className="no-underline">
                    <h3 className="text-sm font-semibold text-gray-900 leading-snug group-hover:text-indigo-600 transition-colors line-clamp-2">
                        {post.title}
                    </h3>
                </Link>
                <time className="text-xs text-gray-400">
                    {new Date(post.createdAt).toLocaleDateString(undefined, {
                        year: "numeric", month: "short", day: "numeric",
                    })}
                </time>
            </div>
        </article>
    );
}

function PostCompactRow({ post }: { post: PostRow }) {
    return (
        <li className="group flex items-start gap-2 py-1.5">
            <span className="mt-1.5 shrink-0 w-1.5 h-1.5 rounded-full bg-indigo-400" />
            <Link
                href={post.postUrl}
                className="no-underline text-sm text-gray-800 group-hover:text-indigo-600 transition-colors line-clamp-2 leading-snug"
            >
                {post.title}
            </Link>
        </li>
    );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default async function LatestPosts(props: LatestPostsProps) {
    const posts = await fetchPosts(props);

    if (posts.length === 0) {
        return (
            <div className="py-8 text-center text-sm text-gray-400">
                No posts found.
            </div>
        );
    }

    const colClass: Record<number, string> = {
        2: "grid-cols-1 sm:grid-cols-2",
        3: "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3",
        4: "grid-cols-1 sm:grid-cols-2 lg:grid-cols-4",
    };

    if (props.layout === "grid") {
        return (
            <div className={`grid gap-5 ${colClass[props.columns] ?? colClass[3]}`}>
                {posts.map((post) => (
                    <PostCard key={post._id} post={post} />
                ))}
            </div>
        );
    }

    if (props.layout === "list") {
        return (
            <div className="flex flex-col">
                {posts.map((post) => (
                    <PostListRow key={post._id} post={post} />
                ))}
            </div>
        );
    }

    // compact
    return (
        <ul className="space-y-0.5">
            {posts.map((post) => (
                <PostCompactRow key={post._id} post={post} />
            ))}
        </ul>
    );
}
