const API_BASE = 'http://localhost:5000/api';

function getToken() {
    return localStorage.getItem('token');
}

function getUser() {
    const user = localStorage.getItem('user');
    return user ? JSON.parse(user) : null;
}

function setToken(token) {
    localStorage.setItem('token', token);
}

function setUser(user) {
    localStorage.setItem('user', JSON.stringify(user));
}

function clearAuth() {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
}

async function checkAuth() {
    const token = getToken();
    const user = getUser();
    
    const authButtons = document.getElementById('authButtons');
    const userMenu = document.getElementById('userMenu');
    const userName = document.getElementById('userName');
    const adminLink = document.getElementById('adminLink');
    
    if (token && user) {
        authButtons.classList.add('d-none');
        userMenu.classList.remove('d-none');
        userName.textContent = user.name;
        
        if (user.role === 'admin' && adminLink) {
            adminLink.style.display = 'block';
        }
    } else {
        authButtons.classList.remove('d-none');
        userMenu.classList.add('d-none');
    }
}

async function handleLogin(e) {
    e.preventDefault();
    
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    const alert = document.getElementById('alert');
    
    try {
        const response = await fetch(`${API_BASE}/auth/login`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ email, password })
        });
        
        const data = await response.json();
        
        if (response.ok) {
            setToken(data.token);
            setUser(data.user);
            window.location.href = 'index.html';
        } else {
            alert.className = 'alert alert-danger mt-3';
            alert.textContent = data.message;
            alert.classList.remove('d-none');
        }
    } catch (error) {
        alert.className = 'alert alert-danger mt-3';
        alert.textContent = 'Server error. Please try again.';
        alert.classList.remove('d-none');
    }
}

async function handleSignup(e) {
    e.preventDefault();
    
    const name = document.getElementById('name').value;
    const email = document.getElementById('email').value;
    const phone = document.getElementById('phone').value;
    const password = document.getElementById('password').value;
    const confirmPassword = document.getElementById('confirmPassword').value;
    const alert = document.getElementById('alert');
    
    if (password !== confirmPassword) {
        alert.className = 'alert alert-danger mt-3';
        alert.textContent = 'Passwords do not match';
        alert.classList.remove('d-none');
        return;
    }
    
    try {
        const response = await fetch(`${API_BASE}/auth/register`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ name, email, phone, password, confirmPassword })
        });
        
        const data = await response.json();
        
        if (response.ok) {
            setToken(data.token);
            setUser(data.user);
            window.location.href = 'index.html';
        } else {
            alert.className = 'alert alert-danger mt-3';
            alert.textContent = data.message;
            alert.classList.remove('d-none');
        }
    } catch (error) {
        alert.className = 'alert alert-danger mt-3';
        alert.textContent = 'Server error. Please try again.';
        alert.classList.remove('d-none');
    }
}

function logout() {
    clearAuth();
    window.location.href = 'index.html';
}

async function loadProfile() {
    const token = getToken();
    const profileInfo = document.getElementById('profileInfo');
    
    try {
        const response = await fetch(`${API_BASE}/auth/profile`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        
        if (response.ok) {
            const user = await response.json();
            profileInfo.innerHTML = `
                <div class="row">
                    <div class="col-md-6">
                        <p><strong>Name:</strong> ${user.name}</p>
                        <p><strong>Email:</strong> ${user.email}</p>
                    </div>
                    <div class="col-md-6">
                        <p><strong>Phone:</strong> ${user.phone}</p>
                        <p><strong>Role:</strong> ${user.role}</p>
                    </div>
                </div>
            `;
            
            document.getElementById('editName').value = user.name;
            document.getElementById('editPhone').value = user.phone;
        } else {
            window.location.href = 'login.html';
        }
    } catch (error) {
        console.error('Error loading profile:', error);
    }
}

async function handleUpdateProfile(e) {
    e.preventDefault();
    
    const token = getToken();
    const name = document.getElementById('editName').value;
    const phone = document.getElementById('editPhone').value;
    
    try {
        const response = await fetch(`${API_BASE}/auth/profile`, {
            method: 'PUT',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ name, phone })
        });
        
        if (response.ok) {
            const data = await response.json();
            setUser(data.user);
            alert('Profile updated successfully');
            loadProfile();
        } else {
            const data = await response.json();
            alert(data.message);
        }
    } catch (error) {
        alert('Server error. Please try again.');
    }
}

async function handleChangePassword(e) {
    e.preventDefault();
    
    const token = getToken();
    const currentPassword = document.getElementById('currentPassword').value;
    const newPassword = document.getElementById('newPassword').value;
    const confirmNewPassword = document.getElementById('confirmNewPassword').value;
    
    if (newPassword !== confirmNewPassword) {
        alert('Passwords do not match');
        return;
    }
    
    try {
        const response = await fetch(`${API_BASE}/auth/change-password`, {
            method: 'PUT',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ currentPassword, newPassword, confirmPassword: confirmNewPassword })
        });
        
        if (response.ok) {
            alert('Password changed successfully');
            document.getElementById('changePasswordForm').reset();
        } else {
            const data = await response.json();
            alert(data.message);
        }
    } catch (error) {
        alert('Server error. Please try again.');
    }
}
