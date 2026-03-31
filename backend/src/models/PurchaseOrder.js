const { EntitySchema } = require('typeorm')

module.exports = new EntitySchema({
    name: 'PurchaseOrder',
    tableName: 'purchase_order',
    columns: {
        po_id: {
            type: 'int',
            primary: true,
            generated: 'increment',
        },
        po_number: {
            type: 'varchar',
            length: 100,
            unique: true,
            nullable: false,
        },
        issue_date: {
            type: 'date',
            nullable: true,
        },
        expected_delivery_date: {
            type: 'date',
            nullable: true,
        },
        actual_delivery_date: {
            type: 'date',
            nullable: true,
        },
        po_amount: {
            type: 'numeric',
            precision: 14,
            scale: 2,
            nullable: true,
        },
        po_status: {
            type: 'varchar',
            length: 30,
            nullable: false,
            default: 'Issued',
            comment: 'Valid values: Issued, Received, Partially Received, Completed, Cancelled',
        },
        payment_status: {
            type: 'varchar',
            length: 20,
            nullable: false,
            default: 'Pending',
            comment: 'Valid values: Pending, Partial, Paid',
        },
        po_document_path: {
            type: 'varchar',
            length: 500,
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
        purchaseRequest: {
            type: 'many-to-one',
            target: 'PurchaseRequest',
            joinColumn: { name: 'pr_id' },
            nullable: false,
            inverseSide: 'purchaseOrders',
            onDelete: 'RESTRICT',
        },
        bid: {
            type: 'many-to-one',
            target: 'Bid',
            joinColumn: { name: 'bid_id' },
            nullable: false,
            inverseSide: 'purchaseOrders',
            onDelete: 'RESTRICT',
        },
        supplier: {
            type: 'many-to-one',
            target: 'Supplier',
            joinColumn: { name: 'supplier_id' },
            nullable: false,
            inverseSide: 'purchaseOrders',
            onDelete: 'RESTRICT',
        },
        deliveries: {
            type: 'one-to-many',
            target: 'Delivery',
            inverseSide: 'purchaseOrder',
        },
        auditLogs: {
            type: 'one-to-many',
            target: 'AuditLog',
            inverseSide: 'purchaseOrder',
        },
    },
})
