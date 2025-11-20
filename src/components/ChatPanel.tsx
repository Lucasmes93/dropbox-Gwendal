import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import type { Message, Chat } from '../types';
import { UserStatus } from './UserStatus';
import '../styles/ChatPanel.css';

interface ChatPanelProps {
  onClose: () => void;
}

export const ChatPanel = ({ onClose }: ChatPanelProps) => {
  const { user } = useAuth();
  const [chats, setChats] = useState<Chat[]>([]);
  const [selectedChat, setSelectedChat] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Charger les chats depuis localStorage
    loadChats();
  }, []);

  useEffect(() => {
    if (selectedChat) {
      loadMessages(selectedChat);
    }
  }, [selectedChat]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const loadChats = () => {
    try {
      const saved = localStorage.getItem('monDrive_chats');
      if (saved) {
        setChats(JSON.parse(saved));
      } else {
        // Chats mock pour la démo
        const mockChats: Chat[] = [
          {
            id: '1',
            userId: '2',
            userName: 'Marie Dupont',
            lastMessage: 'Salut, tu as vu le nouveau fichier ?',
            lastMessageTime: new Date().toISOString(),
            unreadCount: 2,
          },
          {
            id: '2',
            userId: '3',
            userName: 'Jean Martin',
            lastMessage: 'Merci pour le partage !',
            lastMessageTime: new Date(Date.now() - 3600000).toISOString(),
            unreadCount: 0,
          },
        ];
        setChats(mockChats);
        localStorage.setItem('monDrive_chats', JSON.stringify(mockChats));
      }
    } catch (error) {
      console.error('Erreur lors du chargement des chats:', error);
    }
  };

  const loadMessages = (chatId: string) => {
    try {
      const saved = localStorage.getItem(`monDrive_messages_${chatId}`);
      if (saved) {
        setMessages(JSON.parse(saved));
      } else {
        // Messages mock
        const mockMessages: Message[] = [
          {
            id: '1',
            fromUserId: '2',
            toUserId: user?.id || '',
            content: 'Salut, tu as vu le nouveau fichier ?',
            timestamp: new Date(Date.now() - 1800000).toISOString(),
            read: false,
          },
          {
            id: '2',
            fromUserId: user?.id || '',
            toUserId: '2',
            content: 'Oui, je l\'ai regardé. C\'est bien fait !',
            timestamp: new Date(Date.now() - 1200000).toISOString(),
            read: true,
          },
        ];
        setMessages(mockMessages);
        localStorage.setItem(`monDrive_messages_${chatId}`, JSON.stringify(mockMessages));
      }
    } catch (error) {
      console.error('Erreur lors du chargement des messages:', error);
    }
  };

  const sendMessage = () => {
    if (!newMessage.trim() || !selectedChat) return;

    const chat = chats.find(c => c.id === selectedChat);
    if (!chat) return;

    const message: Message = {
      id: Date.now().toString(),
      fromUserId: user?.id || '',
      toUserId: chat.userId,
      content: newMessage.trim(),
      timestamp: new Date().toISOString(),
      read: false,
    };

    const updatedMessages = [...messages, message];
    setMessages(updatedMessages);
    localStorage.setItem(`monDrive_messages_${selectedChat}`, JSON.stringify(updatedMessages));

    // Mettre à jour le chat
    const updatedChats = chats.map(c =>
      c.id === selectedChat
        ? { ...c, lastMessage: message.content, lastMessageTime: message.timestamp }
        : c
    );
    setChats(updatedChats);
    localStorage.setItem('monDrive_chats', JSON.stringify(updatedChats));

    setNewMessage('');
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const selectedChatData = chats.find(c => c.id === selectedChat);

  return (
    <div className="chat-panel">
      <div className="chat-header">
        <h3>Messages</h3>
        <button className="chat-close" onClick={onClose}>✕</button>
      </div>

      {!selectedChat ? (
        <div className="chat-list">
          {chats.length === 0 ? (
            <div className="chat-empty">Aucun message</div>
          ) : (
            chats.map(chat => (
              <div
                key={chat.id}
                className="chat-item"
                onClick={() => setSelectedChat(chat.id)}
              >
                <div className="chat-avatar">
                  <UserStatus userId={chat.userId} size="medium" />
                </div>
                <div className="chat-info">
                  <div className="chat-name">{chat.userName}</div>
                  <div className="chat-preview">{chat.lastMessage}</div>
                </div>
                {chat.unreadCount > 0 && (
                  <div className="chat-unread">{chat.unreadCount}</div>
                )}
              </div>
            ))
          )}
        </div>
      ) : (
        <div className="chat-conversation">
          <div className="chat-conversation-header">
            <button className="chat-back" onClick={() => setSelectedChat(null)}>
              ←
            </button>
            <div className="chat-conversation-name">
              <UserStatus userId={selectedChatData?.userId || ''} size="small" />
              {selectedChatData?.userName}
            </div>
          </div>

          <div className="chat-messages">
            {messages.map(message => {
              const isOwn = message.fromUserId === user?.id;
              return (
                <div
                  key={message.id}
                  className={`chat-message ${isOwn ? 'own' : ''}`}
                >
                  <div className="chat-message-content">{message.content}</div>
                  <div className="chat-message-time">
                    {new Date(message.timestamp).toLocaleTimeString('fr-FR', {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </div>
                </div>
              );
            })}
            <div ref={messagesEndRef} />
          </div>

          <div className="chat-input-container">
            <input
              type="text"
              className="chat-input"
              placeholder="Tapez un message..."
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
            />
            <button className="chat-send" onClick={sendMessage}>
              Envoyer
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

