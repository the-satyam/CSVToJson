const express = require('express');
const { processCSV } = require('./controllers/csvtojson.controller');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

app.get('/dumpcsvtodb', async (req, res) => {
  try {
    await processCSV();
    res.send('CSV processed and data uploaded.');
  } catch (err) {
    console.error(err);
    res.status(500).send('Failed to process CSV.');
  }
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
