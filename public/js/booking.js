function getToken() {
    return localStorage.getItem('token');
}

async function loadMyBookings() {
    const token = getToken();
    const container = document.getElementById('bookingsList');
    
    if (!token) {
        window.location.href = 'login.html';
        return;
    }
    
    try {
        const response = await fetch(`${API_BASE}/bookings/my`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        
        if (response.ok) {
            const bookings = await response.json();
            displayBookings(bookings);
        } else {
            window.location.href = 'login.html';
        }
    } catch (error) {
        console.error('Error loading bookings:', error);
        container.innerHTML = '<p class="text-center">Error loading bookings</p>';
    }
}

function displayBookings(bookings) {
    const container = document.getElementById('bookingsList');
    
    if (bookings.length === 0) {
        container.innerHTML = '<p class="text-center">No bookings found</p>';
        return;
    }
    
    container.innerHTML = `
        <div class="table-responsive">
            <table class="table">
                <thead>
                    <tr>
                        <th>Booking ID</th>
                        <th>Facility</th>
                        <th>Date</th>
                        <th>Time</th>
                        <th>Amount</th>
                        <th>Status</th>
                        <th>Action</th>
                    </tr>
                </thead>
                <tbody>
                    ${bookings.map(booking => `
                        <tr>
                            <td>${booking.booking_id}</td>
                            <td>${booking.facility_id?.name || 'N/A'}</td>
                            <td>${booking.booking_date}</td>
                            <td>${booking.start_time} - ${booking.end_time}</td>
                            <td>₹${booking.amount}</td>
                            <td><span class="status-${booking.booking_status}">${booking.booking_status.charAt(0).toUpperCase() + booking.booking_status.slice(1)}</span></td>
                            <td>
                                ${booking.booking_status === 'confirmed' ? 
                                    `<button class="btn btn-danger btn-sm" onclick="cancelBooking('${booking.id}')">Cancel</button>` : 
                                    '-'
                                }
                            </td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        </div>
    `;
}

async function filterBookings() {
    const token = getToken();
    const status = document.getElementById('statusFilter').value;
    const container = document.getElementById('bookingsList');
    
    let url = `${API_BASE}/bookings/my`;
    if (status) url += `?status=${status}`;
    
    try {
        const response = await fetch(url, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        
        if (response.ok) {
            const bookings = await response.json();
            displayBookings(bookings);
        }
    } catch (error) {
        console.error('Error filtering bookings:', error);
    }
}

async function cancelBooking(bookingId) {
    const token = getToken();
    
    if (!confirm('Are you sure you want to cancel this booking?')) {
        return;
    }
    
    try {
        const response = await fetch(`${API_BASE}/bookings/${bookingId}`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        
        if (response.ok) {
            alert('Booking cancelled successfully');
            loadMyBookings();
        } else {
            const data = await response.json();
            alert(data.message);
        }
    } catch (error) {
        console.error('Error cancelling booking:', error);
        alert('Server error. Please try again.');
    }
}
