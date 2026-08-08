import { useMemo, useState } from 'react';
import { forgetText, readHistory, type TextType } from '../lib/sellerMemory';
import { IconClock, IconTrash } from './Icons';

interface Props {
  type: TextType;
  /** Current field value — used to filter suggestions and avoid echoing it back. */
  value: string;
  onPick: (text: string) => void;
  profileId?: string;
  label?: string;
  max?: number;
}

/**
 * Feature 3 — additive suggestion layer.
 * Renders previously-used text as selectable chips beneath an existing field.
 * Picking one fills the field; the user can still edit before publishing.
 * Nothing is auto-applied and no existing form styling is altered.
 */
export function HistorySuggest({ type, value, onPick, profileId, label, max = 6 }: Props) {
  const [version, setVersion] = useState(0);

  const items = useMemo(() => {
    const query = value.trim().toLowerCase();
    return readHistory(type)
      .filter((entry) => entry.textValue.toLowerCase() !== query)
      .filter((entry) => (query.length >= 2 ? entry.textValue.toLowerCase().includes(query) : true))
      .slice(0, max);
    // version forces a re-read after a delete
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [type, value, max, version]);

  if (!items.length) return null;

  return (
    <div className="hist">
      <span className="hist__label">
        <IconClock size={11} /> {label ?? 'Recently used'}
      </span>
      <div className="hist__chips">
        {items.map((entry) => (
          <span key={entry.id} className="hist__chip">
            <button
              type="button"
              className="hist__pick"
              onClick={() => onPick(entry.textValue)}
              title={entry.textValue}
            >
              {entry.textValue.length > 54 ? `${entry.textValue.slice(0, 54)}…` : entry.textValue}
            </button>
            <button
              type="button"
              className="hist__del"
              aria-label="Delete suggestion"
              onClick={() => {
                forgetText(entry.id, profileId);
                setVersion((prev) => prev + 1);
              }}
            >
              <IconTrash size={11} />
            </button>
          </span>
        ))}
      </div>
    </div>
  );
}
