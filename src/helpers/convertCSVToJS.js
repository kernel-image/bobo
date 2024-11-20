/* script to parse csv output from osenaudio region metadata to create a map for parsing audio sprites */

const fs = require('fs');
const csv = require('csv-parser');

const csvFile = process.argv[2]; //'path/to/your/csv/file.csv';
const fileName = csvFile.split('/').pop().split('.').shift();
const data = {};
const result = [];

console.log(`Processing CSV file: ${csvFile}`);
console.log(`Output file: ${fileName}.mjs`);

fs.createReadStream(csvFile)
  .pipe(csv({headers:false}))
  .on('data', (data) => {
    result.push(data);
  })
  .on('end', () => {
    console.log(result);
    for (let i = 0; i < result.length; i++) {
        console.log(result[i]);
        const row = result[i];
        const key = row[2];
        const value1 = row[0];
        const value2 = row[1];
        const time1 = parseTime(value1);
        const time2 = parseTime(value2);
        const tuple = [time1, time2-time1];

        data[key] = tuple;
    }
    console.log(data);
    console.log('CSV file successfully processed');

    writeDataToFile(data, fileName);
  });

function parseTime(timeStr) {
  console.log(timeStr);
  if (!timeStr) {
    return -1;
  }
  const [hours, minutes, seconds, milliseconds] = timeStr.split(/[:.]/);
  const timeInMs = (parseInt(hours) * 3600 * 1000) +
    (parseInt(minutes) * 60 * 1000) +
    (parseInt(seconds) * 1000) +
    parseInt(milliseconds);
  return timeInMs;
}


function writeDataToFile(data, fileName) {
    const output = `export const spritemap = ${JSON.stringify(data, null, 2).replace(/"/g, "")};`
    fs.writeFile(`${fileName}.js`, output, (err) => {
      if (err) {
        console.error(err)
      } else {
        console.log('file generated successfully')
      }
    })
}
