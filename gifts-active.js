document.addEventListener('DOMContentLoaded', function() {
    fetchActiveGifts();
});

async function fetchActiveGifts() {
    const url = 'http://localhost:8081/v1/gift/active';
    try {
        const response = await fetch(url, {
            method: 'GET',
            headers: {
                'Authorization': 'Bearer ' + localStorage.getItem("accessToken")
            }
        });

        if (!response.ok) {
            throw new Error('Failed to fetch active gifts');
        }

        const gifts = await response.json();
        populateGiftsTable(gifts);
    } catch (error) {
        console.error('Error fetching active gifts:', error);
    }
}

function populateGiftsTable(gifts) {
    const tableBody = document.getElementById('giftsTable').getElementsByTagName('tbody')[0];
    tableBody.innerHTML = '';

    // Retrieve the current user's workId from localStorage
    const currentUserWorkId = localStorage.getItem("workId");

    gifts.forEach(gift => {
        // Check if the current user's workId matches the publisherWorkId
        if (gift.publisherWorkId !== currentUserWorkId) {
            const row = tableBody.insertRow();
            row.insertCell(0).textContent = gift.giftId;
            row.insertCell(1).textContent = gift.publisherWorkId;
            row.insertCell(2).textContent = gift.receiverWorkId;
            row.insertCell(3).textContent = gift.giftDate;
            row.insertCell(4).textContent = gift.publishDate;
            row.insertCell(5).textContent = gift.status;
            row.insertCell(6).textContent = `${gift.hours[0].start} - ${gift.hours[gift.hours.length - 1].end}`;

            const actionCell = row.insertCell(7);
            const actionButton = document.createElement('button');
            actionButton.className = 'btn btn-primary';

            if (gift.publisherWorkId === currentUserWorkId) {
                actionButton.textContent = 'Delete';
                actionButton.className += ' btn-danger';
                actionButton.onclick = () => deleteGift(gift.giftId);
            } else {
                actionButton.textContent = 'Receive';
                actionButton.className += ' btn-success';
                actionButton.onclick = () => receiveGift(gift.giftId);
            }

            actionCell.appendChild(actionButton);
        }
    });
}

async function deleteGift(giftId) {
    const url = `http://localhost:8081/v1/gift/delete/${giftId}`;
    try {
        const response = await fetch(url, {
            method: 'DELETE',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': 'Bearer ' + localStorage.getItem("accessToken")
            }
        });

        if (!response.ok) {
            const errorResponse = await response.text();
            console.error('Server responded with error:', errorResponse);
            throw new Error('Network response was not ok');
        }

        alert('Gift deleted successfully');
        location.replace(location.href);
    } catch (error) {
        console.error('Failed to delete gift:', error);
        alert('Failed to delete gift. Please try again.');
    }
}

async function receiveGift(giftId) {
    const url = `http://localhost:8081/v1/gift/receive/${giftId}`;
    try {
        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': 'Bearer ' + localStorage.getItem("accessToken")
            }
        });

        if (!response.ok) {
            const errorResponse = await response.text();
            console.error('Server responded with error:', errorResponse);
            throw new Error('Network response was not ok');
        }

        alert("Gift received successfully"); // Display the success message from the server
    } catch (error) {
        console.error('Failed to receive gift:', error);
        alert('Failed to receive gift. Please try again.');
    }
}