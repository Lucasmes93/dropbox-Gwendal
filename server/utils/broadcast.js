// Utilitaire pour diffuser des messages via WebSocket
// Évite les imports circulaires

let broadcastFunction = null;

export const setBroadcastFunction = (fn) => {
  broadcastFunction = fn;
};

export const broadcast = (data, excludeUserId = null) => {
  if (broadcastFunction) {
    broadcastFunction(data, excludeUserId);
  }
};

