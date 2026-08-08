import { useEffect, useMemo, useRef, useState } from 'react';
import type { Listing, Message, Profile, Seller, Thread } from '../types';
import { inr, timeAgo } from '../lib/format';
import { maskCallback } from '../lib/messaging';
import { Empty } from './Ui';
import { IconChat, IconCheck, IconImage, IconLock, IconPhone, IconSend, IconShield } from './Icons';

interface Props {
  me: Profile;
  threads: Thread[];
  messages: Message[];
  listingMap: Record<string, Listing>;
  sellerMap: Record<string, Seller>;
  activeThreadId?: string;
  onSelectThread: (id: string) => void;
  onSend: (threadId: string, body: string, imageSrc?: string) => void;
  onRequestCallback: (threadId: string, phone: string) => void;
  onApproveCallback: (messageId: string) => void;
  onOpenListing: (id: string) => void;
}

/**
 * Module 6.5 — Instagram/Marketplace-style messenger.
 * Primary lead routing mechanism when a seller masks their phone number.
 */
export function Messenger({
  me,
  threads,
  messages,
  listingMap,
  sellerMap,
  activeThreadId,
  onSelectThread,
  onSend,
  onRequestCallback,
  onApproveCallback,
  onOpenListing,
}: Props) {
  const [draft, setDraft] = useState('');
  const [callbackOpen, setCallbackOpen] = useState(false);
  const [callbackNumber, setCallbackNumber] = useState(me.phone ?? '');
  const fileRef = useRef<HTMLInputElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  const mine = useMemo(
    () =>
      threads
        .filter((thread) => thread.buyerId === me.id || thread.sellerId === me.id)
        .sort((a, b) => +new Date(b.lastMessageAt) - +new Date(a.lastMessageAt)),
    [threads, me.id],
  );

  const active = mine.find((thread) => thread.id === activeThreadId) ?? mine[0];
  const thread = active;
  const chat = useMemo(
    () =>
      thread
        ? messages
            .filter((message) => message.threadId === thread.id)
            .sort((a, b) => +new Date(a.createdAt) - +new Date(b.createdAt))
        : [],
    [messages, thread],
  );

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
  }, [chat.length, thread?.id]);

  if (!mine.length) {
    return (
      <Empty
        icon={<IconChat size={28} />}
        title="No conversations yet"
        message="When you message a seller — or a buyer contacts one of your ads — the thread appears here."
      />
    );
  }

  function send() {
    if (!thread || draft.trim().length < 1) return;
    onSend(thread.id, draft.trim());
    setDraft('');
  }

  function attach(file: File) {
    if (!thread) return;
    const reader = new FileReader();
    reader.onload = () => onSend(thread.id, 'Shared an image', String(reader.result));
    reader.readAsDataURL(file);
  }

  const counterpartId = thread ? (thread.buyerId === me.id ? thread.sellerId : thread.buyerId) : '';
  const counterpart = sellerMap[counterpartId];
  const listing = thread ? listingMap[thread.listingId] : undefined;
  const iAmBuyer = thread?.buyerId === me.id;

  return (
    <div className="msgr">
      <aside className="msgr__list">
        {mine.map((item) => {
          const other = sellerMap[item.buyerId === me.id ? item.sellerId : item.buyerId];
          const ad = listingMap[item.listingId];
          const last = messages
            .filter((message) => message.threadId === item.id)
            .sort((a, b) => +new Date(b.createdAt) - +new Date(a.createdAt))[0];
          const unread = item.buyerId === me.id ? item.unreadForBuyer : item.unreadForSeller;

          return (
            <button
              key={item.id}
              className={`msgr__row${thread?.id === item.id ? ' is-on' : ''}`}
              onClick={() => onSelectThread(item.id)}
            >
              <span className="avatar" style={{ background: other?.avatarColor ?? '#f2713a', width: 44, height: 44, fontSize: 15 }}>
                {(other?.name ?? '??').slice(0, 2).toUpperCase()}
              </span>
              <span className="msgr__row-main">
                <b>
                  {other?.name ?? 'EXY member'}
                  {other && other.verification !== 'none' && <IconShield size={12} />}
                </b>
                <span>{last ? (last.kind === 'image' ? '📷 Photo' : last.body) : ad?.title}</span>
              </span>
              <span className="msgr__row-side">
                <em>{timeAgo(item.lastMessageAt)}</em>
                {unread > 0 && <i className="msgr__unread">{unread}</i>}
              </span>
            </button>
          );
        })}
      </aside>

      <section className="msgr__pane">
        {thread && (
          <>
            <header className="msgr__head">
              <span className="avatar" style={{ background: counterpart?.avatarColor ?? '#f2713a', width: 40, height: 40, fontSize: 14 }}>
                {(counterpart?.name ?? '??').slice(0, 2).toUpperCase()}
              </span>
              <div style={{ flex: 1, minWidth: 0 }}>
                <b style={{ fontSize: 14.5, fontWeight: 750, display: 'flex', alignItems: 'center', gap: 6 }}>
                  {counterpart?.name ?? 'EXY member'}
                  {counterpart && counterpart.verification !== 'none' && <IconShield size={13} />}
                </b>
                <span style={{ fontSize: 12, color: 'var(--ink-3)' }}>{counterpart?.responseTime}</span>
              </div>
              {listing && (
                <button className="msgr__ad" onClick={() => onOpenListing(listing.id)}>
                  <span style={{ background: listing.photos[0] }} />
                  <span>
                    <b>{listing.title}</b>
                    <em>{inr(listing.price)}</em>
                  </span>
                </button>
              )}
            </header>

            <div className="msgr__scroll" ref={scrollRef}>
              {chat.length === 0 && (
                <div className="msgr__hint">
                  Say hello — sellers respond fastest to specific questions about condition, price and delivery.
                </div>
              )}
              {chat.map((message) => (
                <Bubble
                  key={message.id}
                  message={message}
                  mine={message.senderId === me.id}
                  canApprove={!iAmBuyer && message.kind === 'callback' && !message.callbackApproved}
                  onApprove={() => onApproveCallback(message.id)}
                />
              ))}
            </div>

            {callbackOpen && (
              <div className="msgr__callback">
                <div className="field" style={{ margin: 0, flex: 1 }}>
                  <label className="field__label" htmlFor="cb-num">
                    <IconLock size={12} /> Your number stays masked until approved
                  </label>
                  <input
                    id="cb-num"
                    className="input"
                    value={callbackNumber}
                    onChange={(event) => setCallbackNumber(event.target.value)}
                    placeholder="+91 98765 43210"
                  />
                </div>
                <button
                  className="btn btn--primary"
                  onClick={() => {
                    if (callbackNumber.replace(/\D/g, '').length < 10) return;
                    onRequestCallback(thread.id, callbackNumber);
                    setCallbackOpen(false);
                  }}
                >
                  Send request
                </button>
                <button className="btn btn--ghost" onClick={() => setCallbackOpen(false)}>
                  Cancel
                </button>
              </div>
            )}

            <footer className="msgr__compose">
              <input
                ref={fileRef}
                type="file"
                accept="image/*"
                hidden
                onChange={(event) => {
                  const file = event.target.files?.[0];
                  if (file) attach(file);
                  event.target.value = '';
                }}
              />
              <button className="icon-btn" onClick={() => fileRef.current?.click()} aria-label="Share an image">
                <IconImage />
              </button>
              <button
                className="icon-btn"
                onClick={() => setCallbackOpen((prev) => !prev)}
                aria-label="Request a private callback"
              >
                <IconPhone />
              </button>
              <input
                className="input"
                value={draft}
                onChange={(event) => setDraft(event.target.value)}
                onKeyDown={(event) => event.key === 'Enter' && !event.shiftKey && send()}
                placeholder="Message…"
              />
              <button className="btn btn--primary" onClick={send} disabled={!draft.trim()} aria-label="Send">
                <IconSend size={17} />
              </button>
            </footer>
          </>
        )}
      </section>
    </div>
  );
}

function Bubble({
  message,
  mine,
  canApprove,
  onApprove,
}: {
  message: Message;
  mine: boolean;
  canApprove: boolean;
  onApprove: () => void;
}) {
  if (message.kind === 'system') {
    return <div className="msgr__system">{message.body}</div>;
  }

  if (message.kind === 'callback') {
    return (
      <div className={`msgr__bubble${mine ? ' is-mine' : ''}`}>
        <div className="msgr__cb">
          <b>
            <IconPhone size={14} /> Private callback request
          </b>
          <span>
            {message.callbackApproved
              ? message.callbackNumber
              : maskCallback(message.callbackNumber ?? '')}
          </span>
          {message.callbackApproved ? (
            <em>
              <IconCheck size={12} /> Number revealed — call is routed through EXY's masked line.
            </em>
          ) : canApprove ? (
            <button className="btn btn--primary btn--sm" onClick={onApprove}>
              Approve &amp; reveal
            </button>
          ) : (
            <em>Waiting for the seller to approve.</em>
          )}
        </div>
        <time>{timeAgo(message.createdAt)}</time>
      </div>
    );
  }

  return (
    <div className={`msgr__bubble${mine ? ' is-mine' : ''}`}>
      {message.kind === 'image' && message.imageSrc ? (
        <img src={message.imageSrc} alt="Shared" className="msgr__img" />
      ) : (
        <p>{message.body}</p>
      )}
      <time>{timeAgo(message.createdAt)}</time>
    </div>
  );
}
