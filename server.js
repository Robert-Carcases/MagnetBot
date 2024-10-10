import express from 'express';
import WebTorrent from 'webtorrent';
import path from 'path';
import fs from 'fs';

const app = express();
const client = new WebTorrent();

app.use(express.json());

// POST endpoint to download the torrent file
app.post('/api/download', (req, res) => {
    const { url } = req.body;

    if (!url) {
        return res.status(400).json({ message: 'No URL provided' });
    }

    console.log(`Received URL: ${url}`);

    // Add the torrent to WebTorrent
    client.add(url, { path: path.join(process.cwd(), 'downloads') }, (torrent) => {
        console.log(`Torrent infoHash: ${torrent.infoHash}`);

        torrent.on('download', (bytes) => {
            console.log(`Downloaded: ${bytes} bytes`);
            console.log(`Progress: ${(torrent.progress * 100).toFixed(1)}%`);
        });

        torrent.on('done', () => {
            console.log('Torrent download finished');
            // Stop seeding by destroying the torrent
            torrent.destroy(err => {
                if (err) {
                    console.error(`Error destroying torrent: ${err.message}`);
                } else {
                    console.log(`Torrent ${torrent.infoHash} has been destroyed and seeding stopped.`);
                }
            });
            res.status(200).json({ message: 'Torrent download finished successfully' });
        });

        torrent.on('error', (err) => {
            console.error(`Error downloading torrent: ${err.message}`);
            res.status(500).json({ message: 'Error downloading torrent' });
        });
    });
});

// Create downloads folder if not exists
const downloadsDir = path.join(process.cwd(), 'downloads');
if (!fs.existsSync(downloadsDir)) {
    fs.mkdirSync(downloadsDir);
}

app.listen(3000, () => {
    console.log('API running on http://localhost:3000');
});
