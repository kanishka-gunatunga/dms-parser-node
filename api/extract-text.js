// /api/extract-text.js
const multer = require('multer');
const pdfParse = require('pdf-parse');
const mammoth = require('mammoth');
const xlsx = require('xlsx');
const officeParser = require('officeparser');

const upload = multer({ storage: multer.memoryStorage() });

module.exports = async (req, res) => {
  if (req.method !== 'POST') return res.status(405).send('Method Not Allowed');

  upload.single('document')(req, res, async (err) => {
    if (err) return res.status(400).send('File upload error: ' + err.message);
    if (!req.file) return res.status(400).send('No file uploaded.');

    const file = req.file;
    const ext = file.originalname.split('.').pop().toLowerCase();
    let content = "", pageCount = 0;

    try {
      switch (ext) {
        case 'pdf':
          const pdfData = await pdfParse(file.buffer);
          content = pdfData.text.replace(/\s+/g, ' ').trim();
          pageCount = pdfData.numpages;
          break;
        case 'docx':
          const docx = await mammoth.extractRawText({ buffer: file.buffer });
          content = docx.value.replace(/\s+/g, ' ').trim();
          break;
        case 'xlsx':
          const wb = xlsx.read(file.buffer, { type: 'buffer' });
          content = wb.SheetNames.map(name => xlsx.utils.sheet_to_csv(wb.Sheets[name])).join('\n').replace(/\s+/g, ' ').trim();
          pageCount = wb.SheetNames.length;
          break;
        case 'txt':
          content = file.buffer.toString('utf8').replace(/\s+/g, ' ').trim();
          break;
        default:
          return res.json({ content: "", pageCount: 0 });
      }

      res.json({ content, pageCount });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'Error processing file' });
    }
  });
};
