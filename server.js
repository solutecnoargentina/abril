const express = require('express');
const path = require('path');
const { initDatabase } = require('./src/db/init');
const apiRoutes = require('./src/routes/api');
const whatsappService = require('./src/services/whatsappService');

const app = express();
const PORT = 3000;

initDatabase();

app.use(express.json({ limit: '2mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

app.use('/api', apiRoutes);

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(PORT, async () => {
  console.log(`Servidor iniciado en http://0.0.0.0:${PORT}`);
  try {
    await whatsappService.initialize();
  } catch (err) {
    console.error('Error iniciando WhatsApp:', err.message);
  }
});
