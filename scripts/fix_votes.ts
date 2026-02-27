import { tursoExecute, tursoQuery } from '../lib/db';

async function fix() {
    console.log("Fixing negative votes...");
    await tursoExecute(`UPDATE opportunities SET thumbs_up = 0 WHERE thumbs_up < 0`);
    await tursoExecute(`UPDATE opportunities SET thumbs_down = 0 WHERE thumbs_down < 0`);
    console.log("Done");
}

fix().catch(console.error);
