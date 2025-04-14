/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function (knex) {
    return knex.schema
        .createTable("genre", function (table) {
            table.increments("id").primary();
            table.string("name").notNullable().unique();
            table.datetime("created_date").defaultTo(knex.fn.now());
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
    return knex.schema.dropTable("manga_genre").dropTable("genre");
};
