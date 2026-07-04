"use client";

/**
 * plugin/news/ui/Style1.tsx
 *
 * News Style 1 — client component.
 * Layout: title + category tabs header, then 50% featured post | 50% post list.
 * Uses NewsTabs for the header + tab state, renders its own post grid.
 */

import Link from "next/link";
import NewsTabs, { type Tab, type TabPost, type NewsColors } from "./tabs";

// ─── Props ────────────────────────────────────────────────────────────────────

export interface Style1Props {
    title:           string;
    tabs:            Tab[];
    postsByCategory: Record<string, TabPost[]>;
    colors?:         NewsColors;
}

// ─── Post card components ─────────────────────────────────────────────────────

function FeaturedPost({ post }: { post: TabPost }) {
    return (
        <article className="group flex flex-col overflow-hidden rounded-xl border border-gray-100 bg-white shadow-sm hover:shadow-md transition-shadow h-full">
            <Link
                href={post.postUrl}
                className="block overflow-hidden aspect-video bg-gray-100 shrink-0"
            >
                {post.image ? (
                    <img
                        src={post.image}
                        alt={post.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-200">
                        <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M19 3H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V5a2 2 0 0 0-2-2zm-8.5 12.5-2-2.5L5 17h14l-4.5-6z" />
                        </svg>
                    </div>
                )}
            </Link>

            <div className="flex flex-col flex-1 p-4 gap-2">
                {post.categoryTitle && post.categoryUrl && (
                    <Link
                        href={post.categoryUrl}
                        className="text-xs font-semibold text-indigo-500 uppercase tracking-wide hover:text-indigo-700 transition-colors no-underline w-fit"
                    >
                        {post.categoryTitle}
                    </Link>
                )}
                <Link href={post.postUrl} className="no-underline flex-1">
                    <h2 className="text-base font-bold text-gray-900 leading-snug group-hover:text-indigo-600 transition-colors line-clamp-3">
                        {post.title}
                    </h2>
                </Link>
                {post.excerpt && (
                    <p className="text-xs text-gray-500 line-clamp-3 leading-relaxed">
                        {post.excerpt}
                    </p>
                )}
                <time className="text-xs text-gray-400 mt-auto pt-2 border-t border-gray-50">
                    {new Date(post.createdAt).toLocaleDateString(undefined, {
                        year: "numeric", month: "short", day: "numeric",
                    })}
                </time>
            </div>
        </article>
    );
}

function SidePost({ post }: { post: TabPost }) {
    return (
        <article className="group flex gap-3 py-3 border-b border-gray-100 last:border-0">
            <Link
                href={post.postUrl}
                className="shrink-0 w-20 h-16 overflow-hidden rounded-lg bg-gray-100 block"
            >
                {post.image ? (
                    <img
                        src={post.image}
                        alt={post.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-200">
                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M19 3H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V5a2 2 0 0 0-2-2zm-8.5 12.5-2-2.5L5 17h14l-4.5-6z" />
                        </svg>
                    </div>
                )}
            </Link>
            <div className="flex flex-col gap-1 min-w-0 flex-1">
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

// ─── Post grid renderer ───────────────────────────────────────────────────────

function PostGrid({ posts }: { posts: TabPost[] }) {
    const featured  = posts[0];
    const sidePosts = posts.slice(1);

    return (
        <div className="flex flex-col sm:flex-row gap-5">
            {/* Featured — 50% */}
            <div className="w-full sm:w-1/2">
                <FeaturedPost post={featured} />
            </div>

            {/* Side list — 50% */}
            {sidePosts.length > 0 && (
                <div className="w-full sm:w-1/2 flex flex-col">
                    {sidePosts.map((post) => (
                        <SidePost key={post._id} post={post} />
                    ))}
                </div>
            )}
        </div>
    );
}

// ─── Main export ──────────────────────────────────────────────────────────────

export default function Style1({ title, tabs, postsByCategory, colors }: Style1Props) {
    return (
        <NewsTabs
            title={title}
            tabs={tabs}
            postsByCategory={postsByCategory}
            colors={colors}
            renderPosts={(posts) => <PostGrid posts={posts} />}
        />
    );
}
