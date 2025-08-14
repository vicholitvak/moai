import { 
  collection, 
  doc, 
  addDoc, 
  updateDoc, 
  onSnapshot, 
  query, 
  where, 
  orderBy, 
  limit, 
  serverTimestamp,
  Timestamp,
  getDocs,
  getDoc
} from 'firebase/firestore';
import { db } from '@/lib/firebase/client';

export interface ChatMessage {
  id: string;
  senderId: string;
  senderName: string;
  senderRole: 'cooker' | 'driver' | 'customer' | 'admin';
  senderAvatar?: string;
  message: string;
  timestamp: Timestamp;
  type: 'text' | 'image' | 'location' | 'system';
  metadata?: {
    orderId?: string;
    location?: { lat: number; lng: number; address: string };
    imageUrl?: string;
  };
  readBy: string[]; // Array of user IDs who have read this message
  edited?: boolean;
  editedAt?: Timestamp;
}

export interface ChatRoom {
  id: string;
  participants: string[]; // Array of user IDs
  participantDetails: {
    [userId: string]: {
      name: string;
      role: 'cooker' | 'driver' | 'customer' | 'admin';
      avatar?: string;
      lastSeen?: Timestamp;
    };
  };
  type: 'order' | 'support' | 'direct'; // order: related to specific order, support: customer support, direct: direct message
  orderId?: string; // If type is 'order'
  lastMessage?: {
    message: string;
    senderId: string;
    timestamp: Timestamp;
    type: 'text' | 'image' | 'location' | 'system';
  };
  createdAt: Timestamp;
  updatedAt: Timestamp;
  status: 'active' | 'archived' | 'closed';
  unreadCount: { [userId: string]: number };
}

export class ChatService {
  private static readonly MESSAGES_COLLECTION = 'chatMessages';
  private static readonly ROOMS_COLLECTION = 'chatRooms';

  /**
   * Create a new chat room
   */
  static async createChatRoom(
    participants: string[], 
    participantDetails: ChatRoom['participantDetails'],
    type: ChatRoom['type'],
    orderId?: string
  ): Promise<string | null> {
    try {
      // Validate that we have participants
      if (!participants || participants.length === 0) {
        console.error('Cannot create chat room: no participants provided');
        return null;
      }

      console.log('Creating chat room with participants:', participants);

      const roomData: Omit<ChatRoom, 'id'> = {
        participants,
        participantDetails,
        type,
        orderId,
        createdAt: serverTimestamp() as Timestamp,
        updatedAt: serverTimestamp() as Timestamp,
        status: 'active',
        unreadCount: participants.reduce((acc, userId) => {
          acc[userId] = 0;
          return acc;
        }, {} as { [userId: string]: number })
      };

      const docRef = await addDoc(collection(db, this.ROOMS_COLLECTION), roomData);
      console.log('Chat room created with ID:', docRef.id);
      return docRef.id;
    } catch (error) {
      console.error('Error creating chat room:', error);
      if (error instanceof Error) {
        console.error('Error details:', error.message);
      }
      return null;
    }
  }

  /**
   * Get or create a chat room for an order
   */
  static async getOrCreateOrderChatRoom(
    orderId: string,
    cookerId: string,
    customerId: string,
    driverId?: string
  ): Promise<string | null> {
    try {
      console.log('Getting or creating chat room for order:', orderId, 'participants:', { cookerId, customerId, driverId });

      // Check if room already exists for this order
      const q = query(
        collection(db, this.ROOMS_COLLECTION),
        where('type', '==', 'order'),
        where('orderId', '==', orderId)
      );
      
      const querySnapshot = await getDocs(q);
      
      if (!querySnapshot.empty) {
        console.log('Chat room already exists for order:', orderId);
        return querySnapshot.docs[0].id;
      }

      // Validate required participants
      if (!cookerId || !customerId) {
        console.error('Cannot create chat room: missing required participants (cookerId or customerId)');
        return null;
      }

      // Create new room if it doesn't exist
      const participants = [cookerId, customerId];
      if (driverId) participants.push(driverId);

      // Get user details with better error handling
      const participantDetails: ChatRoom['participantDetails'] = {};
      
      for (const userId of participants) {
        try {
          const userDoc = await getDoc(doc(db, 'users', userId));
          if (userDoc.exists()) {
            const userData = userDoc.data();
            participantDetails[userId] = {
              name: userData.displayName || userData.email || 'Usuario',
              role: userData.role?.toLowerCase() || 'customer',
              avatar: userData.photoURL || userData.avatar
            };
          } else {
            console.warn(`User document not found for ${userId}, using default details`);
            participantDetails[userId] = {
              name: 'Usuario',
              role: 'customer'
            };
          }
        } catch (error) {
          console.warn(`Could not load details for user ${userId}:`, error);
          participantDetails[userId] = {
            name: 'Usuario',
            role: 'customer'
          };
        }
      }

      return await this.createChatRoom(participants, participantDetails, 'order', orderId);
    } catch (error) {
      console.error('Error getting or creating order chat room:', error);
      return null;
    }
  }

  /**
   * Send a message to a chat room
   */
  static async sendMessage(
    roomId: string,
    senderId: string,
    message: string,
    type: ChatMessage['type'] = 'text',
    metadata?: ChatMessage['metadata']
  ): Promise<boolean> {
    try {
      // Get sender details
      const userDoc = await getDoc(doc(db, 'users', senderId));
      const userData = userDoc.exists() ? userDoc.data() : {};

      const messageData: Omit<ChatMessage, 'id'> = {
        senderId,
        senderName: userData.displayName || userData.email || 'Usuario',
        senderRole: userData.role?.toLowerCase() || 'customer',
        senderAvatar: userData.photoURL || userData.avatar,
        message,
        timestamp: serverTimestamp() as Timestamp,
        type,
        metadata,
        readBy: [senderId] // Sender has read their own message
      };

      // Add message to subcollection
      await addDoc(
        collection(db, this.ROOMS_COLLECTION, roomId, this.MESSAGES_COLLECTION),
        messageData
      );

      // Update room's last message and timestamp
      await updateDoc(doc(db, this.ROOMS_COLLECTION, roomId), {
        lastMessage: {
          message,
          senderId,
          timestamp: serverTimestamp(),
          type
        },
        updatedAt: serverTimestamp(),
        // Increment unread count for all participants except sender
        [`unreadCount.${senderId}`]: 0 // Reset sender's unread count
      });

      // Update unread counts for other participants
      const roomDoc = await getDoc(doc(db, this.ROOMS_COLLECTION, roomId));
      if (roomDoc.exists()) {
        const roomData = roomDoc.data() as ChatRoom;
        const updates: any = {};
        
        roomData.participants.forEach(participantId => {
          if (participantId !== senderId) {
            updates[`unreadCount.${participantId}`] = (roomData.unreadCount[participantId] || 0) + 1;
          }
        });

        if (Object.keys(updates).length > 0) {
          await updateDoc(doc(db, this.ROOMS_COLLECTION, roomId), updates);
        }
      }

      console.log('Message sent successfully');
      return true;
    } catch (error) {
      console.error('Error sending message:', error);
      return false;
    }
  }

  /**
   * Send system message (automated)
   */
  static async sendSystemMessage(
    roomId: string,
    message: string,
    metadata?: ChatMessage['metadata']
  ): Promise<boolean> {
    try {
      const messageData: Omit<ChatMessage, 'id'> = {
        senderId: 'system',
        senderName: 'Sistema',
        senderRole: 'admin',
        message,
        timestamp: serverTimestamp() as Timestamp,
        type: 'system',
        metadata,
        readBy: [] // System messages start as unread for everyone
      };

      await addDoc(
        collection(db, this.ROOMS_COLLECTION, roomId, this.MESSAGES_COLLECTION),
        messageData
      );

      await updateDoc(doc(db, this.ROOMS_COLLECTION, roomId), {
        lastMessage: {
          message,
          senderId: 'system',
          timestamp: serverTimestamp(),
          type: 'system'
        },
        updatedAt: serverTimestamp()
      });

      return true;
    } catch (error) {
      console.error('Error sending system message:', error);
      return false;
    }
  }

  /**
   * Mark messages as read by a user
   */
  static async markMessagesAsRead(roomId: string, userId: string): Promise<boolean> {
    try {
      // Reset unread count for this user
      await updateDoc(doc(db, this.ROOMS_COLLECTION, roomId), {
        [`unreadCount.${userId}`]: 0,
        [`participantDetails.${userId}.lastSeen`]: serverTimestamp()
      });

      return true;
    } catch (error) {
      console.error('Error marking messages as read:', error);
      return false;
    }
  }

  /**
   * Subscribe to messages in a chat room
   */
  static subscribeToMessages(
    roomId: string,
    callback: (messages: ChatMessage[]) => void
  ) {
    const q = query(
      collection(db, this.ROOMS_COLLECTION, roomId, this.MESSAGES_COLLECTION),
      orderBy('timestamp', 'asc'),
      limit(100) // Limit to last 100 messages
    );

    return onSnapshot(q, (snapshot) => {
      const messages = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as ChatMessage[];
      
      callback(messages);
    });
  }

  /**
   * Subscribe to chat rooms for a user
   */
  static subscribeToUserChatRooms(
    userId: string,
    callback: (rooms: ChatRoom[]) => void
  ) {
    const q = query(
      collection(db, this.ROOMS_COLLECTION),
      where('participants', 'array-contains', userId),
      where('status', '==', 'active'),
      orderBy('updatedAt', 'desc')
    );

    return onSnapshot(q, (snapshot) => {
      const rooms = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as ChatRoom[];
      
      callback(rooms);
    });
  }

  /**
   * Get total unread count for a user across all rooms
   */
  static async getTotalUnreadCount(userId: string): Promise<number> {
    try {
      const q = query(
        collection(db, this.ROOMS_COLLECTION),
        where('participants', 'array-contains', userId),
        where('status', '==', 'active')
      );

      const snapshot = await getDocs(q);
      let totalUnread = 0;

      snapshot.docs.forEach(doc => {
        const room = doc.data() as ChatRoom;
        totalUnread += room.unreadCount[userId] || 0;
      });

      return totalUnread;
    } catch (error) {
      console.error('Error getting total unread count:', error);
      return 0;
    }
  }

  /**
   * Archive a chat room
   */
  static async archiveChatRoom(roomId: string): Promise<boolean> {
    try {
      await updateDoc(doc(db, this.ROOMS_COLLECTION, roomId), {
        status: 'archived',
        updatedAt: serverTimestamp()
      });
      return true;
    } catch (error) {
      console.error('Error archiving chat room:', error);
      return false;
    }
  }

  /**
   * Send location message
   */
  static async sendLocationMessage(
    roomId: string,
    senderId: string,
    location: { lat: number; lng: number; address: string }
  ): Promise<boolean> {
    return await this.sendMessage(
      roomId,
      senderId,
      `📍 Ubicación compartida: ${location.address}`,
      'location',
      { location }
    );
  }

  /**
   * Send order update message
   */
  static async sendOrderUpdateMessage(
    roomId: string,
    orderId: string,
    status: string,
    senderRole: 'cooker' | 'driver'
  ): Promise<boolean> {
    const statusMessages = {
      'accepted': '✅ Pedido aceptado y en preparación',
      'preparing': '👨‍🍳 Preparando tu pedido...',
      'ready': '📦 ¡Pedido listo para recoger!',
      'delivering': '🚚 Pedido en camino',
      'delivered': '🎉 ¡Pedido entregado!'
    };

    const message = statusMessages[status as keyof typeof statusMessages] || `Estado actualizado: ${status}`;

    return await this.sendSystemMessage(roomId, message, { orderId });
  }
}