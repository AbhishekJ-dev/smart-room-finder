const axios = require('axios');

const test = async () => {
    try {
        console.log("Testing Profile Route...");
        // This will likely fail without a token, but we can check if the route exists (401 vs 404)
        const res1 = await axios.get('http://localhost:5000/api/auth/1');
        console.log("Response 1:", res1.status);
    } catch (err) {
        console.log("Response 1 Error:", err.response?.status || err.message);
    }

    try {
        console.log("Testing Bookings Route...");
        const res2 = await axios.get('http://localhost:5000/api/bookings/user/1');
        console.log("Response 2:", res2.status);
    } catch (err) {
        console.log("Response 2 Error:", err.response?.status || err.message);
    }
};

test();
