const http = require('http');
const fs = require('fs');
const path = require('path');
const { parse } = require('node-html-parser');
const express = require('express');
const readline = require('readline');
const app = express();

const bodyParser = require('body-parser');


app.use(bodyParser.json());

// 1.1
function readIndexFile(callback) {
  const indexFilePath = path.join(__dirname, 'index.html');
  fs.readFile(indexFilePath, 'utf8', (err, data) => {
    if (err) {
      callback(err, null);
      return;
    }
    callback(null, data);
  });
}

// 1.2
function countImgTagsInHtmlFiles(callback) {
  const htmlFilesDirPath = path.join(__dirname, 'html_files');
  fs.readdir(htmlFilesDirPath, (err, files) => {
    if (err) {
      callback(err, null);
      return;
    }

    const imgTagCounts = [];
    files.forEach(file => {
      const filePath = path.join(htmlFilesDirPath, file);
      if (path.extname(file) === '.html') {
        fs.readFile(filePath, 'utf8', (err, data) => {
          if (err) {
            callback(err, null);
            return;
          }
          
          const root = parse(data);
          const imgTags = root.querySelectorAll('img');
          imgTagCounts.push({ file: file, count: imgTags.length });
          
          if (imgTagCounts.length === files.length) {
            callback(null, imgTagCounts);
          }
        });
      }
    });
  });
}

// Create a Node.js server
app.get('/', (req, res) => {
  readIndexFile((err, data) => {
    if (err) {
      res.status(500).send('Internal Server Error');
      return;
    }
    res.status(200).send(data);
  });
});

// Endpoint to count <img> tags in HTML files
app.get('/count-img-tags', (req, res) => {
  countImgTagsInHtmlFiles((err, imgTagCounts) => {
    if (err) {
      res.status(500).send('Internal Server Error');
      return;
    }
    res.status(200).json(imgTagCounts);
  });
});


// 2.1
app.get('/generate-basic-html', (req, res) => {
  const htmlContent = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>New Page</title>
    </head>
    <body>
      <h1>Hello, World!</h1>
      <p>This is a basic HTML file generated dynamically.</p>
    </body>
    </html>
  `;

  const filePath = path.join(__dirname, 'new_page.html');
  fs.writeFile(filePath, htmlContent, (err) => {
    if (err) {
      console.error('Error writing file:', err);
      res.status(500).send('Internal Server Error');
      return;
    }
    res.sendFile(filePath);
  });
});

// 2.2 on postman http://localhost:3000/generate-multiple-html?numberOfFiles=5 or localhost http://localhost:3000/generate-multiple-html?numberOfFiles=1
app.get('/generate-multiple-html', (req, res) => {
  const { numberOfFiles } = req.query;
  if (!numberOfFiles || isNaN(numberOfFiles) || numberOfFiles <= 0) {
    return res.status(400).send('Invalid number of files. Please provide a valid number.');
  }

  for (let i = 1; i <= numberOfFiles; i++) {
    const htmlContent = `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>File ${i}</title>
      </head>
      <body>
        <h1>File ${i}</h1>
        <p>This is file ${i} content.</p>
      </body>
      </html>
    `;

    const fileName = `file_${i}.html`;
    const filePath = path.join(__dirname, fileName);
    fs.writeFileSync(filePath, htmlContent);
  }

  res.status(200).send(`${numberOfFiles} HTML files generated successfully!`);
});

//3 in raw postman {"keyword": "old_text","replacement": "new_text"}

app.put('/update-html', (req, res) => {
  const { keyword, replacement } = req.body;
  const filePath = 'about.html';

  fs.readFile(filePath, 'utf8', (err, data) => {
    if (err) {
      console.error('Error reading file:', err);
      res.status(500).send('Internal Server Error');
      return;
    }

    // Perform the replacement
    const updatedContent = data.replace(new RegExp(keyword, 'g'), replacement);

    // Write the updated content back to the file
    fs.writeFile(filePath, updatedContent, 'utf8', (err) => {
      if (err) {
        console.error('Error writing file:', err);
        res.status(500).send('Internal Server Error');
        return;
      }
      console.log(`File ${filePath} updated successfully.`);
      res.status(200).send('File updated successfully.');
    });
  });
});


//4
const filePath = 'obsolete_page.html';

// Endpoint to delete the HTML file
app.delete('/delete-html', (req, res) => {
  fs.unlink(filePath, (err) => {
    if (err) {
      console.error('Error deleting file:', err);
      res.status(500).send('Internal Server Error');
      return;
    }
    console.log(`File ${filePath} deleted successfully.`);
    res.status(200).send(`File ${filePath} deleted successfully.`);
  });
});


//5.1
app.put('/rename-single-file', (req, res) => {
  const oldFilePath = 'about.html';
  const newFilePath = 'about1.html';

  fs.rename(oldFilePath, newFilePath, (err) => {
    if (err) {
      console.error('Error renaming file:', err);
      res.status(500).send('Internal Server Error');
      return;
    }
    console.log(`File ${oldFilePath} renamed to ${newFilePath} successfully.`);
    res.status(200).send('File renamed successfully.');
  });
});

// 5.2 give folder name
app.put('/rename-multiple-files', (req, res) => {
  const htmlBackupDir = 'html_files';

  fs.readdir(htmlBackupDir, (err, files) => {
    if (err) {
      console.error('Error reading directory:', err);
      res.status(500).send('Internal Server Error');
      return;
    }

    files.forEach((file) => {
      const filePath = path.join(htmlBackupDir, file);
      const timestamp = Date.now();
      const newFileName = `${file}_${timestamp}.html`;

      fs.rename(filePath, path.join(htmlBackupDir, newFileName), (err) => {
        if (err) {
          console.error(`Error renaming file ${filePath}:`, err);
          return;
        }
        console.log(`File ${filePath} renamed to ${newFileName} successfully.`);
      });
    });

    res.status(200).send('Files renamed successfully.');
  });
});

// Start the server on port 3000
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
