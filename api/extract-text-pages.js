const multer = require('multer');
const pdfParse = require('pdf-parse');
const mammoth = require('mammoth');
const xlsx = require('xlsx');
const officeParser = require('officeparser');

const upload = multer({ storage: multer.memoryStorage() });

module.exports = async (req, res) => {
  if (req.method !== 'POST') {
    return res.status(405).send('Method Not Allowed');
  }

  upload.single('document')(req, res, async (err) => {
    if (err) {
      return res.status(400).send('File upload error: ' + err.message);
    }

    if (!req.file) {
      return res.status(400).send('No file uploaded.');
    }

    const file = req.file;
    const fileExtension = file.originalname.split('.').pop().toLowerCase();
    let content = {};

    try {
      return 123;
    } catch (error) {
      console.error('Error processing file:', error);
      res.status(500).json({ error: 'Error processing file' });
    }
  });
};
