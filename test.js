const knex = require("./db/db");

async function getAllTablesPostgres() {
    try {
        const result = await knex.select("table_name").from("information_schema.tables").where("table_schema", "public").andWhere("table_type", "BASE TABLE");

        console.log("PostgreSQL jadvallari:");
        result.forEach((row) => console.log(row.table_name));

        return result.map((row) => row.table_name);
    } catch (error) {
        console.error("Xatolik:", error);
        throw error;
    } finally {
        await knex.destroy();
    }
}

getAllTablesPostgres();
