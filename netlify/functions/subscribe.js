exports.handler = async (event) => {
    if (event.httpMethod !== 'POST') {
        return { statusCode: 405, body: 'Method Not Allowed' };
    }

    const { email } = JSON.parse(event.body);

    const response = await fetch('https://app.loops.so/api/v1/contacts/create', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${process.env.LOOPS_API_KEY}`
        },
        body: JSON.stringify({ email, userGroup: 'BABY' })
    });

    const data = await response.json();
    return { statusCode: 200, body: JSON.stringify(data) };
};
