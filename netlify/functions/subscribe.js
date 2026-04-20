const { randomUUID } = require('crypto');

exports.handler = async (event) => {
    if (event.httpMethod !== 'POST') {
        return { statusCode: 405, body: 'Method Not Allowed' };
    }

    const { name, email, utm_source, utm_medium, utm_campaign, utm_content, utm_term } = JSON.parse(event.body);
    const [firstName, ...rest] = name.trim().split(/\s+/);
    const lastName = rest.join(' ');
    const userId = randomUUID();

    const utmProps = {};
    if (utm_source)   utmProps.utmSource   = utm_source;
    if (utm_medium)   utmProps.utmMedium   = utm_medium;
    if (utm_campaign) utmProps.utmCampaign = utm_campaign;
    if (utm_content)  utmProps.utmContent  = utm_content;
    if (utm_term)     utmProps.utmTerm     = utm_term;

    try {
        const response = await fetch('https://app.loops.so/api/v1/contacts/upsert', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${process.env.LOOPS_API_KEY}`
            },
            body: JSON.stringify({ email, firstName, lastName, userId, ...utmProps })
        });

        const text = await response.text();
        if (!response.ok) {
            return { statusCode: 200, body: JSON.stringify({ ok: false, loopsStatus: response.status, loopsBody: text.slice(0, 300) }) };
        }
        const data = JSON.parse(text);
        return { statusCode: 200, body: JSON.stringify(data) };
    } catch (err) {
        console.error('Loops upsert failed:', err.message);
        return { statusCode: 200, body: JSON.stringify({ ok: true, loopsError: err.message }) };
    }
};
