import type { VercelRequest, VercelResponse } from '@vercel/node';
export type Provider = 'instagram' | 'facebook';
interface Normalized {
    provider: Provider;
    /** Canonical URL handed to Meta */
    normalizedUrl: string;
    /** Shortcode (IG) or numeric id (FB) when derivable */
    externalId: string | null;
}
/**
 * Accepts only public Instagram/Facebook post URLs. Everything else — other
 * hosts, non-https schemes, credentials, ports, path traversal — is rejected,
 * so this cannot be used to fetch arbitrary internal or third-party URLs.
 */
export declare function normalizeUrl(raw: string): Normalized | null;
export interface OEmbedResponse {
    provider: Provider | null;
    originalUrl: string;
    normalizedUrl: string | null;
    /** Present only when Meta returns one. */
    thumbnailUrl: string | null;
    thumbnailWidth: number | null;
    thumbnailHeight: number | null;
    /** Official embed markup, when supplied. */
    embedHtml: string | null;
    authorName: string | null;
    authorUrl: string | null;
    /** false → frontend keeps the branded EXY fallback. */
    available: boolean;
    /** Machine-readable reason when unavailable. */
    status: 'ok' | 'not_configured' | 'unsupported_url' | 'not_found' | 'restricted' | 'rate_limited' | 'timeout' | 'provider_error';
    message?: string;
    cached?: boolean;
}
export default function handler(request: VercelRequest, response: VercelResponse): Promise<VercelResponse>;
export {};
