import type { NativeMedia, NativeMediaKind } from '../types';
import { supabase, isSupabaseLive, STORAGE_BUCKETS } from './supabase';
import { uid } from './storage';

export const TARGET_HEIGHT = 480;
export const MAX_UPLOAD_BYTES = 200 * 1024 * 1024;

export const ACCEPT: Record<NativeMediaKind, string> = {
  video: 'video/mp4,video/webm,video/quicktime',
  image: 'image/jpeg,image/png,image/webp',
  audio: 'audio/mpeg,audio/mp3,audio/wav,audio/ogg',
};

export function bytes(size: number): string {
  if (size < 1024) return `${size} B`;
  if (size < 1024 * 1024) return `${(size / 1024).toFixed(0)} KB`;
  return `${(size / (1024 * 1024)).toFixed(1)} MB`;
}

export function duration(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${String(s).padStart(2, '0')}`;
}

/* -------------------------------------------------------------------------- */
/* Poster extraction                                                           */
/* -------------------------------------------------------------------------- */
export function grabPoster(file: File, atSecond = 0.5): Promise<{ poster: string; durationSec: number; height: number }> {
  return new Promise((resolve, reject) => {
    const video = document.createElement('video');
    video.preload = 'metadata';
    video.muted = true;
    video.playsInline = true;
    video.src = URL.createObjectURL(file);

    const fail = () => reject(new Error('Could not read the video file.'));
    video.onerror = fail;

    video.onloadedmetadata = () => {
      const seekTo = Math.min(atSecond, Math.max(0, video.duration - 0.1));
      video.currentTime = seekTo;
    };

    video.onseeked = () => {
      const canvas = document.createElement('canvas');
      const scale = Math.min(1, TARGET_HEIGHT / (video.videoHeight || TARGET_HEIGHT));
      canvas.width = Math.round((video.videoWidth || 854) * scale);
      canvas.height = Math.round((video.videoHeight || TARGET_HEIGHT) * scale);
      const ctx = canvas.getContext('2d');
      if (!ctx) return fail();
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      resolve({
        poster: canvas.toDataURL('image/jpeg', 0.72),
        durationSec: video.duration,
        height: video.videoHeight || TARGET_HEIGHT,
      });
    };
  });
}

/* -------------------------------------------------------------------------- */
/* Background 480p compression                                                 */
/* -------------------------------------------------------------------------- */
export interface CompressResult {
  blob: Blob;
  mime: string;
  height: number;
  durationSec: number;
  poster: string;
  compressed: boolean;
}

function pickMime(): string | null {
  const candidates = ['video/webm;codecs=vp9,opus', 'video/webm;codecs=vp8,opus', 'video/webm', 'video/mp4'];
  for (const mime of candidates) {
    if (typeof MediaRecorder !== 'undefined' && MediaRecorder.isTypeSupported(mime)) return mime;
  }
  return null;
}

/**
 * Transcodes an uploaded video down to 480p in the background using
 * canvas capture + MediaRecorder. Falls back to the original file when the
 * browser cannot record, so the upload never blocks.
 */
export function compressTo480p(file: File, onProgress?: (pct: number) => void): Promise<CompressResult> {
  return new Promise((resolve, reject) => {
    const mime = pickMime();
    const video = document.createElement('video');
    video.preload = 'auto';
    video.muted = true;
    video.playsInline = true;
    video.src = URL.createObjectURL(file);

    video.onerror = () => reject(new Error('Unsupported or corrupt video file.'));

    video.onloadedmetadata = async () => {
      const srcHeight = video.videoHeight || TARGET_HEIGHT;
      const srcWidth = video.videoWidth || 854;
      const durationSec = video.duration;

      // Already small enough, or recording unsupported → passthrough.
      if (!mime || srcHeight <= TARGET_HEIGHT) {
        try {
          const meta = await grabPoster(file);
          onProgress?.(100);
          resolve({
            blob: file,
            mime: file.type || 'video/mp4',
            height: srcHeight,
            durationSec,
            poster: meta.poster,
            compressed: false,
          });
        } catch (error) {
          reject(error);
        }
        return;
      }

      const scale = TARGET_HEIGHT / srcHeight;
      const canvas = document.createElement('canvas');
      canvas.width = Math.round(srcWidth * scale / 2) * 2;
      canvas.height = TARGET_HEIGHT;
      const ctx = canvas.getContext('2d');
      if (!ctx) return reject(new Error('Canvas unavailable.'));

      const stream = canvas.captureStream(30);
      const recorder = new MediaRecorder(stream, { mimeType: mime, videoBitsPerSecond: 1_200_000 });
      const chunks: BlobPart[] = [];
      let poster = '';

      recorder.ondataavailable = (event) => {
        if (event.data.size) chunks.push(event.data);
      };

      recorder.onstop = () => {
        onProgress?.(100);
        resolve({
          blob: new Blob(chunks, { type: mime }),
          mime,
          height: TARGET_HEIGHT,
          durationSec,
          poster,
          compressed: true,
        });
      };

      const draw = () => {
        if (video.ended || video.paused) {
          if (recorder.state === 'recording') recorder.stop();
          return;
        }
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        if (!poster && video.currentTime > 0.2) poster = canvas.toDataURL('image/jpeg', 0.72);
        onProgress?.(Math.min(99, Math.round((video.currentTime / durationSec) * 100)));
        requestAnimationFrame(draw);
      };

      recorder.start(250);
      await video.play().catch(() => undefined);
      requestAnimationFrame(draw);
      video.onended = () => {
        if (recorder.state === 'recording') recorder.stop();
      };
    };
  });
}

/* -------------------------------------------------------------------------- */
/* Upload                                                                      */
/* -------------------------------------------------------------------------- */
export interface UploadOptions {
  kind: NativeMediaKind;
  onProgress?: (pct: number, stage: string) => void;
}

/**
 * Uploads to Supabase Storage when configured, otherwise returns an object URL
 * so the demo build behaves identically without a backend.
 */
export async function uploadMedia(file: File, options: UploadOptions): Promise<NativeMedia> {
  const { kind, onProgress } = options;
  if (file.size > MAX_UPLOAD_BYTES) throw new Error(`File exceeds the ${bytes(MAX_UPLOAD_BYTES)} limit.`);

  const bucket = STORAGE_BUCKETS[kind];
  const id = uid('media');
  const ext = file.name.split('.').pop()?.toLowerCase() ?? 'bin';

  let payload: Blob = file;
  let mime = file.type || 'application/octet-stream';
  let poster: string | undefined;
  let durationSec: number | undefined;
  let height: number | undefined;
  const originalBytes = file.size;

  if (kind === 'video') {
    onProgress?.(0, 'Compressing to 480p');
    const result = await compressTo480p(file, (pct) => onProgress?.(pct * 0.8, 'Compressing to 480p'));
    payload = result.blob;
    mime = result.mime;
    poster = result.poster;
    durationSec = result.durationSec;
    height = result.height;
  }

  if (kind === 'audio') {
    onProgress?.(20, 'Reading audio');
    durationSec = await readAudioDuration(file);
  }

  const path = `${new Date().getFullYear()}/${id}.${kind === 'video' ? (mime.includes('webm') ? 'webm' : 'mp4') : ext}`;
  onProgress?.(85, 'Uploading');

  let src: string;
  if (isSupabaseLive && supabase) {
    const { error } = await supabase.storage.from(bucket).upload(path, payload, { contentType: mime, upsert: false });
    if (error) throw new Error(error.message);
    src = supabase.storage.from(bucket).getPublicUrl(path).data.publicUrl;
  } else {
    src = URL.createObjectURL(payload);
  }

  onProgress?.(100, 'Done');

  return {
    id,
    kind,
    name: file.name,
    src,
    poster,
    sizeBytes: payload.size,
    originalBytes,
    durationSec,
    height,
    mime,
    bucket,
    path,
    createdAt: new Date().toISOString(),
  };
}

function readAudioDuration(file: File): Promise<number> {
  return new Promise((resolve) => {
    const audio = document.createElement('audio');
    audio.preload = 'metadata';
    audio.src = URL.createObjectURL(file);
    audio.onloadedmetadata = () => resolve(audio.duration || 0);
    audio.onerror = () => resolve(0);
  });
}
