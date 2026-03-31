-- ProcureEase: one-click reset + example seed
-- Runs end-to-end in Supabase SQL editor.
-- Keeps:
--   - users
--   - the departments referenced by users
-- Then:
--   - fills missing details for dept_id=1 (if it exists)
--   - inserts additional departments (if missing)
--   - seeds example procurement data (10 per table where applicable)

begin;

-- Guardrails
DO $$
begin
  if not exists (select 1 from users) then
    raise exception 'No users found. Create at least 1 user first.';
  end if;
  if not exists (select 1 from users where dept_id is not null) then
    raise exception 'Users exist but none have dept_id. Ensure users are assigned to a department.';
  end if;
end $$;

-- Keep only departments referenced by users
create temp table _keep_dept_ids as
select distinct dept_id
from users
where dept_id is not null;

-- Wipe everything else
truncate table
  audit_log,
  delivery,
  notice_of_award,
  purchase_order,
  bid,
  approval_workflow,
  pr_items,
  purchase_request,
  supplier,
  item_category
restart identity;

delete from department d
where not exists (select 1 from _keep_dept_ids k where k.dept_id = d.dept_id);

-- Seed / patch department details
with
  dept_seed as (
    select *
    from (
      values
        ('Administration', 'Dr. Marites Villareal', '+63 2 8000 0101', 2500000.00::numeric),
        ('Emergency Room', 'Dr. Angelo Cruz', '+63 2 8000 0102', 3200000.00::numeric),
        ('Intensive Care Unit', 'Dr. Bianca Reyes', '+63 2 8000 0103', 4100000.00::numeric),
        ('Pharmacy', 'RPh. Janelle Santos', '+63 2 8000 0104', 5500000.00::numeric),
        ('Laboratory', 'Dr. Noel Mendoza', '+63 2 8000 0105', 2800000.00::numeric),
        ('Radiology', 'Dr. Paolo Navarro', '+63 2 8000 0106', 3600000.00::numeric),
        ('Surgery / Operating Room', 'Dr. Camille Tan', '+63 2 8000 0107', 6000000.00::numeric),
        ('Housekeeping', 'Ms. Liza Gomez', '+63 2 8000 0108', 1500000.00::numeric),
        ('Procurement Management Office', 'Mr. Jerome Dela Cruz', '+63 2 8000 0109', 2200000.00::numeric),
        ('Budget Office', 'Ms. Andrea Lim', '+63 2 8000 0110', 2400000.00::numeric)
    ) as v(dept_name, dept_head_name, contact_number, budget_allocation)
  ),
  ins_departments as (
    insert into department (dept_name, dept_head_name, contact_number, budget_allocation)
    select ds.dept_name, ds.dept_head_name, ds.contact_number, ds.budget_allocation
    from dept_seed ds
    where not exists (
      select 1
      from department d
      where d.dept_name = ds.dept_name
    )
    returning dept_id
  ),
  upd_departments as (
    update department d
    set
      dept_head_name = coalesce(d.dept_head_name, ds.dept_head_name),
      contact_number = coalesce(d.contact_number, ds.contact_number),
      budget_allocation = coalesce(d.budget_allocation, ds.budget_allocation)
    from dept_seed ds
    where d.dept_name = ds.dept_name
    returning d.dept_id
  ),
  upd_dept1 as (
    update department
    set
      dept_name = coalesce(dept_name, 'Administration'),
      dept_head_name = coalesce(dept_head_name, 'Dr. Marites Villareal'),
      contact_number = coalesce(contact_number, '+63 2 8000 0101'),
      budget_allocation = coalesce(budget_allocation, 2500000.00::numeric)
    where dept_id = 1
    returning dept_id
  )
select
  (select count(*) from ins_departments) as departments_inserted,
  (select count(*) from upd_departments) as departments_updated,
  (select count(*) from upd_dept1) as dept1_patched;

-- Seed example procurement data
with
  dept_user as (
    select user_id, dept_id
    from users
    where role = 'Department User'
    order by user_id
    limit 1
  ),
  any_user as (
    select user_id, dept_id
    from users
    where dept_id is not null
    order by user_id
    limit 1
  ),
  requester as (
    select
      coalesce((select user_id from dept_user), (select user_id from any_user)) as user_id,
      coalesce((select dept_id from dept_user), (select dept_id from any_user)) as dept_id
  ),
  approver as (
    select coalesce(
      (select user_id from users where role = 'Admin' order by user_id limit 1),
      (select user_id from requester)
    ) as user_id
  ),

  ins_categories as (
    insert into item_category (category_name, description)
    values
      ('Medical Supplies', 'Consumables like gloves, syringes, masks, and dressings.'),
      ('Pharmaceuticals', 'Medicines and injectables used for inpatient/outpatient care.'),
      ('Laboratory Reagents', 'Test kits, reagents, and lab consumables.'),
      ('Radiology Supplies', 'Imaging-related consumables and contrast media.'),
      ('PPE', 'Personal protective equipment for clinical areas.'),
      ('Sterilization', 'Autoclave and sterilization consumables.'),
      ('IV Therapy', 'IV fluids, sets, cannulas, and related items.'),
      ('Surgical Supplies', 'Sutures, drapes, scalpels, and OR consumables.'),
      ('Housekeeping', 'Cleaning, disinfection, and waste management supplies.'),
      ('IT & Office', 'Office/IT items used by hospital departments.')
    returning category_id
  ),
  categories as (
    select category_id, row_number() over (order by category_id)::int as rn
    from ins_categories
  ),

  ins_suppliers as (
    insert into supplier (
      supplier_name,
      contact_person,
      email,
      phone_number,
      address,
      city,
      registration_number,
      supplier_rating,
      is_active
    )
    values
      ('MedSupply Philippines Inc.', 'Karen Dela Cruz', 'sales@medsupply.ph', '+63 2 8123 1001', 'Unit 12, HealthPark Bldg., EDSA', 'Quezon City', 'DTI-2019-00123', 4.60, true),
      ('CareFirst Medical Trading', 'Joseph Ramos', 'info@carefirstmed.com', '+63 2 8456 2200', 'Warehouse 5, Industrial Rd.', 'Makati', 'DTI-2020-00456', 4.40, true),
      ('PharmaOne Distributors', 'Ana Santos', 'orders@pharmaone.ph', '+63 2 8333 9000', 'Lot 9, Pharma Ave.', 'Pasig', 'FDA-LTO-2018-7788', 4.50, true),
      ('LabWorks Scientific Supply', 'Miguel Herrera', 'support@labworks.ph', '+63 2 8777 1111', '23 Science St.', 'Taguig', 'DTI-2017-00999', 4.35, true),
      ('SterilePro Solutions', 'Grace Lim', 'hello@sterilepro.ph', '+63 2 8555 1212', 'Autoclave Park, Bldg. 2', 'Manila', 'DTI-2016-00321', 4.55, true),
      ('Radiant Imaging Supplies', 'Paolo Reyes', 'sales@radiantimaging.ph', '+63 2 8999 7000', 'Imaging Hub, 4th Ave.', 'Quezon City', 'DTI-2021-00666', 4.20, true),
      ('CleanWave Janitorial Supply', 'Liza Gomez', 'orders@cleanwave.ph', '+63 2 8666 3000', '77 Sanitation Blvd.', 'Caloocan', 'DTI-2015-00222', 4.10, true),
      ('OR Essentials Trading', 'Rico Navarro', 'quotes@oressentials.ph', '+63 2 8222 8080', '9 Surgical Lane', 'Mandaluyong', 'DTI-2019-00777', 4.45, true),
      ('IVCare Medical Supply', 'Shiela Tan', 'sales@ivcare.ph', '+63 2 8444 5050', '18 Infusion St.', 'Pasig', 'DTI-2022-00111', 4.30, true),
      ('OfficeTech Solutions', 'Mark Villanueva', 'support@officetech.ph', '+63 2 8111 2020', '3rd Floor, Admin Center', 'Makati', 'DTI-2014-00088', 4.00, true)
    returning supplier_id
  ),
  suppliers as (
    select supplier_id, row_number() over (order by supplier_id)::int as rn
    from ins_suppliers
  ),

  pr_base as (
    select
      gs.n::int as rn,
      (select dept_id from requester) as dept_id,
      (select user_id from requester) as requester_id,
      (select category_id from categories c where c.rn = ((gs.n - 1) % 10) + 1) as category_id
    from generate_series(1, 10) as gs(n)
  ),
  ins_pr as (
    insert into purchase_request (
      pr_number,
      request_date,
      description,
      total_amount,
      status,
      priority_level,
      dept_id,
      requester_id,
      category_id
    )
    select
      format('PR-%s-%s', to_char(current_date, 'YYYYMMDD'), lpad(pb.rn::text, 3, '0')),
      (current_date - ((pb.rn % 7)::int)),
      case pb.rn
        when 1 then 'Nitrile examination gloves for ER triage and isolation rooms.'
        when 2 then 'Surgical masks and N95 respirators for ICU and ER staff.'
        when 3 then 'IV cannulas and IV administration sets for ward replenishment.'
        when 4 then 'Syringes (3mL/5mL) and needles for outpatient injection station.'
        when 5 then 'Sterile gauze pads and elastic bandages for wound care clinic.'
        when 6 then 'Ceftriaxone 1g vials for inpatient antibiotic stock.'
        when 7 then 'Urine dipstick test strips and specimen cups for laboratory.'
        when 8 then 'Chlorine-based disinfectant and surface wipes for housekeeping.'
        when 9 then 'Suture packs (Vicryl 2-0/3-0) for minor OR procedures.'
        else 'Printer toner and A4 bond paper for administrative documentation.'
      end,
      case pb.rn
        when 1 then 18500.00
        when 2 then 42000.00
        when 3 then 26500.00
        when 4 then 9800.00
        when 5 then 15250.00
        when 6 then 78000.00
        when 7 then 13400.00
        when 8 then 8900.00
        when 9 then 22600.00
        else 12600.00
      end,
      'Submitted',
      case when pb.rn in (2, 6, 9) then 'High' else 'Medium' end,
      pb.dept_id,
      pb.requester_id,
      pb.category_id
    from pr_base pb
    returning pr_id
  ),
  prs as (
    select pr_id, row_number() over (order by pr_id)::int as rn
    from ins_pr
  ),

  ins_items as (
    insert into pr_items (
      pr_id,
      item_name,
      item_description,
      quantity,
      unit_of_measure,
      unit_price,
      total_price,
      specification
    )
    select
      p.pr_id,
      case p.rn
        when 1 then 'Nitrile Examination Gloves (Medium)'
        when 2 then 'N95 Respirator Mask (NIOSH Approved)'
        when 3 then 'IV Cannula 18G'
        when 4 then 'Syringe 5mL, Luer Lock'
        when 5 then 'Sterile Gauze Pads 4x4'
        when 6 then 'Ceftriaxone 1g Vial'
        when 7 then 'Urine Dipstick Test Strips (10-parameter)'
        when 8 then 'Surface Disinfectant Wipes'
        when 9 then 'Absorbable Suture (Vicryl) 2-0'
        else 'A4 Bond Paper (80gsm)'
      end,
      case p.rn
        when 1 then 'Powder-free, latex-free; box of 100.'
        when 2 then 'Cup-style or fold; individually packed.'
        when 3 then 'With injection port; sterile; single-use.'
        when 4 then 'Sterile; individually packed.'
        when 5 then '100 pcs per pack; sterile.'
        when 6 then 'For IV/IM; with diluent instructions.'
        when 7 then 'For routine urinalysis; compatible with color chart.'
        when 8 then 'Hospital-grade disinfectant wipes; canister pack.'
        when 9 then 'Needle included; sterile; single-use.'
        else 'Ream pack; bright white.'
      end,
      case p.rn
        when 1 then 50
        when 2 then 200
        when 3 then 150
        when 4 then 500
        when 5 then 100
        when 6 then 300
        when 7 then 40
        when 8 then 30
        when 9 then 60
        else 40
      end,
      case p.rn
        when 1 then 'box'
        when 2 then 'piece'
        when 3 then 'piece'
        when 4 then 'piece'
        when 5 then 'pack'
        when 6 then 'vial'
        when 7 then 'box'
        when 8 then 'canister'
        when 9 then 'pack'
        else 'ream'
      end,
      case p.rn
        when 1 then 370.00
        when 2 then 210.00
        when 3 then 48.00
        when 4 then 12.50
        when 5 then 152.50
        when 6 then 260.00
        when 7 then 335.00
        when 8 then 296.67
        when 9 then 376.67
        else 315.00
      end,
      (case p.rn
        when 1 then 50 * 370.00
        when 2 then 200 * 210.00
        when 3 then 150 * 48.00
        when 4 then 500 * 12.50
        when 5 then 100 * 152.50
        when 6 then 300 * 260.00
        when 7 then 40 * 335.00
        when 8 then 30 * 296.67
        when 9 then 60 * 376.67
        else 40 * 315.00
      end)::numeric(14,2),
      case p.rn
        when 1 then 'Size: Medium; AQL 1.5; non-sterile.'
        when 2 then 'Filtration: ≥95%; head straps preferred.'
        when 3 then 'Gauge: 18G; length: 1.25".'
        when 4 then 'Volume: 5mL; sterile.'
        when 5 then 'Size: 4" x 4"; 8-ply.'
        when 6 then 'Strength: 1g; powder for injection.'
        when 7 then 'Parameters: glucose, protein, ketone, etc.'
        when 8 then 'Contact time: 1-3 minutes; hospital grade.'
        when 9 then 'Material: polyglactin; needle type per pack.'
        else '80gsm; A4; 500 sheets.'
      end
    from prs p
    returning pr_item_id
  ),

  bid_base as (
    select
      p.pr_id,
      p.rn,
      (select supplier_id from suppliers s where s.rn = p.rn) as supplier_id
    from prs p
  ),
  ins_bids as (
    insert into bid (
      pr_id,
      supplier_id,
      bid_date,
      quoted_price,
      delivery_period_days,
      bid_status,
      bid_document_path
    )
    select
      bb.pr_id,
      bb.supplier_id,
      (current_date - ((bb.rn % 5)::int)),
      case bb.rn
        when 1 then 18200.00
        when 2 then 41500.00
        when 3 then 25900.00
        when 4 then 9600.00
        when 5 then 14950.00
        when 6 then 77200.00
        when 7 then 13100.00
        when 8 then 8700.00
        when 9 then 22150.00
        else 12400.00
      end,
      (7 + (bb.rn % 10))::int,
      'Qualified',
      null
    from bid_base bb
    returning bid_id, pr_id, supplier_id
  ),
  bids as (
    select bid_id, pr_id, supplier_id, row_number() over (order by bid_id)::int as rn
    from ins_bids
  ),

  ins_noa as (
    insert into notice_of_award (
      noa_number,
      issue_date,
      noa_document_path,
      bid_id,
      supplier_id
    )
    select
      format('NOA-%s-%s', to_char(current_date, 'YYYYMMDD'), lpad(b.rn::text, 3, '0')),
      current_date,
      null,
      b.bid_id,
      b.supplier_id
    from bids b
    returning noa_id
  ),

  ins_po as (
    insert into purchase_order (
      po_number,
      issue_date,
      expected_delivery_date,
      actual_delivery_date,
      po_amount,
      po_status,
      payment_status,
      po_document_path,
      pr_id,
      bid_id,
      supplier_id
    )
    select
      format('PO-%s-%s', to_char(current_date, 'YYYYMMDD'), lpad(b.rn::text, 3, '0')),
      current_date,
      (current_date + ((10 + b.rn)::int)),
      null,
      case b.rn
        when 1 then 18200.00
        when 2 then 41500.00
        when 3 then 25900.00
        when 4 then 9600.00
        when 5 then 14950.00
        when 6 then 77200.00
        when 7 then 13100.00
        when 8 then 8700.00
        when 9 then 22150.00
        else 12400.00
      end,
      'Issued',
      'Pending',
      null,
      b.pr_id,
      b.bid_id,
      b.supplier_id
    from bids b
    returning po_id
  ),
  pos as (
    select po_id, row_number() over (order by po_id)::int as rn
    from ins_po
  ),

  ins_deliveries as (
    insert into delivery (
      po_id,
      delivery_date,
      quantity_received,
      condition_status,
      delivery_remarks,
      received_by_id
    )
    select
      p.po_id,
      (current_date + ((p.rn % 6)::int)),
      case when p.rn in (2, 6, 9) then 0 else 1 end,
      case when p.rn in (6) then 'Incomplete' else 'Good' end,
      case when p.rn in (6) then 'Partial delivery; remaining items to follow.' else 'Received in good condition.' end,
      (select user_id from approver)
    from pos p
    returning delivery_id
  ),

  ins_approvals as (
    insert into approval_workflow (
      pr_id,
      approver_id,
      approval_level,
      status,
      approval_date,
      remarks
    )
    select
      p.pr_id,
      (select user_id from approver),
      1,
      'Approved',
      current_date,
      'Reviewed and approved for processing.'
    from prs p
    returning approval_id
  ),

  ins_audit as (
    insert into audit_log (
      action_type,
      old_value,
      new_value,
      pr_id,
      po_id,
      user_id
    )
    select
      'Created',
      null,
      'Purchase Request submitted',
      pr.pr_id,
      po.po_id,
      (select user_id from requester)
    from prs pr
    join pos po on po.rn = pr.rn
    returning log_id
  )
select
  (select count(*) from ins_categories) as categories_added,
  (select count(*) from ins_suppliers) as suppliers_added,
  (select count(*) from ins_pr) as purchase_requests_added,
  (select count(*) from ins_items) as pr_items_added,
  (select count(*) from ins_bids) as bids_added,
  (select count(*) from ins_noa) as notice_of_award_added,
  (select count(*) from ins_po) as purchase_orders_added,
  (select count(*) from ins_deliveries) as deliveries_added,
  (select count(*) from ins_approvals) as approvals_added,
  (select count(*) from ins_audit) as audit_logs_added;

commit;
