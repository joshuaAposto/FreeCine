const express = require('express');
const path = require('path');
const rateLimit = require('express-rate-limit');
const morgan = require('morgan');
const fs = require('fs').promises;
const app = express();


const DB_PATH = path.join(__dirname, 'db.json');

async function readDB() {
    try {
        const data = await fs.readFile(DB_PATH, 'utf8');
        return JSON.parse(data);
    } catch (error) {
        await fs.writeFile(DB_PATH, JSON.stringify({ downloadCount: 0 }));
        return { downloadCount: 0 };
    }
}

async function updateDB(data) {
    await fs.writeFile(DB_PATH, JSON.stringify(data, null, 2));
}

app.use(morgan('combined'));

const limiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 100
});

app.use('/download', limiter);
app.use(express.static('public'));

app.get('/api/downloads', async (req, res) => {
    try {
        const db = await readDB();
        res.json({ count: db.downloadCount });
    } catch (error) {
        console.error('Error reading download count:', error);
        res.status(500).json({ error: 'Failed to get download count' });
    }
});

app.get('/download', async (req, res) => {
    const file = path.join(__dirname, 'public/uploads/FreeCine MOD_V4.0.0.apk');
    
    try {
        const db = await readDB();
        db.downloadCount += 1;
        await updateDB(db);
        
        try {
            await fs.access(file);
        } catch {
            return res.status(404).send('APK file not found');
        }
        
        res.download(file, 'FreeCine MOD_V4.0.0.apk');
    } catch (error) {
        console.error('Download error:', error);
        res.status(500).send('Error processing download');
    }
});

app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));