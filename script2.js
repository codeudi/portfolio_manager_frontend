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

// Dummy data for investments across assets


// Dummy data for portfolio performance

async function fetchInvestmentsData() {
    try {
        const response = await fetch('http://localhost:3000/api/investments'); // Replace with your backend API URL
        if (!response.ok) throw new Error('Failed to fetch investments data');
        return await response.json();
    } catch (error) {
        console.error('Error fetching investments data:', error.message);
        return [];
    }
}

async function renderInvestmentsPieChart() {
    const investmentsData = await fetchInvestmentsData();

    // Log the data being passed to the chart
    console.log('Rendering pie chart with data:', investmentsData);

    // Extract labels (asset names) and data (investment amounts)
    const labels = investmentsData.map(asset => asset.name);
    const data = investmentsData.map(asset => asset.investment);

    // Dynamically generate colors for the chart
    const colors = labels.map((_, index) => {
        const hue = (index * 360) / labels.length; // Spread colors evenly across the hue spectrum
        return `hsl(${hue}, 70%, 50%)`; // Generate HSL color
    });

    const ctx = document.getElementById('investmentsPieChart').getContext('2d');

    // Create the pie chart
    new Chart(ctx, {
        type: 'pie',
        data: {
            labels: labels,
            datasets: [{
                label: 'Investments',
                data: data,
                backgroundColor: colors, // Use dynamically generated colors
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            plugins: {
                legend: {
                    display: false // Disable the default Chart.js legend
                }
            }
        }
    });

    // Generate a custom legend
    const legendContainer = document.getElementById('pie-chart-legend'); // Ensure this element exists in your HTML
    if (legendContainer) {
        // Clear the legend container before adding new content
        legendContainer.innerHTML = '';

        legendContainer.innerHTML = investmentsData.map((asset, index) => `
            <div style="display: flex; align-items: center; margin-bottom: 8px;">
                <span style="display: inline-block; width: 16px; height: 16px; background-color: ${colors[index]}; border-radius: 4px; margin-right: 8px;"></span>
                <span>${asset.name}: $${asset.investment.toLocaleString()}</span>
            </div>
        `).join('');
    }
}

async function fetchPortfolioPerformance() {
    try {
        const response = await fetch('http://localhost:3000/api/portfolio/performance'); // Replace with your backend API URL
        if (!response.ok) throw new Error('Failed to fetch portfolio performance');
        return await response.json();
    } catch (error) {
        console.error('Error fetching portfolio performance:', error.message);
        return [];
    }
}

async function renderPortfolioLineChart() {
    const performanceData = await fetchPortfolioPerformance();

    // Extract labels (dates) and data (portfolio values)
    const labels = performanceData.map(item => item.date); // Dates
    const data = performanceData.map(item => item.portfolio_value); // Portfolio values

    const ctx = document.getElementById('portfolioLineChart').getContext('2d');

    new Chart(ctx, {
        type: 'line',
        data: {
            labels: labels,
            datasets: [{
                label: 'Portfolio Value',
                data: data,
                borderColor: '#2c7cff',
                backgroundColor: 'rgba(44, 124, 255, 0.2)',
                borderWidth: 2,
                tension: 0.4 // Smooth curve
            }]
        },
        options: {
            responsive: true,
            plugins: {
                legend: {
                    display: true,
                    position: 'top'
                }
            },
            scales: {
                x: {
                    title: {
                        display: true,
                        text: 'Date'
                    }
                },
                y: {
                    title: {
                        display: true,
                        text: 'Portfolio Value (Rs)'
                    },
                    beginAtZero: false
                }
            }
        }
    });
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

async function fetchtradetable() {
    try {
        const response = await fetch('http://localhost:3000/api/tradedata');
        //console.log("response is :"+response.json());
        if (!response.ok) throw new Error('Failed to fetch trade');
        const dt=await response.json();
        console.log("Trade data fetched:", dt);
        return dt;
    } catch (error) {
        console.error('Error fetching trade:', error.message);
        return [];
    }
}

function renderTradeTable(data) {
    const tradeTable = document.querySelector('.trades-list-glass tbody');
    if (!tradeTable) return;

    if (data.length === 0) {
        tradeTable.innerHTML = `<tr><td colspan="7" style="text-align:center;">No holdings found.</td></tr>`;
        return;
    }
    

    tradeTable.innerHTML = ''; // Clear existing rows

    for (const d of data) {
        
        const { type, symbol, name, qty:quantity, total:amount, datetime:date } = d;
        console.log(`Rendering trade: ${type}, Symbol: ${symbol}, Quantity: ${quantity}, Amount: ${amount}`);

        const newRow = `
            <tr>
                <td>${type}</td>
                <td><a class="symbol-link" href="#">${symbol}</a></td>
                <td>${name}</td>
                <td>${quantity}</td>
                <td>$${(+amount).toFixed(2)}</td>
                <td>${date.split('T')[0]}</td>
            </tr>
        `;
        tradeTable.innerHTML += newRow;
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
    
        const symbol = document.getElementById('stock-symbol').value;
        const name = document.getElementById('stock-name').value;
        const quantity = parseInt(document.getElementById('stock-quantity').value, 10);
        const buyPrice = parseFloat(document.getElementById('stock-buy-price').value);
        const buyDate = document.getElementById('stock-buy-date').value;
    
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
    
            // ✅ FIX: Re-fetch holdings instead of manually appending
            const updatedHoldings = await fetchHoldings();
            await renderHoldingsWithLiveData(updatedHoldings);
    
            console.log('Stock added successfully:', newStock);
    
            modal.style.display = 'none';
            form.reset();
        } catch (error) {
            console.error('Error adding stock:', error.message);
        }
    });
}

function setupTradeModal() {
    const modal = document.getElementById('trade-modal');
    const closeBtn = document.getElementById('close-trade-modal');
    const form = document.getElementById('trade-form');
    const title = document.getElementById('trade-modal-title');
    const submitBtn = document.getElementById('trade-submit-btn');
    const symbolDropdown = document.getElementById('trade-symbol');

    const buyBtn = document.getElementById('trades-add-btn1');
    const sellBtn = document.getElementById('trades-sell-btn2');

    let tradeType = 'Buy';

    async function populateDropdown() {
        const holdings = await fetchHoldings();
        symbolDropdown.innerHTML = holdings.map(h => `<option value="${h.symbol}">${h.symbol} - ${h.namee}</option>`).join('');
    }

    buyBtn.addEventListener('click', async () => {
        tradeType = 'Buy';
        title.textContent = 'Buy / Add Asset';
        submitBtn.textContent = 'Buy';
        await populateDropdown();
        modal.style.display = 'block';
    });

    sellBtn.addEventListener('click', async () => {
        tradeType = 'Sell';
        title.textContent = 'Sell / Remove Asset';
        submitBtn.textContent = 'Sell';
        await populateDropdown();
        modal.style.display = 'block';
    });

    closeBtn.addEventListener('click', () => {
        modal.style.display = 'none';
    });

    window.addEventListener('click', (e) => {
        if (e.target === modal) modal.style.display = 'none';
    });

    // ✅ Correct place to simulate trade: inside form submission
    form.addEventListener('submit', async (e) => {
        console.log('Trade form submitted');
        e.preventDefault();
        const symbol = symbolDropdown.value;
        const name = symbol; // Placeholder, can be fetched from holdings if needed
            const quantity = parseInt(document.getElementById('trade-quantity').value);
            const price = parseFloat(document.getElementById('trade-price').value);
            const date = document.getElementById('trade-date').value || new Date().toISOString().split('T')[0];
            let total= quantity * price;

            console.log('Trade data:', { symbol, name, quantity, price, total, tradeType, date });

        try {
        
            const response = await fetch('http://localhost:3000/api/addtrade', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ symbol, name, quantity, price, total , tradeType, date }),
            });

            if (!response.ok) throw new Error('Failed to add stock');
    
            const newtrade = await response.json();
            console.log('New trade:', newtrade);
            // ✅ FIX: Re-fetch holdings instead of manually appending
            const updatedTable = await fetchtradetable();
            renderTradeTable(updatedTable);
    
            console.log('Trade added successfully:', newtrade);
    
            modal.style.display = 'none';
            form.reset();
        } catch (error) {
            console.error('Error adding trade:', error.message);
        }
    });
}


// Initialize modal logic

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

        const trade = await fetchtradetable();
        renderTradeTable(trade);
    }, interval);
}

// ========== Initialize App ==========
async function initializeApp() {
    setupTabNavigation();
    setupAddStockModal();
    setupTradeModal();

        const holdings = await fetchHoldings();
        await renderHoldingsWithLiveData(holdings); // Render holdings with live data

        const portfolioMetrics = await fetchPortfolioMetrics();
        renderPortfolioMetrics(portfolioMetrics);

        const trade = await fetchtradetable();
        renderTradeTable(trade);

        await renderInvestmentsPieChart(); // Render investments pie chart
        await renderPortfolioLineChart(); // Render portfolio performance line chart

        startPeriodicUpdates(); // Start periodic updates every 5 seconds
    }

// Start the app
initializeApp();