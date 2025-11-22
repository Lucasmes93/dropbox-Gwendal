// Utilitaires d'authentification

import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';

const JWT_SECRET = process.env.JWT_SECRET || 'demo-secret-key-change-in-production';
const JWT_EXPIRES_IN = '7d';

// Générer un token JWT
export const generateToken = (user) => {
  return jwt.sign(
    {
      id: user.id,
      email: user.email,
      role: user.role,
    },
    JWT_SECRET,
    { expiresIn: JWT_EXPIRES_IN }
  );
};

// Vérifier un token JWT
export const verifyToken = (token) => {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch (error) {
    return null;
  }
};

// Hasher un mot de passe
export const hashPassword = async (password) => {
  return await bcrypt.hash(password, 10);
};

// Vérifier un mot de passe
export const comparePassword = async (password, hash) => {
  return await bcrypt.compare(password, hash);
};

// Middleware pour vérifier l'authentification
export const authenticate = (req, res, next) => {
  const token = req.headers.authorization?.replace('Bearer ', '');
  
  if (!token) {
    return res.status(401).json({ error: 'Token manquant' });
  }

  const decoded = verifyToken(token);
  
  if (!decoded) {
    return res.status(401).json({ error: 'Token invalide' });
  }

  req.user = decoded;
  next();
};

// Middleware pour vérifier si l'utilisateur est admin
export const isAdmin = (req, res, next) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Accès refusé. Administrateur requis.' });
  }
  next();
};

