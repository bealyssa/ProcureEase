const { EntitySchema } = require('typeorm')

module.exports = new EntitySchema({
    name: 'NoticeOfAward',
    tableName: 'notice_of_award',
    columns: {
        noa_id: {
            type: 'int',
            primary: true,
            generated: 'increment',
        },
        noa_number: {
            type: 'varchar',
            length: 100,
            unique: true,
            nullable: false,
        },
        issue_date: {
            type: 'date',
            nullable: true,
        },
        noa_document_path: {
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
        bid: {
            type: 'many-to-one',
            target: 'Bid',
            joinColumn: { name: 'bid_id' },
            nullable: false,
            inverseSide: 'awards',
            onDelete: 'CASCADE',
        },
        supplier: {
            type: 'many-to-one',
            target: 'Supplier',
            joinColumn: { name: 'supplier_id' },
            nullable: false,
            inverseSide: 'awards',
            onDelete: 'RESTRICT',
        },
    },
})
