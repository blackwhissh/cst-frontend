document.getElementById('loadSwapsButton').addEventListener('click', function() {
    const status = document.getElementById('statusSelect').value;
    if (status === 'ALL') {
        fetchAllSwaps();
    } else {
        fetchSwapsByStatus(status);
    }
});

document.addEventListener('DOMContentLoaded', function() {
    fetchSwapsByStatus('ACTIVE');
});

async function fetchSwapsByStatus(status) {
    const url = `http://localhost:8081/v1/swap/by?status=${status}`;
    try {
        const response = await fetch(url);
        if (!response.ok) {
            throw new Error('Network response was not ok');
        }
        const swaps = await response.json();
        populateSwapsTable(swaps);
    } catch (error) {
        console.error('Failed to fetch swaps:', error);
        alert('Failed to load swaps. Please try again.');
    }
}

async function fetchAllSwaps() {
    const url = `http://localhost:8081/v1/swap`;
    try {
        const response = await fetch(url);
        if (!response.ok) {
            throw new Error('Network response was not ok');
        }
        const swaps = await response.json();
        populateSwapsTable(swaps);
    } catch (error) {
        console.error('Failed to fetch all swaps:', error);
        alert('Failed to load swaps. Please try again.');
    }
}

function populateSwapsTable(swaps) {
    const tableBody = document.getElementById('swapsTable').getElementsByTagName('tbody')[0];
    tableBody.innerHTML = ''; // Clear existing rows
    swaps.forEach(swap => {
        const row = tableBody.insertRow();
        row.insertCell().textContent = swap.swapId;
        row.insertCell().textContent = swap.publisherWorkId;
        row.insertCell().textContent = swap.receiverWorkId;
        row.insertCell().textContent = swap.hourDay;
        row.insertCell().textContent = swap.start;
        row.insertCell().textContent = swap.end;
        row.insertCell().textContent = swap.publishDate;
        row.insertCell().textContent = swap.status;
    });
}