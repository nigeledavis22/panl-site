/**
 * Tests UTM propagation through the subscribe and survey Netlify functions.
 * Mocks fetch and nodemailer so no real network calls are made.
 * Run with: node test-utm.js
 */

// ── Mock nodemailer ──────────────────────────────────────────────────────────
const sentEmails = [];
require.cache[require.resolve('nodemailer')] = {
    id: 'nodemailer',
    filename: 'nodemailer',
    loaded: true,
    exports: {
        createTransport: () => ({
            sendMail: async (opts) => { sentEmails.push(opts); }
        })
    }
};

// ── Mock fetch ───────────────────────────────────────────────────────────────
const loopsCalls = [];
global.fetch = async (url, opts) => {
    loopsCalls.push({ url, body: JSON.parse(opts.body) });
    return { ok: true, json: async () => ({ success: true }) };
};

// ── Env vars ─────────────────────────────────────────────────────────────────
process.env.LOOPS_API_KEY = 'test-loops-key';
process.env.ZOHO_USER = 'nigel@panlhome.com';
process.env.ZOHO_PASS = 'test-pass';

// ── Load function handlers ────────────────────────────────────────────────────
const subscribe = require('./netlify/functions/subscribe');
const survey    = require('./netlify/functions/survey');

// ── Helpers ───────────────────────────────────────────────────────────────────
function makeEvent(body) {
    return { httpMethod: 'POST', body: JSON.stringify(body) };
}

function assert(condition, message) {
    if (!condition) {
        console.error(`  FAIL: ${message}`);
        process.exitCode = 1;
    } else {
        console.log(`  PASS: ${message}`);
    }
}

// ── Test data ─────────────────────────────────────────────────────────────────
const utms = {
    utm_source:   'reddit',
    utm_medium:   'paid',
    utm_campaign: 'apartment-audit-1',
    utm_content:  'parents-ad',
    utm_term:     'small-apartment'
};

const subscriber = { name: 'Jane Doe', email: 'jane@example.com', ...utms };

const surveyAnswers = {
    email:      'jane@example.com',
    name:       'Jane Doe',
    city:       'New York',
    unitType:   '1BR',
    sqft:       '750–1,000 sqft',
    ownership:  'Rent',
    painPoints: ['Baby or young child sleeping', 'Working from home'],
    ...utms
};

// ── Run tests ─────────────────────────────────────────────────────────────────
async function run() {
    console.log('\n── subscribe function ──────────────────────────────────────');
    loopsCalls.length = 0;

    const subRes = await subscribe.handler(makeEvent(subscriber));
    assert(subRes.statusCode === 200, 'returns 200');

    const loopsCall = loopsCalls[0];
    assert(loopsCall !== undefined, 'called Loops API');
    assert(loopsCall.url.includes('/contacts/upsert'), 'called contacts/upsert');
    assert(loopsCall.body.utmSource   === 'reddit',             'utmSource sent to Loops');
    assert(loopsCall.body.utmMedium   === 'paid',               'utmMedium sent to Loops');
    assert(loopsCall.body.utmCampaign === 'apartment-audit-1',  'utmCampaign sent to Loops');
    assert(loopsCall.body.utmContent  === 'parents-ad',         'utmContent sent to Loops');
    assert(loopsCall.body.utmTerm     === 'small-apartment',    'utmTerm sent to Loops');
    assert(loopsCall.body.email === 'jane@example.com',         'email sent to Loops');
    assert(loopsCall.body.firstName === 'Jane',                 'firstName parsed correctly');

    console.log('\n── survey function ─────────────────────────────────────────');
    loopsCalls.length = 0;
    sentEmails.length = 0;

    const surveyRes = await survey.handler(makeEvent(surveyAnswers));
    assert(surveyRes.statusCode === 200, 'returns 200');

    const loopsUpdate = loopsCalls[0];
    assert(loopsUpdate !== undefined, 'called Loops API');
    assert(loopsUpdate.url.includes('/contacts/update'), 'called contacts/update');
    assert(loopsUpdate.body.city === 'New York',    'city sent to Loops');
    assert(loopsUpdate.body.isNursery === true,     'isNursery flag set');
    assert(loopsUpdate.body.isWfh === true,         'isWfh flag set');

    const emailText = sentEmails[0]?.text || '';
    console.log('\n── UTM propagation in notification email ───────────────────');
    assert(emailText.includes('reddit'),             'utm_source in email');
    assert(emailText.includes('paid'),               'utm_medium in email');
    assert(emailText.includes('apartment-audit-1'), 'utm_campaign in email');
    assert(emailText.includes('parents-ad'),        'utm_content in email');
    assert(emailText.includes('small-apartment'),   'utm_term in email');

    console.log('');
}

run().catch(err => { console.error(err); process.exit(1); });
