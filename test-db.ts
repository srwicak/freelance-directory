import { createClient } from "@libsql/client";
import * as dotenv from "dotenv";
dotenv.config();

const url = process.env.TURSO_DATABASE_URL?.replace("libsql://", "https://");
const authToken = process.env.TURSO_AUTH_TOKEN;

console.log("URL:", url);

const client = createClient({
    url: url!,
    authToken: authToken!,
});

async function test() {
    try {
        console.log("Checking connection...");
        const rs = await client.execute("SELECT 1");
        console.log("Connection successful!", rs);

        console.log("Checking tables...");
        const tables = await client.execute("SELECT name FROM sqlite_master WHERE type='table'");
        console.log("Tables found:", tables.rows);

        const hasFreelancers = tables.rows.some(r => r.name === 'freelancers');
        if (hasFreelancers) {
            console.log("Table 'freelancers' exists. Checking count...");
            const count = await client.execute("SELECT count(*) as c FROM freelancers");
            console.log("Freelancers count:", count.rows[0]);

            console.log("Checking schema of 'freelancers'...");
            const schema = await client.execute("PRAGMA table_info(freelancers)");
            console.log("Schema:", schema.rows);

        } else {
            console.log("Table 'freelancers' NOT found!");
        }

    } catch (e) {
        console.error("Error:", e);
    }
}

test();
