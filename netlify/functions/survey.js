const nodemailer = require('nodemailer');

exports.handler = async (event) => {
    if (event.httpMethod !== 'POST') {
        return { statusCode: 405, body: 'Method Not Allowed' };
    }

    const { email, name, city, unitType, sqft, ownership, painPoints,
            utm_source, utm_medium, utm_campaign, utm_content, utm_term } = JSON.parse(event.body);
    const firstName = (name || '').trim().split(/\s+/)[0];
    const painPointsStr = Array.isArray(painPoints) ? painPoints.join(', ') : '';

    // Map pain point labels to boolean flags
    const flags = {
        isWfh:             painPoints.includes('Working from home'),
        isNursery:         painPoints.includes('Baby or young child sleeping'),
        isAfterSchool:     painPoints.includes('Kids home after school'),
        isExercise:        painPoints.includes('Exercising at home'),
        isOvernightGuests: painPoints.includes('Hosting overnight guests'),
        isPets:            painPoints.includes('Living with a pet')
    };

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
            ownership,
            ...flags
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
        subject: `New audit request — ${firstName || 'Unknown'}, ${city || 'location not provided'}`,
        text: [
            `New space audit request`,
            ``,
            `Name:        ${name || '—'}`,
            `Email:       ${email}`,
            `City:        ${city || '—'}`,
            `Home type:   ${unitType || '—'}`,
            `Size:        ${sqft || '—'}`,
            `Ownership:   ${ownership || '—'}`,
            `Pain points: ${painPointsStr || '—'}`,
            ``,
            `Reply directly to this email to respond to them.`,
            ...(utm_source || utm_medium || utm_campaign ? [
            ``,
            `── Attribution ──────────────────────────────`,
            utm_source   ? `Source:    ${utm_source}`   : null,
            utm_medium   ? `Medium:    ${utm_medium}`   : null,
            utm_campaign ? `Campaign:  ${utm_campaign}` : null,
            utm_content  ? `Content:   ${utm_content}`  : null,
            utm_term     ? `Term:      ${utm_term}`     : null,
        ].filter(Boolean) : [])
        ].join('\n')
    });

    return { statusCode: 200, body: JSON.stringify({ ok: true }) };
};
