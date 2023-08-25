const express = require('express');
const cors = require('cors');
const PORT = process.env.port || 8000;
const googleTTS = require('google-tts-api');
const fileUpload = require('express-fileupload');
const pdfjsLib = require('pdfjs-dist');
const path = require('path');

const app = express();
app.use(cors());

app.use(fileUpload());
const directoryPath = path.dirname(__dirname);
app.use(express.static(directoryPath));

app.listen(PORT, () => {
  console.log('If local, static files are on http://localhost:8000');
});

app.get('/base64data', (request, response) => {
  const text = request.query.text;
  
  googleTTS.getAllAudioBase64(text, {
    lang: 'en',
    slow: false,
    host: 'https://translate.google.com'
  })
  .then((base64Array) => {
    var data = '';
    base64Array.forEach((url) => {
      data += url.base64;
    });
    
    response.send(data);
  })
  .catch((err) => {
    console.error(err.stack);
  });
});


app.post('/get-text', (request, response) => {
  if (!request.files && !request.files.pdf) {
    response.status(400).send('No files were uploaded.');
    return;
  }
  const src = request.files.pdf;
  getText(src).then(text => {
    console.log(text);
    response.send(text);
  });
});

async function getAllContent(src) {
  const doc = await pdfjsLib.getDocument(src).promise;
  console.log(doc);
  const numPages = doc.numPages;
  const allContent = [];

  for (let pageNumber = 1; pageNumber <= numPages; pageNumber++) {
    const page = await doc.getPage(pageNumber);
    const content = await page.getTextContent();
    allContent.push(content);
  }

  return allContent;
}


async function getText(src) {
  const allContent = await getAllContent(src);
  const allText = allContent.flatMap(page => page.items.map(item => item.str));
  return allText.join(' ');
}


