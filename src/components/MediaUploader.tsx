import { useRef, useState } from 'react';
import type { NativeMedia, NativeMediaKind } from '../types';
import { ACCEPT, bytes, duration, uploadMedia } from '../lib/media';
import { isSupabaseLive } from '../lib/supabase';
import { IconFilm, IconImage, IconMusic, IconTrash, IconUpload } from './Icons';

const META: Record<NativeMediaKind, { label: string; hint: string; icon: React.ReactNode }> = {
  video: {
    label: 'MP4 video',
    hint: 'Compressed to 480p in the background before upload.',
    icon: <IconFilm size={18} />,
  },
  image: { label: 'JPG / PNG image', hint: 'Used for gallery slides and audio banner posters.', icon: <IconImage size={18} /> },
  audio: { label: 'MP3 audio', hint: 'Creates an audio banner paired with a still poster.', icon: <IconMusic size={18} /> },
};

interface Props {
  kind: NativeMediaKind;
  items: NativeMedia[];
  onChange: (items: NativeMedia[]) => void;
  max?: number;
  onError?: (message: string) => void;
}

export function MediaUploader({ kind, items, onChange, max = 6, onError }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [pct, setPct] = useState(0);
  const [stage, setStage] = useState('');
  const [dragOver, setDragOver] = useState(false);

  const meta = META[kind];
  const full = items.length >= max;

  async function handle(files: FileList | null) {
    if (!files?.length || full) return;
    const file = files[0];
    setBusy(true);
    setPct(0);
    setStage('Preparing');
    try {
      const media = await uploadMedia(file, {
        kind,
        onProgress: (value, label) => {
          setPct(Math.round(value));
          setStage(label);
        },
      });
      onChange([...items, media]);
    } catch (error) {
      onError?.(error instanceof Error ? error.message : 'Upload failed.');
    } finally {
      setBusy(false);
      setPct(0);
      setStage('');
    }
  }

  return (
    <div className="uploader">
      <input
        ref={inputRef}
        type="file"
        accept={ACCEPT[kind]}
        hidden
        onChange={(event) => {
          void handle(event.target.files);
          event.target.value = '';
        }}
      />

      <button
        className={`uploader__drop${dragOver ? ' is-over' : ''}${full ? ' is-full' : ''}`}
        onClick={() => !full && inputRef.current?.click()}
        onDragOver={(event) => {
          event.preventDefault();
          setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(event) => {
          event.preventDefault();
          setDragOver(false);
          void handle(event.dataTransfer.files);
        }}
        disabled={busy || full}
      >
        <span className="uploader__icon">{busy ? <span className="spinner" /> : meta.icon}</span>
        <span className="uploader__text">
          <b>{busy ? `${stage}… ${pct}%` : full ? `${meta.label} limit reached` : `Upload ${meta.label}`}</b>
          <span>{busy ? 'Keep this tab open until the upload finishes.' : meta.hint}</span>
        </span>
        {!busy && !full && <IconUpload size={17} />}
      </button>

      {busy && (
        <div className="uploader__bar">
          <div style={{ width: `${pct}%` }} />
        </div>
      )}

      {items.length > 0 && (
        <ul className="uploader__items">
          {items.map((item) => (
            <li key={item.id} className="uploader__item">
              <span
                className="uploader__thumb"
                style={
                  item.poster
                    ? { backgroundImage: `url(${item.poster})` }
                    : item.kind === 'image'
                      ? { backgroundImage: `url(${item.src})` }
                      : undefined
                }
              >
                {!item.poster && item.kind !== 'image' && META[item.kind].icon}
              </span>
              <span className="uploader__meta">
                <b>{item.name}</b>
                <span>
                  {bytes(item.sizeBytes)}
                  {item.originalBytes && item.originalBytes > item.sizeBytes && (
                    <em>
                      {' '}
                      · saved {Math.round((1 - item.sizeBytes / item.originalBytes) * 100)}% from{' '}
                      {bytes(item.originalBytes)}
                    </em>
                  )}
                  {item.height ? ` · ${item.height}p` : ''}
                  {item.durationSec ? ` · ${duration(item.durationSec)}` : ''}
                </span>
              </span>
              <button
                className="btn btn--danger btn--sm"
                onClick={() => onChange(items.filter((entry) => entry.id !== item.id))}
                aria-label="Remove"
              >
                <IconTrash size={13} />
              </button>
            </li>
          ))}
        </ul>
      )}

      <p className="field__hint" style={{ marginTop: 8 }}>
        {isSupabaseLive
          ? `Files upload to the Supabase Storage bucket "exy-${kind}".`
          : `Demo mode — files stay in this browser. Add Supabase credentials to host on EXY servers.`}
      </p>
    </div>
  );
}
