import * as dotenv from "dotenv";
dotenv.config();

const url = process.env.TURSO_DATABASE_URL!.replace('libsql://', 'https://');
const authToken = process.env.TURSO_AUTH_TOKEN!.trim();

console.log("Testing Turso Hrana HTTP API directly...");
console.log("URL:", url);

async function test() {
    const body = {
        requests: [
            { type: 'execute', stmt: { sql: 'SELECT 1 as test', args: [] } },
            { type: 'close' }
        ]
    };

    try {
        const response = await fetch(`${url}/v2/pipeline`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${authToken}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(body),
        });

        console.log("Status:", response.status);
        const data = await response.json();
        console.log("Full response:", JSON.stringify(data, null, 2));

        // Now test actual table query
        const body2 = {
            requests: [
                { type: 'execute', stmt: { sql: 'SELECT id, name, field FROM freelancers LIMIT 2', args: [] } },
                { type: 'close' }
            ]
        };

        const response2 = await fetch(`${url}/v2/pipeline`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${authToken}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(body2),
        });

        console.log("\nTable query status:", response2.status);
        const data2 = await response2.json();
        console.log("Table query response:", JSON.stringify(data2, null, 2));

    } catch (e) {
        console.error("Error:", e);
    }
}

test();
