const nodemailer = require('nodemailer');

exports.handler = async (event) => {
    if (event.httpMethod !== 'POST') {
        return { statusCode: 405, body: 'Method Not Allowed' };
    }

    const { email, city, unitType, sqft, painPoints } = JSON.parse(event.body);
    const painPointsStr = Array.isArray(painPoints) ? painPoints.join(', ') : '';

    // ── 1. Update Loops contact with survey answers ──────────────────
    await fetch('https://app.loops.so/api/v1/contacts/update', {
        method: 'PUT',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${process.env.LOOPS_API_KEY}`
        },
        body: JSON.stringify({
            email,
            city,
            unitType,
            sqft,
            painPoints: painPointsStr
        })
    });

    // ── 2. Email Nigel a formatted brief ─────────────────────────────
    const transporter = nodemailer.createTransport({
        host: 'smtp.zoho.com',
        port: 465,
        secure: true,
        auth: {
            user: process.env.ZOHO_USER, // nigel@panlhome.com
            pass: process.env.ZOHO_PASS  // Zoho app-specific password
        }
    });

    await transporter.sendMail({
        from: `"Panl" <${process.env.ZOHO_USER}>`,
        to: process.env.ZOHO_USER,
        replyTo: email,
        subject: `New audit — ${city || 'location not provided'}`,
        text: [
            `New space audit request`,
            ``,
            `Email:       ${email}`,
            `City:        ${city || '—'}`,
            `Home type:   ${unitType || '—'}`,
            `Size:        ${sqft || '—'}`,
            `Pain points: ${painPointsStr || '—'}`,
            ``,
            `Reply directly to this email to respond to them.`
        ].join('\n')
    });

    return { statusCode: 200, body: JSON.stringify({ ok: true }) };
};
