const dbUrl = process.env.TURSO_DATABASE_URL.replace('libsql://', 'https://');
const token = process.env.TURSO_AUTH_TOKEN;

async function fix() {
    const res = await fetch(`${dbUrl}/v2/pipeline`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
            requests: [
                { type: 'execute', stmt: { sql: 'UPDATE opportunities SET thumbs_up = 0 WHERE thumbs_up < 0', args: [] } },
                { type: 'execute', stmt: { sql: 'UPDATE opportunities SET thumbs_down = 0 WHERE thumbs_down < 0', args: [] } },
                { type: 'close' }
            ]
        })
    });
    console.log(await res.text());
}
fix().catch(console.error);
