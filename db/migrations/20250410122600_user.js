/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function (knex) {
    return knex.schema
        .createTable("user", function (table) {
            table.increments("id").primary();
            table.bigInteger("user_id").notNullable().unique();
            table.string("username");
            table.string("first_name");
            table.string("last_name");
            table.timestamp("created_date").defaultTo(knex.fn.now());
        })
        .createTable("user_page", function (table) {
            table.increments("id").primary();
            table.integer("user_id").notNullable().unique();
            table.foreign("user_id").references("id").inTable("user").onDelete("CASCADE");
            table.integer("manga_id").references("id").inTable("manga");
            table.integer("manga_page").defaultTo(0);
            table.integer("episode_page").defaultTo(0);
            table.string("searching").defaultTo("");
            table.string("genres").defaultTo("");
            table.string("not_genres").defaultTo("");
        });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function (knex) {
    return knex.schema.dropTable("user_page").dropTable("user");
};
