'use client';

/**
 * Blog Box 3 — Horizontal list card style.
 *
 * Image on the left, title + date + excerpt on the right.
 * Good for news-feed / list views.
 * Registered as type "blog-box" in the Template manager via plugin/news/index.ts.
 */

import Link from 'next/link';
import { Icon } from '@iconify/react';

interface BlogBoxProps {
    data: {
        _id: string;
        title: string;
        slug: string;
        status: string;
        createdAt?: string;
        info: Record<string, string>;
    };
    postUrl: string;
}

export default function BlogBox3({ data, postUrl }: BlogBoxProps) {
    const image = data.info?.images
        ? (() => {
              try {
                  const a = JSON.parse(data.info.images);
                  return Array.isArray(a) ? a[0] : '';
              } catch { return ''; }
          })()
        : '';

    const shortDesc   = data.info?.shortDescription ?? '';
    const publishedAt = data.createdAt
        ? new Date(data.createdAt).toLocaleDateString('en-US', {
              year: 'numeric', month: 'short', day: 'numeric',
          })
        : null;

    return (
        <article className="group flex gap-4 bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow overflow-hidden p-3">
            {/* Thumbnail */}
            <Link href={postUrl}
                className="shrink-0 w-24 h-24 md:w-28 md:h-28 rounded-xl overflow-hidden bg-gray-100 block">
                {image ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                        src={image}
                        alt={data.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-200">
                        <Icon icon="solar:document-bold" width="32" height="32" />
                    </div>
                )}
            </Link>

            {/* Content */}
            <div className="flex flex-col flex-1 min-w-0 py-1 gap-1.5">
                {publishedAt && (
                    <time className="text-xs text-gray-400 flex items-center gap-1 shrink-0">
                        <Icon icon="solar:calendar-bold" width="11" height="11" />
                        {publishedAt}
                    </time>
                )}

                <Link href={postUrl}
                    className="text-sm font-semibold text-gray-900 hover:text-main transition-colors line-clamp-2 leading-snug">
                    {data.title}
                </Link>

                {shortDesc && (
                    <p className="text-xs text-gray-500 line-clamp-2 leading-relaxed flex-1"
                        dangerouslySetInnerHTML={{ __html: shortDesc }} />
                )}

                <Link href={postUrl}
                    className="mt-auto inline-flex items-center gap-1 text-xs font-semibold text-main hover:gap-2 transition-all w-fit">
                    Read more
                    <Icon icon="mdi:arrow-right" width="12" height="12" />
                </Link>
            </div>
        </article>
    );
}
