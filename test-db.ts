import { createClient } from "@libsql/client";
import * as dotenv from "dotenv";
dotenv.config();

const url = process.env.TURSO_DATABASE_URL;
const authToken = process.env.TURSO_AUTH_TOKEN;

console.log("URL:", url);
console.log("Token Length:", authToken?.length);
console.log("Token Start:", authToken?.substring(0, 10));

const client = createClient({
    url: url!,
    authToken: authToken!,
});

async function test() {
    try {
        const rs = await client.execute("SELECT 1");
        console.log("Success!", rs);
    } catch (e) {
        console.error("Error:", e);
    }
}

test();
