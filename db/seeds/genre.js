/**
 * @param {import("knex").Knex} knex
 * @returns {Promise<void>}
 */
exports.seed = async function (knex) {
    try {
        const data = [
            { name: "Shounen" },
            { name: "Jangari" },
            { name: "Sarguzasht" },
            { name: "Fantaziya" },
            { name: "Dramma" },
            { name: "Ilmiy Fantastika" },
            { name: "Mistik" },
            { name: "Triller" },
        ];
        await knex("genre").insert(data);
    } catch (error) {
        console.error(error);
    }
};
