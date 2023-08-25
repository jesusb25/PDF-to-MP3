/*!
 * Color mode toggler for Bootstrap's docs (https://getbootstrap.com/)
 * Copyright 2011-2023 The Bootstrap Authors
 * Licensed under the Creative Commons Attribution 3.0 Unported License.
 */

(() => {
  'use strict'

  const getStoredTheme = () => localStorage.getItem('theme')
  const setStoredTheme = theme => localStorage.setItem('theme', theme)

  const getPreferredTheme = () => {
    const storedTheme = getStoredTheme()
    if (storedTheme) {
      return storedTheme
    }

    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
  }

  const setTheme = theme => {
    if (theme === 'auto' && window.matchMedia('(prefers-color-scheme: dark)').matches) {
      document.documentElement.setAttribute('data-bs-theme', 'dark')
    } else {
      document.documentElement.setAttribute('data-bs-theme', theme)
    }
  }

  setTheme(getPreferredTheme())

  const showActiveTheme = (theme, focus = false) => {
    const themeSwitcher = document.querySelector('#bd-theme')

    if (!themeSwitcher) {
      return
    }

    const themeSwitcherText = document.querySelector('#bd-theme-text')
    const activeThemeIcon = document.querySelector('.theme-icon-active use')
    const btnToActive = document.querySelector(`[data-bs-theme-value="${theme}"]`)
    const svgOfActiveBtn = btnToActive.querySelector('svg use').getAttribute('href')

    document.querySelectorAll('[data-bs-theme-value]').forEach(element => {
      element.classList.remove('active')
      element.setAttribute('aria-pressed', 'false')
    })

    btnToActive.classList.add('active')
    btnToActive.setAttribute('aria-pressed', 'true')
    activeThemeIcon.setAttribute('href', svgOfActiveBtn)
    const themeSwitcherLabel = `${themeSwitcherText.textContent} (${btnToActive.dataset.bsThemeValue})`
    themeSwitcher.setAttribute('aria-label', themeSwitcherLabel)

    if (focus) {
      themeSwitcher.focus()
    }
  }

  window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => {
    const storedTheme = getStoredTheme()
    if (storedTheme !== 'light' && storedTheme !== 'dark') {
      setTheme(getPreferredTheme())
    }
  })

  window.addEventListener('DOMContentLoaded', () => {
    showActiveTheme(getPreferredTheme())

    document.querySelectorAll('[data-bs-theme-value]')
      .forEach(toggle => {
        toggle.addEventListener('click', () => {
          const theme = toggle.getAttribute('data-bs-theme-value')
          setStoredTheme(theme)
          setTheme(theme)
          showActiveTheme(theme, true)
        })
      })
  })
})()


const inputPDF = document.querySelector("#formFileLg");
const resultText = document.querySelector("#floatingTextarea");
const MAX_TEXT_LENGTH = 1000;
const buttonConvert = document.querySelector("#mp3Convert");

buttonConvert.addEventListener("click", convertTextToMp3);
resultText.addEventListener("keyup", adjustTextAreaHeight);


function adjustTextAreaHeight() {
  const scrollHeight = resultText.scrollHeight;
  resultText.style.height = `${scrollHeight}px`;
}


function isPDF(filename) {
  const extension = filename.split('.').pop().toLowerCase();
  return extension === 'pdf';
}

function uploadPDF() {
  buttonConvert.disabled = true;
  resultText.textContent = "Extracting text from PDF..."
  buttonConvert.textContent = "PDF text loading...";
  
  const formData = new FormData();
  formData.append("pdf", inputPDF.files[0]);

  fetch("https://pdf-to-mp3.onrender.com/get-text", {
    method: "POST",
    body: formData
  }).then(response => {
    return response.text();
  }).then(extractedText => {
    extractedText = extractedText.trim();
    extractedText = extractedText.replace(/\s{2,}/g, ' ');
    resultText.value = extractedText;
    adjustTextAreaHeight();
    // Enable the convert button
    buttonConvert.disabled = false;
    buttonConvert.textContent = "Download as MP3";
  });
}

/**
 * Fetches the base64-encoded audio data from the server.
 * @param {string} text - The text to be converted to base64 data.
 * @returns {Promise<string>} A promise that resolves with the base64-encoded audio data.
 */
async function getBase64Data(text) {
  const apiUrl = `https://pdf-to-mp3.onrender.com/base64data?text=${encodeURIComponent(text)}`;
  const response = await fetch(apiUrl);
  if (!response.ok) {
    throw new Error("Network response was not ok.");
  }
  return response.text();
}

/**
 * Downloads an MP3 audio file from base64 data.
 * @param {string} base64Data - The base64-encoded audio data.
 */
function downloadMP3(base64Data) {
  console.log("Downloading MP3...");

  const mp3Data = 'data:audio/mpeg;base64,' + base64Data;

  const a = document.createElement("a");
  a.href = mp3Data;
  const filename = inputPDF.files[0] ? inputPDF.files[0].name : "audio.mp3";
  a.download = filename.slice(0, filename.lastIndexOf('.')) + ".mp3";
  document.body.appendChild(a);
  a.click();
}

/**
 * Event handler for the button click.
 * @param {Event} event - The click event object.
 * @returns {Promise<void>} A promise that resolves when the process is complete.
 */
async function convertTextToMp3(event) {
  console.log("Conversion started!");

  try {
    const text = document.querySelector("#floatingTextarea").value;
    if (!text) {
      window.alert("Error: PDF text cannot be empty.");
      throw new Error("No text to convert.");
    }
    
    const textChunks = splitTextIntoChunks(text, MAX_TEXT_LENGTH);
    const base64DataArray = await Promise.all(textChunks.map(chunk => getBase64Data(chunk)));
    const base64Data = base64DataArray.join('');

    downloadMP3(base64Data);
  } catch (error) {
    console.log("Error:", error);
  }
  resultText.textContent = "";
}

function splitTextIntoChunks(text, chunkSize) {
  const chunks = [];
  let currentIndex = 0;

  while (currentIndex < text.length) {
    let endIndex = currentIndex + chunkSize;
    if (endIndex >= text.length) {
      endIndex = text.length;
    } else {
      // Find the last space before endIndex to ensure no word is split
      const lastSpaceIndex = text.lastIndexOf(' ', endIndex);
      if (lastSpaceIndex !== -1 && lastSpaceIndex > currentIndex) {
        endIndex = lastSpaceIndex;
      }
    }

    chunks.push(text.slice(currentIndex, endIndex));
    currentIndex = endIndex + 1;
  }
  return chunks;
}


inputPDF.addEventListener("change", () => {
  if (!inputPDF.files[0] || !isPDF(inputPDF.files[0].name)) {
    window.alert("Error: Input file must be PDF");
    return;
  }
  uploadPDF();
});


