const express = require('express');
const path = require('path');
const { spawn } = require('child_process');
const fs = require('fs');
const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(express.static('public'));

// Owner number save کرنے کا API
app.post('/save-owner', (req, res) => {
    const { number } = req.body;
    if (!number) return res.status(400).json({ error: 'Number chahiye' });
    fs.writeFileSync('./owner.json', JSON.stringify({ number }));
    res.json({ success: true, message: 'Owner saved ✅' });
});

// Index page
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(PORT, () => {
    console.log(`Server running on ${PORT}`);
    // Bot start karo
    spawn('node', ['index.js'], { stdio: 'inherit' });
});
