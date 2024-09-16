document.getElementById('loginForm').addEventListener('submit', async function(event) {
    event.preventDefault(); // Prevent the default form submission
    const username = document.getElementById('usernameInput').value;
    const password = document.getElementById('passwordInput').value;
    const url = 'http://localhost:8081/v1/auth/login';

    try {
        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ username, password })
        });

        if (!response.ok) {
            throw new Error('Login failed');
        }

        const data = await response.json();
        localStorage.setItem('accessToken', data.accessToken); // Store the  JWT token in localStorage
        localStorage.setItem('refreshToken',data.refreshToken);
        localStorage.setItem('role', data.role);
        localStorage.setItem('workId', data.workId);
        alert('Login successful!');
        if (data.role === 'ROLE_MANAGER') {
            window.location.href = '/index.html'; // Redirect to index.html if the user is a manager
        } else if(data.role === 'ROLE_ADMIN'){
            window.location.href = '/admin.html'; // Redirect to another page for other roles
        } else {
            window.location.href = '/employee-schedule.html';
        }
    } catch (error) {
        console.error('Error during login:', error);
        alert('Failed to login. Please check your credentials and try again.');
    }
});