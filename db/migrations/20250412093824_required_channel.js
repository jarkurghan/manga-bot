/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function (knex) {
    return knex.schema.createTable("required_channel", function (table) {
        table.increments("id").primary();
        table.string("username");
        table.string("name");
        table.integer("count").defaultTo(0).notNullable();
        table.string("status").defaultTo("1");
        table.datetime("created_date").defaultTo(knex.fn.now());
        table.datetime("deactivated_date");
    });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function (knex) {
    return knex.schema.dropTable("required_channel");
};
