const { EntitySchema } = require('typeorm')

module.exports = new EntitySchema({
    name: 'Bid',
    tableName: 'bid',
    columns: {
        bid_id: {
            type: 'int',
            primary: true,
            generated: 'increment',
        },
        bid_date: {
            type: 'date',
            nullable: true,
        },
        quoted_price: {
            type: 'numeric',
            precision: 14,
            scale: 2,
            nullable: true,
        },
        delivery_period_days: {
            type: 'int',
            nullable: true,
        },
        bid_status: {
            type: 'varchar',
            length: 30,
            nullable: false,
            default: 'Submitted',
            comment: 'Valid values: Submitted, Qualified, Disqualified, Awarded',
        },
        bid_document_path: {
            type: 'varchar',
            length: 500,
            nullable: true,
        },
        created_at: {
            type: 'timestamp',
            createDate: true,
            update: false,
        },
    },
    relations: {
        purchaseRequest: {
            type: 'many-to-one',
            target: 'PurchaseRequest',
            joinColumn: { name: 'pr_id' },
            nullable: false,
            inverseSide: 'bids',
            onDelete: 'CASCADE',
        },
        supplier: {
            type: 'many-to-one',
            target: 'Supplier',
            joinColumn: { name: 'supplier_id' },
            nullable: false,
            inverseSide: 'bids',
            onDelete: 'RESTRICT',
        },
        purchaseOrders: {
            type: 'one-to-many',
            target: 'PurchaseOrder',
            inverseSide: 'bid',
        },
        awards: {
            type: 'one-to-many',
            target: 'NoticeOfAward',
            inverseSide: 'bid',
        },
    },
})
