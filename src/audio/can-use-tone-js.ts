
export function canUseToneJs(): boolean {
    if (typeof window === "undefined") return false;
    return (
        typeof window.AudioContext !== "undefined" ||
        typeof (window as any).webkitAudioContext !== "undefined"
    );
}
