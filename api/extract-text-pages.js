const multer = require('multer');
const fs = require('fs').promises;
const pdfParse = require('pdf-parse');
const mammoth = require('mammoth');
const xlsx = require('xlsx');
const officeParser = require('officeparser');

const upload = multer({ storage: multer.memoryStorage() });

module.exports = async (req, res) => {
  if (req.method !== 'POST') {
    return res.status(405).send('Method Not Allowed');
  }

  const processFile = (file) => {
    return new Promise(async (resolve, reject) => {
      const fileExtension = file.originalname.split('.').pop().toLowerCase();
      let fullContent = "";
      let pageCount = 0;

      try {
        switch (fileExtension) {
          case 'pdf':
           const dataBuffer = await fs.readFile(filePath);
            const pdfData = await pdfParse(dataBuffer);
            let pages = pdfData.text.split('\n\n');
            if (pages[0] === '') {
                pages = pages.slice(1);
            }
        
            pages.forEach((page, index) => {
                content[index + 1] = page.replace(/\s+/g, ' ').trim();
            });
            break;
            
          case 'docx':
            const docxBuffer = await fs.readFile(filePath);
            const docxResult = await mammoth.extractRawText({ buffer: docxBuffer });
            const docxText = docxResult.value;
            
            const docxSections = docxText.replace(/\n{2,}/g, '\n').split('\n');
            
            docxSections.forEach((section, index) => {
                content[index + 1] = section.replace(/\s+/g, ' ').trim();
            });
            break;
            
          case 'xlsx':
            const workbook = xlsx.readFile(filePath);
            workbook.SheetNames.forEach((sheetName, sheetIndex) => {
                const sheet = workbook.Sheets[sheetName];
                const sheetData = xlsx.utils.sheet_to_csv(sheet);
                content[sheetIndex + 1] = sheetData.replace(/\s+/g, ' ').trim();
            });
            break;
            
          case 'pptx':
           const pptxText = await officeParser.parseOfficeAsync(filePath);
            content[1] = pptxText.replace(/\s+/g, ' ').trim();
            break;
            
          case 'txt':
            const txtContent = await fs.readFile(filePath, 'utf8');
            content[1] = txtContent.replace(/\s+/g, ' ').trim();
            break;
            
          default:
            return resolve({ content: fullContent, pageCount: 0 });
        }
        resolve({ content: fullContent, pageCount });
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