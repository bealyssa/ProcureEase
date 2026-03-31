const { EntitySchema } = require('typeorm')

module.exports = new EntitySchema({
    name: 'PurchaseRequest',
    tableName: 'purchase_request',
    columns: {
        pr_id: {
            type: 'int',
            primary: true,
            generated: 'increment',
        },
        pr_number: {
            type: 'varchar',
            length: 100,
            unique: true,
            nullable: false,
        },
        request_date: {
            type: 'date',
            nullable: true,
        },
        description: {
            type: 'text',
            nullable: true,
        },
        total_amount: {
            type: 'numeric',
            precision: 14,
            scale: 2,
            nullable: true,
        },
        status: {
            type: 'varchar',
            length: 50,
            nullable: false,
            comment:
                'Valid values: Draft, Submitted, Approved, Rejected, For BAC, Processing, Completed',
            default: 'Draft',
        },
        priority_level: {
            type: 'varchar',
            length: 20,
            nullable: true,
            comment: 'Valid values: Low, Medium, High, Urgent',
            default: 'Low',
        },
        admin_remarks: {
            type: 'text',
            nullable: true,
        },
        archived: {
            type: 'boolean',
            default: false,
        },
        deleted: {
            type: 'boolean',
            default: false,
        },
        created_at: {
            type: 'timestamp',
            createDate: true,
            update: false,
        },
        updated_at: {
            type: 'timestamp',
            updateDate: true,
        },
    },
    relations: {
        department: {
            type: 'many-to-one',
            target: 'Department',
            joinColumn: { name: 'dept_id' },
            nullable: false,
            inverseSide: 'purchaseRequests',
            onDelete: 'RESTRICT',
        },
        requester: {
            type: 'many-to-one',
            target: 'User',
            joinColumn: { name: 'requester_id' },
            nullable: false,
            inverseSide: 'purchaseRequests',
            onDelete: 'RESTRICT',
        },
        category: {
            type: 'many-to-one',
            target: 'ItemCategory',
            joinColumn: { name: 'category_id' },
            nullable: false,
            inverseSide: 'purchaseRequests',
            onDelete: 'RESTRICT',
        },
        items: {
            type: 'one-to-many',
            target: 'PrItem',
            inverseSide: 'purchaseRequest',
        },
        bids: {
            type: 'one-to-many',
            target: 'Bid',
            inverseSide: 'purchaseRequest',
        },
        approvals: {
            type: 'one-to-many',
            target: 'ApprovalWorkflow',
            inverseSide: 'purchaseRequest',
        },
        purchaseOrders: {
            type: 'one-to-many',
            target: 'PurchaseOrder',
            inverseSide: 'purchaseRequest',
        },
        auditLogs: {
            type: 'one-to-many',
            target: 'AuditLog',
            inverseSide: 'purchaseRequest',
        },
    },
})
