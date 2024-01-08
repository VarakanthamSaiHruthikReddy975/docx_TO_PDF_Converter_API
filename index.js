const express = require('express');
const bodyParser = require('body-parser');
const multer = require('multer');
const fs = require('fs');
const libre = require('libreoffice-convert');

const app = express();
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(express.static('uploads'));

// Configure multer for file uploads
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'uploads/');
    },
    filename: (req, file, cb) => {
        cb(null, Date.now() + '-' + file.originalname);
    }
});

const upload = multer({ storage: storage });

// Serve the HTML page
app.get('/', (req, res) => {
    res.sendFile(__dirname + '/index.html');
});

// Handle the file upload and conversion
app.post('/docxtopdf', upload.single('file'), (req, res) => {
    if (!req.file) {
        return res.status(400).send('No file uploaded.');
    }

    const file = fs.readFileSync(req.file.path);
    libre.convert(file, '.pdf', undefined, (err, done) => {
        if (err) {
            console.error(`Error converting file: ${err}`);
            res.status(500).send('Internal Server Error');
            return;
        }

        const outputFilePath = `uploads/${Date.now()}-converted.pdf`;
        fs.writeFileSync(outputFilePath, done);

        res.download(outputFilePath, (err) => {
            if (err) {
                console.error(err);
                res.status(500).send('Error sending the file.');
            }
            fs.unlinkSync(req.file.path); // Delete the original file
            fs.unlinkSync(outputFilePath); // Delete the converted file
        });
    });
});

// Start the server
const port = 9000;
app.listen(port, () => {
    console.log(`Server is listening on port ${port}`);
});
