'use client';

import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { useGameStore } from '@/stores/game-store';
import { useGameActions } from '@/hooks/use-game-actions';
import { ChatMessage } from '@/types/game';
import { 
  MessageCircle, 
  X, 
  Send, 
  Smile,
  Image,
  Paperclip
} from 'lucide-react';

interface ChatPanelProps {
  isOpen: boolean;
  onClose: () => void;
  className?: string;
}

export function ChatPanel({ isOpen, onClose, className = '' }: ChatPanelProps) {
  const [message, setMessage] = useState('');
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const { chatMessages, currentPlayer } = useGameStore();
  const { sendChatMessage } = useGameActions();

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages]);

  // Focus input when chat opens
  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  // Handle message submission
  const handleSubmit = () => {
    if (message.trim()) {
      sendChatMessage(message.trim());
      setMessage('');
      setShowEmojiPicker(false);
    }
  };

  // Handle Enter key
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  // Handle emoji selection
  const handleEmojiSelect = (emoji: string) => {
    setMessage(prev => prev + emoji);
    setShowEmojiPicker(false);
  };

  // Common emojis
  const commonEmojis = ['😀', '😂', '😍', '🤔', '👍', '👎', '🎉', '🔥', '💯', '😎'];

  if (!isOpen) return null;

  return (
    <div className={`fixed inset-0 z-50 bg-black/50 backdrop-blur-sm ${className}`}>
      <div className="absolute bottom-0 left-0 right-0 bg-white dark:bg-gray-800 rounded-t-3xl shadow-2xl max-h-96 flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-2">
            <MessageCircle className="w-5 h-5 text-purple-600" />
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              Sohbet
            </h3>
            <span className="text-xs text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded-full">
              {chatMessages.length}
            </span>
          </div>
          
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
          >
            <X className="w-5 h-5" />
          </Button>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {chatMessages.length === 0 ? (
            <div className="text-center text-gray-500 dark:text-gray-400 py-8">
              <MessageCircle className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p>Henüz mesaj yok</p>
              <p className="text-sm">İlk mesajı siz gönderin!</p>
            </div>
          ) : (
            chatMessages.map((msg) => (
              <ChatMessageItem
                key={msg.id}
                message={msg}
                isOwnMessage={msg.playerId === currentPlayer?.id}
              />
            ))
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Emoji Picker */}
        {showEmojiPicker && (
          <div className="px-4 py-2 border-t border-gray-200 dark:border-gray-700">
            <div className="flex flex-wrap gap-2">
              {commonEmojis.map((emoji) => (
                <button
                  key={emoji}
                  onClick={() => handleEmojiSelect(emoji)}
                  className="text-2xl hover:scale-110 transition-transform cursor-pointer"
                >
                  {emoji}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Input Area */}
        <div className="p-4 border-t border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-2">
            <div className="flex-1 relative">
              <input
                ref={inputRef}
                type="text"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Mesajınızı yazın..."
                className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                maxLength={200}
              />
              
              {message.length > 0 && (
                <div className="absolute right-3 top-1/2 transform -translate-y-1/2 text-xs text-gray-400">
                  {message.length}/200
                </div>
              )}
            </div>
            
            <Button
              onClick={() => setShowEmojiPicker(!showEmojiPicker)}
              variant="ghost"
              size="icon"
              className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
            >
              <Smile className="w-5 h-5" />
            </Button>
            
            <Button
              onClick={handleSubmit}
              disabled={!message.trim()}
              size="icon"
              className="bg-purple-600 hover:bg-purple-700 text-white disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Send className="w-5 h-5" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

// Individual chat message component
interface ChatMessageItemProps {
  message: ChatMessage;
  isOwnMessage: boolean;
}

function ChatMessageItem({ message, isOwnMessage }: ChatMessageItemProps) {
  const formatTime = (timestamp: number) => {
    return new Date(timestamp).toLocaleTimeString('tr-TR', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className={`flex ${isOwnMessage ? 'justify-end' : 'justify-start'}`}>
      <div className={`max-w-xs px-3 py-2 rounded-2xl ${
        isOwnMessage
          ? 'bg-purple-500 text-white rounded-br-md'
          : 'bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-white rounded-bl-md'
      }`}>
        {/* Message header */}
        <div className="flex items-center justify-between mb-1">
          <span className={`text-xs font-medium ${
            isOwnMessage ? 'text-purple-100' : 'text-gray-600 dark:text-gray-400'
          }`}>
            {message.playerName}
          </span>
          <span className={`text-xs ${
            isOwnMessage ? 'text-purple-100' : 'text-gray-500 dark:text-gray-400'
          }`}>
            {formatTime(message.timestamp)}
          </span>
        </div>
        
        {/* Message content */}
        <p className="text-sm break-words">{message.message}</p>
      </div>
    </div>
  );
}

// Floating chat button
interface FloatingChatButtonProps {
  onClick: () => void;
  unreadCount?: number;
  className?: string;
}

export function FloatingChatButton({ onClick, unreadCount = 0, className = '' }: FloatingChatButtonProps) {
  return (
    <Button
      onClick={onClick}
      size="icon"
      className={`fixed bottom-6 right-6 w-14 h-14 rounded-full bg-purple-600 hover:bg-purple-700 text-white shadow-lg shadow-purple-500/25 ${className}`}
    >
      <MessageCircle className="w-6 h-6" />
      
      {/* Unread count badge */}
      {unreadCount > 0 && (
        <div className="absolute -top-1 -right-1 w-6 h-6 bg-red-500 text-white text-xs rounded-full flex items-center justify-center font-bold">
          {unreadCount > 99 ? '99+' : unreadCount}
        </div>
      )}
    </Button>
  );
}

// Compact chat preview
interface ChatPreviewProps {
  messages: ChatMessage[];
  onOpen: () => void;
  className?: string;
}

export function ChatPreview({ messages, onOpen, className = '' }: ChatPreviewProps) {
  const recentMessages = messages.slice(-3);
  
  return (
    <div 
      onClick={onOpen}
      className={`bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl rounded-xl p-4 border border-gray-200/50 dark:border-gray-700/50 cursor-pointer hover:bg-white dark:hover:bg-gray-800 transition-colors ${className}`}
    >
      <div className="flex items-center justify-between mb-3">
        <h4 className="font-medium text-gray-900 dark:text-white">
          Sohbet
        </h4>
        <MessageCircle className="w-4 h-4 text-purple-600" />
      </div>
      
      {recentMessages.length > 0 ? (
        <div className="space-y-2">
          {recentMessages.map((msg) => (
            <div key={msg.id} className="text-sm">
              <span className="font-medium text-gray-700 dark:text-gray-300">
                {msg.playerName}:
              </span>
              <span className="text-gray-600 dark:text-gray-400 ml-2">
                {msg.message.length > 30 
                  ? msg.message.substring(0, 30) + '...' 
                  : msg.message
                }
              </span>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-sm text-gray-500 dark:text-gray-400">
          Henüz mesaj yok
        </p>
      )}
    </div>
  );
}

