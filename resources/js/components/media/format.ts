/**
 * 1536 → "1.5 KB"
 */
export function formatBytes(bytes: number | null | undefined): string {
    if (!bytes) {
        return '0 B';
    }

    const units = ['B', 'KB', 'MB', 'GB'];
    const exponent = Math.min(
        Math.floor(Math.log(Math.abs(bytes)) / Math.log(1024)),
        units.length - 1,
    );
    const value = bytes / 1024 ** exponent;

    return `${value.toFixed(exponent === 0 ? 0 : 1)} ${units[exponent]}`;
}
