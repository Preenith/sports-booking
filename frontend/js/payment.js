const API_BASE = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
    ? 'http://localhost:5000/api'
    : '/api';

let bookingData = null;

async function loadPaymentDetails() {
    const urlParams = new URLSearchParams(window.location.search);
    const facilityId = urlParams.get('facility_id');
    const slotId = urlParams.get('slot_id');
    const date = urlParams.get('date');
    const start = urlParams.get('start');
    const end = urlParams.get('end');
    
    console.log('URL params:', { facilityId, slotId, date, start, end });
    
    if (!facilityId || !date || !start || !end) {
        alert('Missing booking information');
        window.location.href = 'facilities.html';
        return;
    }
    
    bookingData = { facility_id: facilityId, slot_id: slotId || null, booking_date: date, start_time: start, end_time: end };
    console.log('Booking data set:', bookingData);
    
    try {
        const response = await fetch(`${API_BASE}/facilities/${facilityId}`);
        const facility = await response.json();
        
        document.getElementById('bookingSummary').innerHTML = `
            <div class="mb-3">
                <strong>Facility:</strong> ${facility.name}
            </div>
            <div class="mb-3">
                <strong>Date:</strong> ${date}
            </div>
            <div class="mb-3">
                <strong>Time:</strong> ${start} - ${end}
            </div>
            <div class="mb-3">
                <strong>Duration:</strong> 1 hour
            </div>
            <hr>
            <div class="d-flex justify-content-between">
                <strong>Total Amount:</strong>
                <span class="price-tag">₹${facility.price_per_hour}</span>
            </div>
        `;
    } catch (error) {
        console.error('Error loading payment details:', error);
    }
}

async function handlePayment(e) {
    e.preventDefault();
    
    const token = getToken();
    if (!token) {
        alert('Please login to proceed with payment');
        window.location.href = 'login.html';
        return;
    }
    
    if (!bookingData) {
        alert('Booking data missing. Please try again.');
        window.location.href = 'facilities.html';
        return;
    }
    
    // Show processing message
    const submitBtn = e.target.querySelector('button[type="submit"]');
    submitBtn.disabled = true;
    submitBtn.innerHTML = '<span class="spinner-border spinner-border-sm me-2"></span>Processing Payment...';
    
    // Simulate payment delay
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    try {
        const response = await fetch(`${API_BASE}/bookings`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(bookingData)
        });
        
        const data = await response.json();
        
        if (response.ok) {
            alert(`Payment successful! Booking ID: ${data.booking.booking_id}`);
            window.location.href = 'my-bookings.html';
        } else {
            alert(data.message);
            submitBtn.disabled = false;
            submitBtn.innerHTML = 'Pay Now';
        }
    } catch (error) {
        console.error('Payment error:', error);
        alert('Payment failed. Please try again.');
        submitBtn.disabled = false;
        submitBtn.innerHTML = 'Pay Now';
    }
}
