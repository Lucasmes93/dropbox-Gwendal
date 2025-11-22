// Service WebSocket pour la synchronisation en temps réel

const WS_URL = import.meta.env.VITE_WS_URL || 'ws://localhost:3001';

let ws: WebSocket | null = null;
let reconnectAttempts = 0;
const MAX_RECONNECT_ATTEMPTS = 5;
let reconnectTimeout: ReturnType<typeof setTimeout> | null = null;

// Callbacks pour les événements
const eventHandlers: Map<string, Set<(data: any) => void>> = new Map();

// Se connecter au WebSocket
export const connectWebSocket = (userId: string) => {
  // Si déjà connecté avec le même userId, ne rien faire
  if (ws?.readyState === WebSocket.OPEN) {
    return; // Déjà connecté
  }

  // Si une connexion est en cours, attendre
  if (ws?.readyState === WebSocket.CONNECTING) {
    return;
  }

  // Fermer l'ancienne connexion si elle existe
  if (ws) {
    ws.close();
    ws = null;
  }

  try {
    ws = new WebSocket(`${WS_URL}?userId=${userId}`);

    ws.onopen = () => {
      reconnectAttempts = 0;
    };

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        handleWebSocketMessage(data);
      } catch (error) {
      }
    };

    ws.onerror = (error) => {
    };

    ws.onclose = () => {
      ws = null;
      
      // Tentative de reconnexion
      if (reconnectAttempts < MAX_RECONNECT_ATTEMPTS) {
        reconnectAttempts++;
        const delay = Math.min(1000 * Math.pow(2, reconnectAttempts), 30000);
        reconnectTimeout = setTimeout(() => {
          connectWebSocket(userId);
        }, delay);
      }
    };
  } catch (error) {
  }
};

// Déconnecter le WebSocket
export const disconnectWebSocket = () => {
  if (reconnectTimeout) {
    clearTimeout(reconnectTimeout);
    reconnectTimeout = null;
  }
  if (ws) {
    ws.close();
    ws = null;
  }
  eventHandlers.clear();
};

// Gérer les messages WebSocket
const handleWebSocketMessage = (data: any) => {
  const { type } = data;
  
  // Appeler tous les handlers pour ce type d'événement
  const handlers = eventHandlers.get(type);
  if (handlers) {
    handlers.forEach(handler => {
      try {
        handler(data);
      } catch (error) {
      }
    });
  }

  // Événements généraux
  const allHandlers = eventHandlers.get('*');
  if (allHandlers) {
    allHandlers.forEach(handler => {
      try {
        handler(data);
      } catch (error) {
      }
    });
  }
};

// S'abonner à un type d'événement
export const onWebSocketEvent = (eventType: string, handler: (data: any) => void) => {
  if (!eventHandlers.has(eventType)) {
    eventHandlers.set(eventType, new Set());
  }
  eventHandlers.get(eventType)!.add(handler);

  // Retourner une fonction pour se désabonner
  return () => {
    const handlers = eventHandlers.get(eventType);
    if (handlers) {
      handlers.delete(handler);
      if (handlers.size === 0) {
        eventHandlers.delete(eventType);
      }
    }
  };
};

// Envoyer un message via WebSocket
export const sendWebSocketMessage = (data: any) => {
  if (ws?.readyState === WebSocket.OPEN) {
    ws.send(JSON.stringify(data));
  } else {
  }
};

// Vérifier si le WebSocket est connecté
export const isWebSocketConnected = () => {
  return ws?.readyState === WebSocket.OPEN;
};

