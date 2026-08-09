import { useRef, useState } from 'react';
import type { NativeMedia, NativeMediaKind } from '../types';
import { bytes, duration, uploadMedia } from '../lib/media';
import { isSupabaseLive } from '../lib/supabase';
import { MediaKindIcon } from './MediaPreview';
import { IconTrash, IconUpload } from './Icons';

const ACCEPT_ALL = 'image/jpeg,image/png,image/webp,video/mp4,video/webm,video/quicktime';

function kindOf(file: File): NativeMediaKind | null {
  if (file.type.startsWith('image/')) return 'image';
  if (file.type.startsWith('video/')) return 'video';
  if (file.type.startsWith('audio/')) return 'audio';
  return null;
}

interface Props {
  items: NativeMedia[];
  onChange: (items: NativeMedia[]) => void;
  maxPhotos?: number;
  maxVideos?: number;
  onError?: (message: string) => void;
  label?: string;
}

interface Job {
  id: string;
  name: string;
  pct: number;
  stage: string;
  error?: string;
}

/**
 * One compact control that accepts images and videos together, supports
 * multi-select from a phone gallery and drag-and-drop on desktop.
 *
 * An item only joins `items` once its storage URL is confirmed — an upload is
 * never reported as successful before that.
 */
export function UnifiedUploader({
  items,
  onChange,
  maxPhotos = 8,
  maxVideos = 3,
  onError,
  label = 'Add photos or videos',
}: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [dragOver, setDragOver] = useState(false);

  const photos = items.filter((item) => item.kind === 'image');
  const videos = items.filter((item) => item.kind === 'video');

  async function ingest(files: FileList | null) {
    if (!files?.length) return;

    let photoRoom = maxPhotos - photos.length;
    let videoRoom = maxVideos - videos.length;
    const accepted: File[] = [];

    for (const file of Array.from(files)) {
      const kind = kindOf(file);
      if (!kind) {
        onError?.(`${file.name}: unsupported file type.`);
        continue;
      }
      if (kind === 'image' && photoRoom <= 0) {
        onError?.(`Photo limit reached (${maxPhotos}).`);
        continue;
      }
      if (kind === 'video' && videoRoom <= 0) {
        onError?.(`Video limit reached (${maxVideos}).`);
        continue;
      }
      if (kind === 'image') photoRoom -= 1;
      if (kind === 'video') videoRoom -= 1;
      accepted.push(file);
    }

    // Sequential so 480p transcodes don't contend for the main thread.
    for (const file of accepted) {
      const kind = kindOf(file)!;
      const jobId = `${file.name}-${Date.now()}`;
      setJobs((prev) => [...prev, { id: jobId, name: file.name, pct: 0, stage: 'Preparing' }]);

      try {
        const media = await uploadMedia(file, {
          kind,
          onProgress: (pct, stage) =>
            setJobs((prev) => prev.map((job) => (job.id === jobId ? { ...job, pct: Math.round(pct), stage } : job))),
        });

        // Only confirmed uploads are surfaced to the form.
        if (!media.src) throw new Error('Storage did not return a URL.');
        onChange([...items, media]);
        setJobs((prev) => prev.filter((job) => job.id !== jobId));
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Upload failed.';
        setJobs((prev) => prev.map((job) => (job.id === jobId ? { ...job, error: message } : job)));
        onError?.(`${file.name}: ${message}`);
      }
    }
  }

  const full = photos.length >= maxPhotos && videos.length >= maxVideos;

  return (
    <div className="uu">
      <input
        ref={inputRef}
        type="file"
        accept={ACCEPT_ALL}
        multiple
        hidden
        onChange={(event) => {
          void ingest(event.target.files);
          event.target.value = '';
        }}
      />

      <button
        type="button"
        className={`uu__drop${dragOver ? ' is-over' : ''}`}
        onClick={() => !full && inputRef.current?.click()}
        onDragOver={(event) => {
          event.preventDefault();
          setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(event) => {
          event.preventDefault();
          setDragOver(false);
          void ingest(event.dataTransfer.files);
        }}
        disabled={full}
      >
        <span className="uu__icon">
          <IconUpload size={17} />
        </span>
        <span className="uu__text">
          <b>{full ? 'Media limit reached' : label}</b>
          <span>
            {photos.length}/{maxPhotos} photos · {videos.length}/{maxVideos} videos · tap or drop files
          </span>
        </span>
      </button>

      {jobs.length > 0 && (
        <ul className="uu__jobs">
          {jobs.map((job) => (
            <li key={job.id} className={`uu__job${job.error ? ' is-error' : ''}`}>
              <span className="uu__job-name">{job.name}</span>
              {job.error ? (
                <span className="uu__job-err">{job.error}</span>
              ) : (
                <>
                  <span className="uu__job-stage">
                    {job.stage} {job.pct}%
                  </span>
                  <span className="uu__job-bar">
                    <i style={{ width: `${job.pct}%` }} />
                  </span>
                </>
              )}
            </li>
          ))}
        </ul>
      )}

      {items.length > 0 && (
        <ul className="uu__grid">
          {items.map((item) => (
            <li key={item.id} className="uu__tile">
              <span
                className="uu__thumb"
                style={
                  item.kind === 'image'
                    ? { backgroundImage: `url(${item.src})` }
                    : item.poster
                      ? { backgroundImage: `url(${item.poster})` }
                      : undefined
                }
              >
                {item.kind !== 'image' && !item.poster && <MediaKindIcon kind={item.kind} size={16} />}
                {item.kind === 'video' && <i className="uu__badge">{item.height ? `${item.height}p` : 'video'}</i>}
              </span>
              <span className="uu__meta">
                {bytes(item.sizeBytes)}
                {item.durationSec ? ` · ${duration(item.durationSec)}` : ''}
              </span>
              <button
                type="button"
                className="uu__remove"
                aria-label={`Remove ${item.name}`}
                onClick={() => onChange(items.filter((entry) => entry.id !== item.id))}
              >
                <IconTrash size={11} />
              </button>
            </li>
          ))}
        </ul>
      )}

      <p className="field__hint" style={{ marginTop: 8 }}>
        {isSupabaseLive
          ? 'Videos are compressed to 480p, then uploaded to EXY storage.'
          : 'Demo mode — files stay in this browser. Add Supabase credentials to host on EXY servers.'}
      </p>
    </div>
  );
}
