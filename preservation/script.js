const uploadInput = document.getElementById('uploadInput');
const preview = document.getElementById('preview');
const pasteArea = document.getElementById('pasteArea');
const generateBtn = document.getElementById('generateBtn');
const tipsOutput = document.getElementById('tipsOutput');
const manualInput = document.getElementById('manualInput');

// Note: API key should be moved to a backend server for security
const API_KEY = 'AIzaSyDsFojbwdTt2SxfgNXc1ct30qAf6tq0O_s'; // Replace with backend endpoint
const { GoogleGenerativeAI } = window.GoogleGenerativeAI;
const genAI = new GoogleGenerativeAI(API_KEY);
const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });

async function generateTips(ingredients, imageData, mimeType = 'image/png') {
    const prompt = `Provide practical tips for storing and managing food waste for the following ingredients: ${ingredients}. If an image is provided, analyze it to identify visible ingredients and combine them with the provided list, prioritizing unique ingredients. Current date and time: 02:56 AM IST on Sunday, September 07, 2025. Return tips as a numbered list.`;
    const requestOptions = {
        temperature: 0.7,
        maxOutputTokens: 500,
    };

    try {
        const response = imageData
            ? await model.generateContent([prompt, { inlineData: { data: imageData, mimeType } }], requestOptions)
            : await model.generateContent(prompt, requestOptions);
        return response.candidates[0].content.parts[0].text;
    } catch (error) {
        if (error.message.includes('quota')) {
            return 'Error: API quota exceeded. Please try again later.';
        } else if (error.message.includes('invalid')) {
            return 'Error: Invalid input or image format.';
        }
        return `Error: ${error.message}`;
    }
}

// Handle file upload
uploadInput.addEventListener('change', function(e) {
    const file = e.target.files[0];
    if (file) {
        if (file.size > 5 * 1024 * 1024) {
            tipsOutput.innerHTML = '<p>Error: Image size exceeds 5MB.</p>';
            tipsOutput.style.display = 'block';
            return;
        }
        const reader = new FileReader();
        reader.onload = function(event) {
            preview.src = event.target.result;
            preview.style.display = 'block';
        };
        reader.readAsDataURL(file);
    }
    const span = this.nextElementSibling.nextElementSibling;
    span.textContent = file ? file.name : 'No file chosen';
});

// Handle paste event
pasteArea.addEventListener('paste', function(e) {
    const items = (e.clipboardData || e.originalEvent.clipboardData).items;
    for (let item of items) {
        if (item.type.indexOf('image') === 0) {
            const blob = item.getAsFile();
            if (blob.size > 5 * 1024 * 1024) {
                tipsOutput.innerHTML = '<p>Error: Image size exceeds 5MB.</p>';
                tipsOutput.style.display = 'block';
                return;
            }
            const reader = new FileReader();
            reader.onload = function(event) {
                preview.src = event.target.result;
                preview.style.display = 'block';
                pasteArea.innerHTML = '';
            };
            reader.readAsDataURL(blob);
            break;
        }
    }
});

// Generate tips button
generateBtn.addEventListener('click', async () => {
    tipsOutput.style.display = 'block';
    tipsOutput.innerHTML = '<p class="loading">Generating tips...</p>';

    const manualText = manualInput.value.trim();
    const imageData = preview.src ? preview.src.split(',')[1] : null;
    const mimeType = uploadInput.files[0]?.type || 'image/png'; // Dynamic MIME type

    try {
        const tips = await generateTips(manualText, imageData, mimeType);
        if (/^\d+\./.test(tips)) {
            tipsOutput.innerHTML = tips.split('\n').map(line => `<p>${line}</p>`).filter(line => line.trim()).join('');
        } else {
            tipsOutput.innerHTML = `<p>${tips}</p>`;
        }
    } catch (error) {
        tipsOutput.innerHTML = '<p>Error generating tips. Please try again.</p>';
    }
});

// Optional: Add clear button in HTML
// <button id="clearBtn">Clear</button>
document.getElementById('clearBtn')?.addEventListener('click', () => {
    manualInput.value = '';
    uploadInput.value = '';
    preview.src = '';
    preview.style.display = 'none';
    pasteArea.innerHTML = 'Click here and paste an image (Ctrl+V)';
    tipsOutput.innerHTML = '';
    tipsOutput.style.display = 'none';
    document.querySelector('.file-upload span').textContent = 'No file chosen';
});