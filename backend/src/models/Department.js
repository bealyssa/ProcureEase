const { EntitySchema } = require('typeorm')

module.exports = new EntitySchema({
    name: 'Department',
    tableName: 'department',
    columns: {
        dept_id: {
            type: 'int',
            primary: true,
            generated: 'increment',
        },
        dept_name: {
            type: 'varchar',
            length: 255,
            nullable: false,
        },
        dept_head_name: {
            type: 'varchar',
            length: 255,
            nullable: true,
        },
        contact_number: {
            type: 'varchar',
            length: 50,
            nullable: true,
        },
        budget_allocation: {
            type: 'numeric',
            precision: 14,
            scale: 2,
            nullable: true,
        },
        created_at: {
            type: 'timestamp',
            createDate: true,
            update: false,
        },
    },
    relations: {
        users: {
            type: 'one-to-many',
            target: 'User',
            inverseSide: 'department',
        },
        purchaseRequests: {
            type: 'one-to-many',
            target: 'PurchaseRequest',
            inverseSide: 'department',
        },
    },
})
