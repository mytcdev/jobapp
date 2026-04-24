alter table jobs
  add column if not exists work_type text
    check (work_type in ('onsite', 'remote', 'hybrid'))
    default 'onsite',
  add column if not exists accepted_nationality text; -- null = open to all, admin-only field
