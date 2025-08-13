'use client';

import { useChatNotifications } from '@/hooks/useChat';

export default function ChatNotificationHandler() {
  useChatNotifications();
  return null;
}