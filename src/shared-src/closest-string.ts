
export function levenshtein(a: string, b: string): number {
    const m = a.length;
    const n = b.length;

    const dp: number[][] = Array.from({ length: m + 1 }, () =>
        new Array(n + 1).fill(0)
    );

    for (let i = 0; i <= m; i++) dp[i][0] = i;
    for (let j = 0; j <= n; j++) dp[0][j] = j;

    for (let i = 1; i <= m; i++) {
        for (let j = 1; j <= n; j++) {
            const cost = a[i - 1] === b[j - 1] ? 0 : 1;

            dp[i][j] = Math.min(
                dp[i - 1][j] + 1,      // deletion
                dp[i][j - 1] + 1,      // insertion
                dp[i - 1][j - 1] + cost // substitution
            );
        }
    }

    return dp[m][n];
}

function norm(s: string): string {
    return s.toLowerCase();
}

export function getClosestString(input: string, list: readonly string[]): string | undefined {
    if (typeof input !== "string")
        return undefined;

    input = norm(input);

    let bestDist = Infinity;
    let bestStr: string | undefined;

    for (let i = 0; i < list.length; i++) {
        if (typeof list[i] !== "string") continue;
        const dist = levenshtein(input, norm(list[i]));
        if (dist < bestDist) {
            bestDist = dist;
            bestStr = list[i];
        }
    }

    return bestDist > 3 ? undefined : bestStr;
}