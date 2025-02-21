const express = require('express');
const path = require('path');
const rateLimit = require('express-rate-limit');
const morgan = require('morgan');
const sqlite3 = require('sqlite3').verbose();
const fs = require('fs').promises;
const app = express();

const DB_PATH = path.join(__dirname, 'downloads.sqlite');

const db = new sqlite3.Database(DB_PATH, (err) => {
    if (err) {
        console.error('Error opening database:', err.message);
    } else {
        db.run(`CREATE TABLE IF NOT EXISTS downloads (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            count INTEGER DEFAULT 0
        )`, (err) => {
            if (err) {
                console.error('Error creating table:', err.message);
            } else {
                db.get(`SELECT count FROM downloads WHERE id = 1`, [], (err, row) => {
                    if (!row) {
                        db.run(`INSERT INTO downloads (id, count) VALUES (1, 0)`);
                    }
                });
            }
        });

        db.run(`CREATE TABLE IF NOT EXISTS user_downloads (
            user_ip TEXT,
            downloaded BOOLEAN DEFAULT 0
        )`);
    }
});

app.use(morgan('combined'));

const limiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 100
});

app.use('/download', limiter);
app.use(express.static('public'));

app.get('/api/downloads', (req, res) => {
    db.get(`SELECT count FROM downloads WHERE id = 1`, [], (err, row) => {
        if (err) {
            console.error('Error reading download count:', err);
            return res.status(500).json({ error: 'Failed to get download count' });
        }
        res.json({ count: row.count });
    });
});

app.get('/download', (req, res) => {
    const userIp = req.ip;

    db.get(`SELECT downloaded FROM user_downloads WHERE user_ip = ?`, [userIp], (err, row) => {
        if (err) {
            console.error('Error checking download status:', err);
            return res.status(500).send('Error processing download');
        }

        if (!row || row.downloaded === 0) {
            db.run(`INSERT INTO user_downloads (user_ip, downloaded) VALUES (?, 1)`, [userIp], (err) => {
                if (err) {
                    console.error('Error recording download:', err);
                } else {
                    db.run(`UPDATE downloads SET count = count + 1 WHERE id = 1`, (err) => {
                        if (err) {
                            console.error('Error updating download count:', err);
                            return res.status(500).send('Error processing download');
                        }
                    });
                }
            });
        }

        const file = path.join(__dirname, 'public/uploads/FreeCine MOD_V4.0.0.apk');

        fs.access(file)
            .then(() => {
                res.download(file, 'FreeCine MOD_V4.0.0.apk');
            })
            .catch(() => {
                res.status(404).send('APK file not found');
            });
    });
});

app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
