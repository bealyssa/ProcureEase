const { EntitySchema } = require('typeorm')

module.exports = new EntitySchema({
    name: 'PrItem',
    tableName: 'pr_items',
    columns: {
        pr_item_id: {
            type: 'int',
            primary: true,
            generated: 'increment',
        },
        item_name: {
            type: 'varchar',
            length: 255,
            nullable: false,
        },
        item_description: {
            type: 'text',
            nullable: true,
        },
        quantity: {
            type: 'int',
            nullable: false,
            default: 1,
        },
        unit_of_measure: {
            type: 'varchar',
            length: 50,
            nullable: true,
        },
        unit_price: {
            type: 'numeric',
            precision: 14,
            scale: 2,
            nullable: true,
        },
        total_price: {
            type: 'numeric',
            precision: 14,
            scale: 2,
            nullable: true,
        },
        specification: {
            type: 'text',
            nullable: true,
        },
    },
    relations: {
        purchaseRequest: {
            type: 'many-to-one',
            target: 'PurchaseRequest',
            joinColumn: { name: 'pr_id' },
            nullable: false,
            inverseSide: 'items',
            onDelete: 'CASCADE',
        },
    },
})
