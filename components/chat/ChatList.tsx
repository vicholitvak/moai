'use client';

import React, { useState, useEffect } from 'react';
import { ChatService, ChatRoom } from '@/lib/services/chatService';
import { useAuth } from '@/context/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { 
  MessageCircle, 
  Search, 
  Users, 
  ShoppingBag,
  Clock,
  Archive,
  Plus
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';

interface ChatListProps {
  onSelectRoom: (roomId: string) => void;
  selectedRoomId?: string;
  className?: string;
}

export default function ChatList({ onSelectRoom, selectedRoomId, className }: ChatListProps) {
  const { user } = useAuth();
  const [rooms, setRooms] = useState<ChatRoom[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filter, setFilter] = useState<'all' | 'order' | 'support' | 'direct'>('all');

  useEffect(() => {
    if (!user) return;

    const unsubscribe = ChatService.subscribeToUserChatRooms(user.uid, (fetchedRooms) => {
      setRooms(fetchedRooms);
      setLoading(false);
    });

    return unsubscribe;
  }, [user]);

  const filteredRooms = rooms.filter(room => {
    // Filter by type
    if (filter !== 'all' && room.type !== filter) return false;

    // Filter by search query
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      const participants = Object.values(room.participantDetails)
        .map(p => p.name.toLowerCase())
        .join(' ');
      const lastMessage = room.lastMessage?.message.toLowerCase() || '';
      
      return participants.includes(query) || lastMessage.includes(query);
    }

    return true;
  });

  const getLastMessageTime = (timestamp: any) => {
    if (!timestamp) return '';
    
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return formatDistanceToNow(date, { addSuffix: true, locale: es });
  };

  const getRoomTitle = (room: ChatRoom) => {
    if (room.type === 'order') {
      return `Pedido #${room.orderId?.slice(-8)}`;
    }
    
    // For direct messages, show other participant's name
    const otherParticipants = Object.entries(room.participantDetails)
      .filter(([id]) => id !== user?.uid)
      .map(([, details]) => details.name);
    
    return otherParticipants.join(', ') || 'Chat';
  };

  const getRoomSubtitle = (room: ChatRoom) => {
    if (room.type === 'order') {
      const otherParticipants = Object.entries(room.participantDetails)
        .filter(([id]) => id !== user?.uid)
        .map(([, details]) => `${details.name} (${getRoleLabel(details.role)})`)
        .join(', ');
      
      return otherParticipants;
    }
    
    return room.lastMessage?.message || 'Sin mensajes';
  };

  const getRoleLabel = (role: string) => {
    switch (role) {
      case 'cooker': return 'Cocinero';
      case 'driver': return 'Conductor';
      case 'customer': return 'Cliente';
      case 'admin': return 'Admin';
      default: return 'Usuario';
    }
  };

  const getRoomIcon = (room: ChatRoom) => {
    switch (room.type) {
      case 'order': return <ShoppingBag className="h-4 w-4" />;
      case 'support': return <MessageCircle className="h-4 w-4" />;
      case 'direct': return <Users className="h-4 w-4" />;
      default: return <MessageCircle className="h-4 w-4" />;
    }
  };

  const unreadCount = (room: ChatRoom) => {
    return room.unreadCount[user?.uid || ''] || 0;
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
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <MessageCircle className="h-5 w-5" />
          <span>Chats</span>
          {rooms.length > 0 && (
            <Badge variant="secondary">{rooms.length}</Badge>
          )}
        </CardTitle>
        
        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar chats..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-2">
          <Button
            variant={filter === 'all' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setFilter('all')}
          >
            Todos
          </Button>
          <Button
            variant={filter === 'order' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setFilter('order')}
          >
            <ShoppingBag className="h-3 w-3 mr-1" />
            Pedidos
          </Button>
          <Button
            variant={filter === 'support' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setFilter('support')}
          >
            <MessageCircle className="h-3 w-3 mr-1" />
            Soporte
          </Button>
          <Button
            variant={filter === 'direct' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setFilter('direct')}
          >
            <Users className="h-3 w-3 mr-1" />
            Directos
          </Button>
        </div>
      </CardHeader>

      <CardContent className="p-0">
        {filteredRooms.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-48 text-muted-foreground">
            <MessageCircle className="h-12 w-12 mb-4 opacity-50" />
            <p className="text-center">
              {searchQuery ? 'No se encontraron chats' : 'No tienes chats aún'}
            </p>
            {!searchQuery && (
              <p className="text-sm text-center mt-2">
                Los chats se crearán automáticamente cuando recibas pedidos
              </p>
            )}
          </div>
        ) : (
          <div className="space-y-1">
            {filteredRooms.map((room) => {
              const isSelected = selectedRoomId === room.id;
              const unread = unreadCount(room);
              
              return (
                <div
                  key={room.id}
                  onClick={() => onSelectRoom(room.id)}
                  className={`flex items-center space-x-3 p-3 hover:bg-muted cursor-pointer transition-colors ${
                    isSelected ? 'bg-muted border-r-2 border-primary' : ''
                  }`}
                >
                  {/* Room Icon */}
                  <div className="flex-shrink-0">
                    <div className="w-10 h-10 bg-muted rounded-full flex items-center justify-center">
                      {getRoomIcon(room)}
                    </div>
                  </div>

                  {/* Room Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <h4 className={`text-sm font-medium truncate ${unread > 0 ? 'font-semibold' : ''}`}>
                        {getRoomTitle(room)}
                      </h4>
                      <div className="flex items-center space-x-2 flex-shrink-0">
                        {room.lastMessage?.timestamp && (
                          <span className="text-xs text-muted-foreground">
                            {getLastMessageTime(room.lastMessage.timestamp)}
                          </span>
                        )}
                        {unread > 0 && (
                          <Badge variant="destructive" className="text-xs min-w-[20px] h-5 flex items-center justify-center px-1">
                            {unread > 99 ? '99+' : unread}
                          </Badge>
                        )}
                      </div>
                    </div>
                    
                    <p className={`text-xs text-muted-foreground truncate mt-1 ${
                      unread > 0 ? 'font-medium' : ''
                    }`}>
                      {room.type === 'order' ? getRoomSubtitle(room) : (room.lastMessage?.message || 'Sin mensajes')}
                    </p>

                    {/* Participants (for non-order chats) */}
                    {room.type !== 'order' && (
                      <div className="flex items-center space-x-1 mt-1">
                        {Object.entries(room.participantDetails)
                          .filter(([id]) => id !== user?.uid)
                          .slice(0, 3)
                          .map(([id, details]) => (
                            <Avatar key={id} className="w-4 h-4">
                              <AvatarImage src={details.avatar} />
                              <AvatarFallback className="text-xs">
                                {details.name.charAt(0).toUpperCase()}
                              </AvatarFallback>
                            </Avatar>
                          ))
                        }
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}