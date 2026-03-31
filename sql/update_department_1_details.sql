-- Update details for Department with dept_id = 1
-- Fills only missing values (won't overwrite non-NULL fields).

begin;

update department
set
  dept_name = coalesce(dept_name, 'Administration'),
  dept_head_name = coalesce(dept_head_name, 'Dr. Marites Villareal'),
  contact_number = coalesce(contact_number, '+63 2 8000 0101'),
  budget_allocation = coalesce(budget_allocation, 2500000.00::numeric)
where dept_id = 1;

commit;
