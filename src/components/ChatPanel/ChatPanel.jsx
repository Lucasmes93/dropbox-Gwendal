import { useState, useEffect } from 'react';
import './ChatPanel.scss';

export const ChatPanel = ({ onClose }) => {
  const [chats, setChats] = useState([]);
  const [selectedChat, setSelectedChat] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');

  useEffect(() => {
    // Charger les chats depuis localStorage
    try {
      const saved = localStorage.getItem('monDrive_chats');
      if (saved) {
        setChats(JSON.parse(saved));
      } else {
        // Exemples de chats
        const exampleChats = [
          { id: '1', userId: '2', userName: 'Marie Dupont', unreadCount: 2 },
          { id: '2', userId: '3', userName: 'Jean Martin', unreadCount: 0 },
        ];
        setChats(exampleChats);
        localStorage.setItem('monDrive_chats', JSON.stringify(exampleChats));
      }
    } catch (error) {
      console.error('Erreur:', error);
    }
  }, []);

  useEffect(() => {
    if (selectedChat) {
      // Charger les messages du chat sélectionné
      try {
        const saved = localStorage.getItem(`monDrive_messages_${selectedChat.userId}`);
        if (saved) {
          setMessages(JSON.parse(saved));
        }
      } catch (error) {
        console.error('Erreur:', error);
      }
    }
  }, [selectedChat]);

  const handleSendMessage = () => {
    if (!newMessage.trim() || !selectedChat) return;

    const message = {
      id: Date.now().toString(),
      fromUserId: '1', // Utilisateur actuel
      toUserId: selectedChat.userId,
      content: newMessage.trim(),
      timestamp: new Date().toISOString(),
      read: false,
    };

    const updated = [...messages, message];
    setMessages(updated);
    localStorage.setItem(`monDrive_messages_${selectedChat.userId}`, JSON.stringify(updated));
    setNewMessage('');
  };

  return (
    <div className="chat-panel">
      <div className="chat-header">
        <h3>Messages</h3>
        <button className="chat-close" onClick={onClose}>✕</button>
      </div>
      
      <div className="chat-content">
        {!selectedChat ? (
          <div className="chats-list">
            {chats.map(chat => (
              <div
                key={chat.id}
                className={`chat-item ${chat.unreadCount > 0 ? 'unread' : ''}`}
                onClick={() => setSelectedChat(chat)}
              >
                <div className="chat-avatar">{chat.userName[0]}</div>
                <div className="chat-info">
                  <div className="chat-name">{chat.userName}</div>
                  {chat.lastMessage && (
                    <div className="chat-preview">{chat.lastMessage}</div>
                  )}
                </div>
                {chat.unreadCount > 0 && (
                  <span className="chat-badge">{chat.unreadCount}</span>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="chat-conversation">
            <div className="conversation-header">
              <button className="back-button" onClick={() => setSelectedChat(null)}>←</button>
              <span>{selectedChat.userName}</span>
            </div>
            <div className="messages-list">
              {messages.map(msg => (
                <div key={msg.id} className={`message ${msg.fromUserId === '1' ? 'sent' : 'received'}`}>
                  <div className="message-content">{msg.content}</div>
                  <div className="message-time">
                    {new Date(msg.timestamp).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                  </div>
                </div>
              ))}
            </div>
            <div className="message-input">
              <input
                type="text"
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                placeholder="Tapez un message..."
              />
              <button onClick={handleSendMessage}>Envoyer</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

