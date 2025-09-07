// API configuration for prices (RapidAPI)
const API_ENDPOINT = 'https://price-comparison-api.p.rapidapi.com/search';
const API_KEY = 'ee92e8c7b0msh0b9ba706c3bdc49p117035jsnb8babfe7311b'; // Replace with your RapidAPI key from rapidapi.com

// OpenFoodFacts API for scanning
const OFF_API = 'https://world.openfoodfacts.org/api/v0/product/';

// Fallback data
const fallbackPriceDatabase = {
    'rice': { 'BigBasket': 45, 'Grofers (Blinkit)': 42, 'Amazon Fresh': 48, 'Swiggy Instamart': 44, 'Zepto': 46, 'JioMart': 40, 'Dunzo': 47 },
    'milk': { 'BigBasket': 52, 'Grofers (Blinkit)': 50, 'Amazon Fresh': 54, 'Swiggy Instamart': 51, 'Zepto': 53, 'JioMart': 49, 'Dunzo': 52 },
    'bread': { 'BigBasket': 35, 'Grofers (Blinkit)': 32, 'Amazon Fresh': 38, 'Swiggy Instamart': 34, 'Zepto': 36, 'JioMart': 30, 'Dunzo': 37 },
    'tomatoes': { 'BigBasket': 28, 'Grofers (Blinkit)': 25, 'Amazon Fresh': 30, 'Swiggy Instamart': 27, 'Zepto': 29, 'JioMart': 24, 'Dunzo': 31 },
    'onions': { 'BigBasket': 22, 'Grofers (Blinkit)': 20, 'Amazon Fresh': 25, 'Swiggy Instamart': 23, 'Zepto': 24, 'JioMart': 19, 'Dunzo': 26 },
    'potatoes': { 'BigBasket': 18, 'Grofers (Blinkit)': 16, 'Amazon Fresh': 20, 'Swiggy Instamart': 17, 'Zepto': 19, 'JioMart': 15, 'Dunzo': 21 },
    'eggs': { 'BigBasket': 65, 'Grofers (Blinkit)': 62, 'Amazon Fresh': 68, 'Swiggy Instamart': 64, 'Zepto': 66, 'JioMart': 60, 'Dunzo': 67 },
    'chicken': { 'BigBasket': 180, 'Grofers (Blinkit)': 175, 'Amazon Fresh': 185, 'Swiggy Instamart': 178, 'Zepto': 182, 'JioMart': 170, 'Dunzo': 188 },
    'oil': { 'BigBasket': 120, 'Grofers (Blinkit)': 115, 'Amazon Fresh': 125, 'Swiggy Instamart': 118, 'Zepto': 122, 'JioMart': 110, 'Dunzo': 128 },
    'sugar': { 'BigBasket': 42, 'Grofers (Blinkit)': 40, 'Amazon Fresh': 45, 'Swiggy Instamart': 41, 'Zepto': 43, 'JioMart': 38, 'Dunzo': 44 }
};

const fallbackGroceryApps = {
    'BigBasket': { deliveryFee: 25, freeDeliveryMin: 200 },
    'Grofers (Blinkit)': { deliveryFee: 15, freeDeliveryMin: 150 },
    'Amazon Fresh': { deliveryFee: 30, freeDeliveryMin: 300 },
    'Swiggy Instamart': { deliveryFee: 20, freeDeliveryMin: 199 },
    'Zepto': { deliveryFee: 10, freeDeliveryMin: 100 },
    'Dunzo': { deliveryFee: 35, freeDeliveryMin: 250 },
    'JioMart': { deliveryFee: 0, freeDeliveryMin: 0 },
    'Nature\'s Basket': { deliveryFee: 50, freeDeliveryMin: 500 }
};

let inventory = [];
let monthlyRequirements = [];
let shoppingList = [];
let scanner = null;

function addInventoryItem(name = null, quantity = null, threshold = null, unit = null, expiry = null) {
    const itemNameInput = document.getElementById('itemName');
    const currentQuantityInput = document.getElementById('currentQuantity');
    const minThresholdInput = document.getElementById('minThreshold');
    const unitSelect = document.getElementById('unit');
    const expiryDateInput = document.getElementById('expiryDate'); // ✅ new field

    const itemName = (name || itemNameInput.value || '').trim().toLowerCase();
    const currentQuantity = quantity !== null ? parseInt(quantity) : parseInt(currentQuantityInput.value) || 0;
    const minThreshold = threshold !== null ? parseInt(threshold) : parseInt(minThresholdInput.value) || 1;
    const itemUnit = unit || unitSelect.value || 'pieces';
    const expiryDate = expiry || expiryDateInput.value || null; // ✅ store expiry

    if (!itemName) {
        alert('Please enter a valid item name');
        return;
    }

    const existingItem = inventory.find(item => item.name === itemName);
    if (existingItem) {
        existingItem.quantity += currentQuantity;
        existingItem.threshold = minThreshold;
        existingItem.unit = itemUnit;
        existingItem.expiryDate = expiryDate; // ✅ update expiry
    } else {
        const newItem = {
            id: Date.now(),
            name: itemName,
            quantity: currentQuantity,
            threshold: minThreshold,
            unit: itemUnit,
            expiryDate: expiryDate // ✅ new field
        };
        inventory.push(newItem);
    }

    updateInventoryDisplay();
    generateShoppingList();
    updateStats();

    itemNameInput.value = '';
    currentQuantityInput.value = '';
    minThresholdInput.value = '';
    unitSelect.value = 'kg';
    expiryDateInput.value = ''; // ✅ clear expiry field
}


function increaseQuantity(id) {
    const item = inventory.find(item => item.id === id);
    if (item) {
        item.quantity += 1;
        console.log(`Increased quantity for ${item.name}: ${item.quantity}`);
        updateInventoryDisplay();
        generateShoppingList();
        updateStats();
    } else {
        console.error('Item not found for id:', id);
    }
}

function decreaseQuantity(id) {
    const item = inventory.find(item => item.id === id);
    if (item) {
        if (item.quantity > 0) {
            item.quantity -= 1;
            console.log(`Decreased quantity for ${item.name}: ${item.quantity}`);
            updateInventoryDisplay();
            generateShoppingList();
            updateStats();
        } else {
            alert(`Cannot reduce quantity of ${item.name} below 0`);
            console.warn(`Attempted to reduce ${item.name} below 0`);
        }
    } else {
        console.error('Item not found for id:', id);
    }
}

function deleteInventoryItem(id) {
    inventory = inventory.filter(item => item.id !== id);
    console.log('Deleted item with id:', id);
    updateInventoryDisplay();
    generateShoppingList();
    updateStats();
}

function updateInventoryDisplay() {
    const container = document.getElementById('inventoryList');
    if (!container) return;

    if (inventory.length === 0) {
        container.innerHTML = '<p style="color: #666; text-align: center;">No items in inventory. Add some items to get started!</p>';
        return;
    }

    const today = new Date();

    container.innerHTML = inventory.map(item => {
        let expiryBadge = '';
        if (item.expiryDate) {
            const expiry = new Date(item.expiryDate);
            const diffDays = Math.ceil((expiry - today) / (1000 * 60 * 60 * 24));

            if (diffDays < 0) {
                expiryBadge = `<span class="badge expired">Expired</span>`;
            } else if (diffDays <= 3) {
                expiryBadge = `<span class="badge expiring">Expiring Soon</span>`;
            } else {
                expiryBadge = `<span class="badge good">Expires: ${expiry.toDateString()}</span>`;
            }
        }

        return `
            <div class="inventory-item ${item.quantity <= item.threshold ? 'low-stock' : ''}">
                <div class="item-info">
                    <div class="item-name">
                        ${item.name.charAt(0).toUpperCase() + item.name.slice(1)}
                        ${item.quantity <= item.threshold ? '<span class="badge low">LOW STOCK</span>' : ''}
                        ${expiryBadge}
                    </div>
                    <div class="item-details">Minimum: ${item.threshold} ${item.unit}</div>
                </div>
                <div class="quantity-controls">
                    <button class="quantity-btn" onclick="decreaseQuantity(${item.id})">−</button>
                    <div class="item-quantity">${item.quantity} ${item.unit}</div>
                    <button class="quantity-btn" onclick="increaseQuantity(${item.id})">+</button>
                </div>
                <button class="delete-btn" onclick="deleteInventoryItem(${item.id})">×</button>
            </div>
        `;
    }).join('');
}


function addMonthlyRequirement() {
    const name = document.getElementById('monthlyItemName').value.trim().toLowerCase();
    const qty = parseInt(document.getElementById('monthlyQuantity').value);
    const unit = document.getElementById('monthlyUnit').value;

    if (!name || isNaN(qty) || qty < 1) {
        console.error('Add Monthly Error: Invalid input', { name, qty });
        alert('Please fill all fields with valid values');
        return;
    }

    const existing = monthlyRequirements.find(m => m.name === name);
    if (existing) {
        existing.qty = qty;
        existing.unit = unit;
        console.log(`Updated monthly requirement: ${name}, qty: ${qty}`);
    } else {
        monthlyRequirements.push({ id: Date.now(), name, qty, unit });
        console.log(`Added monthly requirement: ${name}, qty: ${qty}, unit: ${unit}`);
    }

    updateMonthlyDisplay();
    generateShoppingList();
    updateStats();

    document.getElementById('monthlyItemName').value = '';
    document.getElementById('monthlyQuantity').value = '';
    document.getElementById('monthlyUnit').value = 'kg';
}

function deleteMonthlyRequirement(id) {
    monthlyRequirements = monthlyRequirements.filter(m => m.id !== id);
    console.log('Deleted monthly requirement with id:', id);
    updateMonthlyDisplay();
    generateShoppingList();
    updateStats();
}

function updateMonthlyDisplay() {
    const container = document.getElementById('monthlyList');
    if (!container) {
        console.error('Monthly list container not found');
        return;
    }

    if (monthlyRequirements.length === 0) {
        container.innerHTML = '<p style="color: #666; text-align: center;">No monthly requirements set yet.</p>';
        return;
    }

    container.innerHTML = monthlyRequirements.map(m => `
                <div class="monthly-item">
                    <div class="item-info">
                        <div class="item-name">${m.name.charAt(0).toUpperCase() + m.name.slice(1)}</div>
                        <div class="item-details">Monthly: ${m.qty} ${m.unit}</div>
                    </div>
                    <button class="delete-btn" onclick="deleteMonthlyRequirement(${m.id})">×</button>
                </div>
            `).join('');
}

async function generateShoppingList() {
    shoppingList = [];

    inventory.forEach(item => {
        if (item.quantity <= item.threshold) {
            shoppingList.push({
                ...item,
                neededQuantity: Math.max(1, item.threshold - item.quantity),
                reason: 'low-stock'
            });
        }
    });

    monthlyRequirements.forEach(m => {
        const invItem = inventory.find(i => i.name === m.name);
        const currentQty = invItem ? invItem.quantity : 0;
        if (currentQty < m.qty) {
            const needed = m.qty - currentQty;
            const existing = shoppingList.find(s => s.name === m.name);
            if (existing) {
                existing.neededQuantity = Math.max(existing.neededQuantity, needed);
                existing.reason = 'monthly-and-low';
            } else {
                shoppingList.push({
                    id: Date.now(),
                    name: m.name,
                    quantity: currentQty,
                    threshold: invItem ? invItem.threshold : 0,
                    neededQuantity: needed,
                    unit: m.unit,
                    reason: 'monthly'
                });
            }
        }
    });

    await updateShoppingListDisplay();
}

async function updateShoppingListDisplay() {
    const container = document.getElementById('shoppingList');
    if (!container) {
        console.error('Shopping list container not found');
        return;
    }

    if (shoppingList.length === 0) {
        container.innerHTML = '<p style="color: #666; text-align: center;">All items are well stocked! No shopping needed right now.</p>';
        return;
    }

    container.innerHTML = await Promise.all(shoppingList.map(async item => {
        const priceInfo = await getEstimatedPrice(item.name, item.neededQuantity);
        return `
                    <div class="shopping-list-item">
                        <div>
                            <strong>${item.name.charAt(0).toUpperCase() + item.name.slice(1)}</strong>
                            <div style="font-size: 12px; color: #666;">Need: ${item.neededQuantity} ${item.unit} (${item.reason})</div>
                        </div>
                        <div style="text-align: right;">
                            ${priceInfo}
                        </div>
                    </div>
                `;
    })).then(results => results.join(''));
}

async function getEstimatedPrice(itemName, quantity) {
    const prices = await fetchPrices(itemName);
    if (prices && prices.length > 0) {
        const avgPrice = prices.reduce((sum, p) => sum + p.price, 0) / prices.length;
        const totalPrice = (avgPrice * quantity).toFixed(0);
        return `<span style="color: #16a085; font-weight: 600;">₹${totalPrice}</span>`;
    }
    const fallbackPrices = fallbackPriceDatabase[itemName];
    if (!fallbackPrices) return '<span style="color: #666;">Price varies</span>';
    const avgPrice = Object.values(fallbackPrices).reduce((a, b) => a + b, 0) / Object.values(fallbackPrices).length;
    const totalPrice = (avgPrice * quantity).toFixed(0);
    return `<span style="color: #16a085; font-weight: 600;">₹${totalPrice} (fallback)</span>`;
}

async function fetchPrices(itemName) {
    try {
        const response = await fetch(`${API_ENDPOINT}?query=${encodeURIComponent(itemName)}`, {
            method: 'GET',
            headers: {
                'X-RapidAPI-Key': API_KEY,
                'X-RapidAPI-Host': 'price-comparison-api.p.rapidapi.com'
            }
        });
        if (!response.ok) throw new Error(`API request failed: ${response.status}`);
        const data = await response.json();
        return data.prices || [];
    } catch (error) {
        console.error('API Error:', error);
        return null;
    }
}

async function generateOptimalShoppingList() {
    if (shoppingList.length === 0) {
        alert('No items needed for shopping right now!');
        return;
    }

    let optimalApp = '';
    let lowestCost = Infinity;
    let costBreakdown = {};

    const appPrices = {};
    await Promise.all(shoppingList.map(async item => {
        const prices = await fetchPrices(item.name);
        if (prices) {
            prices.forEach(p => {
                if (!appPrices[p.merchant]) appPrices[p.merchant] = { itemCost: 0, deliveryFee: p.deliveryFee || 0, freeDeliveryMin: p.freeDeliveryMin || 0 };
                appPrices[p.merchant].itemCost += p.price * item.neededQuantity;
            });
        } else {
            const fallback = fallbackPriceDatabase[item.name];
            if (fallback) {
                Object.entries(fallback).forEach(([app, price]) => {
                    if (!appPrices[app]) appPrices[app] = { itemCost: 0, deliveryFee: fallbackGroceryApps[app]?.deliveryFee || 0, freeDeliveryMin: fallbackGroceryApps[app]?.freeDeliveryMin || 0 };
                    appPrices[app].itemCost += price * item.neededQuantity;
                });
            }
        }
    }));

    Object.keys(appPrices).forEach(app => {
        const { itemCost, deliveryFee, freeDeliveryMin } = appPrices[app];
        const finalCost = itemCost + (itemCost >= freeDeliveryMin ? 0 : deliveryFee);
        costBreakdown[app] = { itemCost, deliveryFee, finalCost };
        if (finalCost < lowestCost) {
            lowestCost = finalCost;
            optimalApp = app;
        }
    });

    if (optimalApp) {
        const breakdown = costBreakdown[optimalApp];
        alert(`🎯 Optimal Shopping Recommendation:\n\nBest App: ${optimalApp}\nItem Cost: ₹${breakdown.itemCost.toFixed(0)}\nDelivery Fee: ₹${breakdown.deliveryFee}\nTotal Cost: ₹${breakdown.finalCost.toFixed(0)}\n\nThis will save you money compared to other apps!`);
    } else {
        alert('Unable to find optimal pricing for current shopping list items.');
    }
}

async function searchPrices() {
    const searchTerm = document.getElementById('searchItem').value.trim().toLowerCase();
    if (!searchTerm) {
        alert('Please enter an item to search');
        return;
    }

    const results = document.getElementById('searchResults');
    const prices = await fetchPrices(searchTerm);

    if (!prices || prices.length === 0) {
        const fallbackPrices = fallbackPriceDatabase[searchTerm];
        if (!fallbackPrices) {
            results.innerHTML = `
                        <div class="result-card">
                            <div class="result-title">No Price Data Available</div>
                            <p>Sorry, we don't have pricing information for "${searchTerm}" yet. Try searching for common items like rice, milk, bread, tomatoes, onions, potatoes, eggs, chicken, oil, or sugar.</p>
                        </div>
                    `;
            return;
        }

        const sortedPrices = Object.entries(fallbackPrices).sort((a, b) => a[1] - b[1]);
        const cheapest = sortedPrices[0];
        const mostExpensive = sortedPrices[sortedPrices.length - 1];

        results.innerHTML = `
                    <div class="result-card">
                        <div class="result-title">💰 Price Comparison for "${searchTerm.charAt(0).toUpperCase() + searchTerm.slice(1)}" (Fallback Data)</div>
                        <div class="price-comparison">
                            ${sortedPrices.map(([app, price], index) => `
                                <div class="price-item" style="${index === 0 ? 'background: #d4efdf; border-color: #16a085;' : ''}">
                                    <div class="app-name">
                                        ${app} ${index === 0 ? '🏆' : ''}
                                        ${fallbackGroceryApps[app].freeDeliveryMin > 0 ?
                `<small style="color: #666;">(Free delivery on ₹${fallbackGroceryApps[app].freeDeliveryMin}+)</small>` :
                '<small style="color: #666;">(Free delivery)</small>'}
                                    </div>
                                    <div class="price">₹${price}</div>
                                </div>
                            `).join('')}
                            <div style="margin-top: 15px; padding-top: 15px; border-top: 1px solid #ddd; font-size: 14px;">
                                <strong>💡 Smart Tip:</strong> ${cheapest[0]} offers the best price at ₹${cheapest[1]}. 
                                You'll save ₹${mostExpensive[1] - cheapest[1]} compared to the most expensive option (${mostExpensive[0]}).
                            </div>
                        </div>
                    </div>
                `;
        return;
    }

    const sortedPrices = prices.sort((a, b) => a.price - b.price);
    const cheapest = sortedPrices[0];
    const mostExpensive = sortedPrices[sortedPrices.length - 1];

    results.innerHTML = `
                <div class="result-card">
                    <div class="result-title">💰 Price Comparison for "${searchTerm.charAt(0).toUpperCase() + searchTerm.slice(1)}"</div>
                    <div class="price-comparison">
                        ${sortedPrices.map((item, index) => `
                            <div class="price-item" style="${index === 0 ? 'background: #d4efdf; border-color: #16a085;' : ''}">
                                <div class="app-name">
                                    ${item.merchant} ${index === 0 ? '🏆' : ''}
                                    ${item.freeDeliveryMin > 0 ?
            `<small style="color: #666;">(Free delivery on ₹${item.freeDeliveryMin}+)</small>` :
            '<small style="color: #666;">(Free delivery)</small>'}
                                </div>
                                <div class="price">₹${item.price}</div>
                            </div>
                        `).join('')}
                        <div style="margin-top: 15px; padding-top: 15px; border-top: 1px solid #ddd; font-size: 14px;">
                            <strong>💡 Smart Tip:</strong> ${cheapest.merchant} offers the best price at ₹${cheapest.price}. 
                            You'll save ₹${mostExpensive.price - cheapest.price} compared to the most expensive option (${mostExpensive.merchant}).
                            <br><small>Prices powered by RapidAPI.</small>
                        </div>
                    </div>
                </div>
            `;
}

function updateStats() {
    const lowStockCount = inventory.filter(item => item.quantity <= item.threshold).length;
    let estimatedCost = 0;

    Promise.all(shoppingList.map(async item => {
        const prices = await fetchPrices(item.name);
        if (prices && prices.length > 0) {
            const avgPrice = prices.reduce((sum, p) => sum + p.price, 0) / prices.length;
            return avgPrice * item.neededQuantity;
        }
        const fallbackPrices = fallbackPriceDatabase[item.name];
        if (fallbackPrices) {
            const avgPrice = Object.values(fallbackPrices).reduce((a, b) => a + b, 0) / Object.values(fallbackPrices).length;
            return avgPrice * item.neededQuantity;
        }
        return 0;
    })).then(costs => {
        estimatedCost = costs.reduce((total, cost) => total + cost, 0);
        document.getElementById('totalItems').textContent = inventory.length;
        document.getElementById('lowStockItems').textContent = lowStockCount;
        document.getElementById('shoppingListCount').textContent = shoppingList.length;
        document.getElementById('estimatedCost').textContent = `₹${estimatedCost.toFixed(0)}`;
    });
}

function startScanner() {
    const reader = document.getElementById('reader');
    if (!reader) {
        console.error('Scanner container not found');
        alert('Scanner not available');
        return;
    }
    reader.style.display = 'block';

    scanner = new Html5Qrcode("reader");
    const config = { fps: 10, qrbox: { width: 250, height: 250 } };

    scanner.start(
        { facingMode: "environment" },
        config,
        onScanSuccess,
        onScanFailure
    ).catch(err => {
        console.error('Scanner start error:', err);
        alert('Failed to start scanner: ' + err);
        reader.style.display = 'none';
    });
}

async function onScanSuccess(decodedText, decodedResult) {
    if (scanner) {
        scanner.stop();
        document.getElementById('reader').style.display = 'none';
    }

    try {
        const response = await fetch(`${OFF_API}${decodedText}.json`);
        const data = await response.json();
        if (data.status === 1) {
            const product = data.product;
            const name = product.product_name || product.generic_name || 'Unknown Item';
            let quantity = 1;
            let unit = 'pieces';

            if (product.quantity) {
                const match = product.quantity.match(/(\d+)\s*(\w+)/);
                if (match) {
                    quantity = parseInt(match[1]);
                    unit = match[2].toLowerCase();
                    if (unit === 'g') unit = 'grams';
                    if (!['kg', 'grams', 'liters', 'pieces', 'packets', 'bottles'].includes(unit)) {
                        unit = 'pieces';
                    }
                }
            }

            document.getElementById('itemName').value = name;
            document.getElementById('currentQuantity').value = quantity;
            document.getElementById('minThreshold').value = 1;
            document.getElementById('unit').value = unit;

            addInventoryItem(name, quantity, 1, unit);
            alert(`Item scanned and added: ${name}`);
        } else {
            alert('Product not found in database. Please enter manually.');
        }
    } catch (error) {
        console.error('Scan fetch error:', error);
        alert('Error fetching product info: ' + error);
    }
}

function onScanFailure(error) {
    console.warn(`Scan error: ${error}`);
}


updateInventoryDisplay();
updateMonthlyDisplay();
generateShoppingList();
updateStats();

document.getElementById('searchItem').addEventListener('keypress', function (e) {
    if (e.key === 'Enter') {
        searchPrices();
    }
});

document.addEventListener('keypress', function (e) {
    if (e.key === 'Enter' && (
        document.activeElement.id === 'itemName' ||
        document.activeElement.id === 'currentQuantity' ||
        document.activeElement.id === 'minThreshold'
    )) {
        addInventoryItem();
    }
    if (e.key === 'Enter' && (
        document.activeElement.id === 'monthlyItemName' ||
        document.activeElement.id === 'monthlyQuantity'
    )) {
        addMonthlyRequirement();
    }
});
// Expose functions for inline HTML usage
window.addInventoryItem = addInventoryItem;
window.increaseQuantity = increaseQuantity;
window.decreaseQuantity = decreaseQuantity;
window.deleteInventoryItem = deleteInventoryItem;
window.addMonthlyRequirement = addMonthlyRequirement;
window.deleteMonthlyRequirement = deleteMonthlyRequirement;
window.searchPrices = searchPrices;
window.generateOptimalShoppingList = generateOptimalShoppingList;
window.startScanner = startScanner;

