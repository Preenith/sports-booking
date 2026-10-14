// Authentication functions for SportConnect

function checkAuth() {
    const token = localStorage.getItem('token');
    const user = JSON.parse(localStorage.getItem('user'));
    
    const authLinks = document.getElementById('authLinks');
    const userLinks = document.getElementById('userLinks');
    
    if (token && user) {
        if (authLinks) authLinks.style.display = 'none';
        if (userLinks) userLinks.style.display = 'block';
    } else {
        if (authLinks) authLinks.style.display = 'block';
        if (userLinks) userLinks.style.display = 'none';
    }
}

function logout() {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    localStorage.removeItem('rememberMe');
    window.location.href = 'index.html';
}

function getToken() {
    return localStorage.getItem('token');
}

function getUser() {
    return JSON.parse(localStorage.getItem('user'));
}

function isAuthenticated() {
    return !!localStorage.getItem('token');
}

function isAdmin() {
    const user = getUser();
    return user && user.role === 'admin';
}
