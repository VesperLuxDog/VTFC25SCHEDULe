const express = require('express');
const bodyParser = require('body-parser');
const fs = require('fs');
//const fsp = require('fs/promises');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000; // Glitch provides a dynamic port

// Parse JSON data
app.use(bodyParser.json());

// Serve static files from the 'public' folder
app.use(express.static(path.join(__dirname, 'public')));

// Read events from file
function readEvents() {
    return new Promise((resolve, reject) => {
        fs.readFile('events.json', (err, data) => {
            if (err) return reject(err);
            resolve(JSON.parse(data));
        });
    });
}

// Save events to file
function saveEvents(events) {
    return new Promise((resolve, reject) => {
        // Sort events by their order value before saving
        events.sort((a, b) => a.order - b.order);
        
        // Log events before saving
        console.log("Saving events:", events);  // Debugging: Log events before saving

        fs.writeFile('events.json', JSON.stringify(events, null, 2), (err) => {
            if (err) return reject(err);
            resolve();
        });
    });
}


// Endpoint to get all events
app.get('/events', async (req, res) => {
    try {
        const events = await readEvents();
        res.json(events);
    } catch (err) {
        res.status(500).send('Error reading events');
    }
});

// Endpoint to save a new event
app.post('/saveEvent', async (req, res) => {
    try {
        const events = await readEvents();
        const newEvent = req.body.event;
        console.log("Received event:", newEvent);  // Debugging: Log the incoming event
      
        // Check if the event has all required fields
        if (!newEvent.title || !newEvent.time || !newEvent.location) {
            return res.status(400).send('Missing required event data');
        }
      
        newEvent.id = Date.now(); // Set unique ID
        events.push(newEvent);
        await saveEvents(events);
        res.status(200).send('Event saved');
    } catch (err) {
        console.error("Error saving event:", err);  // Debugging: Log error if any
        res.status(500).send('Error saving event');
    }
});

// Endpoint to delete an event
app.delete('/deleteEvent/:id', async (req, res) => {
    try {
        const eventId = parseInt(req.params.id, 10);
        const events = await readEvents();
        const filteredEvents = events.filter(event => event.id !== eventId);
        await saveEvents(filteredEvents);
        res.status(200).send('Event deleted');
    } catch (err) {
        res.status(500).send('Error deleting event');
    }
});

// Endpoint to update all events (overwrite current events list)
app.post('/updateEvents', async (req, res) => {
    try {
        const body = req.body; // Get the list of events from the request
        const events = typeof body === 'string' ? JSON.parse(body):body
        //console.log(events)
        if (!Array.isArray(events)) {
            return res.status(400).send('Expected an array of events');
        }

        // Log events before saving for debugging
        console.log("Received events for overwrite:", events);

        await saveEvents(events); // Save the updated list of events
        res.status(200).send('Events updated successfully');
    } catch (err) {
        console.error("Error updating events:", err);  // Log error if any
        res.status(500).send('Error updating events');
    }
});

app.get('/readPass', async (req, res) => {
    //console.log('Function Called');
    fs.readFile('password.txt', 'utf8', (err, password) => {
        if (err) {
            console.error('Error reading password file:', err);
            return res.status(500).json({ error: 'Failed to read password file' });
        }
        //console.log(password);
        res.json({ "password":password });
    });
});

// Endpoint to update the admin password
app.post('/updatePassword', async (req, res) => {
    try {
        const { newPassword } = req.body;

        if (!newPassword || newPassword.trim() === '') {
            return res.status(400).send('New password is required');
        }

        // Write the new password to the password.txt file
        fs.writeFile('password.txt', newPassword, 'utf8', (err) => {
            if (err) {
                console.error('Error writing to password file:', err);
                return res.status(500).send('Error updating password');
            }
            res.status(200).send('Password updated successfully');
        });
    } catch (err) {
        console.error("Error updating password:", err);
        res.status(500).send('Error updating password');
    }
});


// Start the server
app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running at http://localhost:${PORT}`);
    console.log("Running Node.js version: ", process.version);
});

