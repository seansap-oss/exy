import type { Message, MessageKind, Thread } from '../types';
import { supabase, isSupabaseLive, SUPABASE_TABLES } from './supabase';
import { load, save, uid } from './storage';

export function readThreads(): Thread[] {
  return load<Thread[]>('threads', []);
}

export function readMessages(): Message[] {
  return load<Message[]>('messages', []);
}

export function writeThreads(threads: Thread[]): void {
  save('threads', threads);
}

export function writeMessages(messages: Message[]): void {
  save('messages', messages.slice(-2000));
}

export function findOrCreateThread(
  threads: Thread[],
  listingId: string,
  buyerId: string,
  sellerId: string,
): { thread: Thread; threads: Thread[]; created: boolean } {
  const existing = threads.find(
    (thread) => thread.listingId === listingId && thread.buyerId === buyerId && thread.sellerId === sellerId,
  );
  if (existing) return { thread: existing, threads, created: false };

  const thread: Thread = {
    id: uid('thr'),
    listingId,
    buyerId,
    sellerId,
    createdAt: new Date().toISOString(),
    lastMessageAt: new Date().toISOString(),
    unreadForBuyer: 0,
    unreadForSeller: 0,
  };

  if (isSupabaseLive && supabase) {
    void supabase
      .from(SUPABASE_TABLES.threads)
      .insert({ id: thread.id, listing_id: listingId, buyer_id: buyerId, seller_id: sellerId });
  }

  return { thread, threads: [thread, ...threads], created: true };
}

export interface ComposeInput {
  threadId: string;
  senderId: string;
  kind: MessageKind;
  body: string;
  imageSrc?: string;
  callbackNumber?: string;
}

export function composeMessage(input: ComposeInput): Message {
  const message: Message = {
    id: uid('msg'),
    threadId: input.threadId,
    senderId: input.senderId,
    kind: input.kind,
    body: input.body,
    imageSrc: input.imageSrc,
    callbackNumber: input.callbackNumber,
    callbackApproved: input.kind === 'callback' ? false : undefined,
    createdAt: new Date().toISOString(),
    readAt: null,
  };

  if (isSupabaseLive && supabase) {
    void supabase.from(SUPABASE_TABLES.messages).insert({
      id: message.id,
      thread_id: message.threadId,
      sender_id: message.senderId,
      kind: message.kind,
      body: message.body,
      image_src: message.imageSrc ?? null,
      callback_number: message.callbackNumber ?? null,
    });
  }

  return message;
}

export function bumpThread(threads: Thread[], threadId: string, senderIsBuyer: boolean): Thread[] {
  return threads.map((thread) =>
    thread.id === threadId
      ? {
          ...thread,
          lastMessageAt: new Date().toISOString(),
          unreadForBuyer: senderIsBuyer ? thread.unreadForBuyer : thread.unreadForBuyer + 1,
          unreadForSeller: senderIsBuyer ? thread.unreadForSeller + 1 : thread.unreadForSeller,
        }
      : thread,
  );
}

export function markRead(threads: Thread[], threadId: string, viewerIsBuyer: boolean): Thread[] {
  return threads.map((thread) =>
    thread.id === threadId
      ? { ...thread, unreadForBuyer: viewerIsBuyer ? 0 : thread.unreadForBuyer, unreadForSeller: viewerIsBuyer ? thread.unreadForSeller : 0 }
      : thread,
  );
}

export function unreadCount(threads: Thread[], userId: string): number {
  return threads.reduce((sum, thread) => {
    if (thread.buyerId === userId) return sum + thread.unreadForBuyer;
    if (thread.sellerId === userId) return sum + thread.unreadForSeller;
    return sum;
  }, 0);
}

/** Masks a real number until the seller approves the callback request. */
export function maskCallback(phone: string): string {
  const digits = phone.replace(/\D/g, '');
  if (digits.length < 6) return '•••• ••••';
  return `+91 ${digits.slice(-10, -6)}•• ••${digits.slice(-2)}`;
}

/** Deterministic auto-reply so the demo messenger feels alive. */
export function autoReply(listingTitle: string): string {
  const options = [
    `Yes, "${listingTitle}" is still available. When would you like to see it?`,
    `Thanks for reaching out! I can do a small discount on "${listingTitle}" for a quick pickup.`,
    `Available. I can share more photos or a walkthrough reel if that helps.`,
    `Still up for sale. Delivery can be arranged within the city at cost.`,
  ];
  return options[Math.floor(Math.random() * options.length)];
}
