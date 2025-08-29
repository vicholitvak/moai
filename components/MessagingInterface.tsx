'use client';

import { useState, useEffect, useRef } from 'react';
import { MessagingService, type Message, type Conversation, type MessageTemplate } from '@/lib/services/messagingService';
import { NotificationService } from '@/lib/services/notificationService';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import { 
  MessageCircle, 
  Send, 
  Search,
  Plus,
  MoreVertical,
  Paperclip,
  Smile,
  Phone,
  Video,
  Archive,
  Edit,
  Trash2,
  Reply,
  Clock,
  Check,
  CheckCheck,
  X,
  FileText,
  Star
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { toast } from 'sonner';

interface MessagingInterfaceProps {
  initialConversationId?: string;
  orderId?: string;
  compactMode?: boolean;
  height?: string;
}

const MessagingInterface = ({ 
  initialConversationId, 
  orderId, 
  compactMode = false,
  height = '600px'
}: MessagingInterfaceProps) => {
  const { user, role } = useAuth();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeConversation, setActiveConversation] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [templates, setTemplates] = useState<MessageTemplate[]>([]);
  const [showTemplates, setShowTemplates] = useState(false);
  const [replyingTo, setReplyingTo] = useState<Message | null>(null);
  const [editingMessage, setEditingMessage] = useState<string | null>(null);
  const [editContent, setEditContent] = useState('');
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const unsubscribeConversations = useRef<(() => void) | null>(null);
  const unsubscribeMessages = useRef<(() => void) | null>(null);

  useEffect(() => {
    if (user) {
      loadConversations();
      loadTemplates();
    }

    return () => {
      unsubscribeConversations.current?.();
      unsubscribeMessages.current?.();
    };
  }, [user]);

  useEffect(() => {
    if (initialConversationId && conversations.length > 0) {
      const conversation = conversations.find(c => c.id === initialConversationId);
      if (conversation) {
        setActiveConversation(conversation);
      }
    } else if (orderId && conversations.length > 0) {
      const orderConversation = conversations.find(c => c.orderId === orderId);
      if (orderConversation) {
        setActiveConversation(orderConversation);
      }
    }
  }, [initialConversationId, orderId, conversations]);

  useEffect(() => {
    if (activeConversation) {
      loadMessages();
      markAsRead();
    } else {
      setMessages([]);
      unsubscribeMessages.current?.();
    }
  }, [activeConversation]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const loadConversations = () => {
    if (!user) return;

    setLoading(true);
    
    unsubscribeConversations.current = MessagingService.subscribeToConversations(
      user.uid,
      (updatedConversations) => {
        setConversations(updatedConversations);
        setLoading(false);
      }
    );
  };

  const loadMessages = () => {
    if (!activeConversation) return;

    unsubscribeMessages.current = MessagingService.subscribeToMessages(
      activeConversation.id!,
      (updatedMessages) => {
        setMessages(updatedMessages);
      }
    );
  };

  const loadTemplates = async () => {
    if (!user) return;

    try {
      const userRole = role || 'customer';
      const messageTemplates = await MessagingService.getMessageTemplates(userRole as 'customer' | 'cook' | 'driver' | 'admin');
      setTemplates(messageTemplates);
    } catch (error) {
      console.error('Error loading templates:', error);
    }
  };

  const markAsRead = async () => {
    if (!activeConversation || !user) return;

    try {
      await MessagingService.markMessagesAsRead(activeConversation.id!, user.uid);
      await MessagingService.updateLastSeen(activeConversation.id!, user.uid);
    } catch (error) {
      console.error('Error marking messages as read:', error);
    }
  };

  const sendMessage = async () => {
    if (!newMessage.trim() || !activeConversation || !user || sending) return;

    setSending(true);
    try {
      const messageId = await MessagingService.sendMessage({
        conversationId: activeConversation.id!,
        senderId: user.uid,
        senderName: user.displayName || 'Usuario',
        senderAvatar: user.photoURL || undefined,
        senderRole: (role as 'customer' | 'cook' | 'driver' | 'admin') || 'customer',
        content: newMessage.trim(),
        replyTo: replyingTo?.id
      });

      if (messageId) {
        setNewMessage('');
        setReplyingTo(null);
        
        // Send push notification to other participants
        const otherParticipants = activeConversation.participants.filter(p => p.userId !== user.uid);
        for (const participant of otherParticipants) {
          await NotificationService.sendToUser(participant.userId, {
            type: 'message',
            title: `Mensaje de ${user.displayName || 'Usuario'}`,
            body: newMessage.length > 50 ? `${newMessage.substring(0, 50)}...` : newMessage,
            priority: 'normal',
            actionUrl: `/messages/${activeConversation.id}`,
            data: {
              conversationId: activeConversation.id,
              senderId: user.uid
            }
          });
        }
      } else {
        toast.error('Error al enviar mensaje');
      }
    } catch (error) {
      console.error('Error sending message:', error);
      toast.error('Error al enviar mensaje');
    } finally {
      setSending(false);
    }
  };

  const handleEditMessage = async (messageId: string) => {
    if (!editContent.trim()) return;

    try {
      await MessagingService.editMessage(messageId, editContent.trim());
      setEditingMessage(null);
      setEditContent('');
      toast.success('Mensaje editado');
    } catch (error) {
      console.error('Error editing message:', error);
      toast.error('Error al editar mensaje');
    }
  };

  const handleDeleteMessage = async (messageId: string) => {
    try {
      await MessagingService.deleteMessage(messageId);
      toast.success('Mensaje eliminado');
    } catch (error) {
      console.error('Error deleting message:', error);
      toast.error('Error al eliminar mensaje');
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const formatMessageTime = (timestamp: any) => {
    if (!timestamp) return '';
    
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    
    if (diff < 24 * 60 * 60 * 1000) {
      return date.toLocaleTimeString('es-CL', { 
        hour: '2-digit', 
        minute: '2-digit' 
      });
    } else {
      return date.toLocaleDateString('es-CL', { 
        day: 'numeric',
        month: 'short',
        hour: '2-digit',
        minute: '2-digit'
      });
    }
  };

  const getConversationTitle = (conversation: Conversation) => {
    if (conversation.title) return conversation.title;
    
    const otherParticipants = conversation.participants.filter(p => p.userId !== user?.uid);
    if (otherParticipants.length === 1) {
      return otherParticipants[0].name;
    }
    
    return `Conversación (${conversation.participants.length} participantes)`;
  };

  const getUnreadCount = (conversation: Conversation) => {
    return conversation.unreadCounts[user?.uid || ''] || 0;
  };

  const applyTemplate = (template: MessageTemplate) => {
    // This would typically involve a modal to fill in template variables
    let content = template.content;
    
    // For now, we'll just set the template content directly
    setNewMessage(content);
    setShowTemplates(false);
    textareaRef.current?.focus();
  };

  const filteredConversations = conversations.filter(conversation =>
    searchTerm === '' || 
    getConversationTitle(conversation).toLowerCase().includes(searchTerm.toLowerCase()) ||
    conversation.lastMessage?.content.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (compactMode) {
    return (
      <Card className="h-full">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            <MessageCircle className="h-5 w-5" />
            {activeConversation ? getConversationTitle(activeConversation) : 'Mensajes'}
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0 h-full flex flex-col">
          {/* Messages */}
          <div className="flex-1 p-4 overflow-y-auto space-y-3" style={{ maxHeight: '300px' }}>
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex ${message.senderId === user?.uid ? 'justify-end' : 'justify-start'}`}
              >
                <div className={`max-w-[80%] rounded-lg p-3 ${
                  message.senderId === user?.uid
                    ? 'bg-moai-orange text-white'
                    : 'bg-muted'
                }`}>
                  <p className="text-sm">{message.content}</p>
                  <div className="flex items-center justify-between mt-1">
                    <span className="text-xs opacity-75">
                      {formatMessageTime(message.timestamp)}
                    </span>
                    {message.senderId === user?.uid && (
                      <div className="text-xs opacity-75">
                        {message.readBy.length > 1 ? <CheckCheck className="h-3 w-3" /> : <Check className="h-3 w-3" />}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>

          {/* Message Input */}
          <div className="p-4 border-t">
            <div className="flex gap-2">
              <Textarea
                ref={textareaRef}
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Escribe un mensaje..."
                rows={2}
                className="resize-none"
              />
              <Button
                onClick={sendMessage}
                disabled={!newMessage.trim() || sending}
                size="sm"
                className="bg-moai-orange hover:bg-moai-orange/90"
              >
                <Send className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="flex h-full bg-background" style={{ height }}>
      {/* Conversations Sidebar */}
      <div className="w-1/3 border-r flex flex-col">
        <div className="p-4 border-b">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-xl font-semibold">Mensajes</h2>
            <Button size="sm" variant="outline">
              <Plus className="h-4 w-4" />
            </Button>
          </div>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Buscar conversaciones..."
              className="pl-10"
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <div className="p-8 text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-moai-orange mx-auto mb-4"></div>
              <p>Cargando conversaciones...</p>
            </div>
          ) : filteredConversations.length === 0 ? (
            <div className="p-8 text-center">
              <MessageCircle className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">No hay conversaciones</h3>
              <p className="text-muted-foreground">
                Las nuevas conversaciones aparecerán aquí
              </p>
            </div>
          ) : (
            <div className="divide-y">
              {filteredConversations.map((conversation) => {
                const unreadCount = getUnreadCount(conversation);
                const isActive = activeConversation?.id === conversation.id;
                
                return (
                  <div
                    key={conversation.id}
                    onClick={() => setActiveConversation(conversation)}
                    className={`p-4 cursor-pointer hover:bg-muted/50 transition-colors ${
                      isActive ? 'bg-moai-orange/10 border-r-2 border-r-moai-orange' : ''
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <Avatar className="h-10 w-10">
                        <AvatarFallback>
                          {getConversationTitle(conversation).charAt(0)}
                        </AvatarFallback>
                      </Avatar>
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <h3 className="font-medium truncate">
                            {getConversationTitle(conversation)}
                          </h3>
                          <div className="flex items-center gap-2">
                            {conversation.lastMessage && (
                              <span className="text-xs text-muted-foreground">
                                {formatMessageTime(conversation.lastMessage.timestamp)}
                              </span>
                            )}
                            {unreadCount > 0 && (
                              <Badge className="bg-moai-orange text-white h-5 w-5 p-0 text-xs">
                                {unreadCount}
                              </Badge>
                            )}
                          </div>
                        </div>
                        
                        {conversation.lastMessage && (
                          <p className="text-sm text-muted-foreground truncate mt-1">
                            {conversation.lastMessage.content}
                          </p>
                        )}
                        
                        <div className="flex items-center gap-2 mt-2">
                          <Badge variant="outline" className="text-xs">
                            {conversation.type === 'order_support' ? 'Soporte' : 
                             conversation.type === 'cook_customer' ? 'Cook-Cliente' :
                             conversation.type === 'driver_customer' ? 'Conductor' : 'General'}
                          </Badge>
                          {conversation.orderId && (
                            <Badge variant="outline" className="text-xs">
                              Pedido #{conversation.orderId.slice(-6)}
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Chat Area */}
      <div className="flex-1 flex flex-col">
        {activeConversation ? (
          <>
            {/* Chat Header */}
            <div className="p-4 border-b flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Avatar className="h-10 w-10">
                  <AvatarFallback>
                    {getConversationTitle(activeConversation).charAt(0)}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <h3 className="font-semibold">{getConversationTitle(activeConversation)}</h3>
                  <p className="text-sm text-muted-foreground">
                    {activeConversation.participants.length} participante{activeConversation.participants.length !== 1 ? 's' : ''}
                  </p>
                </div>
              </div>
              
              <div className="flex items-center gap-2">
                {templates.length > 0 && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowTemplates(!showTemplates)}
                  >
                    <FileText className="h-4 w-4 mr-2" />
                    Plantillas
                  </Button>
                )}
                <Button variant="outline" size="sm">
                  <Phone className="h-4 w-4" />
                </Button>
                <Button variant="outline" size="sm">
                  <Video className="h-4 w-4" />
                </Button>
                <Button variant="outline" size="sm">
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {/* Templates Panel */}
            {showTemplates && (
              <div className="p-4 border-b bg-muted/20">
                <h4 className="font-medium mb-3">Plantillas de Mensajes</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  {templates.map((template) => (
                    <Button
                      key={template.id}
                      variant="outline"
                      size="sm"
                      onClick={() => applyTemplate(template)}
                      className="justify-start text-left h-auto p-3"
                    >
                      <div>
                        <div className="font-medium">{template.title}</div>
                        <div className="text-xs text-muted-foreground mt-1 line-clamp-2">
                          {template.content}
                        </div>
                      </div>
                    </Button>
                  ))}
                </div>
              </div>
            )}

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {messages.map((message) => {
                const isOwn = message.senderId === user?.uid;
                const isEditing = editingMessage === message.id;
                
                return (
                  <div key={message.id} className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-[70%] ${isOwn ? 'order-2' : 'order-1'}`}>
                      {/* Reply context */}
                      {message.replyTo && (
                        <div className="mb-2 p-2 bg-muted/50 rounded text-sm border-l-2 border-moai-orange">
                          <p className="text-muted-foreground">Respondiendo a mensaje anterior</p>
                        </div>
                      )}

                      <div
                        className={`relative rounded-lg p-3 ${
                          isOwn
                            ? 'bg-moai-orange text-white'
                            : 'bg-muted'
                        }`}
                      >
                        {!isOwn && (
                          <p className="text-xs font-medium mb-1">{message.senderName}</p>
                        )}
                        
                        {isEditing ? (
                          <div className="space-y-2">
                            <Textarea
                              value={editContent}
                              onChange={(e) => setEditContent(e.target.value)}
                              className="bg-background"
                              rows={2}
                            />
                            <div className="flex gap-2">
                              <Button
                                size="sm"
                                onClick={() => handleEditMessage(message.id!)}
                                className="bg-green-600 hover:bg-green-700"
                              >
                                Guardar
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => {
                                  setEditingMessage(null);
                                  setEditContent('');
                                }}
                              >
                                Cancelar
                              </Button>
                            </div>
                          </div>
                        ) : (
                          <>
                            <p className="whitespace-pre-wrap">{message.content}</p>
                            {message.edited && (
                              <p className="text-xs opacity-75 mt-1">(editado)</p>
                            )}
                          </>
                        )}

                        <div className="flex items-center justify-between mt-2">
                          <span className="text-xs opacity-75">
                            {formatMessageTime(message.timestamp)}
                          </span>
                          
                          <div className="flex items-center gap-1">
                            {isOwn && !isEditing && (
                              <div className="flex items-center gap-1">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => setReplyingTo(message)}
                                  className="p-1 h-6 w-6 text-current opacity-75 hover:opacity-100"
                                >
                                  <Reply className="h-3 w-3" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => {
                                    setEditingMessage(message.id!);
                                    setEditContent(message.content);
                                  }}
                                  className="p-1 h-6 w-6 text-current opacity-75 hover:opacity-100"
                                >
                                  <Edit className="h-3 w-3" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleDeleteMessage(message.id!)}
                                  className="p-1 h-6 w-6 text-current opacity-75 hover:opacity-100"
                                >
                                  <Trash2 className="h-3 w-3" />
                                </Button>
                              </div>
                            )}
                            
                            {isOwn && (
                              <div className="text-xs opacity-75">
                                {message.readBy.length > 1 ? (
                                  <CheckCheck className="h-3 w-3" />
                                ) : (
                                  <Check className="h-3 w-3" />
                                )}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
              <div ref={messagesEndRef} />
            </div>

            {/* Reply Context */}
            {replyingTo && (
              <div className="px-4 py-2 border-t bg-muted/20">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Reply className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm text-muted-foreground">
                      Respondiendo a {replyingTo.senderName}
                    </span>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setReplyingTo(null)}
                    className="p-1 h-6 w-6"
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </div>
                <p className="text-sm mt-1 line-clamp-1">{replyingTo.content}</p>
              </div>
            )}

            {/* Message Input */}
            <div className="p-4 border-t">
              <div className="flex gap-2">
                <Button variant="outline" size="sm">
                  <Paperclip className="h-4 w-4" />
                </Button>
                <Button variant="outline" size="sm">
                  <Smile className="h-4 w-4" />
                </Button>
                <Textarea
                  ref={textareaRef}
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="Escribe un mensaje..."
                  rows={2}
                  className="flex-1 resize-none"
                />
                <Button
                  onClick={sendMessage}
                  disabled={!newMessage.trim() || sending}
                  className="bg-moai-orange hover:bg-moai-orange/90"
                >
                  {sending ? (
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  ) : (
                    <Send className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <MessageCircle className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">Selecciona una conversación</h3>
              <p className="text-muted-foreground">
                Elige una conversación de la lista para comenzar a chatear
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default MessagingInterface;