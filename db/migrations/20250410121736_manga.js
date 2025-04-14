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
            table.datetime("created_date").defaultTo(knex.fn.now());
        })
        .createTable("chapter", function (table) {
            table.increments("id").primary();
            table.string("chapter").notNullable();
            table.string("posts").notNullable();
            table.integer("order").notNullable();
            table.integer("forward_count").defaultTo(0).notNullable();
            table.integer("manga_id").references("id").inTable("manga").notNullable();
            table.unique(["order", "manga_id"]);
            table.datetime("created_date").defaultTo(knex.fn.now());
        });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function (knex) {
    return knex.schema.dropTable("manga_genre").dropTable("chapter").dropTable("manga");
};
