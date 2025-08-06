// ========== Feature Tab Navigation/Section Switching ==========
function setupTabNavigation() {
    const sections = [
        { btn: 'dashboard-btn', sec: 'dashboard-section' },
        { btn: 'visualize-btn', sec: 'visualize-section' },
        { btn: 'transactions-btn', sec: 'transactions-section' },
        { btn: 'mutualfunds-btn', sec: 'mutualfunds-section' },
        { btn: 'calculatetax-btn', sec: 'calculatetax-section' }
    ];

    function showSection(sectionIdToShow) {
        sections.forEach(({ sec }) => {
            const el = document.getElementById(sec);
            if (el) el.style.display = (sec === sectionIdToShow) ? '' : 'none';
        });
    }

    sections.forEach(({ btn, sec }) => {
        const btnEl = document.getElementById(btn);
        if (btnEl) {
            btnEl.addEventListener('click', function () {
                document.querySelectorAll('.feature-btn').forEach(b => b.classList.remove('active'));
                btnEl.classList.add('active');
                showSection(sec);
            });
        }
    });

    // On first load, show only dashboard
    showSection('dashboard-section');
}

async function renderHoldingsWithLiveData(holdings) {
    const holdingsTable = document.querySelector('.holdings-section tbody');
    if (!holdingsTable) return;

    if (holdings.length === 0) {
        holdingsTable.innerHTML = `<tr><td colspan="7" style="text-align:center;">No holdings found.</td></tr>`;
        return;
    }

    holdingsTable.innerHTML = ''; // Clear existing rows

    for (const stock of holdings) {
        const { symbol, namee, quantity, buy_price } = stock;

        // Fetch live stock data
        const { currentPrice, previousClose } = await fetchLiveStockData(symbol);

        // Calculate day change and profit/loss
        const dayChange = currentPrice - previousClose;
        const dayChangePercentage = previousClose > 0 ? (dayChange / previousClose) * 100 : 0;
        const profitLoss = (currentPrice - buy_price) * quantity;
        const profitLossPercentage = buy_price > 0 ? ((currentPrice - buy_price) / buy_price) * 100 : 0;

        console.log(`Rendering stock: ${symbol}, Current Price: ${currentPrice}, Day Change: ${dayChange}, Profit/Loss: ${profitLoss}`);

        // Add row to holdings table
        const newRow = `
            <tr>
                <td><a class="symbol-link" href="#">${symbol}</a></td>
                <td>${namee}</td>
                <td>${quantity}</td>
                <td>$${(+buy_price).toFixed(2)}</td>
                <td>$${currentPrice.toFixed(2)}</td>
                <td class="${dayChange >= 0 ? 'positive' : 'negative'}">
                    ${dayChange >= 0 ? '+' : '-'}$${Math.abs(dayChange).toFixed(2)}
                    <span class="percentage-chip">(${dayChangePercentage.toFixed(2)}%)</span>
                </td>
                <td class="${profitLoss >= 0 ? 'positive' : 'negative'}">
                    ${profitLoss >= 0 ? '+' : '-'}$${Math.abs(profitLoss).toFixed(2)}
                    <span class="percentage-chip">(${profitLossPercentage.toFixed(2)}%)</span>
                </td>
            </tr>
        `;
        holdingsTable.innerHTML += newRow;
    }
}

async function fetchHoldings() {
    try {
        const response = await fetch('http://localhost:3000/api/holdings');
        console.log(response);
        if (!response.ok) throw new Error('Failed to fetch holdings');
        return await response.json();
    } catch (error) {
        console.error('Error fetching holdings:', error.message);
        return [];
    }
}
async function fetchLiveStockData(symbol) {
    try {
        const url = `http://localhost:3000/api/finance/${symbol}`;
        const response = await fetch(url);
        const data = await response.json();
        const meta = data.chart.result[0].meta;

        const currentPrice = meta.regularMarketPrice || 0; // Current price
        const previousClose = meta.previousClose || 0; // Previous closing price

        return { currentPrice, previousClose };
    } catch (error) {
        console.error(`Error fetching live data for ${symbol}:`, error.message);
        return { currentPrice: 0, previousClose: 0 };
    }
}
// ========== Modal Logic ==========
function setupAddStockModal() {
    const modal = document.getElementById('add-stock-modal');
    const openBtn = document.getElementById('add-stock-btn');
    const closeBtn = document.getElementById('close-stock-modal');
    const form = document.getElementById('add-stock-form');

    // Open modal
    openBtn.addEventListener('click', () => {
        modal.style.display = 'block';
    });

    // Close modal
    closeBtn.addEventListener('click', () => {
        modal.style.display = 'none';
    });

    // Close modal when clicking outside of it
    window.addEventListener('click', (event) => {
        if (event.target === modal) {
            modal.style.display = 'none';
        }
    });

    // Handle form submission
    form.addEventListener('submit', async (event) => {
        event.preventDefault();

        // Get form values
        const symbol = document.getElementById('stock-symbol').value;
        const name = document.getElementById('stock-name').value;
        const quantity = parseInt(document.getElementById('stock-quantity').value, 10);
        const buyPrice = parseFloat(document.getElementById('stock-buy-price').value);
        const buyDate = document.getElementById('stock-buy-date').value;


        // Send data to backend
        try {
            const response = await fetch('http://localhost:3000/api/addasset', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ symbol, name, quantity, buyPrice, buyDate }),
            });

            if (!response.ok) throw new Error('Failed to add stock');

            const newStock = await response.json();

            // Update holdings table dynamically
            const holdingsTable = document.querySelector('.holdings-section tbody');
            const newRow = `
                <tr>
                    <td><a class="symbol-link" href="#">${newStock.symbol}</a></td>
                    <td>${newStock.name}</td>
                    <td>${newStock.quantity}</td>
                    <td>$${newStock.buyPrice.toFixed(2)}</td>
                    <td>$0.00</td>
                    <td class="positive">+0.00 <span class="percentage-chip">(+0.00%)</span></td>
                    <td class="positive">+$0.00 <span class="percentage-chip">(+0.00%)</span></td>
                </tr>
            `;
            holdingsTable.innerHTML += newRow;
            console.log('Stock added successfully:', newStock); 

            // Close modal
            modal.style.display = 'none';
            form.reset();
        } catch (error) {
            console.error('Error adding stock:', error.message);
        }
    });
}

// Initialize modal logic
setupAddStockModal();

// ========== Fetch Portfolio Metrics ==========
async function fetchPortfolioMetrics() {
    try {
        const response = await fetch('http://localhost:3000/api/portfolio/metrics');
        if (!response.ok) throw new Error('Failed to fetch portfolio metrics');
        return await response.json();
    } catch (error) {
        console.error('Error fetching portfolio metrics:', error.message);
        return null;
    }
}

function renderPortfolioMetrics(data) {
    if (!data) return;

    const { totalInvested, portfolioValue, profitLoss, dayChange } = data;

    // Update Dashboard Section
    const portfolioValueEl = document.getElementById('portfolio-value');
    const totalInvestedEl = document.getElementById('total-invested');
    const totalPnlEl = document.getElementById('total-pnl');
    const dayChangeEl = document.getElementById('day-change');

    if (portfolioValueEl) portfolioValueEl.innerHTML = `Rs.<span>${portfolioValue.toLocaleString()}</span>`;
    if (totalInvestedEl) totalInvestedEl.innerHTML = `Rs.<span>${totalInvested.toLocaleString()}</span>`;
    if (dayChangeEl) {
        dayChangeEl.className = dayChange >= 0 ? 'value positive' : 'value negative';
        dayChangeEl.innerHTML = `${dayChange >= 0 ? '+' : '-'}Rs.${Math.abs(dayChange).toLocaleString()}`;
    }
    if (totalPnlEl) {
        totalPnlEl.className = profitLoss >= 0 ? 'value positive' : 'value negative';
        totalPnlEl.innerHTML = `${profitLoss >= 0 ? '+' : '-'}Rs.${Math.abs(profitLoss).toLocaleString()}`;
    }

    // Update Visualize Section
    const pieChart = document.getElementById('pieChart');
    const pieLegend = document.getElementById('pie-legend');
    const centerTotal = document.getElementById('center-total');

    const profit = profitLoss > 0 ? profitLoss : 0;
    const loss = profitLoss < 0 ? -profitLoss : 0;
    const total = totalInvested + profit + loss;

    const investedAngle = (totalInvested / total) * 360;
    const profitAngle = (profit / total) * 360;
    const lossAngle = (loss / total) * 360;

    let nextAngle = 0;
    const slices = [
        { deg: investedAngle, color: '#2c7cff' },
        { deg: profitAngle, color: '#39ea85' },
        { deg: lossAngle, color: '#ffa386' }
    ];
    const gradientParts = slices
        .filter(s => s.deg > 0)
        .map(s => {
            const part = `${s.color} ${nextAngle}deg ${nextAngle + s.deg}deg`;
            nextAngle += s.deg;
            return part;
        });

    if (pieChart)
        pieChart.style.background = `conic-gradient(${gradientParts.join(',')})`;
    if (centerTotal)
        centerTotal.textContent = `$${portfolioValue.toLocaleString()}`;
    if (pieLegend) {
        pieLegend.innerHTML = `
            <div><span class="legend-color invested"></span> Invested: $${totalInvested.toLocaleString()}</div>
            <div><span class="legend-color profit"></span> Profit: $${profit.toLocaleString()}</div>
            <div><span class="legend-color loss"></span> Loss: $${loss.toLocaleString()}</div>
        `;
    }
}

// ========== Fetch Transactions ==========
async function fetchTransactions() {
    try {
        const response = await fetch('http://localhost:3000/api/transactions'); // Replace with your backend API URL
        if (!response.ok) throw new Error('Failed to fetch transactions');
        return await response.json();
    } catch (error) {
        console.error('Error fetching transactions:', error.message);
        return [];
    }
}

function renderTransactions(transactions) {
    const body = document.getElementById('transactions-table-body');
    if (!body) return;
    if (!transactions.length) {
        body.innerHTML = `<tr><td colspan="7" style="text-align:center;color:#aaa;">No transactions yet.</td></tr>`;
        return;
    }
    body.innerHTML = transactions.map(tr => `
        <tr>
            <td>${tr.datetime}</td>
            <td class="${tr.type.toLowerCase()}">${tr.type}</td>
            <td>${tr.symbol}</td>
            <td>${tr.name || '-'}</td>
            <td>${tr.qty}</td>
            <td>$${(+tr.price).toLocaleString()}</td>
            <td>$${(+tr.total).toLocaleString()}</td>
        </tr>
    `).join('');
}

// ========== Periodic Updates ==========
function startPeriodicUpdates(interval = 5000) {
    setInterval(async () => {
        const portfolioMetrics = await fetchPortfolioMetrics();
        renderPortfolioMetrics(portfolioMetrics);

        const transactions = await fetchTransactions();
        renderTransactions(transactions);
    }, interval);
}

// ========== Initialize App ==========
async function initializeApp() {
    setupTabNavigation();
    setupAddStockModal();

    const holdings = await fetchHoldings();
    await renderHoldingsWithLiveData(holdings); // Render holdings with live data

    const portfolioMetrics = await fetchPortfolioMetrics();
    renderPortfolioMetrics(portfolioMetrics);

    const transactions = await fetchTransactions();
    renderTransactions(transactions);

    startPeriodicUpdates(); // Start periodic updates every 5 seconds
}

// Start the app
initializeApp();