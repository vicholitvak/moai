'use client';

import React, { useState } from 'react';
import { useChat } from '@/hooks/useChat';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { MessageCircle, X } from 'lucide-react';
import ChatList from './ChatList';
import ChatWindow from './ChatWindow';

interface FloatingChatButtonProps {
  className?: string;
}

export default function FloatingChatButton({ className }: FloatingChatButtonProps) {
  const { totalUnreadCount } = useChat();
  const [isOpen, setIsOpen] = useState(false);
  const [selectedRoomId, setSelectedRoomId] = useState<string | null>(null);

  const handleSelectRoom = (roomId: string) => {
    setSelectedRoomId(roomId);
  };

  const handleBackToList = () => {
    setSelectedRoomId(null);
  };

  return (
    <>
      {/* Desktop Version - Sheet */}
      <div className="hidden md:block">
        <Sheet open={isOpen} onOpenChange={setIsOpen}>
          <SheetTrigger asChild>
            <Button
              className={`fixed bottom-6 right-6 h-14 w-14 rounded-full shadow-lg hover:shadow-xl transition-all duration-200 z-50 ${className}`}
              size="icon"
            >
              <div className="relative">
                <MessageCircle className="h-6 w-6" />
                {totalUnreadCount > 0 && (
                  <Badge 
                    variant="destructive" 
                    className="absolute -top-2 -right-2 min-w-[20px] h-5 flex items-center justify-center px-1 text-xs"
                  >
                    {totalUnreadCount > 99 ? '99+' : totalUnreadCount}
                  </Badge>
                )}
              </div>
            </Button>
          </SheetTrigger>
          
          <SheetContent side="right" className="w-full sm:w-[800px] p-0">
            <div className="flex h-full">
              {/* Chat List */}
              <div className={`${selectedRoomId ? 'hidden lg:flex' : 'flex'} w-full lg:w-1/3 border-r`}>
                <ChatList 
                  onSelectRoom={handleSelectRoom}
                  selectedRoomId={selectedRoomId || undefined}
                  className="w-full border-none"
                />
              </div>
              
              {/* Chat Window */}
              {selectedRoomId && (
                <div className="flex-1">
                  <div className="lg:hidden p-4 border-b">
                    <Button variant="ghost" onClick={handleBackToList}>
                      ← Volver a chats
                    </Button>
                  </div>
                  <ChatWindow 
                    roomId={selectedRoomId}
                    className="border-none h-full"
                  />
                </div>
              )}
              
              {/* Placeholder when no room selected on desktop */}
              {!selectedRoomId && (
                <div className="hidden lg:flex flex-1 items-center justify-center bg-muted/30">
                  <div className="text-center text-muted-foreground">
                    <MessageCircle className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>Selecciona un chat para comenzar</p>
                  </div>
                </div>
              )}
            </div>
          </SheetContent>
        </Sheet>
      </div>

      {/* Mobile Version - Full Screen */}
      <div className="md:hidden">
        <Button
          onClick={() => setIsOpen(true)}
          className={`fixed bottom-6 right-6 h-14 w-14 rounded-full shadow-lg hover:shadow-xl transition-all duration-200 z-50 ${className}`}
          size="icon"
        >
          <div className="relative">
            <MessageCircle className="h-6 w-6" />
            {totalUnreadCount > 0 && (
              <Badge 
                variant="destructive" 
                className="absolute -top-2 -right-2 min-w-[20px] h-5 flex items-center justify-center px-1 text-xs"
              >
                {totalUnreadCount > 99 ? '99+' : totalUnreadCount}
              </Badge>
            )}
          </div>
        </Button>

        {/* Mobile Full Screen Overlay */}
        {isOpen && (
          <div className="fixed inset-0 bg-background z-50 flex flex-col">
            {/* Mobile Header */}
            <div className="flex items-center justify-between p-4 border-b">
              <h1 className="text-lg font-semibold">
                {selectedRoomId ? 'Chat' : 'Chats'}
              </h1>
              <div className="flex items-center space-x-2">
                {selectedRoomId && (
                  <Button variant="ghost" size="sm" onClick={handleBackToList}>
                    ← Volver
                  </Button>
                )}
                <Button variant="ghost" size="sm" onClick={() => setIsOpen(false)}>
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {/* Mobile Content */}
            <div className="flex-1 overflow-hidden">
              {selectedRoomId ? (
                <ChatWindow 
                  roomId={selectedRoomId}
                  className="h-full border-none"
                />
              ) : (
                <ChatList 
                  onSelectRoom={handleSelectRoom}
                  className="h-full border-none"
                />
              )}
            </div>
          </div>
        )}
      </div>
    </>
  );
}