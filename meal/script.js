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

            ingredientsList.innerHTML = "<li class='loading'>Loading...</li>";
            stepsList.innerHTML = "<li class='loading'>Loading...</li>";
            wasteList.innerHTML = "<li class='loading'>Loading...</li>";
            dishImage.src = "";
            dishImage.alt = "Loading image...";
            if (chartInstance) chartInstance.destroy();
            nutritionChart.style.display = "block";

            try {
                // Fetch all data from Gemini API
                const geminiPrompt = `Indian ${food}\n
                Provide the following in this exact format:\n
                Ingredients (list with numbers, e.g., 1. item):\n
                1. Ingredient1\n
                2. Ingredient2\n
                Recipe (step-by-step):\n
                1. Step1\n
                2. Step2\n
                Nutrition (calories in kcal, carbs in g, protein in g, fat in g):\n
                calories: X kcal, carbs: Y g, protein: Z g, fat: W g\n
                Waste Management Tips (suggestions for managing waste from ingredients with numbers, e.g., 1. Tip1: description):\n
                1. Tip1\n
                2. Tip2`;
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
                if (!geminiData.candidates?.[0]?.content?.parts?.[0]?.text) throw new Error("No valid Gemini response");
                const geminiText = geminiData.candidates[0].content.parts[0].text;
                console.log("Gemini Response:", geminiText); // Debug log

                // Ingredients Parsing
                const ingredientsMatch = geminiText.match(/Ingredients[\s\S]*?Recipe/);
                const ingredientsListElement = document.getElementById("ingredientsList");
                ingredientsListElement.innerHTML = "";
                if (ingredientsMatch) {
                    const items = ingredientsMatch[0]
                        .replace("Ingredients", "")
                        .replace("Recipe", "")
                        .trim()
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

                // Steps Parsing
                const stepsMatch = geminiText.match(/Recipe[\s\S]*?Nutrition/);
                const stepsListElement = document.getElementById("stepsList");
                stepsListElement.innerHTML = "";
                if (stepsMatch) {
                    const steps = stepsMatch[0]
                        .replace("Recipe", "")
                        .replace("Nutrition", "")
                        .trim()
                        .split("\n")
                        .filter(s => s.trim() && /^\d+\.\s/.test(s))
                        .map(s => s.replace(/^\d+\.\s*/, "")); // <-- remove leading numbers
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


                // Nutrition Parsing
                const nutritionMatch = geminiText.match(/Nutrition[\s\S]*?Waste Management Tips/);
                const nutritionChartElement = document.getElementById("nutritionChart");
                let calories = 0, carbs = 0, protein = 0, fat = 0;
                if (nutritionMatch) {
                    const nutriText = nutritionMatch[0]
                        .replace("Nutrition", "")
                        .replace("Waste Management Tips", "")
                        .trim();
                    calories = parseFloat(nutriText.match(/calories:?\s*([\d.]+)/i)?.[1] || 0);
                    carbs = parseFloat(nutriText.match(/carbs:?\s*([\d.]+)/i)?.[1] || 0);
                    protein = parseFloat(nutriText.match(/protein:?\s*([\d.]+)/i)?.[1] || 0);
                    fat = parseFloat(nutriText.match(/fat:?\s*([\d.]+)/i)?.[1] || 0);
                }

                console.log("Nutrition Data:", { calories, carbs, protein, fat }); // Debug log

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
                            legend: {
                                position: "top",
                                labels: { color: "#333" }
                            },
                            title: {
                                display: true,
                                text: `Nutrition Breakdown for ${food}`,
                                color: "#333"
                            }
                        }
                    }
                });

                // Waste Management Tips Parsing
                const wasteMatch = geminiText.match(/Waste Management Tips[\s\S]*?$/);
                const wasteListElement = document.getElementById("wasteList");
                wasteListElement.innerHTML = "";
                if (wasteMatch) {
                    const tips = wasteMatch[0]
                        .replace("Waste Management Tips", "")
                        .trim()
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

                // Set Dish Image
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