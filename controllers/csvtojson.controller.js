const fs = require('fs');
const csv = require('fast-csv');
const db = require('../config/db');
require('dotenv').config();


async function processCSV() {
  const AGE_GROUPS = {
  '<20': 0,
  '20-40': 0,
  '40-60': 0,
  '>60': 0
};
  return new Promise((resolve, reject) => {
    try {
      const stream = fs.createReadStream(process.env.CSV_FILE_PATH);
      const rows = [];

      csv.parseStream(stream, { headers: true })
        .on('error', (err) => {
          console.error('CSV parsing error:', err);
          reject(err);
        })
        .on('data', (row) => {
          rows.push(row);
        })
        .on('end', async () => {
          try {
            for (const row of rows) {
              const { ['name.firstName']: firstName, ['name.lastName']: lastName, age, ...rest } = row;

              const ageNum = parseInt(age, 10);
              if (isNaN(ageNum)) {
                console.warn(`Invalid age found, skipping row: ${JSON.stringify(row)}`);
                continue;
              }

              const name = `${firstName} ${lastName}`;
              const address = {};
              const additionalInfo = {};

              Object.entries(rest).forEach(([key, value]) => {
                if (key.startsWith('address.')) {
                  address[key.replace('address.', '')] = value;
                } else {
                  additionalInfo[key] = value;
                }
              });

              try {
                await db.query(
                  `INSERT INTO users (name, age, address, additional_info)
                   VALUES ($1, $2, $3, $4)`,
                  [name, ageNum, JSON.stringify(address), JSON.stringify(additionalInfo)]
                );
              } catch (dbErr) {
                console.error(`DB insert error for row ${JSON.stringify(row)}:`, dbErr);
                continue; // Skip this row and continue with the next
              }

              if (ageNum < 20) AGE_GROUPS['<20']++;
              else if (ageNum <= 40) AGE_GROUPS['20-40']++;
              else if (ageNum <= 60) AGE_GROUPS['40-60']++;
              else AGE_GROUPS['>60']++;
            }

            const total = rows.length;
            console.log('\nAge-Group % Distribution');
            for (const group in AGE_GROUPS) {
              const percentage = ((AGE_GROUPS[group] / total) * 100).toFixed(2);
              console.log(`${group} ${percentage}%`);
            }

            resolve();
          } catch (processingError) {
            console.error('Error processing rows:', processingError);
            reject(processingError);
          }
        });
    } catch (streamError) {
      console.error('Failed to read CSV stream:', streamError);
      reject(streamError);
    }
  });
}

module.exports = { processCSV };
