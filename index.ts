/**
 * plugin/news/index.ts — News/Blog enhancement plugin.
 *
 * Extends the core blog post type with:
 *   - Blog box templates (blog-box type) selectable in the Template manager
 *   - Blog category layouts that show real posts + active box
 *   - Block Post builder element (multi-category post feed)
 *
 * NO server-only / Mongoose imports here — server hooks live in serverHooks.ts.
 */

import { addHook, addBuilderElement, type PluginMeta } from "@/hook";
import BlogBox3            from "./box/Box-3";
import newsHeadingElement  from "./elements/heading";
import blockPostElement    from "./elements/News";
import newsStyle1Element   from "./elements/NewsStyle1";

export const PLUGINS: PluginMeta = {
    nx:          "com.system.news",
    name:        "news",
    version:     "1.0.0",
    description: "Blog post cards and category layouts with dynamic box selection.",
    author:      "System",
    path:        "https://github.com/HOTLancerX/news.git",
    icon:        "solar:document-bold",
    color:       "from-violet-500 to-purple-600",
};

export function register() {
    // ─── Blog box templates ─────────────────────────────────────────────────
    addHook("root.pages", [
        {
            key:       "blog-box",
            label:     "Blog Box 3",
            type:      "blog-box",
            slug:      "dynamic",
            style:     "left",
            position:  30,
            active:    false,
            component: BlogBox3,
        },
    ], PLUGINS.nx);

    // ─── Builder elements ───────────────────────────────────────────────────
    addBuilderElement(newsHeadingElement, PLUGINS.nx);
    addBuilderElement(blockPostElement,   PLUGINS.nx);
    addBuilderElement(newsStyle1Element,  PLUGINS.nx);
}
