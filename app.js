document.addEventListener('DOMContentLoaded', function() {
    document.getElementById('loadScheduleButton').addEventListener('click', fetchSchedule);
    document.getElementById('addEmployeeButton').addEventListener('click', function() {
        window.location.href = 'add-employee.html'; // Redirect to the Add Employee page
    });
    document.getElementById('viewSwapsButton').addEventListener('click', function() {
        window.location.href = 'swaps.html'; // Redirect to the Swaps page
    });
    document.getElementById('viewAllGiftsButton').addEventListener('click', function() {
        window.location.href = 'gifts-manager.html';
    });
});


async function fetchSchedule() {
    const monthYearInput = document.getElementById('monthYear').value;
    const [year, month] = monthYearInput.split('-').map(Number);
    const url = `http://localhost:8081/v1/schedule/all-by-month`;
    const requestData = { year, month };

    try {
        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': 'Bearer ' + localStorage.getItem("accessToken")
            },
            body: JSON.stringify(requestData)
        });
        const data = await response.json();
        populateTable(data);
    } catch (error) {
        console.error('Error fetching data:', error);
        alert('Failed to load schedules. Please try again later.');
    }
}

function populateTable(schedules) {
    const table = document.getElementById('scheduleTable');
    const tbody = table.querySelector('tbody');
    tbody.innerHTML = '';
    const dates = new Set(schedules.map(schedule => schedule.date));
    const dateHeaders = Array.from(dates).sort();
    const thead = table.querySelector('thead');
    thead.rows[0].innerHTML = '<th>Work ID</th><th>Set</th><th>Shift</th>';

    dateHeaders.forEach(date => {
        const th = document.createElement('th');
        th.textContent = date;
        thead.rows[0].appendChild(th);
    });

    const employees = groupByEmployee(schedules);
    Object.values(employees).forEach(employee => createEmployeeRow(employee, tbody, dateHeaders));
}

function groupByEmployee(schedules) {
    const employees = {};
    schedules.forEach(schedule => {
        const key = `${schedule.employee.workId}-${schedule.employee.set}-${schedule.employee.shift}`;
        employees[key] = employees[key] || { ...schedule.employee, dates: {} };
        employees[key].dates[schedule.date] = schedule;
    });
    return employees;
}

function createEmployeeRow(employee, tbody, dateHeaders) {
    const row = tbody.insertRow();
    row.insertCell().textContent = employee.workId;
    row.insertCell().textContent = employee.set;
    row.insertCell().textContent = employee.shift;
    dateHeaders.forEach(date => {
        const cell = row.insertCell();
        const dayData = employee.dates[date];
        if (dayData) {
            setupCellContent(cell, dayData);
            if (dayData.workStatus === 'WORK') {
                cell.setAttribute('data-schedule-id', dayData.scheduleId);
                cell.classList.add('clickable');
                cell.addEventListener('click', () => fetchHours(cell, dayData.date, employee.workId)); // Pass employee's work ID
            }
        }
    });
}

function setupCellContent(cell, dayData) {
    if (dayData.workStatus === 'WORK') {
        cell.textContent = `(${dayData.totalHours} hrs)`;
        cell.style.backgroundColor = getBackgroundColorByHours(dayData.totalHours);
    } else {
        cell.textContent = 'REST';
    }
}

function getBackgroundColorByHours(hours) {
    if (hours === 8) return 'green';
    if (hours > 8) return 'yellow';
    return 'red';
}

let currentEmployeeWorkId; // Global variable to store the current employee's work ID

async function fetchHours(element, date, workId) {
    const scheduleId = element.getAttribute('data-schedule-id');
    selectedHourDay = date; // Set the selected hour day when fetching hours
    currentEmployeeWorkId = workId; // Store the employee's work ID globally
    const url = `http://localhost:8081/v1/hour?scheduleId=${scheduleId}`;
    try {
        const response = await fetch(url, {
            method: "GET",
            headers: {
                'Content-Type': 'application/json',
                'Authorization': 'Bearer ' + localStorage.getItem("accessToken")
            }
        });
        
        if (!response.ok) throw new Error('Network response was not ok');
        let hours = await response.json();
        hours.sort((a, b) => a.id - b.id);
        displayHours(hours);
    } catch (error) {
        console.error('Failed to fetch hours:', error);
        alert('Failed to load hours. Please try again.');
    }
}

function displayHours(hours) {
    const modalBody = document.getElementById('modalBody');
    modalBody.innerHTML = '';
    const list = document.createElement('ul');
    hours.forEach(hour => {
        const listItem = document.createElement('li');
        listItem.textContent = `Start: ${hour.start}, End: ${hour.end}`;

        list.appendChild(listItem);
    });
    modalBody.appendChild(list);
    $('#hoursModal').modal('show');
}

async function publishSwap() {
    const publisherWorkId = currentEmployeeWorkId; // Use the dynamically stored employee's work ID

    const url = `http://localhost:8081/v1/swap/publish`;
    const requestData = {
        publisherWorkId,
        hourDay: selectedHourDay,
        hourId: selectedHourId
    };

    try {
        const response = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(requestData)
        });

        if (response.ok) {
            const data = await response.json();
            // Assuming you want to display a success message including the request ID and status
            alert(`Swap request published successfully! Request ID: ${data.requestId}, Status: ${data.status}`);
            console.log(`Request ID: ${data.requestId}, Status: ${data.status}, Start: ${data.start}, End: ${data.end}`);
            $('#swapModal').modal('hide');
        } else {
            const errorData = await response.json();
            // Handle the case where the server responds with an error status code but still provides a JSON response
            alert(`Failed to publish swap: ${errorData.status}`);
        }
    } catch (error) {
        console.error('Error publishing swap:', error);
        alert('Failed to publish swap.');
    }
}

