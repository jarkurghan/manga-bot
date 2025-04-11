// Update with your config settings.
require("dotenv").config({ path: process.env.NODE_ENV === "production" ? ".env.production" : ".env" });
require("dotenv").config({ path: process.env.NODE_ENV === "production" ? "../.env.production" : "../.env" });

// console.log(process.env.DATABASE);
/**
 * @type { Object.<string, import("knex").Knex.Config> }
 */
module.exports = {
    client: "pg",
    connection: {
        connectionString: process.env.DATABASE,
    },
    migrations: { directory: "./migrations" },
    seeds: { directory: "./seeds/" },
    pool: { min: 5, max: 100 },
};
