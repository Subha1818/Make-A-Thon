// script.js (upgraded and fixed)
const generateBtn = document.getElementById('generateBtn');
const recipeForm = document.getElementById('recipeForm');
const loadingDiv = document.getElementById('loading');
const errorDiv = document.getElementById('error');
const recipeDescriptionDiv = document.getElementById('recipeDescription');
const descriptionContent = document.getElementById('descriptionContent');
const recipeIngredientsDiv = document.getElementById('recipeIngredients');
const ingredientsContent = document.getElementById('ingredientsContent');
const recipeInstructionsDiv = document.getElementById('recipeInstructions');
const instructionsContent = document.getElementById('instructionsContent');
const wasteManagementDiv = document.getElementById('wasteManagement');
const wasteContent = document.getElementById('wasteContent');
const ingredientsInput = document.getElementById('ingredients');
const imageInput = document.getElementById('imageInput');
const pasteArea = document.getElementById('pasteArea');
const pastedImage = document.getElementById('pastedImage');
const imagePreviewDiv = document.getElementById('imagePreviewDiv');
const foodImageDiv = document.getElementById('foodImage');
const uploadStatus = document.getElementById('uploadStatus');
const saveRecipeBtn = document.getElementById('saveRecipeBtn');
let pastedImageData = null;
let currentRecipe = null;

const apiKey = 'AIzaSyDsFojbwdTt2SxfgNXc1ct30qAf6tq0O_s'; // Store securely in production

// Initialize Chart.js for nutrition chart
let nutritionChart = null;



function renderNutritionChart(data = { protein: 0, carbs: 0, fats: 0 }) {
    const ctx = document.getElementById('nutritionChart').getContext('2d');
    
    if (nutritionChart) nutritionChart.destroy();
    
    nutritionChart = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: ['Protein', 'Carbohydrates', 'Fat'],
            datasets: [{
                data: [data.protein, data.carbs, data.fats],
                backgroundColor: ['#007bff', '#fd7e14', '#28a745'], // Blue, Orange, Green
                borderColor: '#fff',
                borderWidth: 2,
                borderRadius: 10
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            cutout: '40%', // smaller cutout for thicker slices
            plugins: {
                legend: {
                    position: 'bottom',
                    labels: {
                        font: { size: 12 },
                        color: '#333'
                    }
                },
                tooltip: {
                    enabled: true,
                    callbacks: {
                        label: function(context) {
                            return `${context.label}: ${context.parsed}%`;
                        }
                    }
                },
                title: { display: false }
            },
            animation: {
                animateRotate: true,
                animateScale: true
            }
        }
    });
}



// Handle paste event for images
pasteArea.setAttribute('tabindex', '0');
pasteArea.addEventListener('click', () => pasteArea.focus());
pasteArea.addEventListener('paste', (event) => {
    const items = (event.clipboardData || window.clipboardData).items;
    for (const item of items) {
        if (item.type.indexOf('image') === 0) {
            const blob = item.getAsFile();
            const reader = new FileReader();
            reader.onload = () => {
                pastedImage.src = reader.result;
                pastedImageData = reader.result.split(',')[1];
                imagePreviewDiv.style.display = 'block';
                pasteArea.classList.add('active');
            };
            reader.onerror = () => {
                errorDiv.textContent = 'Error reading pasted image.';
                errorDiv.style.display = 'block';
            };
            reader.readAsDataURL(blob);
            break;
        }
    }
});

// Handle image upload
imageInput.addEventListener('change', () => {
    const file = imageInput.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = () => {
            pastedImage.src = reader.result;
            pastedImageData = reader.result.split(',')[1];
            imagePreviewDiv.style.display = 'block';
            uploadStatus.textContent = 'Image uploaded successfully!';
            uploadStatus.style.display = 'block';
            uploadStatus.style.color = '#4CAF50';
            setTimeout(() => uploadStatus.style.display = 'none', 3000);
        };
        reader.onerror = () => {
            uploadStatus.textContent = 'Error uploading image.';
            uploadStatus.style.display = 'block';
            uploadStatus.style.color = '#d32f2f';
        };
        reader.readAsDataURL(file);
    }
});

// Function to extract nutrition data from text
function extractNutritionData(nutritionText) {
    let protein = 0, carbs = 0, fats = 0, calories = 0;
    
    if (nutritionText) {
        // Split by common separators and clean up
        const nutritionLines = nutritionText.split(/[\n,•\*]+/).map(line => line.trim());
        
        nutritionLines.forEach(line => {
            const cleanLine = line.toLowerCase().replace(/[^\w\s:]/g, ' ');
            
            // Extract numbers from the line
            const numbers = cleanLine.match(/\d+(\.\d+)?/g);
            if (numbers) {
                const value = parseFloat(numbers[0]);
                
                if (cleanLine.includes('protein') && value > 0) {
                    protein = value;
                } else if ((cleanLine.includes('carb') || cleanLine.includes('carbohydrate')) && value > 0) {
                    carbs = value;
                } else if ((cleanLine.includes('fat') || cleanLine.includes('fats')) && value > 0) {
                    fats = value;
                } else if (cleanLine.includes('calorie') && value > 0) {
                    calories = value;
                }
            }
        });
    }
    
    return { protein, carbs, fats, calories };
}

// Handle form submission
recipeForm.addEventListener('submit', async (event) => {
    event.preventDefault();
    const ingredients = ingredientsInput.value.trim();
    const hasImage = imageInput.files.length > 0;
    const hasPastedImage = pastedImageData !== null;

    if (!ingredients && !hasImage && !hasPastedImage) {
        errorDiv.textContent = 'Please provide ingredients, upload an image, or paste an image.';
        errorDiv.style.display = 'block';
        return;
    }

    loadingDiv.style.display = 'block';
    errorDiv.style.display = 'none';
    [recipeDescriptionDiv, recipeIngredientsDiv, recipeInstructionsDiv, wasteManagementDiv, foodImageDiv, document.getElementById('nutrition')].forEach(el => el.style.display = 'none');

    let parts = [];
    let prompt = '';
    let inputImageDataUrl = null;

    if (hasImage) {
        const file = imageInput.files[0];
        inputImageDataUrl = await new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result);
            reader.onerror = reject;
            reader.readAsDataURL(file);
        });
        const base64 = inputImageDataUrl.split(',')[1];
        parts.push({ inline_data: { mime_type: file.type, data: base64 } });
        prompt = `Analyze this image to identify the food or ingredients, then provide a detailed recipe...`;
    } else if (hasPastedImage) {
        parts.push({ inline_data: { mime_type: 'image/jpeg', data: pastedImageData } });
        prompt = `Analyze this pasted image to identify the food or ingredients, then provide a detailed recipe...`;
    } else {
        prompt = `Using these ingredients: ${ingredients}, provide a detailed recipe...`;
    }

    prompt += `

Please provide the response in the following exact format:

**Recipe Description**: [A brief description of the dish]

**Ingredients**: 
[List of ingredients with quantities, each on a new line]

**Instructions**: 
[Step-by-step cooking instructions, each step on a new line]

**Nutrition**: 
• Calories: [number]
• Protein: [number]g
• Carbs: [number]g
• Fats: [number]g

**Waste Management Tips**: 
[Suggestions for using or managing food waste, each tip on a new line]

Ensure each section is clearly labeled and formatted exactly as shown above.`;

    parts.push({ text: prompt });

    try {
        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ contents: [{ parts }] })
        });

        if (!response.ok) throw new Error(`API error: ${response.statusText}`);
        const data = await response.json();
        const generatedText = data.candidates[0].content.parts[0].text;

        // Parse the response more carefully
        const sections = { description: '', ingredients: '', instructions: '', waste: '', nutrition: '' };
        const lines = generatedText.split('\n');
        let currentSection = null;

        lines.forEach(line => {
            const trimmedLine = line.trim();
            
            if (trimmedLine.includes('**Recipe Description**')) {
                currentSection = 'description';
                const content = trimmedLine.replace(/\*\*Recipe Description\*\*:?/i, '').trim();
                if (content) sections.description = content;
            } else if (trimmedLine.includes('**Ingredients**')) {
                currentSection = 'ingredients';
                const content = trimmedLine.replace(/\*\*Ingredients\*\*:?/i, '').trim();
                if (content) sections.ingredients = content;
            } else if (trimmedLine.includes('**Instructions**')) {
                currentSection = 'instructions';
                const content = trimmedLine.replace(/\*\*Instructions\*\*:?/i, '').trim();
                if (content) sections.instructions = content;
            } else if (trimmedLine.includes('**Nutrition**')) {
                currentSection = 'nutrition';
                const content = trimmedLine.replace(/\*\*Nutrition\*\*:?/i, '').trim();
                if (content) sections.nutrition = content;
            } else if (trimmedLine.includes('**Waste Management Tips**')) {
                currentSection = 'waste';
                const content = trimmedLine.replace(/\*\*Waste Management Tips\*\*:?/i, '').trim();
                if (content) sections.waste = content;
            } else if (currentSection && trimmedLine) {
                // Don't add section headers to content
                if (!trimmedLine.includes('**')) {
                    sections[currentSection] += (sections[currentSection] ? '\n' : '') + trimmedLine;
                }
            }
        });

        // Display content
        descriptionContent.textContent = sections.description || 'No description provided.';
        
        // Format ingredients as list
        const ingredientItems = sections.ingredients.split('\n').filter(item => item.trim());
        ingredientsContent.innerHTML = ingredientItems.length > 0 ? 
            ingredientItems.map(item => `<li>${item.trim()}</li>`).join('') : 
            '<li>No ingredients provided.</li>';
        
        // Format instructions as list
        const instructionItems = sections.instructions.split('\n').filter(item => item.trim());
        instructionsContent.innerHTML = instructionItems.length > 0 ? 
            instructionItems.map(item => `<li>${item.trim()}</li>`).join('') : 
            '<li>No instructions provided.</li>';
        
        // Format waste management tips as list (excluding nutrition data)
        const wasteItems = sections.waste.split('\n').filter(item => {
            const trimmed = item.trim().toLowerCase();
            return trimmed && 
                   !trimmed.includes('calorie') && 
                   !trimmed.includes('protein') && 
                   !trimmed.includes('carb') && 
                   !trimmed.includes('fat') &&
                   !trimmed.includes('nutrition');
        });
        wasteContent.innerHTML = wasteItems.length > 0 ? 
            wasteItems.map(item => `<li>${item.trim()}</li>`).join('') : 
            '<li>No waste tips provided.</li>';

        // Extract and display nutrition data as pie chart
        const nutritionData = extractNutritionData(sections.nutrition);
        
        if (nutritionData.protein > 0 || nutritionData.carbs > 0 || nutritionData.fats > 0) {
            renderNutritionChart(nutritionData);
            document.getElementById('nutrition').style.display = 'block';
        }

        // Store current recipe
        currentRecipe = { 
            description: sections.description, 
            ingredients: sections.ingredients, 
            instructions: sections.instructions, 
            waste: sections.waste, 
            nutrition: sections.nutrition,
            nutritionData: nutritionData
        };
        
        saveRecipeBtn.style.display = 'block';
        
        // Show all sections
        [recipeDescriptionDiv, recipeIngredientsDiv, recipeInstructionsDiv, wasteManagementDiv].forEach(el => el.style.display = 'block');
        
    } catch (error) {
        errorDiv.textContent = `Error: ${error.message}. Please try again or check your internet connection.`;
        errorDiv.style.display = 'block';
    } finally {
        loadingDiv.style.display = 'none';
    }
});

// Save recipe to localStorage
saveRecipeBtn.addEventListener('click', () => {
    if (currentRecipe) {
        const recipes = JSON.parse(localStorage.getItem('savedRecipes') || '[]');
        const recipeWithTimestamp = {
            ...currentRecipe,
            savedAt: new Date().toISOString(),
            id: Date.now() // Simple ID generation
        };
        recipes.push(recipeWithTimestamp);
        localStorage.setItem('savedRecipes', JSON.stringify(recipes));
        alert('Recipe saved successfully!');
    }
});

// Initialize empty nutrition chart on page load
document.addEventListener('DOMContentLoaded', () => {
    renderNutritionChart();
});