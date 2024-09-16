document.addEventListener('DOMContentLoaded', function() {
    fetchAllGifts();
    setupModalHandlers();
});

document.addEventListener('DOMContentLoaded', function() {
    fetchAllGifts();
    setupModalHandlers();
    document.getElementById('statusFilter').addEventListener('change', fetchFilteredGifts);
});

async function fetchFilteredGifts() {
    const selectedStatus = document.getElementById('statusFilter').value;
    const url = selectedStatus ? 
        `http://localhost:8081/v1/gift/filter?status=${selectedStatus}` : 
        'http://localhost:8081/v1/gift/all';

    try {
        const response = await fetch(url, {
            method: 'GET',
            headers: {
                'Authorization': 'Bearer ' + localStorage.getItem("accessToken")
            }
        });

        if (!response.ok) {
            throw new Error('Failed to fetch gifts');
        }

        const gifts = await response.json();
        populateGiftsTable(gifts);
    } catch (error) {
        console.error('Error fetching gifts:', error);
    }
}

function fetchAllGifts() {
    fetchFilteredGifts(); // Reuse the filtering function with no filter applied initially
}

function populateGiftsTable(gifts) {
    const tableBody = document.getElementById('giftsTableBody');
    tableBody.innerHTML = '';

    // Sort gifts with 'IN_PROGRESS' status appearing first
    gifts.sort((a, b) => {
        if (a.status === 'IN_PROGRESS' && b.status !== 'IN_PROGRESS') {
            return -1;
        }
        if (a.status !== 'IN_PROGRESS' && b.status === 'IN_PROGRESS') {
            return 1;
        }
        return 0; // Keep the order unchanged if both have the same status
    });

    gifts.forEach(gift => {
        const row = tableBody.insertRow();
        row.insertCell(0).textContent = gift.giftId;
        row.insertCell(1).textContent = gift.publisherWorkId;
        row.insertCell(2).textContent = gift.receiverWorkId;
        row.insertCell(3).textContent = gift.giftDate;
        row.insertCell(4).textContent = gift.publishDate;
        row.insertCell(5).textContent = gift.status;
        
        // Extract and format the first and last hours
        let hoursText = '';
        if (gift.hours.length > 0) {
            const firstHour = gift.hours[0].start;
            const lastHour = gift.hours[gift.hours.length - 1].end;
            hoursText = `${firstHour} - ${lastHour}`;
        }
        row.insertCell(6).textContent = hoursText;

        if (gift.status === 'IN_PROGRESS') {
            row.style.cursor = 'pointer';
            row.addEventListener('click', () => showGiftActionModal(gift.giftId));
        }
    });
}

function showGiftActionModal(giftId) {
    const acceptButton = document.getElementById('acceptGiftButton');
    const rejectButton = document.getElementById('rejectGiftButton');
    acceptButton.onclick = () => acceptGift(giftId);
    rejectButton.onclick = () => rejectGift(giftId);
    new bootstrap.Modal(document.getElementById('giftActionModal')).show();
}

async function acceptGift(giftId) {
    const url = `http://localhost:8081/v1/gift/accept/${giftId}`;
    try {
        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Authorization': 'Bearer ' + localStorage.getItem("accessToken"),
                'Content-Type': 'application/json'
            }
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error('Error occurred during accepting gift:', errorText);
            alert('Error occurred during accepting gift: ' + errorText);
            return;
        }

        const successMessage = await response.text();
        alert(successMessage); // Display the success message from the server
        bootstrap.Modal.getInstance(document.getElementById('giftActionModal')).hide();
        fetchAllGifts(); // Refresh the gifts table to reflect changes
    } catch (error) {
        console.error('Failed to accept gift:', error);
        alert('Failed to accept gift. Please try again.');
    }
}

async function rejectGift(giftId) {
    const url = `http://localhost:8081/v1/gift/reject/${giftId}`;
    try {
        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Authorization': 'Bearer ' + localStorage.getItem("accessToken"),
                'Content-Type': 'application/json'
            }
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error('Error occurred during rejecting gift:', errorText);
            alert('Error occurred during rejecting gift: ' + errorText);
            return;
        }

        const successMessage = await response.text();
        alert(successMessage); // Display the success message from the server
        bootstrap.Modal.getInstance(document.getElementById('giftActionModal')).hide();
        fetchAllGifts(); // Refresh the gifts table to reflect changes
    } catch (error) {
        console.error('Failed to reject gift:', error);
        alert('Failed to reject gift. Please try again.');
    }
}

function setupModalHandlers() {
    // This function can be expanded if more modal-related functionality is needed
}