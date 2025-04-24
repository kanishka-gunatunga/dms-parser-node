// /api/extract-text-pages.js
const multer = require('multer');
const pdfParse = require('pdf-parse');
const mammoth = require('mammoth');
const xlsx = require('xlsx');

const upload = multer({ storage: multer.memoryStorage() });

module.exports = async (req, res) => {
  if (req.method !== 'POST') return res.status(405).send('Method Not Allowed');

  upload.single('document')(req, res, async (err) => {
    if (err) return res.status(400).send('File upload error: ' + err.message);
    if (!req.file) return res.status(400).send('No file uploaded.');

    const file = req.file;
    const ext = file.originalname.split('.').pop().toLowerCase();
    let content = {};

    try {
      switch (ext) {
        case 'pdf':
          const pdfData = await pdfParse(file.buffer);
          const pages = pdfData.text.split('\n\n').filter(p => p.trim() !== '');
          pages.forEach((p, i) => {
            content[i + 1] = p.replace(/\s+/g, ' ').trim();
          });
          break;
        case 'docx':
          const docx = await mammoth.extractRawText({ buffer: file.buffer });
          const docxPages = docx.value.replace(/\n{2,}/g, '\n').split('\n');
          docxPages.forEach((p, i) => {
            content[i + 1] = p.replace(/\s+/g, ' ').trim();
          });
          break;
        case 'xlsx':
          const wb = xlsx.read(file.buffer, { type: 'buffer' });
          wb.SheetNames.forEach((sheet, i) => {
            const csv = xlsx.utils.sheet_to_csv(wb.Sheets[sheet]);
            content[i + 1] = csv.replace(/\s+/g, ' ').trim();
          });
          break;
        case 'txt':
          const txt = file.buffer.toString('utf8');
          content[1] = txt.replace(/\s+/g, ' ').trim();
          break;
        default:
          return res.json(content);
      }

      res.json(content);
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'Error processing file' });
    }
  });
};
