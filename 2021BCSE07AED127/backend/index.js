const express = require('express');
const axios = require('axios');

const app = express();
const port = 9876;

const WINDOW_SIZE = 10;
let numberWindow = [];

const credentials = {
    "companyName": "Alliance University",
    "clientID": "552a8029-8643-4288-99fb-bee6edc988a1",
    "clientSecret": "BlPaMFFMmBigoeBx",
    "ownerName": "Aman Singh",
    "ownerEmail": "samanbtech21@ced.alliance.edu.in",
    "rollNo": "2021BCSE07AED127"
};

let token = "";

// Function to obtain the token
async function obtainToken() {
    try {
        console.log("Attempting to obtain token...");
        const response = await axios.post('http://20.244.56.144/test/auth', credentials);
        token = response.data.access_token; // Extract the access token
        console.log("Token obtained:", token);
    } catch (error) {
        console.error("Error obtaining token:", error.message);
    }
}

// Function to fetch numbers from the third-party server
async function fetchNumbers(type) {
    try {
        let endpoint;
        switch (type) {
            case 'p':
                endpoint = 'primes';
                break;
            case 'f':
                endpoint = 'fibo';
                break;
            case 'e':
                endpoint = 'random'; // Using 'random' endpoint for even numbers
                break;
            case 'r':
                endpoint = 'random';
                break;
            default:
                throw new Error("Invalid type");
        }

        console.log(`Fetching ${type} numbers from ${endpoint} with token...`);
        const response = await axios.get(`http://20.244.56.144/test/${endpoint}`, {
            headers: { Authorization: `Bearer ${token}` },
            timeout: 500
        });

        let numbers = response.data.numbers || [];
        
        if (type === 'e') {
            numbers = numbers.filter(number => number % 2 === 0); // Filter even numbers
        }

        console.log(`Response from ${endpoint} API:`, numbers);
        return numbers;
    } catch (error) {
        console.error(`Error fetching ${type} numbers:`, error.message);
        return [];
    }
}

// Function to update the number window
function updateNumberWindow(newNumbers) {
    console.log("Updating window with new numbers:", newNumbers);
    newNumbers.forEach(number => {
        if (!numberWindow.includes(number)) {
            if (numberWindow.length >= WINDOW_SIZE) {
                numberWindow.shift(); // Remove oldest number
            }
            numberWindow.push(number);
        }
    });
    console.log("Updated window state:", numberWindow);
}

// Function to calculate the average
function calculateAverage(numbers) {
    if (numbers.length === 0) return "NaN";
    const sum = numbers.reduce((acc, num) => acc + num, 0);
    return (sum / numbers.length).toFixed(2);
}

// Route to handle requests
app.get('/numbers/:numberId', async (req, res) => {
    const { numberId } = req.params;
    
    if (!['p', 'f', 'e', 'r'].includes(numberId)) {
        return res.status(400).json({ error: "Invalid number ID" });
    }

    if (!token) {
        await obtainToken();
    }

    if (!token) {
        return res.status(500).json({ error: "Unable to obtain token" });
    }

    const windowPrevState = [...numberWindow];
    const newNumbers = await fetchNumbers(numberId);
    
    if (newNumbers.length > 0) {
        updateNumberWindow(newNumbers);
    }

    const windowCurrState = [...numberWindow];
    const average = calculateAverage(numberWindow);

    res.json({
        windowPrevState,
        windowCurrState,
        numbers: newNumbers,
        avg: average
    });
});

app.listen(port, () => {
    console.log(`Average Calculator microservice running on port ${port}`);
});
