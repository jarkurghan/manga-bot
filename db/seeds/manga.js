/**
 * @param {import("knex").Knex} knex
 * @returns {Promise<void>}
 */
exports.seed = async function (knex) {
    try {
        const data = { user_id: "6389479517", username: "najmiddin_nazirov", first_name: "Nazirov", last_name: null }
        const user = await knex("user").insert(data).returning("*");
        await knex("user_page").insert({ user_id: user[0].id });
    } catch (error) {
        console.error(error);
    }
};
