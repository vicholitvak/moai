'use client';

import { db } from '@/lib/firebase/client';
import { 
  collection, 
  doc, 
  addDoc, 
  setDoc, 
  updateDoc, 
  deleteDoc,
  getDoc,
  getDocs,
  query, 
  where, 
  orderBy, 
  limit,
  onSnapshot,
  Timestamp,
  writeBatch
} from 'firebase/firestore';

export interface Message {
  id?: string;
  conversationId: string;
  senderId: string;
  senderName: string;
  senderAvatar?: string;
  senderRole: 'customer' | 'cook' | 'driver' | 'admin';
  content: string;
  type: 'text' | 'image' | 'order_update' | 'system';
  attachments?: MessageAttachment[];
  metadata?: any;
  timestamp: Timestamp;
  readBy: string[]; // Array of user IDs who have read this message
  edited?: boolean;
  editedAt?: Timestamp;
  replyTo?: string; // Reference to another message ID
}

export interface MessageAttachment {
  id: string;
  type: 'image' | 'file';
  url: string;
  name: string;
  size: number;
  mimeType: string;
}

export interface Conversation {
  id?: string;
  participants: ConversationParticipant[];
  type: 'order_support' | 'general_inquiry' | 'cook_customer' | 'driver_customer' | 'group';
  title?: string;
  orderId?: string;
  lastMessage?: {
    content: string;
    senderId: string;
    timestamp: Timestamp;
  };
  unreadCounts: { [userId: string]: number };
  isActive: boolean;
  createdAt: Timestamp;
  updatedAt: Timestamp;
  metadata?: any;
}

export interface ConversationParticipant {
  userId: string;
  name: string;
  avatar?: string;
  role: 'customer' | 'cook' | 'driver' | 'admin';
  joinedAt: Timestamp;
  lastSeen?: Timestamp;
  notifications: boolean;
}

export interface MessageTemplate {
  id: string;
  title: string;
  content: string;
  category: 'greeting' | 'order_update' | 'delivery' | 'support' | 'custom';
  role: 'cook' | 'driver' | 'admin' | 'all';
  variables?: string[]; // Template variables like {customerName}, {orderNumber}
}

export class MessagingService {
  // Create a new conversation
  static async createConversation(data: {
    participants: Omit<ConversationParticipant, 'joinedAt'>[];
    type: Conversation['type'];
    title?: string;
    orderId?: string;
    metadata?: any;
  }): Promise<string | null> {
    try {
      const conversation: Conversation = {
        participants: data.participants.map(p => ({
          ...p,
          joinedAt: Timestamp.now()
        })),
        type: data.type,
        title: data.title,
        orderId: data.orderId,
        unreadCounts: {},
        isActive: true,
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
        metadata: data.metadata
      };

      // Initialize unread counts
      data.participants.forEach(participant => {
        conversation.unreadCounts[participant.userId] = 0;
      });

      const docRef = await addDoc(collection(db, 'conversations'), conversation);
      return docRef.id;

    } catch (error) {
      console.error('Error creating conversation:', error);
      return null;
    }
  }

  // Send a message
  static async sendMessage(data: {
    conversationId: string;
    senderId: string;
    senderName: string;
    senderAvatar?: string;
    senderRole: Message['senderRole'];
    content: string;
    type?: Message['type'];
    attachments?: MessageAttachment[];
    replyTo?: string;
    metadata?: any;
  }): Promise<string | null> {
    try {
      const message: Message = {
        conversationId: data.conversationId,
        senderId: data.senderId,
        senderName: data.senderName,
        senderAvatar: data.senderAvatar,
        senderRole: data.senderRole,
        content: data.content,
        type: data.type || 'text',
        attachments: data.attachments,
        replyTo: data.replyTo,
        metadata: data.metadata,
        timestamp: Timestamp.now(),
        readBy: [data.senderId] // Sender has read their own message
      };

      // Use batch to update both message and conversation
      const batch = writeBatch(db);

      // Add message
      const messageRef = doc(collection(db, 'messages'));
      batch.set(messageRef, message);

      // Update conversation
      const conversationRef = doc(db, 'conversations', data.conversationId);
      const conversationDoc = await getDoc(conversationRef);
      
      if (conversationDoc.exists()) {
        const conversation = conversationDoc.data() as Conversation;
        const unreadCounts = { ...conversation.unreadCounts };
        
        // Increment unread count for all participants except sender
        conversation.participants.forEach(participant => {
          if (participant.userId !== data.senderId) {
            unreadCounts[participant.userId] = (unreadCounts[participant.userId] || 0) + 1;
          }
        });

        batch.update(conversationRef, {
          lastMessage: {
            content: data.content,
            senderId: data.senderId,
            timestamp: Timestamp.now()
          },
          unreadCounts,
          updatedAt: Timestamp.now()
        });
      }

      await batch.commit();
      return messageRef.id;

    } catch (error) {
      console.error('Error sending message:', error);
      return null;
    }
  }

  // Get conversations for a user
  static async getUserConversations(userId: string): Promise<Conversation[]> {
    try {
      const conversationsQuery = query(
        collection(db, 'conversations'),
        where('participants', 'array-contains-any', [{ userId }]),
        where('isActive', '==', true),
        orderBy('updatedAt', 'desc')
      );

      const conversationsSnapshot = await getDocs(conversationsQuery);
      return conversationsSnapshot.docs.map(doc => ({ 
        id: doc.id, 
        ...doc.data() 
      } as Conversation));

    } catch (error) {
      console.error('Error getting user conversations:', error);
      // Fallback query without orderBy if index doesn't exist
      try {
        const fallbackQuery = query(
          collection(db, 'conversations'),
          where('isActive', '==', true)
        );
        
        const snapshot = await getDocs(fallbackQuery);
        const conversations = snapshot.docs
          .map(doc => ({ id: doc.id, ...doc.data() } as Conversation))
          .filter(conv => conv.participants.some(p => p.userId === userId))
          .sort((a, b) => b.updatedAt.toMillis() - a.updatedAt.toMillis());
        
        return conversations;
      } catch (fallbackError) {
        console.error('Error with fallback query:', fallbackError);
        return [];
      }
    }
  }

  // Get messages for a conversation
  static async getConversationMessages(conversationId: string, limitCount: number = 50): Promise<Message[]> {
    try {
      const messagesQuery = query(
        collection(db, 'messages'),
        where('conversationId', '==', conversationId),
        orderBy('timestamp', 'desc'),
        limit(limitCount)
      );

      const messagesSnapshot = await getDocs(messagesQuery);
      const messages = messagesSnapshot.docs.map(doc => ({ 
        id: doc.id, 
        ...doc.data() 
      } as Message));

      return messages.reverse(); // Return in chronological order

    } catch (error) {
      console.error('Error getting conversation messages:', error);
      return [];
    }
  }

  // Subscribe to real-time messages
  static subscribeToMessages(
    conversationId: string, 
    callback: (messages: Message[]) => void,
    limitCount: number = 50
  ) {
    try {
      const messagesQuery = query(
        collection(db, 'messages'),
        where('conversationId', '==', conversationId),
        orderBy('timestamp', 'desc'),
        limit(limitCount)
      );

      return onSnapshot(messagesQuery, (snapshot) => {
        const messages = snapshot.docs.map(doc => ({ 
          id: doc.id, 
          ...doc.data() 
        } as Message));
        
        callback(messages.reverse());
      });

    } catch (error) {
      console.error('Error subscribing to messages:', error);
      return () => {}; // Return empty unsubscribe function
    }
  }

  // Subscribe to conversations
  static subscribeToConversations(userId: string, callback: (conversations: Conversation[]) => void) {
    try {
      // Since we can't easily query array-contains with real-time updates,
      // we'll subscribe to all active conversations and filter client-side
      const conversationsQuery = query(
        collection(db, 'conversations'),
        where('isActive', '==', true)
      );

      return onSnapshot(conversationsQuery, (snapshot) => {
        const conversations = snapshot.docs
          .map(doc => ({ id: doc.id, ...doc.data() } as Conversation))
          .filter(conv => conv.participants.some(p => p.userId === userId))
          .sort((a, b) => b.updatedAt.toMillis() - a.updatedAt.toMillis());
        
        callback(conversations);
      });

    } catch (error) {
      console.error('Error subscribing to conversations:', error);
      return () => {};
    }
  }

  // Mark messages as read
  static async markMessagesAsRead(conversationId: string, userId: string): Promise<boolean> {
    try {
      // Get unread messages in this conversation
      const unreadMessagesQuery = query(
        collection(db, 'messages'),
        where('conversationId', '==', conversationId),
        where('readBy', 'not-in', [[userId]])
      );

      const unreadMessages = await getDocs(unreadMessagesQuery);
      
      if (unreadMessages.empty) return true;

      const batch = writeBatch(db);

      // Mark all unread messages as read
      unreadMessages.docs.forEach(doc => {
        const message = doc.data() as Message;
        const updatedReadBy = [...(message.readBy || []), userId];
        batch.update(doc.ref, { readBy: updatedReadBy });
      });

      // Reset unread count in conversation
      const conversationRef = doc(db, 'conversations', conversationId);
      const conversationDoc = await getDoc(conversationRef);
      
      if (conversationDoc.exists()) {
        const conversation = conversationDoc.data() as Conversation;
        const unreadCounts = { ...conversation.unreadCounts };
        unreadCounts[userId] = 0;
        
        batch.update(conversationRef, { unreadCounts });
      }

      await batch.commit();
      return true;

    } catch (error) {
      console.error('Error marking messages as read:', error);
      return false;
    }
  }

  // Update user's last seen timestamp
  static async updateLastSeen(conversationId: string, userId: string): Promise<boolean> {
    try {
      const conversationRef = doc(db, 'conversations', conversationId);
      const conversationDoc = await getDoc(conversationRef);
      
      if (!conversationDoc.exists()) return false;

      const conversation = conversationDoc.data() as Conversation;
      const updatedParticipants = conversation.participants.map(participant => 
        participant.userId === userId 
          ? { ...participant, lastSeen: Timestamp.now() }
          : participant
      );

      await updateDoc(conversationRef, { participants: updatedParticipants });
      return true;

    } catch (error) {
      console.error('Error updating last seen:', error);
      return false;
    }
  }

  // Add participant to conversation
  static async addParticipant(
    conversationId: string, 
    participant: Omit<ConversationParticipant, 'joinedAt'>
  ): Promise<boolean> {
    try {
      const conversationRef = doc(db, 'conversations', conversationId);
      const conversationDoc = await getDoc(conversationRef);
      
      if (!conversationDoc.exists()) return false;

      const conversation = conversationDoc.data() as Conversation;
      const newParticipant: ConversationParticipant = {
        ...participant,
        joinedAt: Timestamp.now()
      };

      const updatedParticipants = [...conversation.participants, newParticipant];
      const updatedUnreadCounts = { 
        ...conversation.unreadCounts, 
        [participant.userId]: 0 
      };

      await updateDoc(conversationRef, { 
        participants: updatedParticipants,
        unreadCounts: updatedUnreadCounts,
        updatedAt: Timestamp.now()
      });

      return true;

    } catch (error) {
      console.error('Error adding participant:', error);
      return false;
    }
  }

  // Remove participant from conversation
  static async removeParticipant(conversationId: string, userId: string): Promise<boolean> {
    try {
      const conversationRef = doc(db, 'conversations', conversationId);
      const conversationDoc = await getDoc(conversationRef);
      
      if (!conversationDoc.exists()) return false;

      const conversation = conversationDoc.data() as Conversation;
      const updatedParticipants = conversation.participants.filter(p => p.userId !== userId);
      const updatedUnreadCounts = { ...conversation.unreadCounts };
      delete updatedUnreadCounts[userId];

      await updateDoc(conversationRef, { 
        participants: updatedParticipants,
        unreadCounts: updatedUnreadCounts,
        updatedAt: Timestamp.now()
      });

      return true;

    } catch (error) {
      console.error('Error removing participant:', error);
      return false;
    }
  }

  // Edit a message
  static async editMessage(messageId: string, newContent: string): Promise<boolean> {
    try {
      await updateDoc(doc(db, 'messages', messageId), {
        content: newContent,
        edited: true,
        editedAt: Timestamp.now()
      });

      return true;

    } catch (error) {
      console.error('Error editing message:', error);
      return false;
    }
  }

  // Delete a message
  static async deleteMessage(messageId: string): Promise<boolean> {
    try {
      await deleteDoc(doc(db, 'messages', messageId));
      return true;

    } catch (error) {
      console.error('Error deleting message:', error);
      return false;
    }
  }

  // Archive conversation
  static async archiveConversation(conversationId: string): Promise<boolean> {
    try {
      await updateDoc(doc(db, 'conversations', conversationId), {
        isActive: false,
        updatedAt: Timestamp.now()
      });

      return true;

    } catch (error) {
      console.error('Error archiving conversation:', error);
      return false;
    }
  }

  // Get conversation for specific order
  static async getOrderConversation(orderId: string): Promise<Conversation | null> {
    try {
      const conversationQuery = query(
        collection(db, 'conversations'),
        where('orderId', '==', orderId),
        where('isActive', '==', true),
        limit(1)
      );

      const conversationSnapshot = await getDocs(conversationQuery);
      
      if (conversationSnapshot.empty) return null;

      const doc = conversationSnapshot.docs[0];
      return { id: doc.id, ...doc.data() } as Conversation;

    } catch (error) {
      console.error('Error getting order conversation:', error);
      return null;
    }
  }

  // Get or create conversation between two users
  static async getOrCreateDirectConversation(
    user1: { id: string; name: string; role: Message['senderRole']; avatar?: string },
    user2: { id: string; name: string; role: Message['senderRole']; avatar?: string }
  ): Promise<string | null> {
    try {
      // Check if conversation already exists
      const conversationsQuery = query(
        collection(db, 'conversations'),
        where('type', '==', 'general_inquiry'),
        where('isActive', '==', true)
      );

      const conversationsSnapshot = await getDocs(conversationsQuery);
      
      const existingConversation = conversationsSnapshot.docs.find(doc => {
        const conv = doc.data() as Conversation;
        const participantIds = conv.participants.map(p => p.userId);
        return participantIds.includes(user1.id) && participantIds.includes(user2.id) && conv.participants.length === 2;
      });

      if (existingConversation) {
        return existingConversation.id;
      }

      // Create new conversation
      return await this.createConversation({
        participants: [
          {
            userId: user1.id,
            name: user1.name,
            role: user1.role,
            avatar: user1.avatar,
            notifications: true
          },
          {
            userId: user2.id,
            name: user2.name,
            role: user2.role,
            avatar: user2.avatar,
            notifications: true
          }
        ],
        type: 'general_inquiry',
        title: `Conversación entre ${user1.name} y ${user2.name}`
      });

    } catch (error) {
      console.error('Error getting or creating direct conversation:', error);
      return null;
    }
  }

  // Get message templates
  static async getMessageTemplates(role: Message['senderRole']): Promise<MessageTemplate[]> {
    try {
      const templatesQuery = query(
        collection(db, 'messageTemplates'),
        where('role', 'in', [role, 'all'])
      );

      const templatesSnapshot = await getDocs(templatesQuery);
      return templatesSnapshot.docs.map(doc => ({ 
        id: doc.id, 
        ...doc.data() 
      } as MessageTemplate));

    } catch (error) {
      console.error('Error getting message templates:', error);
      return this.getDefaultTemplates(role);
    }
  }

  // Get default message templates
  private static getDefaultTemplates(role: Message['senderRole']): MessageTemplate[] {
    const templates: MessageTemplate[] = [];

    if (role === 'cook') {
      templates.push(
        {
          id: 'cook_order_accepted',
          title: 'Pedido Aceptado',
          content: 'Hola {customerName}, he aceptado tu pedido #{orderNumber}. Comenzaré a prepararlo de inmediato.',
          category: 'order_update',
          role: 'cook',
          variables: ['customerName', 'orderNumber']
        },
        {
          id: 'cook_order_ready',
          title: 'Pedido Listo',
          content: 'Tu pedido #{orderNumber} está listo para entrega. El conductor llegará pronto.',
          category: 'order_update',
          role: 'cook',
          variables: ['orderNumber']
        }
      );
    }

    if (role === 'driver') {
      templates.push(
        {
          id: 'driver_pickup',
          title: 'Recogiendo Pedido',
          content: 'Hola, soy {driverName} tu conductor. Estoy recogiendo tu pedido y estaré contigo en {estimatedTime} minutos.',
          category: 'delivery',
          role: 'driver',
          variables: ['driverName', 'estimatedTime']
        },
        {
          id: 'driver_arrived',
          title: 'He Llegado',
          content: 'He llegado a tu ubicación con tu pedido #{orderNumber}. Por favor sal a recibirlo.',
          category: 'delivery',
          role: 'driver',
          variables: ['orderNumber']
        }
      );
    }

    return templates;
  }

  // Apply template variables
  static applyTemplate(template: MessageTemplate, variables: { [key: string]: string }): string {
    let content = template.content;
    
    template.variables?.forEach(variable => {
      const value = variables[variable] || `{${variable}}`;
      content = content.replace(new RegExp(`{${variable}}`, 'g'), value);
    });

    return content;
  }

  // Get total unread count for user
  static async getTotalUnreadCount(userId: string): Promise<number> {
    try {
      const conversations = await this.getUserConversations(userId);
      return conversations.reduce((total, conv) => total + (conv.unreadCounts[userId] || 0), 0);

    } catch (error) {
      console.error('Error getting total unread count:', error);
      return 0;
    }
  }

  // Search messages
  static async searchMessages(userId: string, searchTerm: string, limit: number = 20): Promise<Message[]> {
    try {
      // Get user's conversations first
      const conversations = await this.getUserConversations(userId);
      const conversationIds = conversations.map(c => c.id!);

      if (conversationIds.length === 0) return [];

      // Search messages in user's conversations
      // Note: This is a simplified search. In production, you'd want to use a proper search solution
      const allMessages: Message[] = [];
      
      for (const conversationId of conversationIds) {
        const messages = await this.getConversationMessages(conversationId, 100);
        const filteredMessages = messages.filter(message =>
          message.content.toLowerCase().includes(searchTerm.toLowerCase())
        );
        allMessages.push(...filteredMessages);
      }

      return allMessages
        .sort((a, b) => b.timestamp.toMillis() - a.timestamp.toMillis())
        .slice(0, limit);

    } catch (error) {
      console.error('Error searching messages:', error);
      return [];
    }
  }
}