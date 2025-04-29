
const express = require('express');
const extractTextRoute = require('./api/extract-text');
const anotherRoute = require('./api/another-route'); 
const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());

app.post('/api/extract-text', extractTextRoute);
app.post('/api/extract-text-pages', anotherRoute); 

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
