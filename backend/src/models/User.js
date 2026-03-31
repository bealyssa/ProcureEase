const { EntitySchema } = require('typeorm')

module.exports = new EntitySchema({
    name: 'User',
    tableName: 'users',
    columns: {
        user_id: {
            type: 'int',
            primary: true,
            generated: 'increment',
        },
        user_name: {
            type: 'varchar',
            length: 255,
            nullable: false,
        },
        email: {
            type: 'varchar',
            length: 255,
            unique: true,
            nullable: false,
        },
        role: {
            type: 'varchar',
            length: 100,
            nullable: false,
            comment:
                'Valid values: Admin, Department User',
        },
        password_hash: {
            type: 'varchar',
            length: 255,
            nullable: false,
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
        department: {
            type: 'many-to-one',
            target: 'Department',
            joinColumn: { name: 'dept_id' },
            nullable: false,
            inverseSide: 'users',
            onDelete: 'RESTRICT',
        },
        purchaseRequests: {
            type: 'one-to-many',
            target: 'PurchaseRequest',
            inverseSide: 'requester',
        },
        approvals: {
            type: 'one-to-many',
            target: 'ApprovalWorkflow',
            inverseSide: 'approver',
        },
        deliveriesReceived: {
            type: 'one-to-many',
            target: 'Delivery',
            inverseSide: 'receivedBy',
        },
        auditLogs: {
            type: 'one-to-many',
            target: 'AuditLog',
            inverseSide: 'user',
        },
    },
})
