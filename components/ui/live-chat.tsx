'use client';

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  MessageSquare, 
  X, 
  Send, 
  Paperclip, 
  Phone, 
  Minimize2,
  Maximize2,
  Bot,
  User,
  Clock,
  CheckCheck,
  AlertCircle,
  Smile,
  Camera,
  Mic,
  Settings
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Textarea } from '@/components/ui/textarea';
import { useAuth } from '@/context/AuthContext';
import { toast } from 'sonner';

interface ChatMessage {
  id: string;
  content: string;
  type: 'text' | 'image' | 'file' | 'system' | 'quick_reply';
  sender: 'user' | 'agent' | 'bot';
  senderName: string;
  senderAvatar?: string;
  timestamp: Date;
  status: 'sending' | 'sent' | 'delivered' | 'read';
  metadata?: {
    orderId?: string;
    fileUrl?: string;
    fileName?: string;
    quickReplies?: string[];
  };
}

interface SupportAgent {
  id: string;
  name: string;
  avatar: string;
  status: 'online' | 'busy' | 'offline';
  specialties: string[];
  rating: number;
  responseTime: string;
}

interface ChatSession {
  id: string;
  userId: string;
  agentId?: string;
  status: 'waiting' | 'active' | 'resolved' | 'closed';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  category: 'order_issue' | 'payment' | 'delivery' | 'general' | 'technical';
  createdAt: Date;
  closedAt?: Date;
  rating?: number;
  feedback?: string;
}

const LiveChat: React.FC = () => {
  const { user } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [currentAgent, setCurrentAgent] = useState<SupportAgent | null>(null);
  const [session, setSession] = useState<ChatSession | null>(null);
  const [queuePosition, setQueuePosition] = useState<number | null>(null);
  const [estimatedWaitTime, setEstimatedWaitTime] = useState<number | null>(null);
  const [showQuickReplies, setShowQuickReplies] = useState(true);
  const [isConnecting, setIsConnecting] = useState(false);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Sample agent data
  const sampleAgent: SupportAgent = {
    id: 'agent_1',
    name: 'María González',
    avatar: 'https://images.unsplash.com/photo-1494790108755-2616b612c14c?w=100&h=100&fit=crop&crop=face',
    status: 'online',
    specialties: ['Pedidos', 'Pagos', 'Delivery'],
    rating: 4.8,
    responseTime: '< 2 min'
  };

  // Quick reply options
  const quickReplies = [
    'Mi pedido no ha llegado',
    'Problema con el pago',
    'Quiero cambiar mi pedido',
    'Información de delivery',
    'Cancelar pedido',
    'Otro problema'
  ];

  // Auto-responses for common issues
  const autoResponses: Record<string, string> = {
    'Mi pedido no ha llegado': 'Entiendo tu preocupación. Déjame revisar el estado de tu pedido. ¿Podrías proporcionarme el número de tu pedido?',
    'Problema con el pago': 'Lamento que tengas problemas con el pago. ¿Podrías contarme qué error específico estás viendo?',
    'Quiero cambiar mi pedido': 'Por supuesto, puedo ayudarte con eso. ¿Qué cambios te gustaría hacer en tu pedido?',
    'Información de delivery': 'Con gusto te ayudo con información sobre el delivery. ¿Qué necesitas saber específicamente?',
    'Cancelar pedido': 'Entiendo que quieres cancelar tu pedido. ¿Podrías proporcionarme el número del pedido que deseas cancelar?'
  };

  useEffect(() => {
    if (isOpen && messages.length === 0) {
      initializeChat();
    }
  }, [isOpen]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const initializeChat = () => {
    setIsConnecting(true);
    
    // Simulate connection process
    setTimeout(() => {
      const welcomeMessage: ChatMessage = {
        id: `msg_${Date.now()}`,
        content: `¡Hola ${user?.displayName || 'Usuario'}! 👋 Soy tu asistente virtual de Moai. ¿En qué puedo ayudarte hoy?`,
        type: 'text',
        sender: 'bot',
        senderName: 'Asistente Moai',
        timestamp: new Date(),
        status: 'delivered',
        metadata: {
          quickReplies: quickReplies
        }
      };

      setMessages([welcomeMessage]);
      setIsConnecting(false);
      setSession({
        id: `session_${Date.now()}`,
        userId: user?.uid || '',
        status: 'waiting',
        priority: 'medium',
        category: 'general',
        createdAt: new Date()
      });
    }, 1500);
  };

  const connectToAgent = () => {
    setIsConnecting(true);
    setQueuePosition(3);
    setEstimatedWaitTime(5);

    // Simulate queue progression
    const queueInterval = setInterval(() => {
      setQueuePosition(prev => {
        if (prev && prev > 1) {
          return prev - 1;
        } else {
          clearInterval(queueInterval);
          assignAgent();
          return null;
        }
      });
    }, 2000);
  };

  const assignAgent = () => {
    setCurrentAgent(sampleAgent);
    setIsConnecting(false);
    setQueuePosition(null);
    setEstimatedWaitTime(null);

    const agentMessage: ChatMessage = {
      id: `msg_${Date.now()}`,
      content: `¡Hola! Soy ${sampleAgent.name} 👋 He revisado tu consulta y estoy aquí para ayudarte. ¿Podrías contarme más detalles sobre tu problema?`,
      type: 'text',
      sender: 'agent',
      senderName: sampleAgent.name,
      senderAvatar: sampleAgent.avatar,
      timestamp: new Date(),
      status: 'delivered'
    };

    setMessages(prev => [...prev, agentMessage]);
    
    if (session) {
      setSession({
        ...session,
        status: 'active',
        agentId: sampleAgent.id
      });
    }
  };

  const sendMessage = async (content: string, type: ChatMessage['type'] = 'text') => {
    if (!content.trim()) return;

    const userMessage: ChatMessage = {
      id: `msg_${Date.now()}`,
      content: content.trim(),
      type,
      sender: 'user',
      senderName: user?.displayName || 'Tú',
      senderAvatar: user?.photoURL || undefined,
      timestamp: new Date(),
      status: 'sending'
    };

    setMessages(prev => [...prev, userMessage]);
    setInputValue('');
    setShowQuickReplies(false);

    // Simulate message delivery
    setTimeout(() => {
      setMessages(prev => 
        prev.map(msg => 
          msg.id === userMessage.id 
            ? { ...msg, status: 'delivered' as const }
            : msg
        )
      );
    }, 500);

    // Generate response
    await generateResponse(content);
  };

  const generateResponse = async (userMessage: string) => {
    setIsTyping(true);

    // Simulate typing delay
    await new Promise(resolve => setTimeout(resolve, 1500));

    let responseContent = '';
    let shouldConnectToAgent = false;

    // Check for auto-responses
    if (autoResponses[userMessage]) {
      responseContent = autoResponses[userMessage];
    } else if (userMessage.toLowerCase().includes('hablar con agente') || 
               userMessage.toLowerCase().includes('persona real')) {
      responseContent = 'Por supuesto, te conecto con uno de nuestros agentes humanos. Un momento por favor...';
      shouldConnectToAgent = true;
    } else if (userMessage.toLowerCase().includes('gracias')) {
      responseContent = '¡De nada! ¿Hay algo más en lo que pueda ayudarte? 😊';
    } else {
      responseContent = 'Entiendo tu consulta. Para brindarte la mejor ayuda posible, ¿te gustaría que te conecte con uno de nuestros agentes especializados?';
      shouldConnectToAgent = true;
    }

    const botMessage: ChatMessage = {
      id: `msg_${Date.now()}`,
      content: responseContent,
      type: 'text',
      sender: currentAgent ? 'agent' : 'bot',
      senderName: currentAgent ? currentAgent.name : 'Asistente Moai',
      senderAvatar: currentAgent?.avatar,
      timestamp: new Date(),
      status: 'delivered'
    };

    setMessages(prev => [...prev, botMessage]);
    setIsTyping(false);

    // Connect to agent if needed
    if (shouldConnectToAgent && !currentAgent) {
      setTimeout(() => {
        connectToAgent();
      }, 1000);
    }
  };

  const handleQuickReply = (reply: string) => {
    sendMessage(reply);
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      toast.error('El archivo es demasiado grande. Máximo 10MB.');
      return;
    }

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'application/pdf'];
    if (!allowedTypes.includes(file.type)) {
      toast.error('Tipo de archivo no permitido. Solo imágenes y PDFs.');
      return;
    }

    // Create file message
    const fileMessage: ChatMessage = {
      id: `msg_${Date.now()}`,
      content: `Archivo enviado: ${file.name}`,
      type: 'file',
      sender: 'user',
      senderName: user?.displayName || 'Tú',
      timestamp: new Date(),
      status: 'sending',
      metadata: {
        fileName: file.name,
        fileUrl: URL.createObjectURL(file)
      }
    };

    setMessages(prev => [...prev, fileMessage]);

    // Simulate upload
    setTimeout(() => {
      setMessages(prev => 
        prev.map(msg => 
          msg.id === fileMessage.id 
            ? { ...msg, status: 'delivered' as const }
            : msg
        )
      );

      // Agent response
      const agentResponse: ChatMessage = {
        id: `msg_${Date.now() + 1}`,
        content: 'He recibido tu archivo. Lo revisaré y te ayudaré en un momento.',
        type: 'text',
        sender: currentAgent ? 'agent' : 'bot',
        senderName: currentAgent ? currentAgent.name : 'Asistente Moai',
        senderAvatar: currentAgent?.avatar,
        timestamp: new Date(),
        status: 'delivered'
      };

      setMessages(prev => [...prev, agentResponse]);
    }, 1000);

    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const closeChat = () => {
    if (session?.status === 'active') {
      // Show satisfaction survey
      setSession({
        ...session,
        status: 'resolved',
        closedAt: new Date()
      });
    }
    setIsOpen(false);
    setMessages([]);
    setCurrentAgent(null);
    setSession(null);
    setShowQuickReplies(true);
  };

  const toggleMinimize = () => {
    setIsMinimized(!isMinimized);
  };

  const renderMessage = (message: ChatMessage) => {
    const isUser = message.sender === 'user';
    const isBot = message.sender === 'bot';

    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        key={message.id}
        className={`flex ${isUser ? 'justify-end' : 'justify-start'} mb-4`}
      >
        <div className={`flex items-end gap-2 max-w-[80%] ${isUser ? 'flex-row-reverse' : 'flex-row'}`}>
          {!isUser && (
            <Avatar className="h-8 w-8">
              <AvatarImage src={message.senderAvatar} />
              <AvatarFallback>
                {isBot ? <Bot className="h-4 w-4" /> : <User className="h-4 w-4" />}
              </AvatarFallback>
            </Avatar>
          )}
          
          <div className={`flex flex-col ${isUser ? 'items-end' : 'items-start'}`}>
            <div
              className={`rounded-2xl px-4 py-2 max-w-full ${
                isUser
                  ? 'bg-primary text-primary-foreground'
                  : isBot
                  ? 'bg-muted'
                  : 'bg-blue-50 border border-blue-200'
              }`}
            >
              {message.type === 'file' ? (
                <div className="flex items-center gap-2">
                  <Paperclip className="h-4 w-4" />
                  <span className="text-sm">{message.metadata?.fileName}</span>
                </div>
              ) : (
                <p className="text-sm whitespace-pre-wrap">{message.content}</p>
              )}
            </div>
            
            <div className="flex items-center gap-1 mt-1">
              <span className="text-xs text-muted-foreground">
                {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </span>
              {isUser && (
                <div className="text-xs text-muted-foreground">
                  {message.status === 'sending' && <Clock className="h-3 w-3" />}
                  {message.status === 'delivered' && <CheckCheck className="h-3 w-3" />}
                  {message.status === 'read' && <CheckCheck className="h-3 w-3 text-blue-500" />}
                </div>
              )}
            </div>
          </div>
        </div>
      </motion.div>
    );
  };

  if (!isOpen) {
    return (
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        className="fixed bottom-6 right-6 z-50"
      >
        <Button
          onClick={() => setIsOpen(true)}
          size="lg"
          className="rounded-full h-14 w-14 shadow-lg hover:shadow-xl"
        >
          <MessageSquare className="h-6 w-6" />
        </Button>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 50 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 50 }}
      className={`fixed bottom-6 right-6 z-50 bg-white rounded-lg shadow-2xl border ${
        isMinimized ? 'h-16' : 'h-[600px]'
      } w-96 flex flex-col`}
    >
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b bg-primary text-primary-foreground rounded-t-lg">
        <div className="flex items-center gap-3">
          {currentAgent ? (
            <>
              <Avatar className="h-8 w-8">
                <AvatarImage src={currentAgent.avatar} />
                <AvatarFallback><User className="h-4 w-4" /></AvatarFallback>
              </Avatar>
              <div>
                <h3 className="font-semibold text-sm">{currentAgent.name}</h3>
                <div className="flex items-center gap-1">
                  <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                  <span className="text-xs opacity-90">En línea</span>
                </div>
              </div>
            </>
          ) : (
            <>
              <Bot className="h-8 w-8" />
              <div>
                <h3 className="font-semibold text-sm">Soporte Moai</h3>
                <span className="text-xs opacity-90">
                  {isConnecting ? 'Conectando...' : 'Asistente Virtual'}
                </span>
              </div>
            </>
          )}
        </div>
        
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="sm"
            onClick={toggleMinimize}
            className="text-primary-foreground hover:bg-white/20"
          >
            {isMinimized ? <Maximize2 className="h-4 w-4" /> : <Minimize2 className="h-4 w-4" />}
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={closeChat}
            className="text-primary-foreground hover:bg-white/20"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {!isMinimized && (
        <>
          {/* Queue Status */}
          {queuePosition && (
            <div className="p-3 bg-yellow-50 border-b border-yellow-200">
              <div className="flex items-center gap-2 text-yellow-800">
                <Clock className="h-4 w-4" />
                <span className="text-sm">
                  Posición en cola: {queuePosition} • Tiempo estimado: {estimatedWaitTime} min
                </span>
              </div>
            </div>
          )}

          {/* Messages */}
          <ScrollArea className="flex-1 p-4">
            <AnimatePresence>
              {messages.map(renderMessage)}
            </AnimatePresence>
            
            {isTyping && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex items-center gap-2 mb-4"
              >
                <Avatar className="h-8 w-8">
                  <AvatarImage src={currentAgent?.avatar} />
                  <AvatarFallback>
                    {currentAgent ? <User className="h-4 w-4" /> : <Bot className="h-4 w-4" />}
                  </AvatarFallback>
                </Avatar>
                <div className="bg-muted rounded-2xl px-4 py-2">
                  <div className="flex gap-1">
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                  </div>
                </div>
              </motion.div>
            )}
            
            <div ref={messagesEndRef} />
          </ScrollArea>

          {/* Quick Replies */}
          {showQuickReplies && messages.length > 0 && (
            <div className="p-3 border-t bg-gray-50">
              <p className="text-xs text-muted-foreground mb-2">Respuestas rápidas:</p>
              <div className="flex flex-wrap gap-2">
                {quickReplies.slice(0, 3).map((reply) => (
                  <Button
                    key={reply}
                    variant="outline"
                    size="sm"
                    onClick={() => handleQuickReply(reply)}
                    className="text-xs"
                  >
                    {reply}
                  </Button>
                ))}
              </div>
            </div>
          )}

          {/* Input */}
          <div className="p-4 border-t">
            <div className="flex items-center gap-2">
              <input
                ref={fileInputRef}
                type="file"
                className="hidden"
                onChange={handleFileUpload}
                accept="image/*,.pdf"
              />
              
              <Button
                variant="ghost"
                size="sm"
                onClick={() => fileInputRef.current?.click()}
                className="shrink-0"
              >
                <Paperclip className="h-4 w-4" />
              </Button>
              
              <div className="flex-1 flex items-center gap-1 border rounded-full px-3 py-1">
                <Input
                  ref={inputRef}
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  placeholder="Escribe tu mensaje..."
                  className="border-0 focus-visible:ring-0 p-0"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      sendMessage(inputValue);
                    }
                  }}
                />
                <Button
                  variant="ghost"
                  size="sm"
                  className="shrink-0"
                >
                  <Smile className="h-4 w-4" />
                </Button>
              </div>
              
              <Button
                onClick={() => sendMessage(inputValue)}
                disabled={!inputValue.trim()}
                size="sm"
                className="shrink-0"
              >
                <Send className="h-4 w-4" />
              </Button>
            </div>
            
            <p className="text-xs text-muted-foreground mt-2 text-center">
              Presiona Enter para enviar • Shift+Enter para nueva línea
            </p>
          </div>
        </>
      )}
    </motion.div>
  );
};

export default LiveChat;