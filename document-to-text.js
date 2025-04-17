const express = require('express');
const multer = require('multer');
const fs = require('fs').promises;
const pdfParse = require('pdf-parse');
const mammoth = require('mammoth');
const xlsx = require('xlsx');
const officeParser = require('officeparser');

const app = express();
const port = 3001;

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'uploads/'); 
    },
    filename: (req, file, cb) => {
        cb(null, file.originalname);
    }
});

const upload = multer({ storage: storage });

app.post('/extract-text', upload.single('document'), async (req, res) => {
    if (!req.file) {
        return res.status(400).send('No file uploaded.');
    }

    const filePath = req.file.path;
    const fileExtension = req.file.originalname.split('.').pop().toLowerCase();
    let content = {};

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
                return json(content);
        }
        res.json(content);
    } catch (error) {
        console.error('Error processing file:', error);
        res.status(500).json({}); 
    } finally {
        fs.unlink(filePath); 
    }
});

app.listen(port, () => {
    console.log(`Node.js server listening at http://localhost:${port}`);
});