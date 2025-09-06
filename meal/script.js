const GEMINI_API_KEY = "AIzaSyDsFojbwdTt2SxfgNXc1ct30qAf6tq0O_s"; // Replace with your Gemini API key:- AIzaSyDsFojbwdTt2SxfgNXc1ct30qAf6tq0O_s
        let chartInstance = null;

        async function getRecipe() {
            const food = document.getElementById("foodInput").value.trim();
            if (!food || food.length > 50 || !/^[a-zA-Z\s]+$/.test(food)) {
                alert("Please enter a valid dish name (letters and spaces only, max 50 characters).");
                return;
            }

            const button = document.querySelector("button");
            button.disabled = true;
            button.textContent = "Loading...";

            // Clear old data and add loading states
            const ingredientsList = document.getElementById("ingredientsList");
            const stepsList = document.getElementById("stepsList");
            const nutritionChart = document.getElementById("nutritionChart");
            const wasteList = document.getElementById("wasteList");
            const dishImage = document.getElementById("dishImage");

            // Set loading states


            ingredientsList.innerHTML = "<li class='loading'>Loading...</li>";
            stepsList.innerHTML = "<li class='loading'>Loading...</li>";
            wasteList.innerHTML = "<li class='loading'>Loading...</li>";
            dishImage.src = "";
            dishImage.alt = "Loading image...";
            if (chartInstance) chartInstance.destroy();
            nutritionChart.style.display = "block";

           


            try { 
    // Build strict Gemini prompt
    const geminiPrompt = `Indian ${food}
Return the output ONLY in this exact plain text format (no markdown, no extra comments):

Ingredients:
1. item
2. item

Recipe:
1. step
2. step

Nutrition:
calories: X kcal, carbs: Y g, protein: Z g, fat: W g

Waste Management Tips:
1. tip
2. tip`;

    // Fetch data from Gemini API
    const geminiRes = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_API_KEY}`,
        {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                contents: [{ parts: [{ text: geminiPrompt }] }]
            })
        }
    );

    if (!geminiRes.ok) throw new Error(`Gemini API error: ${geminiRes.status}`);
    const geminiData = await geminiRes.json();

    let geminiText = geminiData.candidates?.[0]?.content?.parts?.[0]?.text || "";
    if (!geminiText) throw new Error("No valid Gemini response");

    // Clean text
    geminiText = geminiText
        .replace(/\*\*/g, "") // remove bold
        .replace(/\r/g, "")   // normalize newlines
        .trim();

    console.log("Gemini Response:", geminiText);

    // ---------------- Ingredients ----------------
    const ingredientsMatch = geminiText.match(/Ingredients:\s*([\s\S]*?)Recipe:/i);
    const ingredientsListElement = document.getElementById("ingredientsList");
    ingredientsListElement.innerHTML = "";
    if (ingredientsMatch) {
        const items = ingredientsMatch[1]
            .split("\n")
            .filter(i => i.trim() && /^\d+\.\s/.test(i));
        if (items.length > 0) {
            items.forEach(i => {
                const li = document.createElement("li");
                li.textContent = i.trim();
                ingredientsListElement.appendChild(li);
            });
        } else {
            ingredientsListElement.innerHTML = "<li>No ingredients found</li>";
        }
    } else {
        ingredientsListElement.innerHTML = "<li>No ingredients found</li>";
    }

    // ---------------- Steps ----------------
    const stepsMatch = geminiText.match(/Recipe:\s*([\s\S]*?)Nutrition:/i);
    const stepsListElement = document.getElementById("stepsList");
    stepsListElement.innerHTML = "";
    if (stepsMatch) {
        const steps = stepsMatch[1]
            .split("\n")
            .filter(s => s.trim() && /^\d+\.\s/.test(s))
            .map(s => s.replace(/^\d+\.\s*/, "")); // remove leading numbers
        if (steps.length > 0) {
            steps.forEach(s => {
                const li = document.createElement("li");
                li.textContent = s.trim();
                stepsListElement.appendChild(li);
            });
        } else {
            stepsListElement.innerHTML = "<li>No steps found</li>";
        }
    } else {
        stepsListElement.innerHTML = "<li>No steps found</li>";
    }

    // ---------------- Nutrition ----------------
    const nutritionMatch = geminiText.match(/Nutrition:\s*([\s\S]*?)Waste Management Tips:/i);
    const nutritionChartElement = document.getElementById("nutritionChart");
    let calories = 0, carbs = 0, protein = 0, fat = 0;
    if (nutritionMatch) {
        const nutriText = nutritionMatch[1].trim();
        calories = parseFloat(nutriText.match(/calories:?\s*([\d.]+)/i)?.[1] || 0);
        carbs = parseFloat(nutriText.match(/carbs:?\s*([\d.]+)/i)?.[1] || 0);
        protein = parseFloat(nutriText.match(/protein:?\s*([\d.]+)/i)?.[1] || 0);
        fat = parseFloat(nutriText.match(/fat:?\s*([\d.]+)/i)?.[1] || 0);
    }

    console.log("Nutrition Data:", { calories, carbs, protein, fat });

    // Render Pie Chart
    if (chartInstance) chartInstance.destroy();
    const ctx = nutritionChartElement.getContext("2d");
    chartInstance = new Chart(ctx, {
        type: "pie",
        data: {
            labels: ["Carbs", "Protein", "Fat"],
            datasets: [{
                data: [carbs, protein, fat].filter(v => v > 0),
                backgroundColor: ["#3498db", "#e67e22", "#2ecc71"]
            }]
        },
        options: {
            responsive: true,
            plugins: {
                legend: { position: "top", labels: { color: "#333" } },
                title: { display: true, text: `Nutrition Breakdown for ${food}`, color: "#333" }
            }
        }
    });

    // ---------------- Waste Tips ----------------
    const wasteMatch = geminiText.match(/Waste Management Tips:\s*([\s\S]*)/i);
    const wasteListElement = document.getElementById("wasteList");
    wasteListElement.innerHTML = "";
    if (wasteMatch) {
        const tips = wasteMatch[1]
            .split("\n")
            .filter(c => c.trim() && /^\d+\.\s/.test(c));
        if (tips.length > 0) {
            tips.forEach(c => {
                const li = document.createElement("li");
                li.textContent = c.trim();
                wasteListElement.appendChild(li);
            });
        } else {
            wasteListElement.innerHTML = "<li>No tips available</li>";
        }
    } else {
        wasteListElement.innerHTML = "<li>No tips available</li>";
    }

    // ---------------- Dish Image ----------------
    const imageUrl = `https://source.unsplash.com/featured/?${encodeURIComponent(food)}`;
    dishImage.src = imageUrl;
    dishImage.alt = `${food} Image`;

} catch (err) {
    console.error(err);
    alert(`Error fetching recipe: ${err.message}`);
    ingredientsList.innerHTML = "<li>Unable to load ingredients</li>";
    stepsList.innerHTML = "<li>Unable to load steps</li>";
    nutritionChart.style.display = "none";
    wasteList.innerHTML = "<li>Unable to load tips</li>";
    dishImage.src = "";
    dishImage.alt = "Unable to load image";
} finally {
    button.disabled = false;
    button.textContent = "Get Recipe & Nutrition";
}

        }

        // Add Enter key functionality
        document.getElementById("foodInput").addEventListener("keypress", function(event) {
            if (event.key === "Enter") {
                getRecipe();
            }
        });