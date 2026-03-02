const express = require('express');
const path = require('path');
const app = express();
const PORT = 3000;

// Pour servir les fichiers statiques du front
app.use(express.static(path.join(__dirname, 'frontend')));

// Route de test si tu veux
app.get('/api/hello', (req, res) => {
  res.json({ message: 'Hello depuis Express !' });
});

// Démarrer le serveur
app.listen(PORT, () => {
  console.log(`Serveur lancé sur http://localhost:${PORT}`);
});
