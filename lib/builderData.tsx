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
