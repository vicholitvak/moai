'use client';

import React, { useState, useEffect, useRef } from 'react';
import { ChatService, ChatMessage, ChatRoom } from '@/lib/services/chatService';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { 
  Send, 
  MapPin, 
  Image as ImageIcon, 
  Phone, 
  MoreVertical,
  Clock,
  CheckCheck,
  X
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';

interface ChatWindowProps {
  roomId: string;
  onClose?: () => void;
  className?: string;
}

export default function ChatWindow({ roomId, onClose, className }: ChatWindowProps) {
  const { user } = useAuth();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [room, setRoom] = useState<ChatRoom | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Scroll to bottom when new messages arrive
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(scrollToBottom, [messages]);

  useEffect(() => {
    if (!roomId || !user) return;

    // Subscribe to messages
    const unsubscribeMessages = ChatService.subscribeToMessages(roomId, (fetchedMessages) => {
      setMessages(fetchedMessages);
      setLoading(false);
    });

    // Subscribe to room details
    const unsubscribeRoom = ChatService.subscribeToUserChatRooms(user.uid, (rooms) => {
      const currentRoom = rooms.find(r => r.id === roomId);
      if (currentRoom) {
        setRoom(currentRoom);
      }
    });

    // Mark messages as read when opening chat
    ChatService.markMessagesAsRead(roomId, user.uid);

    return () => {
      unsubscribeMessages();
      unsubscribeRoom();
    };
  }, [roomId, user]);

  const handleSendMessage = async () => {
    if (!newMessage.trim() || !user || sending) return;

    setSending(true);
    const success = await ChatService.sendMessage(roomId, user.uid, newMessage.trim());
    
    if (success) {
      setNewMessage('');
    }
    setSending(false);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleSendLocation = async () => {
    if (!user || !navigator.geolocation) return;

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        // In a real app, you'd reverse geocode to get address
        const address = `${latitude.toFixed(6)}, ${longitude.toFixed(6)}`;
        
        await ChatService.sendLocationMessage(roomId, user.uid, {
          lat: latitude,
          lng: longitude,
          address
        });
      },
      (error) => {
        console.error('Error getting location:', error);
      }
    );
  };

  const getMessageTime = (timestamp: any) => {
    if (!timestamp) return '';
    
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return formatDistanceToNow(date, { addSuffix: true, locale: es });
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'cooker': return 'bg-orange-100 text-orange-800';
      case 'driver': return 'bg-blue-100 text-blue-800';
      case 'customer': return 'bg-green-100 text-green-800';
      case 'admin': return 'bg-purple-100 text-purple-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getRoleLabel = (role: string) => {
    switch (role) {
      case 'cooker': return 'Cocinero';
      case 'driver': return 'Conductor';
      case 'customer': return 'Cliente';
      case 'admin': return 'Sistema';
      default: return 'Usuario';
    }
  };

  if (loading) {
    return (
      <Card className={className}>
        <CardContent className="flex items-center justify-center h-96">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={className}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
        <div className="flex items-center space-x-3">
          <div>
            <CardTitle className="text-lg">
              {room?.type === 'order' ? `Pedido #${room.orderId?.slice(-8)}` : 'Chat'}
            </CardTitle>
            <div className="flex items-center space-x-2 mt-1">
              {room && Object.entries(room.participantDetails)
                .filter(([id]) => id !== user?.uid)
                .map(([id, details]) => (
                  <div key={id} className="flex items-center space-x-1">
                    <Badge variant="outline" className={getRoleColor(details.role)}>
                      {getRoleLabel(details.role)}
                    </Badge>
                    <span className="text-sm text-muted-foreground">{details.name}</span>
                  </div>
                ))
              }
            </div>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          {room?.type === 'order' && (
            <Button variant="outline" size="sm">
              <Phone className="h-4 w-4" />
            </Button>
          )}
          <Button variant="ghost" size="sm">
            <MoreVertical className="h-4 w-4" />
          </Button>
          {onClose && (
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>
      </CardHeader>

      <CardContent className="p-0">
        {/* Messages Area */}
        <div className="h-96 overflow-y-auto px-4 space-y-4">
          {messages.length === 0 ? (
            <div className="flex items-center justify-center h-full text-muted-foreground">
              <div className="text-center">
                <p>No hay mensajes aún</p>
                <p className="text-sm">Envía el primer mensaje para comenzar la conversación</p>
              </div>
            </div>
          ) : (
            messages.map((message) => {
              const isOwn = message.senderId === user?.uid;
              const isSystem = message.senderId === 'system';

              if (isSystem) {
                return (
                  <div key={message.id} className="flex justify-center">
                    <div className="bg-muted text-muted-foreground px-3 py-1 rounded-full text-sm">
                      {message.message}
                    </div>
                  </div>
                );
              }

              return (
                <div key={message.id} className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}>
                  <div className={`flex max-w-[70%] ${isOwn ? 'flex-row-reverse' : 'flex-row'} items-start space-x-2`}>
                    {!isOwn && (
                      <Avatar className="w-8 h-8">
                        <AvatarImage src={message.senderAvatar} />
                        <AvatarFallback className="text-xs">
                          {message.senderName.charAt(0).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                    )}
                    
                    <div className={`${isOwn ? 'mr-2' : 'ml-2'}`}>
                      {!isOwn && (
                        <div className="flex items-center space-x-2 mb-1">
                          <span className="text-sm font-medium">{message.senderName}</span>
                          <Badge variant="outline" className={`text-xs ${getRoleColor(message.senderRole)}`}>
                            {getRoleLabel(message.senderRole)}
                          </Badge>
                        </div>
                      )}
                      
                      <div className={`rounded-lg px-3 py-2 ${
                        isOwn 
                          ? 'bg-primary text-primary-foreground' 
                          : 'bg-muted'
                      }`}>
                        {message.type === 'location' && message.metadata?.location ? (
                          <div className="space-y-2">
                            <div className="flex items-center space-x-2">
                              <MapPin className="h-4 w-4" />
                              <span>Ubicación compartida</span>
                            </div>
                            <p className="text-sm opacity-90">{message.metadata.location.address}</p>
                            <Button 
                              variant={isOwn ? "secondary" : "default"} 
                              size="sm"
                              onClick={() => {
                                const { lat, lng } = message.metadata!.location!;
                                window.open(`https://www.google.com/maps?q=${lat},${lng}`, '_blank');
                              }}
                            >
                              Ver en Maps
                            </Button>
                          </div>
                        ) : (
                          <p className="whitespace-pre-wrap">{message.message}</p>
                        )}
                      </div>
                      
                      <div className={`flex items-center space-x-1 mt-1 ${isOwn ? 'justify-end' : 'justify-start'}`}>
                        <span className="text-xs text-muted-foreground">
                          {getMessageTime(message.timestamp)}
                        </span>
                        {isOwn && (
                          <div className="flex items-center">
                            <CheckCheck className={`h-3 w-3 ${
                              message.readBy.length > 1 ? 'text-blue-500' : 'text-muted-foreground'
                            }`} />
                          </div>
                        )}
                        {message.edited && (
                          <span className="text-xs text-muted-foreground">(editado)</span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input Area */}
        <div className="border-t p-4">
          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleSendLocation}
              className="flex-shrink-0"
            >
              <MapPin className="h-4 w-4" />
            </Button>
            
            <div className="flex-1 flex items-center space-x-2">
              <Input
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Escribe un mensaje..."
                disabled={sending}
                className="flex-1"
              />
              <Button
                onClick={handleSendMessage}
                disabled={!newMessage.trim() || sending}
                size="sm"
              >
                {sending ? (
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                ) : (
                  <Send className="h-4 w-4" />
                )}
              </Button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}