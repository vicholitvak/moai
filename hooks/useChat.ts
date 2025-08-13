'use client';

import { useState, useEffect } from 'react';
import { ChatService, ChatRoom } from '@/lib/services/chatService';
import { useAuth } from '@/context/AuthContext';

export function useChat() {
  const { user } = useAuth();
  const [rooms, setRooms] = useState<ChatRoom[]>([]);
  const [totalUnreadCount, setTotalUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setRooms([]);
      setTotalUnreadCount(0);
      setLoading(false);
      return;
    }

    // Subscribe to user's chat rooms
    const unsubscribe = ChatService.subscribeToUserChatRooms(user.uid, (fetchedRooms) => {
      setRooms(fetchedRooms);
      
      // Calculate total unread count
      const total = fetchedRooms.reduce((sum, room) => {
        return sum + (room.unreadCount[user.uid] || 0);
      }, 0);
      setTotalUnreadCount(total);
      
      setLoading(false);
    });

    return unsubscribe;
  }, [user]);

  const createOrderChat = async (
    orderId: string,
    cookerId: string,
    customerId: string,
    driverId?: string
  ) => {
    return await ChatService.getOrCreateOrderChatRoom(orderId, cookerId, customerId, driverId);
  };

  const markRoomAsRead = async (roomId: string) => {
    if (!user) return;
    return await ChatService.markMessagesAsRead(roomId, user.uid);
  };

  const sendMessage = async (roomId: string, message: string) => {
    if (!user) return false;
    return await ChatService.sendMessage(roomId, user.uid, message);
  };

  const sendLocationMessage = async (
    roomId: string, 
    location: { lat: number; lng: number; address: string }
  ) => {
    if (!user) return false;
    return await ChatService.sendLocationMessage(roomId, user.uid, location);
  };

  const sendOrderUpdate = async (roomId: string, orderId: string, status: string, senderRole: 'cooker' | 'driver') => {
    return await ChatService.sendOrderUpdateMessage(roomId, orderId, status, senderRole);
  };

  const archiveRoom = async (roomId: string) => {
    return await ChatService.archiveChatRoom(roomId);
  };

  return {
    rooms,
    totalUnreadCount,
    loading,
    createOrderChat,
    markRoomAsRead,
    sendMessage,
    sendLocationMessage,
    sendOrderUpdate,
    archiveRoom
  };
}

export function useChatNotifications() {
  const { totalUnreadCount } = useChat();

  // Update browser tab title with unread count
  useEffect(() => {
    const originalTitle = document.title.replace(/ \(\d+\)$/, '');
    
    if (totalUnreadCount > 0) {
      document.title = `${originalTitle} (${totalUnreadCount})`;
    } else {
      document.title = originalTitle;
    }

    return () => {
      document.title = originalTitle;
    };
  }, [totalUnreadCount]);

  return { totalUnreadCount };
}