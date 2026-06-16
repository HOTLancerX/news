/**
 * plugin/news/index.ts — News/Blog enhancement plugin.
 *
 * Extends the core blog post type with:
 *   - Blog box templates (blog-box type) selectable in the Template manager
 *   - Blog category layouts that show real posts + active box
 *
 * The server-side data fetcher (lib/serverHooks.ts) is auto-discovered
 * by hook/serverDataHooks.ts — no manual imports needed in page.tsx.
 *
 * NO server-only / Mongoose imports here.
 */

import { addHook, type PluginMeta } from "@/hook";
import BlogBox3            from "./box/Box-3";

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
    // type: "blog-box" — selectable in the Template manager.
    // BlogGridClient resolves the active box via getHooks("root.pages").
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
}
