
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

        initializeResourceDisplay(); //  resource elements once
        updateResourceDisplay();
        gameLoop();
    })
    .catch(error => {
        console.error('Error loading goods data:', error);
    });

// Function to initialize the resource display
function initializeResourceDisplay() {
    resourceList.innerHTML = '';


    const resourcePanel = document.createElement('div');
    resourcePanel.className = 'resource-item';

    const emojiSpan = document.createElement('div');
    emojiSpan.className = 'good-emoji';
    emojiSpan.textContent = "💰";
    resourcePanel.appendChild(emojiSpan);

    const resourceName = document.createElement('h3');
    resourceName.textContent = "Money";
    resourcePanel.appendChild(resourceName);

    // Add Money Display to Resource Panel
    const moneyItem = document.createElement('p');
    moneyItem.style.fontWeight = 'bold';
    resourcePanel.appendChild(moneyItem);


    // Store reference to money display for updates
    window.moneyDisplay = moneyItem;

    // Add Sell All Button
    const sellAllButton = document.createElement('button');
    sellAllButton.textContent = 'Sell All Goods';
    sellAllButton.className = 'sell-button';
    sellAllButton.addEventListener('click', sellAllGoods);
    resourcePanel.appendChild(sellAllButton);

    resourceList.appendChild(resourcePanel);


    // Store references to resource displays
    goods.forEach(good => {
        const resourceItem = document.createElement('div');
        resourceItem.className = 'resource-item';

        // Hide div by default if not baseProduction
        if (!good.baseProduction) {
            resourceItem.style.display = 'none';
        }

        good.resourceDiv = resourceItem;

        // Create a heading for the resource
        // Add emoji
        if (good.emoji) {
            const emojiSpan = document.createElement('div');
            emojiSpan.className = 'good-emoji';
            emojiSpan.textContent = good.emoji;
            resourceItem.appendChild(emojiSpan);
        }

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

        // Add Sell Button with Sell Price
        const sellButton = document.createElement('button');
        sellButton.textContent = `Sell ($${good.sellPrice} each)`;
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

        const pProduction = document.createElement('p');
        resourceItem.appendChild(pProduction);

        // Display required inputs
        if (!good.baseProduction) {
            const pInputs = document.createElement('p');
            const inputList = good.inputs
                .map(input => {
                    const inputGood = goods.find(g => g.id === input.goodId);
                    return `${input.quantity} ${inputGood.emoji}`;
                })
                .join(', ');
            pInputs.textContent = `Requires: ${inputList}`;
            resourceItem.appendChild(pInputs);
        }

        const buy_button = document.createElement('button');
        buy_button.className = 'buy-button';
        buy_button.textContent = `Buy Factory (${good.factories} owned)`;

        // Store references for later updates
        good.button = buy_button;
        good.pProduction = pProduction;

        // Update button state based on available money
        function updateButtonState() {
            good.pProduction.textContent = `Max production: +${good.production * good.factories} ${good.emoji}/sec`;
        }

        buy_button.addEventListener('click', () => {
            number = Math.max(1, Math.floor(money * .05 / good.cost));

            if (money >= good.cost * number) {
                money -= good.cost * number;
                good.factories += number;
                updateResourceDisplay();
                updateButtonStates();
            }
        });

        updateButtonState();
        resourceItem.appendChild(buy_button);
    });
}

function updateResourceDisplay() {
    // Update money display
    window.moneyDisplay.textContent = `$${money.toFixed(2)}`;

    goods.forEach(good => {
        // Update resource quantities and sell button states
        if (good.resourceDiv.style.display === 'none' && money >= good.cost) {
            // Check if the good can be produced using the inputs
            let canProduce = true;
            if (!good.baseProduction) {
                good.inputs.forEach(input => {
                    if (resources[input.goodId] < input.quantity) {
                        canProduce = false;
                    }
                });
            }
            if (canProduce) {
                good.resourceDiv.style.display = 'block';
            }
        }

        if (good.resourceDiv.style.display === 'none') {
            return;
        }

        good.quantityValue.textContent = `${Math.floor(resources[good.id])}`;
        good.sellButton.disabled = Math.floor(resources[good.id]) === 0;
        good.pProduction.textContent = `Max production: +${good.production * good.factories} ${good.emoji}/sec`;
        good.pProduction.title = `Number of factories: ${good.factories}`;
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

function sellAllGoods() {
    goods.forEach(good => {
        sellGood(good.id);
    });
}

function updateButtonStates() {
    goods.forEach(good => {
        if (good.button) {
            if (money >= good.cost) {
                good.button.disabled = false;
                good.button.textContent = `Buy Factory (Costs $${good.cost})`;
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
                let table = {};

                // create a table with the number of goods we can produce based on the inputs
                good.inputs.forEach(input => {
                    if (resources[input.goodId] <= 0) {
                        table[input.goodId] = 0;
                    }
                    else {

                        table[input.goodId] = Math.floor(resources[input.goodId] / input.quantity);
                    }
                });

                // find the minimum value in the table
                let maxProductionAllowedByRessources = Math.min(...Object.values(table));

                let enabledFactories = Math.min(good.factories, maxProductionAllowedByRessources);

                if (enabledFactories === 0) {
                    return;
                }

                good.inputs.forEach(input => {
                    resources[input.goodId] -= input.quantity * enabledFactories * deltaTime;
                });
                resources[good.id] += enabledFactories * good.production * deltaTime;
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

    requestAnimationFrame(gameLoop);
}