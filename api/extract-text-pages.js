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
      switch (fileExtension) {
        case 'pdf':
          const pdfData = await pdfParse(file.buffer);
          let pages = pdfData.text.split('\n\n');
          if (pages[0] === '') {
            pages = pages.slice(1);
          }
          pages.forEach((page, index) => {
            content[index + 1] = page.replace(/\s+/g, ' ').trim();
          });
          break;

        case 'docx':
          const docxResult = await mammoth.extractRawText({ buffer: file.buffer });
          const docxText = docxResult.value;
          const docxSections = docxText.replace(/\n{2,}/g, '\n').split('\n');
          docxSections.forEach((section, index) => {
            content[index + 1] = section.replace(/\s+/g, ' ').trim();
          });
          break;

        case 'xlsx':
          const workbook = xlsx.read(file.buffer, { type: 'buffer' });
          workbook.SheetNames.forEach((sheetName, sheetIndex) => {
            const sheet = workbook.Sheets[sheetName];
            const sheetData = xlsx.utils.sheet_to_csv(sheet);
            content[sheetIndex + 1] = sheetData.replace(/\s+/g, ' ').trim();
          });
          break;

        case 'pptx':
           res.json(content);
        
        case 'txt':
          const txtText = file.buffer.toString('utf-8');
          content[1] = txtText.replace(/\s+/g, ' ').trim();
          break;

        default:
          res.json(content);
      }

      res.json(content);
    } catch (error) {
      console.error('Error processing file:', error);
      res.status(500).json({ error: 'Error processing file' });
    }
  });
};
