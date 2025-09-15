
const express = require('express');
const extractTextRoute = require('./api/extract-text');
const extractTextPagesRoute = require('./api/extract-text-pages'); 
const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());

app.post('/api/extract-text', extractTextPagesRoute);
app.post('/api/extract-text-pages', extractTextPagesRoute); 

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
