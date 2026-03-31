const { EntitySchema } = require('typeorm')

module.exports = new EntitySchema({
    name: 'Supplier',
    tableName: 'supplier',
    columns: {
        supplier_id: {
            type: 'int',
            primary: true,
            generated: 'increment',
        },
        supplier_name: {
            type: 'varchar',
            length: 255,
            nullable: false,
        },
        contact_person: {
            type: 'varchar',
            length: 255,
            nullable: true,
        },
        email: {
            type: 'varchar',
            length: 255,
            nullable: true,
        },
        phone_number: {
            type: 'varchar',
            length: 50,
            nullable: true,
        },
        address: {
            type: 'text',
            nullable: true,
        },
        city: {
            type: 'varchar',
            length: 120,
            nullable: true,
        },
        registration_number: {
            type: 'varchar',
            length: 120,
            nullable: true,
        },
        supplier_rating: {
            type: 'numeric',
            precision: 3,
            scale: 2,
            nullable: true,
            comment: '0-5 rating',
        },
        is_active: {
            type: 'boolean',
            default: true,
        },
        created_at: {
            type: 'timestamp',
            createDate: true,
            update: false,
        },
    },
    relations: {
        bids: {
            type: 'one-to-many',
            target: 'Bid',
            inverseSide: 'supplier',
        },
        purchaseOrders: {
            type: 'one-to-many',
            target: 'PurchaseOrder',
            inverseSide: 'supplier',
        },
        awards: {
            type: 'one-to-many',
            target: 'NoticeOfAward',
            inverseSide: 'supplier',
        },
    },
})
