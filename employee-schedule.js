let currentHours = []; // This will hold the current hours data when a table cell is clicked

document.addEventListener('DOMContentLoaded', function() {
    const currentDate = new Date();
    const currentYear = currentDate.getFullYear();
    const currentMonth = String(currentDate.getMonth() + 1).padStart(2, '0'); // JavaScript months are 0-indexed
    document.getElementById('yearMonthInput').value = `${currentYear}-${currentMonth}`;
});

document.getElementById('fetchScheduleButton').addEventListener('click', function() {
    const yearMonth = document.getElementById('yearMonthInput').value;
    if (yearMonth) {
        fetchEmployeeSchedule(yearMonth);
    } else {
        alert('Please select Year and Month.');
    }
});

document.addEventListener('DOMContentLoaded', function() {
    // Event listener for the new button
    const viewActiveGiftsButton = document.getElementById('viewActiveGiftsButton');
    viewActiveGiftsButton.addEventListener('click', function() {
        window.location.href = '/gifts-active';  // Change the URL to navigate to the /gifts-active page
    });
});

async function fetchEmployeeSchedule(yearMonth) {
    const [year, month] = yearMonth.split('-');
    const url = 'http://localhost:8081/v1/schedule/current';
    const requestData = {
        workId: localStorage.getItem("workId"),
        year: parseInt(year),
        month: parseInt(month)
    };
    console.log(requestData);

    try {
        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': 'Bearer ' + localStorage.getItem("accessToken")
            },
            body: JSON.stringify(requestData)
        });

        if (!response.ok) {
            throw new Error('Network response was not ok');
        }

        const schedule = await response.json();
        schedule.sort((a, b) => a.scheduleId - b.scheduleId); // Sort by scheduleId in ascending order
        console.log(schedule);
        displaySchedule(schedule);
        fetchAndDisplayGifts();
    } catch (error) {
        console.error('Failed to fetch schedule:', error);
        alert('Failed to load schedule. Please try again.');
    }
}

function displaySchedule(schedule) {
    const resultsDiv = document.getElementById('scheduleResults');
    resultsDiv.innerHTML = ''; // Clear previous results

    if (schedule.length === 0) {
        resultsDiv.innerHTML = '<p>No schedule found for this employee.</p>';
        return;
    }

    const table = document.createElement('table');
    table.className = 'table';
    const thead = table.createTHead();
    const tbody = table.createTBody();
    const headerRow = thead.insertRow();

    const headers = ['scheduleId', 'workStatus', 'date', 'totalHours', 'shift'];
    headers.forEach(header => {
        const th = document.createElement('th');
        th.textContent = header.charAt(0).toUpperCase() + header.slice(1);
        headerRow.appendChild(th);
    });

    schedule.forEach(item => {
        const row = tbody.insertRow();
        headers.forEach(header => {
            const cell = row.insertCell();
            cell.textContent = item[header];
            let availableHours = [];
            item.hours.forEach(hour => {
                if (hour.swapExists === false && hour.giftExists === false) {
                    availableHours.push(hour);
                }
            })
            
            cell.addEventListener('click', () => {
                currentHours = availableHours; // Update currentHours when a cell is clicked
                showHoursModal(availableHours);
            });
        });
    });

    resultsDiv.appendChild(table);
}

function showHoursModal(hours) {
    const modalBody = document.getElementById('modalBody');
    modalBody.innerHTML = '';

    if (!hours || hours.length === 0) {
        modalBody.textContent = 'No hours recorded for this schedule.';
    } else {
        const list = document.createElement('ul');
        hours.forEach(hour => {
            const listItem = document.createElement('li');
            listItem.textContent = `Start: ${hour.start}, End: ${hour.end}`;
            list.appendChild(listItem);
        });
        modalBody.appendChild(list);
    }

    const hoursModal = new bootstrap.Modal(document.getElementById('hoursModal'));
    hoursModal.show();
}

document.getElementById('giftButton').addEventListener('click', function() {
    if (currentHours.length < 3) {
        alert("Not enough hours to gift. Minimum of 2 hours required.");
        return;
    }
    populateGiftHoursModal(currentHours);
    const giftHoursModal = new bootstrap.Modal(document.getElementById('giftHoursModal'));
    giftHoursModal.show();
});

function populateGiftHoursModal(hours) {
    const fromHourSelect = document.getElementById('fromHour');
    const toHourSelect = document.getElementById('toHour');
    const infoText = document.getElementById('giftInfoText'); // Element in the modal for info text
    fromHourSelect.innerHTML = '';
    toHourSelect.innerHTML = '';
    infoText.textContent = ''; // Clear previous info text

    // Populate "From Hour" dropdown, including the first hour
    for (let i = 0; i < hours.length - 1; i++) {
        let option = document.createElement('option');
        option.value = i;
        option.textContent = `Hour ${i + 1} (${hours[i].start} - ${hours[i].end})`;
        fromHourSelect.appendChild(option);
    }

    // Listen for changes in the "From Hour" to update "To Hour" options
    fromHourSelect.addEventListener('change', function() {
        toHourSelect.innerHTML = '';
        const selectedFromHour = parseInt(fromHourSelect.value);
        const selectedToHour = parseInt(toHourSelect.value);
        if (selectedFromHour === 1) {
            infoText.textContent = 'Note: The first hour will be included in the gift automatically.';
        } else if (selectedFromHour === 1 && selectedToHour === hours.length - 2){
            infoText.textContent = 'Note: The first hour will be included in the gift automatically.\nNote: The last hour will be included in the gift automatically. ';
        } else {
            infoText.textContent = '';
        }

        // Populate "To Hour" dropdown, ensuring at least 2 hours are selected
        for (let j = selectedFromHour + 1; j < hours.length; j++) {
            let option = document.createElement('option');
            option.value = j;
            option.textContent = `Hour ${j + 1} (${hours[j].start} - ${hours[j].end})`;
            toHourSelect.appendChild(option);
        }
    });

    // Listen for changes in the "To Hour" to display info text if the hour before last is selected
    toHourSelect.addEventListener('change', function() {
        const selectedToHour = parseInt(toHourSelect.value);
        const selectedFromHour = parseInt(fromHourSelect.value);
        if (selectedToHour === 1) {
            infoText.textContent = 'Note: The first hour will be included in the gift automatically.';
        } else if (selectedFromHour === 1 && selectedToHour === hours.length - 2){
            infoText.textContent = 'Note: The first hour will be included in the gift automatically.\nNote: The last hour will be included in the gift automatically. ';
        } else {
            infoText.textContent = '';
        }
    });

    // Trigger change to populate "To Hour" initially
    fromHourSelect.dispatchEvent(new Event('change'));
}

async function publishGift(requestPayload) {
    console.log('Sending request with payload:', requestPayload);

    try {
        const response = await fetch('http://localhost:8081/v1/gift/publish', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': 'Bearer ' + localStorage.getItem("accessToken")
            },
            body: JSON.stringify(requestPayload)
        });

        if (!response.ok) {
            const errorResponse = await response.text();
            console.error('Server responded with error:', errorResponse);
            throw new Error('Network response was not ok');
        }

        const newGift = await response.json();
        alert('Gift successfully published!');
        console.log('New gift data:', newGift);
        addGiftToTable(newGift);  // Add the new gift to the table
        location.replace(location.href);
    } catch (error) {
        console.error('Failed to publish gift:', error);
        alert('Failed to publish gift. Please try again.');
    }
}

document.getElementById('giftWholeDayButton').addEventListener('click', async function() {
    const hourIdList = currentHours.map(hour => hour.id);

    await publishGift(hourIdList);
});

document.getElementById('confirmGiftButton').addEventListener('click', async function() {
    let fromHourIndex = parseInt(document.getElementById('fromHour').value);
    let toHourIndex = parseInt(document.getElementById('toHour').value);

    if (toHourIndex === currentHours.length - 2) {
        toHourIndex = currentHours.length - 1;
    }

    if (fromHourIndex === 1) {
        fromHourIndex = 0;
    }

    const hourIdList = currentHours.slice(fromHourIndex, toHourIndex + 1).map(hour => hour.id);

    await publishGift(hourIdList);
});

function addGiftToTable(gift) {
    const tableBody = document.getElementById('giftsTable').getElementsByTagName('tbody')[0];
    const row = tableBody.insertRow();
    row.insertCell(0).textContent = gift.giftId;
    row.insertCell(1).textContent = gift.publisherWorkId;
    row.insertCell(2).textContent = gift.receiverWorkId;
    row.insertCell(3).textContent = gift.giftDate;
    row.insertCell(4).textContent = gift.publishDate;
    row.insertCell(5).textContent = gift.status;

    // Extract the start time of the first hour and the end time of the last hour
    const hoursCell = row.insertCell(6);
    if (gift.hours.length > 0) {
        const startTime = gift.hours[0].start;
        const endTime = gift.hours[gift.hours.length - 1].end;
        hoursCell.textContent = `${startTime} - ${endTime}`;
    } else {
        hoursCell.textContent = 'No hours available';
    }

    // Add a delete button
    const deleteCell = row.insertCell(7);
    if (gift.status !== 'OK') {
        const deleteButton = document.createElement('button');
        deleteButton.textContent = 'Delete';
        deleteButton.className = 'btn btn-danger';
        deleteButton.onclick = () => deleteGift(gift.giftId);
        deleteCell.appendChild(deleteButton);
    } else {
        deleteCell.textContent = 'N/A'; 
    }
}

async function fetchAndDisplayGifts() {
    try {
        const response = await fetch(`http://localhost:8081/v1/gift/current`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': 'Bearer ' + localStorage.getItem("accessToken")
            },
        });
        if (!response.ok) {
            throw new Error('Failed to fetch gifts');
        }
        const gifts = await response.json();
        populateGiftsTable(gifts);
    } catch (error) {
        console.error('Error fetching gifts:', error);
        alert('Failed to load gifts. Please try again.');
    }
}

function populateGiftsTable(gifts) {
    const tableBody = document.getElementById('giftsTable').getElementsByTagName('tbody')[0];
    tableBody.innerHTML = ''; // Clear existing rows

    gifts.forEach(gift => {
        const row = tableBody.insertRow();
        row.insertCell(0).textContent = gift.giftId;
        row.insertCell(1).textContent = gift.publisherWorkId;
        row.insertCell(2).textContent = gift.receiverWorkId;
        row.insertCell(3).textContent = gift.giftDate;
        row.insertCell(4).textContent = gift.publishDate;
        row.insertCell(5).textContent = gift.status;
        const hoursCell = row.insertCell(6);
        if (gift.hours.length > 0) {
            const startTime = gift.hours[0].start;
            const endTime = gift.hours[gift.hours.length - 1].end;
            hoursCell.textContent = `${startTime} - ${endTime}`;
        } else {
            hoursCell.textContent = 'No hours available';
        }
        
        // Add a delete button
        const deleteCell = row.insertCell(7);
        if (gift.status !== 'OK') {
            const deleteButton = document.createElement('button');
            deleteButton.textContent = 'Delete';
            deleteButton.className = 'btn btn-danger';
            deleteButton.onclick = () => deleteGift(gift.giftId);
            deleteCell.appendChild(deleteButton);
        } else {
            deleteCell.textContent = 'N/A'; 
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
        fetchAndDisplayGifts();  // Refresh the gifts table
        location.replace(location.href);
    } catch (error) {
        console.error('Failed to delete gift:', error);
        alert('Failed to delete gift. Please try again.');
    }
}