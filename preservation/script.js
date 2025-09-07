  const uploadInput = document.getElementById('uploadInput');
  const preview = document.getElementById('preview');
  const manualInput = document.getElementById('manualInput');
  const generateBtn = document.getElementById('generateBtn');
  const clearBtn = document.getElementById('clearBtn');
  const tipsOutput = document.getElementById('tipsOutput');
  let currentImageData = null;

  // 👉 Gemini API function
  async function generateTips(ingredients, imageData) {
    const apiKey = "AIzaSyDsFojbwdTt2SxfgNXc1ct30qAf6tq0O_s"; // ⚠️ move to .env in production
    let prompt = `I have these ingredients: ${ingredients}.
      Give me clear, practical 10 useful tips to store them longer and reduce food waste. 
      Return only the tips, no extra intro/outro text.`;

    if (imageData) {
      prompt += " (An image of the ingredients was also provided.)";
    }

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
        }),
      }
    );

    const data = await response.json();
    console.log("Gemini raw response:", data);

    // ✅ safer parsing
    let tipsText =
      data?.candidates?.[0]?.content?.parts?.[0]?.text ||
      data?.candidates?.[0]?.output ||
      "No tips found.";

    // ✅ cleanup into array
    let tips = tipsText
      .split(/\n|•|-|\d\./)
      .map(t => t.trim())
      .filter(t => t.length > 2);

    return tips.length ? tips : [tipsText];
  }

  // File upload
  uploadInput.addEventListener('change', e => {
    const file = e.target.files[0];
    const span = uploadInput.parentElement.querySelector('span');
    if (file) {
      const reader = new FileReader();
      reader.onload = ev => {
        preview.src = ev.target.result;
        preview.style.display = 'block';
        currentImageData = ev.target.result;
        span.textContent = file.name;
      };
      reader.readAsDataURL(file);
    } else {
      span.textContent = 'No file chosen';
      preview.style.display = 'none';
      currentImageData = null;
    }
  });

  // Generate tips button
  generateBtn.addEventListener('click', async () => {
    const manualText = manualInput.value.trim();
    if (!manualText && !currentImageData) {
      showError("Please enter ingredients or upload an image.");
      return;
    }
    generateBtn.disabled = true;
    generateBtn.innerHTML = "⏳ Generating...";
    tipsOutput.style.display = "block";
    tipsOutput.innerHTML = '<div class="loading">Fetching Data...</div>';

    try {
      const tips = await generateTips(manualText, currentImageData);
      let output = `
        <div class="tips-card">
          <h3>💡 Food Storage & Waste Reduction Tips</h3>
          <ol>
      `;
      tips.forEach(tip => {
        output += `<li>${tip}</li>`;
      });
      output += "</ol></div>";

      tipsOutput.innerHTML = output;
      tipsOutput.scrollIntoView({ behavior: "smooth" });

    } catch (err) {
      console.error(err);
      showError("Error fetching tips from Gemini API.");
    } finally {
      generateBtn.disabled = false;
      generateBtn.innerHTML = "✨ Generate Tips";
    }
  });

  // Clear button
  clearBtn.addEventListener('click', () => {
    manualInput.value = "";
    uploadInput.value = "";
    preview.src = "";
    preview.style.display = "none";
    tipsOutput.innerHTML = "";
    tipsOutput.style.display = "none";
    currentImageData = null;
  });

  // Messages
  function showError(msg) {
    const div = document.createElement("div");
    div.className = "error";
    div.innerText = "⚠ " + msg;
    document.querySelector(".header").insertAdjacentElement("afterend", div);
    setTimeout(() => div.remove(), 4000);
  }