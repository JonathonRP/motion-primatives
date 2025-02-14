import type { SvelteHTMLElements } from 'svelte/elements';
import Motion from './Motion.svelte';
	
export const motion = new Proxy({} as { [K in keyof SvelteHTMLElements]: typeof Motion }, {
    get(_target, key: string) {
        return Motion
    }
});