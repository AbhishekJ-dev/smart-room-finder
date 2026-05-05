// Using native fetch in Node 22

async function test() {
    const response = await fetch('http://localhost:5000/api/rooms', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6Miwicm9sZSI6InVzZXIiLCJpYXQiOjE3Nzc5MjAzMzAsImV4cCI6MTc3ODUyNTEzMH0.L0zqSZGr3L6BA9U6JXJiOpnQtXHs3zYAHCWPQOn7JXQ'
        },
        body: JSON.stringify({
            type: '1BHK',
            city: 'Indore',
            area: 'Vijay Nagar',
            location: 'Near Mall',
            contact: '9876543210',
            price_monthly: 5000
        })
    });
    const data = await response.json();
    console.log('Status:', response.status);
    console.log('Data:', data);
}

test().catch(err => console.error('Fetch Error:', err));
