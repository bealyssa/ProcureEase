const { EntitySchema } = require('typeorm')

module.exports = new EntitySchema({
    name: 'AuditLog',
    tableName: 'audit_log',
    columns: {
        log_id: {
            type: 'int',
            primary: true,
            generated: 'increment',
        },
        action_type: {
            type: 'varchar',
            length: 50,
            nullable: false,
            comment: 'Valid values: Created, Updated, Approved, Rejected, Delivered',
        },
        old_value: {
            type: 'text',
            nullable: true,
        },
        new_value: {
            type: 'text',
            nullable: true,
        },
        timestamp: {
            type: 'timestamp',
            nullable: false,
            default: () => 'CURRENT_TIMESTAMP',
        },
    },
    relations: {
        purchaseRequest: {
            type: 'many-to-one',
            target: 'PurchaseRequest',
            joinColumn: { name: 'pr_id' },
            nullable: true,
            inverseSide: 'auditLogs',
            onDelete: 'SET NULL',
        },
        purchaseOrder: {
            type: 'many-to-one',
            target: 'PurchaseOrder',
            joinColumn: { name: 'po_id' },
            nullable: true,
            inverseSide: 'auditLogs',
            onDelete: 'SET NULL',
        },
        user: {
            type: 'many-to-one',
            target: 'User',
            joinColumn: { name: 'user_id' },
            nullable: true,
            inverseSide: 'auditLogs',
            onDelete: 'SET NULL',
        },
    },
})
