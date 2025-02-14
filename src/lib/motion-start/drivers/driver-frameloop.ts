import { AnimationFrames } from "runed"
import type { Driver } from "./types"

export const frameloopDriver: Driver = (update) => {
    const passTimestamp = ({ timestamp }: { delta: number; timestamp: number; }) => update(timestamp);
    const frame = new AnimationFrames(passTimestamp.bind(this), { immediate: false, fpsLimit: 60 });
    
    return {
        start: () => frame.start(),
        stop: () => frame.stop(),
        now: () => performance?.now() ?? Date.now()
    }
}