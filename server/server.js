import express from 'express';
import cors from 'cors';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { createServer } from 'http';
import { WebSocketServer } from 'ws';
import { setBroadcastFunction } from './utils/broadcast.js';
import { initializeData } from './utils/storage.js';

// Routes
import authRoutes from './routes/auth.js';
import usersRoutes from './routes/users.js';
import filesRoutes from './routes/files.js';
import activityRoutes from './routes/activity.js';
import notificationsRoutes from './routes/notifications.js';
import calendarRoutes from './routes/calendar.js';
import notesRoutes from './routes/notes.js';
import tasksRoutes from './routes/tasks.js';
import boardsRoutes from './routes/boards.js';
import contactsRoutes from './routes/contacts.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors({
  origin: 'http://localhost:5173', // Vite dev server
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Dossier pour stocker les fichiers uploadés
app.use('/uploads', express.static(join(__dirname, 'data', 'uploads')));

// Routes API
app.use('/api/auth', authRoutes);
app.use('/api/users', usersRoutes);
app.use('/api/files', filesRoutes);
app.use('/api/activity', activityRoutes);
app.use('/api/notifications', notificationsRoutes);
app.use('/api/calendar', calendarRoutes);
app.use('/api/notes', notesRoutes);
app.use('/api/tasks', tasksRoutes);
app.use('/api/boards', boardsRoutes);
app.use('/api/contacts', contactsRoutes);

// Route de santé
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'Backend is running' });
});

// Créer le serveur HTTP
const server = createServer(app);

// WebSocket pour la collaboration en temps réel
const wss = new WebSocketServer({ server });

// Gérer les connexions WebSocket
const clients = new Map();

wss.on('connection', (ws, req) => {
  const userId = new URL(req.url, 'http://localhost').searchParams.get('userId');
  
  if (userId) {
    clients.set(userId, ws);
    // Notifier les autres clients
    broadcast({ type: 'user_connected', userId }, userId);
  }

  ws.on('message', (message) => {
    try {
      const data = JSON.parse(message.toString());
      
      // Diffuser le message à tous les autres clients
      broadcast(data, userId);
    } catch (error) {
    }
  });

  ws.on('close', () => {
    if (userId) {
      clients.delete(userId);
      broadcast({ type: 'user_disconnected', userId }, userId);
    }
  });

  ws.on('error', (error) => {
  });
});

// Fonction pour diffuser un message à tous les clients sauf l'expéditeur
function broadcast(data, excludeUserId) {
  clients.forEach((ws, userId) => {
    if (userId !== excludeUserId && ws.readyState === 1) {
      ws.send(JSON.stringify(data));
    }
  });
}

// Exporter la fonction broadcast pour les routes
setBroadcastFunction(broadcast);

// Initialiser les données au démarrage (asynchrone)
initializeData().catch(err => {
});

// Démarrer le serveur
server.listen(PORT, () => {
});

export { wss };

