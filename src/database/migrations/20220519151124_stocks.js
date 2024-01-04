exports.up = function (knex) {
    return knex.schema.createTable('stocks', function (table) {
        table.increments();

        table.string('title');
        table.string('ticker');

        table.float('div_yield');
        table.float('p_l');
        table.float('roe');
        table.float('roic');
        table.float('ev_ebit');

        table.decimal('rank_ev_ebit')
        table.decimal('rank_roic')
        table.decimal('rank_final')
    });
};

exports.down = function (knex) {
    return knex.schema.dropTable('stocks');
};