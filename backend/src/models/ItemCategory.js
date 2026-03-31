const { EntitySchema } = require('typeorm')

module.exports = new EntitySchema({
    name: 'ItemCategory',
    tableName: 'item_category',
    columns: {
        category_id: {
            type: 'int',
            primary: true,
            generated: 'increment',
        },
        category_name: {
            type: 'varchar',
            length: 255,
            nullable: false,
            comment: 'Medical Supplies, Equipment, Medicines, etc.',
        },
        description: {
            type: 'text',
            nullable: true,
        },
    },
    relations: {
        purchaseRequests: {
            type: 'one-to-many',
            target: 'PurchaseRequest',
            inverseSide: 'category',
        },
    },
})
