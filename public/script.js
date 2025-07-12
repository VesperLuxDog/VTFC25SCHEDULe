document.addEventListener('DOMContentLoaded', () => {
    
    const eventList = document.getElementById('event-list');
    const adminEventList = document.getElementById('admin-event-list');
    const eventTemplate = document.getElementById('event-template');
    const adminEventTemplate = document.getElementById('admin-event-template');
    const addEventForm = document.getElementById('event-form');
    const publicView = document.getElementById('public-view');
    const adminView = document.getElementById('admin-view');
    const adminLoginButton = document.getElementById('admin-login-button');
    const logoutButton = document.getElementById('logout-button');
    const passwordModal = document.getElementById('password-modal');
    const passwordInput = document.getElementById('password-input');
    const submitPasswordButton = document.getElementById('submit-password');
    const closeButton = passwordModal.querySelector('.close-button');
    const passwordError = document.getElementById('password-error');
    const cancelPasswordButton = document.getElementById('cancel-password');
    const passwordChangeSection = document.getElementById('password-change-section');
    const newPasswordInput = document.getElementById('new-password-input');
    const saveNewPasswordButton = document.getElementById('save-new-password');

    let events = [];

    // Fetch events from backend
    async function fetchEvents() {
        try {
            const response = await fetch('/events');
            if (response.ok) {
                events = await response.json();
                renderAllViews();
            } else {
                console.error("Failed to fetch events:", response.status);
            }
        } catch (error) {
            console.error("Error fetching events:", error);
        }
    }

    // Save events to backend
    async function saveEvents(events) {
        const response = await fetch('/saveEvent', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ event: events })
        });
        if (response.ok) {
            fetchEvents();
        }
    }
  
    async function updateEvents(events) {
        const response = await fetch('/updateEvents', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(events)
        });
        if (response.ok) {
            fetchEvents();
        }
    }

    // Add a new event
    async function addEvent(eventData) {
        // Ensure that the event data is complete
        if (!eventData.title || !eventData.time || !eventData.location) {
            alert('Please fill in Title, Time, and Location.');
            return; // Prevent saving incomplete events
        }

        // Add an ID to the event (unique identifier)
        eventData.id = Date.now(); // Use timestamp as a unique ID

        console.log("Adding event:", eventData);  // Debugging: Log the event data

        const response = await fetch('/saveEvent', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ event: eventData })
        });

        if (response.ok) {
            fetchEvents();
        } else {
            console.log("Failed to save event:", response.status);  // Debugging: Log failure
        }
    }

    // Delete an event
    async function deleteEvent(eventId) {
        if (confirm('Are you sure you want to delete this event?')) {
            const response = await fetch(`/deleteEvent/${eventId}`, {
                method: 'DELETE',
            });
            if (response.ok) {
                fetchEvents();
            }
        }
    }

    // Render events
    function renderEvents(targetListElement, templateElement, isAdmin = false) {
        targetListElement.innerHTML = ''; // Clear existing list
        if (events.length === 0) {
            targetListElement.innerHTML = '<p>No events scheduled yet.</p>';
            return;
        }
        events.forEach(event => {
            const templateClone = templateElement.content.cloneNode(true);
            templateClone.querySelector('.event-item-title').textContent = event.title;
            templateClone.querySelector('.event-item-time').textContent = event.time;
            templateClone.querySelector('.event-item-location').textContent = event.location;
            templateClone.querySelector('.event-item-description').textContent = event.description;

            if (isAdmin) {
                const eventItemDiv = templateClone.querySelector('.admin-event-item');
                eventItemDiv.dataset.eventId = event.id;
                const deleteButton = templateClone.querySelector('.delete-event-button');
                deleteButton.addEventListener('click', () => deleteEvent(event.id));

                // Allow ordering of events
                const orderInput = templateClone.querySelector('.order-number');
                orderInput.value = event.order || ''; // Optional order input
            }

            targetListElement.appendChild(templateClone);
        });
    }

    // Render all views (public and admin)
    function renderAllViews() {
        renderEvents(eventList, eventTemplate, false); // Public view
        renderEvents(adminEventList, adminEventTemplate, true); // Admin view
    }

    function showAdminView() {
        publicView.classList.add('hidden');
        adminView.classList.remove('hidden');
        adminLoginButton.classList.add('hidden');
        passwordModal.classList.add('hidden');
        passwordInput.value = '';
        passwordError.classList.add('hidden');
    }

    function showPublicView() {
        adminView.classList.add('hidden');
        publicView.classList.remove('hidden');
        adminLoginButton.classList.remove('hidden');
    }

    async function checkPassword() {
        const enteredPassword = passwordInput.value;
        const data = await fetch('/readPass');
        const json = await data.json();
        const storedPassword = json.password;
        //console.log(data);
        if (enteredPassword === storedPassword) {
            showAdminView();
        } else {
            passwordError.classList.remove('hidden');
            passwordError.textContent = 'Incorrect password, please try again.';
        }
    }

    function hidePasswordModal() {
        passwordModal.classList.add('hidden');
        passwordError.classList.add('hidden');
        passwordInput.value = '';
    }

    // Password change handler
    // Password change handler
    saveNewPasswordButton.addEventListener('click', async () => {
        const newPassword = newPasswordInput.value.trim();
        if (newPassword) {
            try {
                const response = await fetch('/updatePassword', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ newPassword: newPassword })
                });
                if (response.ok) {
                    alert('Password updated successfully!');
                    passwordChangeSection.classList.add('hidden');
                } else {
                    alert('Failed to update the password.');
                }
            } catch (error) {
                alert('Error updating password:', error);
            }
        } else {
            alert('Please enter a valid password');
        }
    });


    // Show password change section
    passwordChangeSection.addEventListener('click', () => {
        passwordChangeSection.classList.remove('hidden');
    });

    // Reorder events
    function reorderEvents() {
        // Loop through the events and update their order based on the input
        events.forEach((event) => {
            const orderInput = document.querySelector(`[data-event-id="${event.id}"] .order-number`);
            const order = parseInt(orderInput.value) || 0; // Default to 0 if no value is provided
            event.order = order; // Update event's order
        });

        // Sort events based on the new order value
        events.sort((a, b) => a.order - b.order);

        // Save the updated events
        updateEvents(events);
    }

    // Event Listeners
    adminLoginButton.addEventListener('click', () => {
        passwordModal.classList.remove('hidden');
        passwordInput.focus();
    });

    closeButton.addEventListener('click', hidePasswordModal);
    cancelPasswordButton.addEventListener('click', hidePasswordModal);
    submitPasswordButton.addEventListener('click', checkPassword);
    passwordInput.addEventListener('keypress', (event) => {
        if (event.key === 'Enter') {
            checkPassword();
        }
    });

    logoutButton.addEventListener('click', showPublicView);

    // Event listener for reorder events button
    document.getElementById('reorder-events-button').addEventListener('click', reorderEvents);

    addEventForm.addEventListener('submit', (e) => {
        e.preventDefault(); // Prevent page reload
        const title = document.getElementById('event-title').value.trim();
        const time = document.getElementById('event-time').value.trim();
        const location = document.getElementById('event-location').value.trim();
        const description = document.getElementById('event-description').value.trim();

        if (title && time && location) {
            // Adding an order value of 0 by default
            addEvent({ title, time, location, description, order: 0 });
            addEventForm.reset(); // Clear the form
        } else {
            alert('Please fill in Title, Time, and Location.');
        }
    });

    fetchEvents(); // Initial load of events
});
