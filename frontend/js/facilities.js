const API_BASE = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
    ? 'http://localhost:5000/api'
    : '/api';

async function loadPopularFacilities() {
    const container = document.getElementById('popularFacilities');
    
    try {
        const response = await fetch(`${API_BASE}/facilities`);
        const facilities = await response.json();
        
        console.log('Facilities loaded:', facilities);
        
        const popularFacilities = facilities.slice(0, 3);
        
        container.innerHTML = popularFacilities.map(facility => `
            <div class="col-md-4 mb-4">
                <div class="card facility-card h-100">
                    <div class="facility-image">
                        <i class="fas fa-${getSportIcon(facility.sport_type)}"></i>
                    </div>
                    <div class="card-body">
                        <span class="sport-badge">${facility.sport_type}</span>
                        <h5 class="card-title">${facility.name}</h5>
                        <p class="card-text text-muted"><i class="fas fa-map-marker-alt me-2"></i>${facility.location}</p>
                        <p class="price-tag">₹${facility.price_per_hour}/hour</p>
                        <div class="d-flex justify-content-between align-items-center">
                            <span class="rating">
                                <i class="fas fa-star"></i> ${facility.rating} (${facility.review_count})
                            </span>
                            <a href="facility-details.html?id=${facility.id}" class="btn btn-primary btn-sm">View Details</a>
                        </div>
                    </div>
                </div>
            </div>
        `).join('');
    } catch (error) {
        console.error('Error loading facilities:', error);
        container.innerHTML = '<p class="text-center col-12">Error loading facilities</p>';
    }
}

async function loadFacilities() {
    const container = document.getElementById('facilitiesList');
    
    try {
        const response = await fetch(`${API_BASE}/facilities`);
        const facilities = await response.json();
        
        displayFacilities(facilities);
    } catch (error) {
        console.error('Error loading facilities:', error);
        container.innerHTML = '<p class="text-center col-12">Error loading facilities</p>';
    }
}

function displayFacilities(facilities) {
    const container = document.getElementById('facilitiesList');
    
    if (facilities.length === 0) {
        container.innerHTML = '<p class="text-center col-12">No facilities found</p>';
        return;
    }
    
    container.innerHTML = facilities.map(facility => `
        <div class="col-md-4 mb-4">
            <div class="card facility-card h-100">
                <div class="facility-image">
                    <i class="fas fa-${getSportIcon(facility.sport_type)}"></i>
                </div>
                <div class="card-body">
                    <span class="sport-badge">${facility.sport_type}</span>
                    <h5 class="card-title">${facility.name}</h5>
                    <p class="card-text text-muted"><i class="fas fa-map-marker-alt me-2"></i>${facility.location}</p>
                    <p class="price-tag">₹${facility.price_per_hour}/hour</p>
                    <div class="d-flex justify-content-between align-items-center">
                        <span class="rating">
                            <i class="fas fa-star"></i> ${facility.rating} (${facility.review_count})
                        </span>
                        <a href="facility-details.html?id=${facility.id}" class="btn btn-primary btn-sm">View Details</a>
                    </div>
                </div>
            </div>
        </div>
    `).join('');
}

async function filterFacilities() {
    const sport = document.getElementById('sportFilter').value;
    const location = document.getElementById('locationFilter').value;
    
    let url = `${API_BASE}/facilities?`;
    if (sport) url += `sport=${sport}&`;
    if (location) url += `location=${location}`;
    
    try {
        const response = await fetch(url);
        const facilities = await response.json();
        displayFacilities(facilities);
    } catch (error) {
        console.error('Error filtering facilities:', error);
    }
}

async function loadFacilityDetails() {
    const urlParams = new URLSearchParams(window.location.search);
    const facilityId = urlParams.get('id');
    const container = document.getElementById('facilityDetails');
    
    if (!facilityId) {
        window.location.href = 'facilities.html';
        return;
    }
    
    try {
        const response = await fetch(`${API_BASE}/facilities/${facilityId}`);
        const facility = await response.json();
        
        const today = new Date().toISOString().split('T')[0];
        
        container.innerHTML = `
            <div class="row">
                <div class="col-md-6">
                    <div class="facility-image mb-4" style="height: 300px;">
                        <i class="fas fa-${getSportIcon(facility.sport_type)} fa-4x"></i>
                    </div>
                </div>
                <div class="col-md-6">
                    <span class="sport-badge mb-2">${facility.sport_type}</span>
                    <h2 class="mb-3">${facility.name}</h2>
                    <p class="text-muted mb-3"><i class="fas fa-map-marker-alt me-2"></i>${facility.location}</p>
                    <p class="price-tag mb-3">₹${facility.price_per_hour}/hour</p>
                    <div class="rating mb-3">
                        <i class="fas fa-star"></i> ${facility.rating} (${facility.review_count} reviews)
                    </div>
                </div>
            </div>
            
            <div class="row mt-4">
                <div class="col-12">
                    <h4>Description</h4>
                    <p>${facility.description}</p>
                </div>
            </div>
            
            <div class="row mt-4">
                <div class="col-md-6">
                    <h4>Facilities Available</h4>
                    <p>${facility.facilities_available || 'Not specified'}</p>
                </div>
                <div class="col-md-6">
                    <h4>Rules</h4>
                    <p>${facility.rules || 'No specific rules'}</p>
                </div>
            </div>
            
            <div class="row mt-4">
                <div class="col-12">
                    <h4>Check Availability</h4>
                    <div class="row mb-3">
                        <div class="col-md-4">
                            <label class="form-label">Select Date</label>
                            <input type="date" class="form-control" id="bookingDate" min="${today}" value="${today}">
                        </div>
                        <div class="col-md-4 d-flex align-items-end">
                            <button class="btn btn-primary w-100" onclick="loadTimeSlots('${facilityId}')">Check Availability</button>
                        </div>
                    </div>
                    <div id="timeSlots"></div>
                </div>
            </div>
        `;
        
        loadTimeSlots(facilityId);
    } catch (error) {
        console.error('Error loading facility details:', error);
        container.innerHTML = '<p class="text-center">Error loading facility details</p>';
    }
}

async function loadTimeSlots(facilityId) {
    const date = document.getElementById('bookingDate').value;
    const container = document.getElementById('timeSlots');
    
    if (!date) {
        alert('Please select a date');
        return;
    }
    
    container.innerHTML = '<div class="text-center"><div class="spinner-border" role="status"></div></div>';
    
    try {
        const response = await fetch(`${API_BASE}/facilities/${facilityId}/availability?date=${date}`);
        const slots = await response.json();
        
        if (slots.length === 0) {
            container.innerHTML = '<p class="text-center">No time slots available for this date</p>';
            return;
        }
        
        container.innerHTML = `
            <div class="row">
                ${slots.map(slot => `
                    <div class="col-md-3 col-6 mb-2">
                        <div class="time-slot slot-${slot.status}" 
                             data-slot-id="${slot.id}" 
                             data-start="${slot.start_time}" 
                             data-end="${slot.end_time}"
                             onclick="selectSlot(this)">
                            ${slot.start_time} - ${slot.end_time}<br>
                            <small>${slot.status.charAt(0).toUpperCase() + slot.status.slice(1)}</small>
                        </div>
                    </div>
                `).join('')}
            </div>
            <div class="mt-4" id="bookingSection" style="display:none;">
                <button class="btn btn-primary btn-lg" onclick="proceedToBooking('${facilityId}')">Book Now</button>
            </div>
        `;
    } catch (error) {
        console.error('Error loading time slots:', error);
        container.innerHTML = '<p class="text-center">Error loading time slots</p>';
    }
}

let selectedSlot = null;

function selectSlot(element) {
    const status = element.classList.contains('slot-booked') || element.classList.contains('slot-unavailable');
    
    if (status) {
        return;
    }
    
    document.querySelectorAll('.time-slot').forEach(slot => {
        slot.classList.remove('selected');
    });
    
    element.classList.add('selected');
    selectedSlot = {
        id: element.dataset.slotId,
        start: element.dataset.start,
        end: element.dataset.end
    };
    
    document.getElementById('bookingSection').style.display = 'block';
}

async function proceedToBooking(facilityId) {
    const token = getToken();
    
    if (!token) {
        alert('Please login to book a facility');
        window.location.href = 'login.html';
        return;
    }
    
    if (!selectedSlot) {
        alert('Please select a time slot');
        return;
    }
    
    const date = document.getElementById('bookingDate').value;
    
    try {
        const response = await fetch(`${API_BASE}/facilities/${facilityId}`);
        const facility = await response.json();
        
        const confirmBooking = confirm(`
            Booking Summary:
            Facility: ${facility.name}
            Date: ${date}
            Time: ${selectedSlot.start} - ${selectedSlot.end}
            Price: ₹${facility.price_per_hour}
            
            Proceed to payment?
        `);
        
        if (confirmBooking) {
            window.location.href = `payment.html?facility_id=${facilityId}&slot_id=${selectedSlot.id}&date=${date}&start=${selectedSlot.start}&end=${selectedSlot.end}`;
        }
    } catch (error) {
        console.error('Error proceeding to booking:', error);
        alert('Server error. Please try again.');
    }
}

function getSportIcon(sport) {
    const icons = {
        'Football': 'futbol',
        'Cricket': 'baseball-ball',
        'Basketball': 'basketball-ball',
        'Badminton': 'feather-alt',
        'Tennis': 'table-tennis',
        'Multi-Sport': 'running'
    };
    return icons[sport] || 'running';
}
