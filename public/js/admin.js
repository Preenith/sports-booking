function getToken() {
    return localStorage.getItem('token');
}

function getUser() {
    const user = localStorage.getItem('user');
    return user ? JSON.parse(user) : null;
}

async function loadDashboard() {
    const token = getToken();
    const user = getUser();
    
    if (!token || !user || user.role !== 'admin') {
        window.location.href = 'index.html';
        return;
    }
    
    loadDashboardStats();
    loadFacilitiesAdmin();
    loadAllBookings();
    loadUsers();
}

async function loadDashboardStats() {
    const token = getToken();
    const container = document.getElementById('dashboardStats');
    
    try {
        const response = await fetch(`${API_BASE}/admin/dashboard`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        
        if (response.ok) {
            const stats = await response.json();
            
            container.innerHTML = `
                <div class="row">
                    <div class="col-md-3 mb-4">
                        <div class="stat-card">
                            <div class="stat-number">${stats.totalUsers}</div>
                            <div class="stat-label">Total Users</div>
                        </div>
                    </div>
                    <div class="col-md-3 mb-4">
                        <div class="stat-card">
                            <div class="stat-number">${stats.totalFacilities}</div>
                            <div class="stat-label">Total Facilities</div>
                        </div>
                    </div>
                    <div class="col-md-3 mb-4">
                        <div class="stat-card">
                            <div class="stat-number">${stats.todayBookings}</div>
                            <div class="stat-label">Today's Bookings</div>
                        </div>
                    </div>
                    <div class="col-md-3 mb-4">
                        <div class="stat-card">
                            <div class="stat-number">₹${stats.totalRevenue}</div>
                            <div class="stat-label">Total Revenue</div>
                        </div>
                    </div>
                </div>
                
                <div class="row mt-4">
                    <div class="col-md-6">
                        <h5>Bookings by Sport</h5>
                        <ul class="list-group">
                            ${stats.bookingsBySport.map(item => `
                                <li class="list-group-item d-flex justify-content-between align-items-center">
                                    ${item._id}
                                    <span class="badge bg-primary rounded-pill">${item.count}</span>
                                </li>
                            `).join('')}
                        </ul>
                    </div>
                    <div class="col-md-6">
                        <h5>Facility Usage</h5>
                        <ul class="list-group">
                            ${stats.facilityUsage.slice(0, 5).map(item => `
                                <li class="list-group-item d-flex justify-content-between align-items-center">
                                    ${item.facilityName}
                                    <span class="badge bg-success rounded-pill">${item.bookings}</span>
                                </li>
                            `).join('')}
                        </ul>
                    </div>
                </div>
            `;
        }
    } catch (error) {
        console.error('Error loading dashboard stats:', error);
    }
}

async function loadFacilitiesAdmin() {
    const token = getToken();
    const container = document.getElementById('facilitiesList');
    
    try {
        const response = await fetch(`${API_BASE}/admin/facilities`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        
        if (response.ok) {
            const facilities = await response.json();
            
            container.innerHTML = `
                <div class="table-responsive">
                    <table class="table">
                        <thead>
                            <tr>
                                <th>Name</th>
                                <th>Sport</th>
                                <th>Location</th>
                                <th>Price</th>
                                <th>Status</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${facilities.map(facility => `
                                <tr>
                                    <td>${facility.name}</td>
                                    <td>${facility.sport_type}</td>
                                    <td>${facility.location}</td>
                                    <td>₹${facility.price_per_hour}</td>
                                    <td>
                                        <span class="badge ${facility.status === 'active' ? 'bg-success' : 'bg-danger'}">
                                            ${facility.status}
                                        </span>
                                    </td>
                                    <td>
                                        <button class="btn btn-sm btn-warning" onclick="editFacility('${facility.id}')">Edit</button>
                                        ${facility.status === 'active' ? 
                                            `<button class="btn btn-sm btn-danger" onclick="deactivateFacility('${facility.id}')">Deactivate</button>` :
                                            `<button class="btn btn-sm btn-success" onclick="activateFacility('${facility.id}')">Activate</button>`
                                        }
                                    </td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                </div>
            `;
        }
    } catch (error) {
        console.error('Error loading facilities:', error);
    }
}

async function handleAddFacility(e) {
    e.preventDefault();
    
    const token = getToken();
    
    const facilityData = {
        name: document.getElementById('facilityName').value,
        sport_type: document.getElementById('facilitySport').value,
        location: document.getElementById('facilityLocation').value,
        description: document.getElementById('facilityDescription').value,
        price_per_hour: parseInt(document.getElementById('facilityPrice').value),
        image: document.getElementById('facilityImage').value,
        facilities_available: document.getElementById('facilityAmenities').value,
        rules: document.getElementById('facilityRules').value
    };
    
    try {
        const response = await fetch(`${API_BASE}/admin/facilities`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(facilityData)
        });
        
        if (response.ok) {
            alert('Facility added successfully');
            document.getElementById('addFacilityForm').reset();
            const modal = bootstrap.Modal.getInstance(document.getElementById('addFacilityModal'));
            modal.hide();
            loadFacilitiesAdmin();
        } else {
            const data = await response.json();
            alert(data.message);
        }
    } catch (error) {
        console.error('Error adding facility:', error);
        alert('Server error. Please try again.');
    }
}

async function deactivateFacility(facilityId) {
    const token = getToken();
    
    if (!confirm('Are you sure you want to deactivate this facility?')) {
        return;
    }
    
    try {
        const response = await fetch(`${API_BASE}/admin/facilities/${facilityId}`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        
        if (response.ok) {
            alert('Facility deactivated successfully');
            loadFacilitiesAdmin();
        } else {
            const data = await response.json();
            alert(data.message);
        }
    } catch (error) {
        console.error('Error deactivating facility:', error);
        alert('Server error. Please try again.');
    }
}

async function activateFacility(facilityId) {
    const token = getToken();
    
    try {
        const response = await fetch(`${API_BASE}/admin/facilities/${facilityId}`, {
            method: 'PUT',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ status: 'active' })
        });
        
        if (response.ok) {
            alert('Facility activated successfully');
            loadFacilitiesAdmin();
        } else {
            const data = await response.json();
            alert(data.message);
        }
    } catch (error) {
        console.error('Error activating facility:', error);
        alert('Server error. Please try again.');
    }
}

async function loadAllBookings() {
    const token = getToken();
    const container = document.getElementById('allBookings');
    
    try {
        const response = await fetch(`${API_BASE}/admin/bookings`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        
        if (response.ok) {
            const bookings = await response.json();
            
            container.innerHTML = `
                <div class="table-responsive">
                    <table class="table">
                        <thead>
                            <tr>
                                <th>Booking ID</th>
                                <th>User</th>
                                <th>Facility</th>
                                <th>Date</th>
                                <th>Time</th>
                                <th>Status</th>
                                <th>Payment</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${bookings.map(booking => `
                                <tr>
                                    <td>${booking.booking_id}</td>
                                    <td>${booking.user_id?.name || 'N/A'}</td>
                                    <td>${booking.facility_id?.name || 'N/A'}</td>
                                    <td>${booking.booking_date}</td>
                                    <td>${booking.start_time} - ${booking.end_time}</td>
                                    <td><span class="status-${booking.booking_status}">${booking.booking_status}</span></td>
                                    <td>${booking.payment_status}</td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                </div>
            `;
        }
    } catch (error) {
        console.error('Error loading bookings:', error);
    }
}

async function loadUsers() {
    const token = getToken();
    const container = document.getElementById('usersList');
    
    try {
        const response = await fetch(`${API_BASE}/admin/users`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        
        if (response.ok) {
            const users = await response.json();
            
            container.innerHTML = `
                <div class="table-responsive">
                    <table class="table">
                        <thead>
                            <tr>
                                <th>Name</th>
                                <th>Email</th>
                                <th>Phone</th>
                                <th>Status</th>
                                <th>Action</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${users.map(user => `
                                <tr>
                                    <td>${user.name}</td>
                                    <td>${user.email}</td>
                                    <td>${user.phone}</td>
                                    <td>
                                        <span class="badge ${user.status === 'active' ? 'bg-success' : 'bg-danger'}">
                                            ${user.status}
                                        </span>
                                    </td>
                                    <td>
                                        <button class="btn btn-sm btn-warning" onclick="toggleUserStatus('${user.id}')">
                                            ${user.status === 'active' ? 'Deactivate' : 'Activate'}
                                        </button>
                                    </td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                </div>
            `;
        }
    } catch (error) {
        console.error('Error loading users:', error);
    }
}

async function toggleUserStatus(userId) {
    const token = getToken();
    
    try {
        const response = await fetch(`${API_BASE}/admin/users/${userId}/status`, {
            method: 'PUT',
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        
        if (response.ok) {
            alert('User status updated successfully');
            loadUsers();
        } else {
            const data = await response.json();
            alert(data.message);
        }
    } catch (error) {
        console.error('Error toggling user status:', error);
        alert('Server error. Please try again.');
    }
}

function editFacility(facilityId) {
    alert('Edit functionality - To be implemented with modal');
}
