const multer = require('multer');
const fs = require('fs').promises;
const pdfParse = require('pdf-parse');
const mammoth = require('mammoth');
const xlsx = require('xlsx');
const officeParser = require('officeparser');

// Configure multer memory storage (no disk storage on Vercel)
const upload = multer({ storage: multer.memoryStorage() });

module.exports = async (req, res) => {
  if (req.method !== 'POST') {
    return res.status(405).send('Method Not Allowed');
  }

  // We'll handle the file processing in a separate function
  const processFile = (file) => {
    return new Promise(async (resolve, reject) => {
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
            const pptxText = await officeParser.parseOfficeAsync(file.buffer);
            content[1] = pptxText.replace(/\s+/g, ' ').trim();
            break;
          case 'txt':
            content[1] = file.buffer.toString('utf8').replace(/\s+/g, ' ').trim();
            break;
          default:
            return resolve(content);
        }
        resolve(content);
      } catch (error) {
        reject(error);
      }
    });
  };

  // Use multer to handle the file upload
  upload.single('document')(req, res, async (err) => {
    if (err) {
      return res.status(400).send('File upload error: ' + err.message);
    }

    if (!req.file) {
      return res.status(400).send('No file uploaded.');
    }

    try {
      const content = await processFile(req.file);
      res.json(content);
    } catch (error) {
      console.error('Error processing file:', error);
      res.status(500).json({ error: 'Error processing file' });
    }
  });
};