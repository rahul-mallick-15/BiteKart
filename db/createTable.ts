import {connectDB} from "./connect";
require('dotenv').config();
const url =  process.env.DB_URL || "";

async function createTable(){
    const sql = await connectDB(url);
    await sql`DROP TABLE IF EXISTS "Contact";`;
    await sql`
    CREATE TABLE "Contact" ( 
        "id" SERIAL PRIMARY KEY,
        "phoneNumber" CHAR(10),
        "email" VARCHAR(255),
        "linkedId" Int REFERENCES "Contact" ("id"),
        "linkPrecedence" VARCHAR(10) CHECK ("linkPrecedence" IN ('primary', 'secondary')) NOT NULL,"createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
        "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
        "deletedAt" TIMESTAMP WITH TIME ZONE )
    `;
    console.log(await sql`SELECT * FROM "Contact"`);
}

createTable();
// `SELECT * FROM pg_catalog.pg_tables WHERE schemaname='public';`
// "SELECT column_name, data_type, is_nullable, column_default FROM information_schema.columns WHERE table_name = 'Contact' "