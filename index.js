const express = require('express');
const path = require('path');
const morgan = require('morgan');
const fs = require('fs').promises;
const app = express();

app.use(morgan('combined'));

app.use(express.static('public'));

app.get('/api/downloads', (req, res) => {
    res.json({ count: '1.2 million' }); 
});

app.get('/download', (req, res) => {
    const file = path.join(__dirname, 'public/uploads/FreeCine MOD_V4.0.0.apk');

    fs.access(file)
        .then(() => {
            res.download(file, 'FreeCine MOD_V4.0.0.apk');
        })
        .catch(() => {
            res.status(404).send('APK file not found');
        });
});

app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
