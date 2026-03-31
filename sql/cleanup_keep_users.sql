-- ProcureEase cleanup script
-- Deletes ALL procurement/sample data while keeping:
--   - users
--   - only the departments referenced by those users
--
-- Safe to run in Supabase SQL editor.

begin;

-- Wipe transactional tables (order matters is handled by truncating all together)
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

-- Remove departments that are not used by any existing user
delete from department d
where not exists (
  select 1
  from users u
  where u.dept_id = d.dept_id
);

commit;
