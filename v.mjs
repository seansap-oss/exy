import { readFileSync } from "node:fs";
const [URL_, KEY] = readFileSync(".pk","utf8").trim().split(/\r?\n/);
const h = { apikey: KEY, Authorization:`Bearer ${KEY}`, "Content-Type":"application/json" };
const cur = await (await fetch(`${URL_}/rest/v1/profiles?email=eq.komlalabs@gmail.com&select=id,email,role`,{headers:h})).json();
console.log("BEFORE:", JSON.stringify(cur[0]));
