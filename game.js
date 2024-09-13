// game.js

let goods = [];
let resources = {};
let money = 100;

const resourceList = document.getElementById('resource-list');
const goodsContainer = document.getElementById('goods-container');

// Fetch the goods data from goods.json
fetch('goods.json')
    .then(response => response.json())
    .then(data => {
        goods = data;
        // Initialize resources
        goods.forEach(good => {
            resources[good.id] = 0;
        });

        initializeResourceDisplay(); // Create resource elements once
        updateGoodsDisplay(); // Create goods elements once
        updateResourceDisplay();
        gameLoop();
    })
    .catch(error => {
        console.error('Error loading goods data:', error);
    });

// Function to initialize the resource display
function initializeResourceDisplay() {
    resourceList.innerHTML = '';

    // Create and store money display
    const moneyItem = document.createElement('div');
    moneyItem.className = 'resource-item';
    moneyItem.style.width = '100%';
    moneyItem.innerHTML = `<h3>Money: $<span id="money-display">${money.toFixed(2)}</span></h3>`;
    resourceList.appendChild(moneyItem);

    // Store reference to money display for updates
    window.moneyDisplay = document.getElementById('money-display');

    // Store references to resource displays
    goods.forEach(good => {
        const resourceItem = document.createElement('div');
        resourceItem.className = 'resource-item';

        // Create a heading for the resource
        const resourceName = document.createElement('h3');
        resourceName.textContent = good.name;
        resourceItem.appendChild(resourceName);

        // Create a span to hold the quantity
        const quantitySpan = document.createElement('p');
        quantitySpan.textContent = `Quantity: `;
        const quantityValue = document.createElement('span');
        quantityValue.textContent = `${Math.floor(resources[good.id])}`;
        quantitySpan.appendChild(quantityValue);
        resourceItem.appendChild(quantitySpan);

        // Add Sell Button
        const sellButton = document.createElement('button');
        sellButton.textContent = 'Sell';
        sellButton.className = 'sell-button';
        sellButton.disabled = Math.floor(resources[good.id]) === 0;
        sellButton.addEventListener('click', () => {
            sellGood(good.id);
        });

        resourceItem.appendChild(sellButton);
        resourceList.appendChild(resourceItem);

        // Store references for updates
        good.quantityValue = quantityValue;
        good.sellButton = sellButton;
    });
}

function updateResourceDisplay() {
    // Update money display
    window.moneyDisplay.textContent = `${money.toFixed(2)}`;

    // Update resource quantities and sell button states
    goods.forEach(good => {
        good.quantityValue.textContent = `${Math.floor(resources[good.id])}`;
        good.sellButton.disabled = Math.floor(resources[good.id]) === 0;
    });
}

function sellGood(goodId) {
    const quantity = Math.floor(resources[goodId]);
    if (quantity > 0) {
        const good = goods.find(g => g.id === goodId);
        const totalSale = quantity * good.sellPrice;
        money += totalSale;
        resources[goodId] -= quantity;
        updateResourceDisplay();
        updateButtonStates();
    }
}

function createGoodElement(good) {
    const div = document.createElement('div');
    div.className = 'good';

    // Add emoji
    if (good.emoji) {
        const emojiSpan = document.createElement('div');
        emojiSpan.className = 'good-emoji';
        emojiSpan.textContent = good.emoji;
        div.appendChild(emojiSpan);
    }

    const h2 = document.createElement('h2');
    h2.textContent = good.name;
    div.appendChild(h2);

    const pFactories = document.createElement('p');
    pFactories.textContent = `Factories Owned: ${good.factories}`;
    div.appendChild(pFactories);

    const pProduction = document.createElement('p');
    pProduction.textContent = good.baseProduction
        ? `Produces ${good.production} ${good.name} per second`
        : `Produces ${good.name} using inputs`;
    div.appendChild(pProduction);

    // Display required inputs
    if (!good.baseProduction) {
        const pInputs = document.createElement('p');
        const inputList = good.inputs
            .map(input => {
                const inputGood = goods.find(g => g.id === input.goodId);
                return `${input.quantity} ${inputGood.name}`;
            })
            .join(', ');
        pInputs.textContent = `Requires: ${inputList}`;
        div.appendChild(pInputs);
    }

    const pCost = document.createElement('p');
    pCost.textContent = `Factory Cost: $${good.cost}`;
    div.appendChild(pCost);

    const button = document.createElement('button');
    button.className = 'buy-button';
    button.textContent = 'Buy Factory';

    // Store references for later updates
    good.button = button;
    good.pFactories = pFactories;

    // Update button state based on available money
    function updateButtonState() {
        if (money >= good.cost) {
            button.disabled = false;
            button.textContent = 'Buy Factory';
        } else {
            button.disabled = true;
            button.textContent = 'Not enough money';
        }
    }

    button.addEventListener('click', () => {
        if (money >= good.cost) {
            money -= good.cost;
            good.factories += 1;
            good.pFactories.textContent = `Factories Owned: ${good.factories}`;
            updateResourceDisplay();
            updateButtonStates();
        }
    });

    updateButtonState();
    div.appendChild(button);

    return div;
}


function updateGoodsDisplay() {
    goodsContainer.innerHTML = '';
    goods.forEach(good => {
        const goodElement = createGoodElement(good);
        goodsContainer.appendChild(goodElement);
    });
}

function updateButtonStates() {
    goods.forEach(good => {
        if (good.button) {
            if (money >= good.cost) {
                good.button.disabled = false;
                good.button.textContent = 'Buy Factory';
            } else {
                good.button.disabled = true;
                good.button.textContent = 'Not enough money';
            }
        }
    });
}

function produceGoods() {
    goods.forEach(good => {
        if (good.factories > 0) {
            if (good.baseProduction) {
                resources[good.id] += good.production * good.factories * deltaTime;
            } else {
                // Check if inputs are available
                let canProduce = true;
                good.inputs.forEach(input => {
                    if (resources[input.goodId] < input.quantity * good.factories * deltaTime) {
                        canProduce = false;
                    }
                });
                if (canProduce) {
                    good.inputs.forEach(input => {
                        resources[input.goodId] -= input.quantity * good.factories * deltaTime;
                    });
                    resources[good.id] += good.factories * deltaTime;
                }
            }
        }
    });
}

let lastUpdateTime = Date.now();
let deltaTime = 0;

function gameLoop() {
    const now = Date.now();
    deltaTime = (now - lastUpdateTime) / 1000; // Convert to seconds
    lastUpdateTime = now;

    produceGoods();
    updateResourceDisplay();
    updateButtonStates();

    // Update factories owned display
    goods.forEach(good => {
        if (good.pFactories) {
            good.pFactories.textContent = `Factories Owned: ${good.factories}`;
        }
    });

    requestAnimationFrame(gameLoop);
}