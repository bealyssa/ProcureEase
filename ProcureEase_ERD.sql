// ProcureEase Hospital Procurement System - ERD for dbdiagram.io
// Copy and paste this entire content into https://dbdiagram.io/

Table department {
  dept_id int [primary key]
  dept_name varchar
  dept_head_name varchar
  contact_number varchar
  budget_allocation decimal
  created_at timestamp
}

Table users {
  user_id int [primary key]
  dept_id int [not null]
  user_name varchar
  email varchar [unique]
  role varchar [note: 'Admin, Department User']
  password_hash varchar
  is_active boolean
  created_at timestamp
  
  Indexes {
    dept_id
  }
}

Table item_category {
  category_id int [primary key]
  category_name varchar [note: 'Medical Supplies, Equipment, Medicines, etc.']
  description text
}

Table purchase_request {
  pr_id int [primary key]
  dept_id int [not null]
  requester_id int [not null]
  category_id int [not null]
  pr_number varchar [unique]
  request_date date
  description text
  total_amount decimal
  status varchar [note: 'Draft, Submitted, Approved, Rejected, For BAC, Processing, Completed']
  priority_level varchar [note: 'Low, Medium, High, Urgent']
  created_at timestamp
  updated_at timestamp
  
  Indexes {
    dept_id
    pr_number
    status
  }
}

Table pr_items {
  pr_item_id int [primary key]
  pr_id int [not null]
  item_name varchar
  item_description text
  quantity int
  unit_of_measure varchar
  unit_price decimal
  total_price decimal
  specification text
  
  Indexes {
    pr_id
  }
}

Table supplier {
  supplier_id int [primary key]
  supplier_name varchar
  contact_person varchar
  email varchar
  phone_number varchar
  address text
  city varchar
  registration_number varchar
  supplier_rating decimal [note: '0-5 rating']
  is_active boolean
  created_at timestamp
}

Table bid {
  bid_id int [primary key]
  pr_id int [not null]
  supplier_id int [not null]
  bid_date date
  quoted_price decimal
  delivery_period_days int
  bid_status varchar [note: 'Submitted, Qualified, Disqualified, Awarded']
  bid_document_path varchar
  created_at timestamp
  
  Indexes {
    pr_id
    supplier_id
    bid_status
  }
}

Table approval_workflow {
  approval_id int [primary key]
  pr_id int [not null]
  approver_id int [not null]
  approval_level int [note: '1=Department Head, 2=PMO, 3=Budget Office, 4=BAC, 5=Final']
  status varchar [note: 'Pending, Approved, Rejected']
  approval_date date
  remarks text
  created_at timestamp
  
  Indexes {
    pr_id
    approver_id
    status
  }
}

Table purchase_order {
  po_id int [primary key]
  pr_id int [not null]
  bid_id int [not null]
  supplier_id int [not null]
  po_number varchar [unique]
  issue_date date
  expected_delivery_date date
  actual_delivery_date date
  po_amount decimal
  po_status varchar [note: 'Issued, Received, Partially Received, Completed, Cancelled']
  payment_status varchar [note: 'Pending, Partial, Paid']
  po_document_path varchar
  created_at timestamp
  updated_at timestamp
  
  Indexes {
    pr_id
    supplier_id
    po_number
    po_status
  }
}

Table delivery {
  delivery_id int [primary key]
  po_id int [not null]
  delivery_date date
  quantity_received int
  condition_status varchar [note: 'Good, Damaged, Incomplete']
  received_by_id int
  delivery_remarks text
  created_at timestamp
  
  Indexes {
    po_id
    received_by_id
  }
}

Table notice_of_award {
  noa_id int [primary key]
  bid_id int [not null]
  supplier_id int [not null]
  noa_number varchar [unique]
  issue_date date
  noa_document_path varchar
  created_at timestamp
}

Table audit_log {
  log_id int [primary key]
  pr_id int
  po_id int
  action_type varchar [note: 'Created, Updated, Approved, Rejected, Delivered']
  user_id int
  old_value text
  new_value text
  timestamp datetime
  
  Indexes {
    pr_id
    po_id
    user_id
  }
}

// Relationships
Ref: users.dept_id > department.dept_id
Ref: purchase_request.dept_id > department.dept_id
Ref: purchase_request.requester_id > users.user_id
Ref: purchase_request.category_id > item_category.category_id
Ref: pr_items.pr_id > purchase_request.pr_id
Ref: bid.pr_id > purchase_request.pr_id
Ref: bid.supplier_id > supplier.supplier_id
Ref: approval_workflow.pr_id > purchase_request.pr_id
Ref: approval_workflow.approver_id > users.user_id
Ref: purchase_order.pr_id > purchase_request.pr_id
Ref: purchase_order.bid_id > bid.bid_id
Ref: purchase_order.supplier_id > supplier.supplier_id
Ref: delivery.po_id > purchase_order.po_id
Ref: delivery.received_by_id > users.user_id
Ref: notice_of_award.bid_id > bid.bid_id
Ref: notice_of_award.supplier_id > supplier.supplier_id
Ref: audit_log.user_id > users.user_id
