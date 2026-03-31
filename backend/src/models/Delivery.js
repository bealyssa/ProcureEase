const { EntitySchema } = require('typeorm')

module.exports = new EntitySchema({
    name: 'Delivery',
    tableName: 'delivery',
    columns: {
        delivery_id: {
            type: 'int',
            primary: true,
            generated: 'increment',
        },
        delivery_date: {
            type: 'date',
            nullable: true,
        },
        quantity_received: {
            type: 'int',
            nullable: true,
        },
        condition_status: {
            type: 'varchar',
            length: 20,
            nullable: true,
            comment: 'Valid values: Good, Damaged, Incomplete',
        },
        delivery_remarks: {
            type: 'text',
            nullable: true,
        },
        created_at: {
            type: 'timestamp',
            createDate: true,
            update: false,
        },
    },
    relations: {
        purchaseOrder: {
            type: 'many-to-one',
            target: 'PurchaseOrder',
            joinColumn: { name: 'po_id' },
            nullable: false,
            inverseSide: 'deliveries',
            onDelete: 'CASCADE',
        },
        receivedBy: {
            type: 'many-to-one',
            target: 'User',
            joinColumn: { name: 'received_by_id' },
            nullable: true,
            inverseSide: 'deliveriesReceived',
            onDelete: 'SET NULL',
        },
    },
})
