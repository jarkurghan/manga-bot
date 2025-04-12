/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function (knex) {
    return knex.schema
        .createTable("manga", function (table) {
            table.increments("id").primary();
            table.string("name").notNullable().unique();
            table.integer("number_of_chapters");
            table.string("status").notNullable().defaultTo("to'liq emas");
            table.string("keys");
            table.timestamp("created_date").defaultTo(knex.fn.now());
        })
        .createTable("chapter", function (table) {
            table.increments("id").primary();
            table.string("chapter").notNullable();
            table.string("subtitle");
            table.string("posts").notNullable();
            table.integer("manga_id").references("id").inTable("manga").notNullable();
            table.timestamp("created_date").defaultTo(knex.fn.now());
        })
        .createTable("manga_genre", function (table) {
            table.increments("id").primary();
            table.integer("manga_id").references("id").inTable("manga").notNullable();
            table.integer("genre_id").references("id").inTable("genre").notNullable();
        });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function (knex) {
    return knex.schema.dropTable("chapter").dropTable("manga");
};
