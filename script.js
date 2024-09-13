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

        updateGoodsDisplay(); // Create goods elements once
        updateResourceDisplay();
        gameLoop();
    })
    .catch(error => {
        console.error('Error loading goods data:', error);
    });

function updateResourceDisplay() {
    resourceList.innerHTML = '';
    const moneyItem = document.createElement('li');
    moneyItem.textContent = `Money: $${money.toFixed(2)}`;
    resourceList.appendChild(moneyItem);

    goods.forEach(good => {
        const li = document.createElement('li');

        // Create a text node for the resource amount
        const resourceText = document.createTextNode(`${good.name}: ${Math.floor(resources[good.id])} `);

        li.appendChild(resourceText);

        // Add Sell Button
        const sellButton = document.createElement('button');
        sellButton.textContent = 'Sell';
        sellButton.className = 'sell-button';
        sellButton.disabled = Math.floor(resources[good.id]) === 0;
        sellButton.addEventListener('click', () => {
            sellGood(good.id);
        });

        li.appendChild(sellButton);
        resourceList.appendChild(li);
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

    const h2 = document.createElement('h2');
    h2.textContent = good.name;
    div.appendChild(h2);

    const pFactories = document.createElement('p');
    pFactories.textContent = `Factories Owned: ${good.factories}`;
    div.appendChild(pFactories);

    const pProduction = document.createElement('p');
    pProduction.textContent = good.baseProduction ? `Produces ${good.production} ${good.name} per second` : `Produces ${good.name} using inputs`;
    div.appendChild(pProduction);

    // Display required inputs
    if (!good.baseProduction) {
        const pInputs = document.createElement('p');
        const inputList = good.inputs.map(input => {
            const inputGood = goods.find(g => g.id === input.goodId);
            return `${input.quantity} ${inputGood.name}`;
        }).join(', ');
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
