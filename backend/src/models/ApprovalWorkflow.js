const { EntitySchema } = require('typeorm')

module.exports = new EntitySchema({
    name: 'ApprovalWorkflow',
    tableName: 'approval_workflow',
    columns: {
        approval_id: {
            type: 'int',
            primary: true,
            generated: 'increment',
        },
        approval_level: {
            type: 'int',
            nullable: false,
            comment: '1=Department Head, 2=PMO, 3=Budget Office, 4=BAC, 5=Final',
        },
        status: {
            type: 'varchar',
            length: 20,
            nullable: false,
            default: 'Pending',
            comment: 'Valid values: Pending, Approved, Rejected',
        },
        approval_date: {
            type: 'date',
            nullable: true,
        },
        remarks: {
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
        purchaseRequest: {
            type: 'many-to-one',
            target: 'PurchaseRequest',
            joinColumn: { name: 'pr_id' },
            nullable: false,
            inverseSide: 'approvals',
            onDelete: 'CASCADE',
        },
        approver: {
            type: 'many-to-one',
            target: 'User',
            joinColumn: { name: 'approver_id' },
            nullable: false,
            inverseSide: 'approvals',
            onDelete: 'RESTRICT',
        },
    },
})
