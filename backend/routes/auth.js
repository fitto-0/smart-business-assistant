/**
 * Routes d'authentification — connectées à PostgreSQL
 * Import adapté à VOTRE config/db.js (Pool)
 */
const router = require('express').Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const pool = require('../config/db');
const query = (text, params) => pool.query(text, params);

const JWT_SECRET = process.env.JWT_SECRET || 'sba_secret_key_2024';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '24h';

const generateToken = (user) =>
  jwt.sign({ id: user.id, email: user.email, role: user.role }, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });

// POST /api/auth/register
router.post('/register', async (req, res) => {
  try {
    const { name, email, password, company } = req.body;

    if (!name || !email || !password) return res.status(400).json({ error: 'Champs requis manquants' });
    if (password.length < 6) return res.status(400).json({ error: 'Mot de passe trop court (6+ caractères)' });
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return res.status(400).json({ error: 'Email invalide' });

    const existing = await query('SELECT id FROM users WHERE email = $1', [email.toLowerCase()]);
    if (existing.rowCount > 0) return res.status(400).json({ error: 'Cet email est déjà utilisé' });

    const hashedPassword = await bcrypt.hash(password, 10);
    const result = await query(
      `INSERT INTO users (name, email, password_hash, company, role)
       VALUES ($1, $2, $3, $4, 'user')
       RETURNING id, name, email, company, role, created_at`,
      [name, email.toLowerCase(), hashedPassword, company || '']
    );

    const user = result.rows[0];
    const token = generateToken(user);

    res.status(201).json({
      message: 'Compte créé avec succès',
      token,
      user: { id: user.id, name: user.name, email: user.email, company: user.company, role: user.role },
    });
  } catch (err) {
    console.error('Erreur register:', err);
    res.status(500).json({ error: 'Erreur serveur lors de l\'inscription' });
  }
});

// POST /api/auth/login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ error: 'Email et mot de passe requis' });

    const result = await query(
      'SELECT id, name, email, password_hash, company, role FROM users WHERE email = $1',
      [email.toLowerCase()]
    );

    if (result.rowCount === 0) return res.status(401).json({ error: 'Email ou mot de passe incorrect' });

    const user = result.rows[0];
    const valid = await bcrypt.compare(password, user.password_hash);
    if (!valid) return res.status(401).json({ error: 'Email ou mot de passe incorrect' });

    res.json({
      token: generateToken(user),
      user: { id: user.id, name: user.name, email: user.email, company: user.company, role: user.role },
    });
  } catch (err) {
    console.error('Erreur login:', err);
    res.status(500).json({ error: 'Erreur serveur lors de la connexion' });
  }
});

// GET /api/auth/me
router.get('/me', require('../middleware/auth'), async (req, res) => {
  try {
    const result = await query(
      'SELECT id, name, email, company, role, avatar_url, created_at FROM users WHERE id = $1',
      [req.user.id]
    );
    if (result.rowCount === 0) return res.status(404).json({ error: 'Utilisateur non trouvé' });
    const u = result.rows[0];
    res.json({ id: u.id, name: u.name, email: u.email, company: u.company, role: u.role, createdAt: u.created_at });
  } catch (err) {
    console.error('Erreur /me:', err);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// PUT /api/auth/profile
router.put('/profile', require('../middleware/auth'), async (req, res) => {
  try {
    const { name, company } = req.body;
    if (!name) return res.status(400).json({ error: 'Le nom est requis' });

    const result = await query(
      `UPDATE users SET name = $1, company = $2 WHERE id = $3
       RETURNING id, name, email, company, role`,
      [name, company || '', req.user.id]
    );
    res.json({ message: 'Profil mis à jour', user: result.rows[0] });
  } catch (err) {
    console.error('Erreur update profile:', err);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

module.exports = router;