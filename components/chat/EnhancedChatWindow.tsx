'use client';

import React, { useState, useEffect, useRef } from 'react';
import { ChatService, ChatMessage, ChatRoom } from '@/lib/services/chatService';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { 
  Send, 
  MapPin, 
  Image as ImageIcon, 
  Paperclip,
  Phone, 
  MoreVertical,
  Clock,
  CheckCheck,
  X,
  FileText,
  Download,
  Eye,
  Camera,
  Smile,
  Mic,
  MicOff,
  Loader2
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

// Extended message types
interface EnhancedChatMessage extends ChatMessage {
  attachments?: {
    type: 'image' | 'file' | 'audio';
    url: string;
    fileName?: string;
    fileSize?: number;
    mimeType?: string;
    thumbnail?: string;
  }[];
  replyTo?: string; // Message ID being replied to
  reactions?: { [emoji: string]: string[] }; // emoji -> user IDs
  edited?: boolean;
  editedAt?: any;
}

interface EnhancedChatWindowProps {
  roomId: string;
  onClose?: () => void;
  className?: string;
}

export default function EnhancedChatWindow({ roomId, onClose, className }: EnhancedChatWindowProps) {
  const { user } = useAuth();
  const [messages, setMessages] = useState<EnhancedChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [room, setRoom] = useState<ChatRoom | null>(null);
  const [replyingTo, setReplyingTo] = useState<EnhancedChatMessage | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<{ [key: string]: number }>({});
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);

  // Scroll to bottom when new messages arrive
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(scrollToBottom, [messages]);

  useEffect(() => {
    if (!roomId || !user) return;

    // Subscribe to messages
    const unsubscribeMessages = ChatService.subscribeToMessages(roomId, (fetchedMessages) => {
      setMessages(fetchedMessages as EnhancedChatMessage[]);
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

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = textareaRef.current.scrollHeight + 'px';
    }
  }, [newMessage]);

  const handleSendMessage = async () => {
    if (!newMessage.trim() || !user || sending) return;

    setSending(true);
    
    const messageData: any = {
      content: newMessage.trim(),
      type: 'text'
    };

    if (replyingTo) {
      messageData.replyTo = replyingTo.id;
    }

    const success = await ChatService.sendMessage(roomId, user.uid, messageData);
    
    if (success) {
      setNewMessage('');
      setReplyingTo(null);
    }
    setSending(false);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleFileUpload = async (files: FileList, type: 'image' | 'file') => {
    if (!user || files.length === 0) return;

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const fileId = `${Date.now()}_${i}`;
      
      // Validate file size (max 10MB for files, 5MB for images)
      const maxSize = type === 'image' ? 5 * 1024 * 1024 : 10 * 1024 * 1024;
      if (file.size > maxSize) {
        toast.error(`El archivo ${file.name} es demasiado grande. Máximo ${type === 'image' ? '5MB' : '10MB'}`);
        continue;
      }

      try {
        setUploadProgress(prev => ({ ...prev, [fileId]: 0 }));

        // In a real app, you'd upload to cloud storage (Firebase Storage, AWS S3, etc.)
        // For demo purposes, we'll use a data URL
        const fileUrl = await new Promise<string>((resolve) => {
          const reader = new FileReader();
          reader.onload = (e) => resolve(e.target?.result as string);
          reader.readAsDataURL(file);
        });

        // Simulate upload progress
        for (let progress = 0; progress <= 100; progress += 20) {
          setUploadProgress(prev => ({ ...prev, [fileId]: progress }));
          await new Promise(resolve => setTimeout(resolve, 100));
        }

        const messageData = {
          content: type === 'image' ? '📷 Imagen' : `📄 ${file.name}`,
          type: 'attachment',
          attachments: [{
            type,
            url: fileUrl,
            fileName: file.name,
            fileSize: file.size,
            mimeType: file.type,
            thumbnail: type === 'image' ? fileUrl : undefined
          }]
        };

        await ChatService.sendMessage(roomId, user.uid, messageData);
        
        setUploadProgress(prev => {
          const newProgress = { ...prev };
          delete newProgress[fileId];
          return newProgress;
        });

      } catch (error) {
        console.error('Error uploading file:', error);
        toast.error('Error al subir el archivo');
        setUploadProgress(prev => {
          const newProgress = { ...prev };
          delete newProgress[fileId];
          return newProgress;
        });
      }
    }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      handleFileUpload(e.target.files, 'image');
      e.target.value = '';
    }
  };

  const handleFileUploadClick = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      handleFileUpload(e.target.files, 'file');
      e.target.value = '';
    }
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      const chunks: BlobPart[] = [];

      mediaRecorder.ondataavailable = (e) => {
        chunks.push(e.data);
      };

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(chunks, { type: 'audio/webm' });
        const audioUrl = URL.createObjectURL(audioBlob);
        
        const messageData = {
          content: '🎤 Mensaje de voz',
          type: 'attachment',
          attachments: [{
            type: 'audio' as const,
            url: audioUrl,
            fileName: `voice_${Date.now()}.webm`,
            fileSize: audioBlob.size,
            mimeType: 'audio/webm'
          }]
        };

        await ChatService.sendMessage(roomId, user.uid, messageData);
        
        // Clean up stream
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorderRef.current = mediaRecorder;
      mediaRecorder.start();
      setIsRecording(true);
    } catch (error) {
      console.error('Error starting recording:', error);
      toast.error('Error al acceder al micrófono');
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  const handleSendLocation = async () => {
    if (!user || !navigator.geolocation) return;

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        const address = `${latitude.toFixed(6)}, ${longitude.toFixed(6)}`;
        
        await ChatService.sendLocationMessage(roomId, user.uid, {
          lat: latitude,
          lng: longitude,
          address
        });
      },
      (error) => {
        console.error('Error getting location:', error);
        toast.error('Error al obtener la ubicación');
      }
    );
  };

  const handleReaction = async (messageId: string, emoji: string) => {
    if (!user) return;
    
    // In a real app, you'd implement reaction logic in ChatService
    toast.success(`Reacción ${emoji} añadida`);
  };

  const getMessageTime = (timestamp: any) => {
    if (!timestamp) return '';
    
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return formatDistanceToNow(date, { addSuffix: true, locale: es });
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const MessageContent = ({ message }: { message: EnhancedChatMessage }) => {
    if (message.type === 'location' && message.location) {
      return (
        <div className="flex items-center gap-2 p-3 bg-blue-50 dark:bg-blue-950/30 rounded-lg">
          <MapPin className="h-4 w-4 text-blue-600" />
          <div>
            <p className="text-sm font-medium">Ubicación compartida</p>
            <p className="text-xs text-muted-foreground">{message.location.address}</p>
          </div>
          <Button
            size="sm"
            variant="outline"
            onClick={() => window.open(`https://maps.google.com/?q=${message.location!.lat},${message.location!.lng}`)}
          >
            Ver mapa
          </Button>
        </div>
      );
    }

    if (message.type === 'attachment' && message.attachments) {
      return (
        <div className="space-y-2">
          {message.attachments.map((attachment, index) => (
            <div key={index} className="max-w-sm">
              {attachment.type === 'image' && (
                <div className="relative group">
                  <img
                    src={attachment.url}
                    alt={attachment.fileName || 'Imagen'}
                    className="rounded-lg max-w-full h-auto cursor-pointer hover:opacity-90 transition-opacity"
                    onClick={() => window.open(attachment.url, '_blank')}
                  />
                  <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Button size="sm" variant="secondary" className="h-8 w-8 p-0">
                      <Eye className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              )}
              
              {attachment.type === 'file' && (
                <div className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg border">
                  <FileText className="h-8 w-8 text-blue-600 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{attachment.fileName}</p>
                    {attachment.fileSize && (
                      <p className="text-xs text-muted-foreground">{formatFileSize(attachment.fileSize)}</p>
                    )}
                  </div>
                  <Button size="sm" variant="outline">
                    <Download className="h-4 w-4" />
                  </Button>
                </div>
              )}
              
              {attachment.type === 'audio' && (
                <div className="flex items-center gap-3 p-3 bg-green-50 dark:bg-green-950/30 rounded-lg">
                  <Mic className="h-6 w-6 text-green-600" />
                  <div className="flex-1">
                    <p className="text-sm font-medium">Mensaje de voz</p>
                    <audio controls className="w-full mt-1">
                      <source src={attachment.url} type={attachment.mimeType} />
                    </audio>
                  </div>
                </div>
              )}
            </div>
          ))}
          {message.content && message.content !== '📷 Imagen' && message.content !== '🎤 Mensaje de voz' && !message.content.startsWith('📄') && (
            <p className="text-sm">{message.content}</p>
          )}
        </div>
      );
    }

    return <p className="text-sm whitespace-pre-wrap">{message.content}</p>;
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'cooker': return 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300';
      case 'driver': return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300';
      case 'customer': return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300';
      case 'admin': return 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300';
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
      {/* Header */}
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {room && (
              <>
                <Avatar className="h-8 w-8">
                  <AvatarImage src={room.participants[0]?.avatar} />
                  <AvatarFallback>{room.participants[0]?.name?.[0]}</AvatarFallback>
                </Avatar>
                <div>
                  <CardTitle className="text-base">{room.participants[0]?.name}</CardTitle>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className={getRoleColor(room.participants[0]?.role || '')}>
                      {getRoleLabel(room.participants[0]?.role || '')}
                    </Badge>
                    <span className="text-xs text-muted-foreground">
                      {room.lastActivity ? getMessageTime(room.lastActivity) : 'Hace tiempo'}
                    </span>
                  </div>
                </div>
              </>
            )}
          </div>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm">
              <Phone className="h-4 w-4" />
            </Button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm">
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem>Ver perfil</DropdownMenuItem>
                <DropdownMenuItem>Buscar mensajes</DropdownMenuItem>
                <DropdownMenuItem>Silenciar notificaciones</DropdownMenuItem>
                <DropdownMenuItem className="text-red-600">Reportar usuario</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            {onClose && (
              <Button variant="ghost" size="sm" onClick={onClose}>
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>
      </CardHeader>

      {/* Messages */}
      <CardContent className="flex flex-col h-96">
        <div className="flex-1 overflow-y-auto space-y-4 mb-4">
          {messages.map((message) => {
            const isOwn = message.senderId === user?.uid;
            const senderInfo = room?.participants.find(p => p.id === message.senderId);
            
            return (
              <div
                key={message.id}
                className={cn(
                  "flex gap-3",
                  isOwn ? "flex-row-reverse" : "flex-row"
                )}
              >
                {!isOwn && (
                  <Avatar className="h-8 w-8 flex-shrink-0">
                    <AvatarImage src={senderInfo?.avatar} />
                    <AvatarFallback>{senderInfo?.name?.[0]}</AvatarFallback>
                  </Avatar>
                )}
                
                <div className={cn("max-w-[70%] space-y-1", isOwn && "items-end")}>
                  {replyingTo?.id === message.id && (
                    <div className="text-xs text-muted-foreground px-3 py-1 bg-muted rounded">
                      Respondiendo a un mensaje
                    </div>
                  )}
                  
                  <div
                    className={cn(
                      "px-3 py-2 rounded-lg",
                      isOwn
                        ? "bg-primary text-primary-foreground ml-auto"
                        : "bg-muted"
                    )}
                  >
                    <MessageContent message={message} />
                  </div>
                  
                  <div className={cn(
                    "flex items-center gap-2 text-xs text-muted-foreground",
                    isOwn ? "justify-end" : "justify-start"
                  )}>
                    <span>{getMessageTime(message.timestamp)}</span>
                    {isOwn && (
                      <CheckCheck className={cn(
                        "h-3 w-3",
                        message.read ? "text-blue-500" : "text-gray-400"
                      )} />
                    )}
                    {message.edited && <span>(editado)</span>}
                  </div>
                  
                  {/* Quick reaction buttons */}
                  <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    {['👍', '❤️', '😂', '😮', '😢', '😡'].map((emoji) => (
                      <Button
                        key={emoji}
                        variant="ghost"
                        size="sm"
                        className="h-6 w-6 p-0 hover:bg-background/80"
                        onClick={() => handleReaction(message.id, emoji)}
                      >
                        {emoji}
                      </Button>
                    ))}
                  </div>
                </div>
              </div>
            );
          })}
          
          {/* Upload progress indicators */}
          {Object.entries(uploadProgress).map(([fileId, progress]) => (
            <div key={fileId} className="flex justify-end">
              <div className="bg-muted rounded-lg p-3 max-w-[70%]">
                <div className="flex items-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span className="text-sm">Subiendo archivo... {progress}%</span>
                </div>
                <div className="w-full bg-background rounded-full h-1.5 mt-2">
                  <div 
                    className="bg-primary h-1.5 rounded-full transition-all"
                    style={{ width: `${progress}%` }}
                  />
                </div>
              </div>
            </div>
          ))}
          
          <div ref={messagesEndRef} />
        </div>

        {/* Reply indicator */}
        {replyingTo && (
          <div className="flex items-center justify-between bg-muted/50 rounded-lg p-3 mb-3">
            <div className="flex-1">
              <p className="text-xs text-muted-foreground">Respondiendo a:</p>
              <p className="text-sm truncate">{replyingTo.content}</p>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setReplyingTo(null)}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        )}

        {/* Input area */}
        <div className="space-y-2">
          <div className="flex items-end gap-2">
            {/* Attachment buttons */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="flex-shrink-0">
                  <Paperclip className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start">
                <DropdownMenuItem onClick={() => imageInputRef.current?.click()}>
                  <ImageIcon className="h-4 w-4 mr-2" />
                  Imagen
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => fileInputRef.current?.click()}>
                  <FileText className="h-4 w-4 mr-2" />
                  Archivo
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleSendLocation}>
                  <MapPin className="h-4 w-4 mr-2" />
                  Ubicación
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => imageInputRef.current?.click()}>
                  <Camera className="h-4 w-4 mr-2" />
                  Cámara
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Message input */}
            <div className="flex-1 relative">
              <Textarea
                ref={textareaRef}
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                onKeyDown={handleKeyPress}
                placeholder="Escribe un mensaje..."
                className="min-h-[40px] max-h-32 resize-none pr-12"
                rows={1}
              />
              <Button
                variant="ghost"
                size="sm"
                className="absolute right-2 top-1/2 -translate-y-1/2 h-8 w-8 p-0"
              >
                <Smile className="h-4 w-4" />
              </Button>
            </div>

            {/* Voice message button */}
            <Button
              variant="ghost"
              size="sm"
              className={cn(
                "flex-shrink-0",
                isRecording && "bg-red-100 text-red-600"
              )}
              onMouseDown={startRecording}
              onMouseUp={stopRecording}
              onMouseLeave={stopRecording}
            >
              {isRecording ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
            </Button>

            {/* Send button */}
            <Button
              onClick={handleSendMessage}
              disabled={!newMessage.trim() || sending}
              size="sm"
              className="flex-shrink-0"
            >
              {sending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Send className="h-4 w-4" />
              )}
            </Button>
          </div>

          {/* File inputs */}
          <input
            ref={imageInputRef}
            type="file"
            accept="image/*"
            multiple
            className="hidden"
            onChange={handleImageUpload}
          />
          <input
            ref={fileInputRef}
            type="file"
            multiple
            className="hidden"
            onChange={handleFileUploadClick}
          />
        </div>
      </CardContent>
    </Card>
  );
}