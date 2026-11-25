-- Tea Town Smart Experience — schema, RLS and server-side functions.
-- Customers (anon) never write tables directly: every write goes through a SECURITY DEFINER
-- function that validates input, rate-limits and checks role/branch. Staff are limited to
-- their branches; owners see everything. Loyalty ledger rows can only be created by staff RPCs.

create table if not exists public.branches (
  id text primary key check (id ~ '^[a-z0-9-]{2,40}$'),
  name text not null,
  created_at timestamptz not null default now()
);

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  name text not null,
  email text not null,
  role text not null check (role in ('staff', 'owner')),
  branches text[] not null default '{}',
  created_at timestamptz not null default now()
);

create table if not exists public.settings (
  id int primary key default 1 check (id = 1),
  data jsonb not null,
  updated_at timestamptz not null default now(),
  updated_by uuid
);

create table if not exists public.service_requests (
  id uuid primary key default gen_random_uuid(),
  ref text not null unique,
  branch_id text not null references public.branches(id),
  type text not null check (type in ('call_staff', 'ready_to_pay')),
  vehicle_colour text not null check (char_length(vehicle_colour) between 2 and 20),
  vehicle_model text not null check (char_length(vehicle_model) between 2 and 40),
  zone_or_ref text check (char_length(zone_or_ref) <= 20),
  status text not null default 'new' check (status in ('new', 'acknowledged', 'completed', 'cancelled')),
  device_hash text not null,
  created_at timestamptz not null default now(),
  ack_at timestamptz, done_at timestamptz, handled_by uuid references public.profiles(id)
);
create index if not exists service_requests_branch_created on public.service_requests (branch_id, created_at desc);
create index if not exists service_requests_device on public.service_requests (device_hash, created_at desc);

create table if not exists public.feedback (
  id uuid primary key default gen_random_uuid(),
  client_id text not null unique,
  branch_id text not null references public.branches(id),
  rating int not null check (rating between 1 and 5),
  aspects jsonb not null default '{}',
  comment text not null default '' check (char_length(comment) <= 600),
  urgent boolean not null default false,
  status text not null default 'new' check (status in ('new', 'reviewed', 'resolved')),
  anon_hash text not null,
  created_at timestamptz not null default now(),
  resolved_at timestamptz
);
create index if not exists feedback_branch_created on public.feedback (branch_id, created_at desc);

create table if not exists public.loyalty_members (
  id uuid primary key default gen_random_uuid(),
  user_id uuid unique references auth.users(id) on delete set null,
  member_code text not null unique check (member_code ~ '^TT[0-9]{6}$'),
  name text not null check (char_length(name) between 2 and 40),
  email text,
  branch_id text references public.branches(id),
  created_at timestamptz not null default now(),
  deleted_at timestamptz
);

create table if not exists public.loyalty_transactions (
  id uuid primary key default gen_random_uuid(),
  member_id uuid not null references public.loyalty_members(id) on delete cascade,
  branch_id text not null references public.branches(id),
  kind text not null check (kind in ('stamp', 'redeem')),
  stamps int not null check ((kind = 'stamp' and stamps = 1) or (kind = 'redeem' and stamps < 0)),
  ref text not null unique,                 -- idempotency key: a retried tap can never double-count
  staff_id uuid not null references public.profiles(id),
  created_at timestamptz not null default now()
);
create index if not exists loyalty_tx_member on public.loyalty_transactions (member_id, created_at desc);

create table if not exists public.offers (
  id text primary key,
  title text not null check (char_length(title) between 2 and 60),
  description text not null default '' check (char_length(description) <= 200),
  image text check (char_length(image) <= 400000),
  branch_id text not null default 'all',
  expires_at timestamptz not null,
  active boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists public.activity_events (
  id bigint generated always as identity primary key,
  kind text not null check (kind in ('scan', 'menu_view', 'item_view', 'review_click', 'whatsapp_click', 'wifi_view', 'website_click')),
  branch_id text references public.branches(id),
  anon_id text not null check (char_length(anon_id) <= 64),
  item_id text check (char_length(item_id) <= 80),
  at timestamptz not null default now()
);
create index if not exists activity_events_at on public.activity_events (at desc);
create index if not exists activity_events_anon on public.activity_events (anon_id, at desc);

-- ---------------------------------------------------------------- helpers
create or replace function public.is_owner() returns boolean language sql stable security definer set search_path = public as
$$ select exists (select 1 from profiles where id = auth.uid() and role = 'owner') $$;
create or replace function public.can_branch(b text) returns boolean language sql stable security definer set search_path = public as
$$ select exists (select 1 from profiles where id = auth.uid() and (role = 'owner' or b = any (branches))) $$;
create or replace function public.is_staff() returns boolean language sql stable security definer set search_path = public as
$$ select exists (select 1 from profiles where id = auth.uid()) $$;
create or replace function public.hash_text(t text) returns text language sql immutable as
$$ select encode(sha256(convert_to(t, 'UTF8')), 'hex') $$;
create or replace function public.clean_text(t text, n int) returns text language sql immutable as
$$ select left(btrim(regexp_replace(regexp_replace(coalesce(t, ''), '[[:cntrl:]<>]', ' ', 'g'), '\s+', ' ', 'g')), n) $$;

-- ---------------------------------------------------------------- RLS
alter table public.branches enable row level security;
alter table public.profiles enable row level security;
alter table public.settings enable row level security;
alter table public.service_requests enable row level security;
alter table public.feedback enable row level security;
alter table public.loyalty_members enable row level security;
alter table public.loyalty_transactions enable row level security;
alter table public.offers enable row level security;
alter table public.activity_events enable row level security;

drop policy if exists branches_read on public.branches;
create policy branches_read on public.branches for select using (true);
drop policy if exists profiles_read on public.profiles;
create policy profiles_read on public.profiles for select to authenticated using (id = auth.uid() or public.is_owner());
drop policy if exists requests_staff_read on public.service_requests;
create policy requests_staff_read on public.service_requests for select to authenticated using (public.can_branch(branch_id));
drop policy if exists feedback_owner_read on public.feedback;
create policy feedback_owner_read on public.feedback for select to authenticated using (public.is_owner());
drop policy if exists members_read on public.loyalty_members;
create policy members_read on public.loyalty_members for select to authenticated using (user_id = auth.uid() or public.is_staff());
drop policy if exists tx_read on public.loyalty_transactions;
create policy tx_read on public.loyalty_transactions for select to authenticated
  using (public.is_staff() or member_id in (select id from public.loyalty_members where user_id = auth.uid()));
drop policy if exists offers_read on public.offers;
create policy offers_read on public.offers for select using (active and expires_at > now() or public.is_owner());
drop policy if exists events_owner_read on public.activity_events;
create policy events_owner_read on public.activity_events for select to authenticated using (public.is_owner());
drop policy if exists settings_owner_read on public.settings;
create policy settings_owner_read on public.settings for select to authenticated using (public.is_owner());
-- No insert/update/delete policies: all writes go through the functions below.
revoke insert, update, delete on all tables in schema public from anon, authenticated;
-- Staff can read member names/codes but never customer emails.
revoke select on public.loyalty_members from anon, authenticated;
grant select (id, member_code, name, branch_id, created_at, deleted_at, user_id) on public.loyalty_members to authenticated;
revoke select on public.service_requests, public.feedback from anon, authenticated;
grant select (id, ref, branch_id, type, vehicle_colour, vehicle_model, zone_or_ref, status, created_at, ack_at, done_at, handled_by) on public.service_requests to authenticated;
grant select (id, client_id, branch_id, rating, aspects, comment, urgent, status, created_at, resolved_at) on public.feedback to authenticated;
grant select on public.loyalty_transactions, public.offers, public.branches, public.profiles, public.activity_events, public.settings to authenticated;
grant select on public.offers, public.branches to anon;

-- ---------------------------------------------------------------- public / customer functions
create or replace function public.public_config() returns jsonb language sql stable security definer set search_path = public as $$
  select jsonb_build_object(
    'settings', (select data from settings where id = 1),
    'offers', coalesce((select jsonb_agg(jsonb_build_object('id', id, 'title', title, 'description', description, 'image', image, 'branch_id', branch_id, 'expires_at', expires_at, 'active', active, 'created_at', created_at) order by created_at desc)
                        from offers where active and expires_at > now()), '[]'::jsonb))
$$;

create or replace function public.log_event(p_kind text, p_branch text, p_anon text, p_item text) returns void language plpgsql security definer set search_path = public as $$
begin
  if p_anon is null or char_length(p_anon) > 64 then return; end if;
  if (select count(*) from activity_events where anon_id = p_anon and at > now() - interval '1 minute') >= 30 then return; end if;
  insert into activity_events (kind, branch_id, anon_id, item_id)
  values (p_kind, (select id from branches where id = p_branch), p_anon, left(p_item, 80));
end $$;

create or replace function public.create_request(p_branch text, p_type text, p_colour text, p_model text, p_zone_ref text, p_token text)
returns jsonb language plpgsql security definer set search_path = public as $$
declare h text := hash_text(p_token); r service_requests;
begin
  if p_token is null or char_length(p_token) < 16 then raise exception 'invalid device token'; end if;
  if not exists (select 1 from branches where id = p_branch) then raise exception 'unknown branch'; end if;
  if coalesce((select (data->'features'->>(case p_type when 'ready_to_pay' then 'readyToPay' else 'callStaff' end))::boolean from settings where id = 1), true) is false then raise exception 'This feature is switched off'; end if;
  select * into r from service_requests where device_hash = h and type = p_type and branch_id = p_branch and status in ('new', 'acknowledged') and created_at > now() - interval '30 minutes' limit 1;
  if found then return to_jsonb(r) - 'device_hash'; end if;   -- accidental double tap
  if (select count(*) from service_requests where device_hash = h and created_at > now() - interval '10 minutes') >= 4 then raise exception 'Too many requests from this phone. Please wave to a staff member.'; end if;
  if (select count(*) from service_requests where branch_id = p_branch and created_at > now() - interval '5 minutes') >= 60 then raise exception 'Service is very busy. Please wave to a staff member.'; end if;
  insert into service_requests (ref, branch_id, type, vehicle_colour, vehicle_model, zone_or_ref, device_hash)
  values ('R-' || upper(substr(md5(gen_random_uuid()::text), 1, 5)), p_branch, p_type, clean_text(p_colour, 20), clean_text(p_model, 40), nullif(clean_text(p_zone_ref, 20), ''), h)
  returning * into r;
  return to_jsonb(r) - 'device_hash';
end $$;

create or replace function public.my_requests(p_token text) returns jsonb language sql stable security definer set search_path = public as $$
  select coalesce(jsonb_agg(to_jsonb(r) - 'device_hash' order by created_at desc), '[]'::jsonb)
  from (select * from service_requests where device_hash = hash_text(p_token) and created_at > now() - interval '1 day' limit 20) r
$$;

create or replace function public.cancel_request(p_id uuid, p_token text) returns void language sql security definer set search_path = public as $$
  update service_requests set status = 'cancelled' where id = p_id and device_hash = hash_text(p_token) and status = 'new'
$$;

create or replace function public.submit_feedback(p_client_id text, p_branch text, p_rating int, p_aspects jsonb, p_comment text, p_anon text)
returns jsonb language plpgsql security definer set search_path = public as $$
declare a jsonb := '{}'; k text; v int; c text := clean_text(p_comment, 600); u boolean; fid uuid; h text := hash_text(coalesce(p_anon, ''));
begin
  if p_client_id is null or char_length(p_client_id) not between 8 and 64 then raise exception 'invalid submission'; end if;
  select id into fid from feedback where client_id = p_client_id;
  if found then return jsonb_build_object('id', fid); end if;   -- idempotent resubmission
  if not exists (select 1 from branches where id = p_branch) then raise exception 'unknown branch'; end if;
  if p_rating not between 1 and 5 then raise exception 'rating must be 1-5'; end if;
  if (select count(*) from feedback where anon_hash = h and created_at > now() - interval '1 hour') >= 3 then raise exception 'Thanks! We already received several messages from this phone in the last hour.'; end if;
  for k in select unnest(array['food', 'taste', 'waiting', 'staff', 'value']) loop
    if p_aspects ? k then v := (p_aspects->>k)::int; if v between 1 and 5 then a := a || jsonb_build_object(k, v); end if; end if;
  end loop;
  u := p_rating <= 1 or (p_rating <= 2 and (exists (select 1 from jsonb_each_text(a) where value = '1')
        or lower(c) ~ '(hair|sick|raw|poison|insect|cockroach|manager|refund|rude|مدير|تسمم|حشرة|شعرة)'));
  insert into feedback (client_id, branch_id, rating, aspects, comment, urgent, anon_hash) values (p_client_id, p_branch, p_rating, a, c, u, h) returning id into fid;
  return jsonb_build_object('id', fid);
end $$;

-- ---------------------------------------------------------------- loyalty (customer)
create or replace function public.join_loyalty(p_name text, p_branch text) returns jsonb language plpgsql security definer set search_path = public as $$
declare m loyalty_members; code text;
begin
  if auth.uid() is null then raise exception 'sign in with your email first'; end if;
  select * into m from loyalty_members where user_id = auth.uid() and deleted_at is null;
  if found then return to_jsonb(m) - 'email'; end if;
  loop
    code := 'TT' || lpad((floor(random() * 1000000))::int::text, 6, '0');
    exit when not exists (select 1 from loyalty_members where member_code = code);
  end loop;
  insert into loyalty_members (user_id, member_code, name, email, branch_id)
  values (auth.uid(), code, clean_text(p_name, 40), (select email from auth.users where id = auth.uid()), (select id from branches where id = p_branch))
  returning * into m;
  return to_jsonb(m) - 'email';
end $$;

create or replace function public.my_loyalty() returns jsonb language sql stable security definer set search_path = public as $$
  select case when m.id is null then null else jsonb_build_object('member', to_jsonb(m) - 'email' - 'user_id',
    'stamps', coalesce((select jsonb_agg(jsonb_build_object('id', t.id, 'member_id', t.member_id, 'branch_id', t.branch_id, 'kind', t.kind, 'stamps', t.stamps, 'created_at', t.created_at) order by t.created_at desc) from loyalty_transactions t where t.member_id = m.id), '[]'::jsonb)) end
  from (select 1) x left join loyalty_members m on m.user_id = auth.uid() and m.deleted_at is null
$$;

-- Deletion: personal data erased; anonymous stamp history kept for fraud/accounting checks.
create or replace function public.delete_my_membership() returns void language sql security definer set search_path = public as $$
  update loyalty_members set name = 'Deleted member', email = null, user_id = null, deleted_at = now() where user_id = auth.uid()
$$;

-- ---------------------------------------------------------------- staff
create or replace function public.my_staff_profile() returns jsonb language sql stable security definer set search_path = public as $$
  select to_jsonb(p) - 'created_at' from profiles p where id = auth.uid()
$$;

create or replace function public.update_request(p_id uuid, p_status text) returns boolean language plpgsql security definer set search_path = public as $$
declare r service_requests;
begin
  select * into r from service_requests where id = p_id for update;
  if not found or not can_branch(r.branch_id) then raise exception 'not authorised'; end if;
  if p_status = 'acknowledged' and r.status = 'new' then
    update service_requests set status = 'acknowledged', ack_at = now(), handled_by = auth.uid() where id = p_id;
  elsif p_status = 'completed' and r.status in ('new', 'acknowledged') then
    update service_requests set status = 'completed', ack_at = coalesce(ack_at, now()), done_at = now(), handled_by = auth.uid() where id = p_id;
  else raise exception 'already updated'; end if;
  return true;
end $$;

create or replace function public.loyalty_rules() returns jsonb language sql stable security definer set search_path = public as
$$ select coalesce((select data->'loyalty' from settings where id = 1), '{"enabled":false}'::jsonb) $$;

create or replace function public.add_stamp(p_member_code text, p_branch text, p_ref text) returns jsonb language plpgsql security definer set search_path = public as $$
declare m loyalty_members; bal int;
begin
  if not can_branch(p_branch) then raise exception 'not authorised for this branch'; end if;
  if not coalesce((loyalty_rules()->>'enabled')::boolean, false) then raise exception 'Loyalty is switched off in Settings'; end if;
  select * into m from loyalty_members where member_code = upper(btrim(p_member_code)) and deleted_at is null for update;
  if not found then raise exception 'Member not found'; end if;
  if exists (select 1 from loyalty_transactions where ref = p_ref) then
    return jsonb_build_object('balance', (select coalesce(sum(stamps), 0) from loyalty_transactions where member_id = m.id), 'duplicate', true);
  end if;
  if exists (select 1 from loyalty_transactions where member_id = m.id and kind = 'stamp' and created_at > now() - interval '10 minutes') then
    raise exception 'A stamp was already added for this member in the last 10 minutes';
  end if;
  insert into loyalty_transactions (member_id, branch_id, kind, stamps, ref, staff_id) values (m.id, p_branch, 'stamp', 1, p_ref, auth.uid());
  select coalesce(sum(stamps), 0) into bal from loyalty_transactions where member_id = m.id;
  return jsonb_build_object('balance', bal, 'duplicate', false);
end $$;

create or replace function public.redeem_reward(p_member_code text, p_branch text, p_ref text) returns jsonb language plpgsql security definer set search_path = public as $$
declare m loyalty_members; bal int; need int := greatest(2, coalesce((loyalty_rules()->>'stampsForReward')::int, 5));
begin
  if not can_branch(p_branch) then raise exception 'not authorised for this branch'; end if;
  if not coalesce((loyalty_rules()->>'enabled')::boolean, false) then raise exception 'Loyalty is switched off in Settings'; end if;
  select * into m from loyalty_members where member_code = upper(btrim(p_member_code)) and deleted_at is null for update;  -- serialises concurrent redemptions
  if not found then raise exception 'Member not found'; end if;
  select coalesce(sum(stamps), 0) into bal from loyalty_transactions where member_id = m.id;
  if exists (select 1 from loyalty_transactions where ref = p_ref) then return jsonb_build_object('balance', bal, 'duplicate', true); end if;
  if bal < need then raise exception 'Needs % stamps to redeem', need; end if;
  insert into loyalty_transactions (member_id, branch_id, kind, stamps, ref, staff_id) values (m.id, p_branch, 'redeem', -need, p_ref, auth.uid());
  return jsonb_build_object('balance', bal - need, 'duplicate', false);
end $$;

-- ---------------------------------------------------------------- owner
create or replace function public.set_feedback_status(p_id uuid, p_status text) returns boolean language plpgsql security definer set search_path = public as $$
begin
  if not is_owner() then raise exception 'owners only'; end if;
  if p_status not in ('new', 'reviewed', 'resolved') then raise exception 'invalid status'; end if;
  update feedback set status = p_status, resolved_at = case when p_status = 'resolved' then now() else resolved_at end where id = p_id;
  return found;
end $$;

create or replace function public.save_settings(p_settings jsonb) returns boolean language plpgsql security definer set search_path = public as $$
begin
  if not is_owner() then raise exception 'owners only'; end if;
  if jsonb_typeof(p_settings->'branches') <> 'object' or jsonb_typeof(p_settings->'loyalty') <> 'object' or jsonb_typeof(p_settings->'features') <> 'object' then raise exception 'invalid settings'; end if;
  if (p_settings->'loyalty'->>'enabled')::boolean and not coalesce((p_settings->'loyalty'->>'approved')::boolean, false) then raise exception 'Reward must be approved before loyalty is switched on'; end if;
  if octet_length(p_settings::text) > 20000 then raise exception 'settings too large'; end if;
  insert into settings (id, data, updated_at, updated_by) values (1, p_settings, now(), auth.uid())
  on conflict (id) do update set data = excluded.data, updated_at = now(), updated_by = auth.uid();
  return true;
end $$;

create or replace function public.save_offer(p_offer jsonb) returns boolean language plpgsql security definer set search_path = public as $$
begin
  if not is_owner() then raise exception 'owners only'; end if;
  insert into offers (id, title, description, image, branch_id, expires_at, active, created_at)
  values (left(p_offer->>'id', 64), clean_text(p_offer->>'title', 60), clean_text(p_offer->>'description', 200),
          case when (p_offer->>'image') ~ '^(data:image/(webp|png|jpeg);base64,|/assets/)' then p_offer->>'image' end,
          coalesce(nullif(p_offer->>'branchId', ''), 'all'), (p_offer->>'expiresAt')::timestamptz, coalesce((p_offer->>'active')::boolean, true), now())
  on conflict (id) do update set title = excluded.title, description = excluded.description, image = excluded.image,
    branch_id = excluded.branch_id, expires_at = excluded.expires_at, active = excluded.active;
  return true;
end $$;

create or replace function public.delete_offer(p_id text) returns boolean language plpgsql security definer set search_path = public as $$
begin if not is_owner() then raise exception 'owners only'; end if; delete from offers where id = p_id; return found; end $$;

-- Functions are callable by the API roles; each one checks its own permissions.
revoke execute on all functions in schema public from public;
grant execute on function public.public_config(), public.log_event(text, text, text, text), public.create_request(text, text, text, text, text, text),
  public.my_requests(text), public.cancel_request(uuid, text), public.submit_feedback(text, text, int, jsonb, text, text) to anon, authenticated;
grant execute on function public.join_loyalty(text, text), public.my_loyalty(), public.delete_my_membership(), public.my_staff_profile(),
  public.update_request(uuid, text), public.add_stamp(text, text, text), public.redeem_reward(text, text, text), public.set_feedback_status(uuid, text),
  public.save_settings(jsonb), public.save_offer(jsonb), public.delete_offer(text) to authenticated;
-- used inside RLS policies (return false for anonymous callers)
grant execute on function public.is_owner(), public.is_staff(), public.can_branch(text), public.hash_text(text) to anon, authenticated;

-- Realtime for the live dashboard (RLS still applies to what each subscriber receives).
do $$ begin
  if exists (select 1 from pg_publication where pubname = 'supabase_realtime') then
    alter publication supabase_realtime add table public.service_requests, public.feedback, public.loyalty_transactions;
  end if;
exception when duplicate_object then null; end $$;

-- ---------------------------------------------------------------- seed (Tea Town)
insert into public.branches (id, name) values ('al-jazzat', 'Tea Town Al Jazzat'), ('al-tarfa', 'Tea Town Jabal Al Noor, Al Tarfa') on conflict do nothing;
insert into public.settings (id, data) values (1, '{
  "branches": {
    "al-jazzat": {"name": "Tea Town Al Jazzat", "phone": "+97165320033", "whatsapp": "971561686858", "reviewUrl": "https://search.google.com/local/writereview?placeid=ChIJVeodDI1ZXz4R5eTnqF-57mI", "wifi": {"ssid": "", "password": "", "security": "WPA", "instructions": "Open Wi-Fi settings on your phone and join the network below, or scan the Wi-Fi QR code with your camera."}},
    "al-tarfa": {"name": "Tea Town Jabal Al Noor, Al Tarfa", "phone": "+97165584100", "whatsapp": "971505212342", "reviewUrl": "https://search.google.com/local/writereview?placeid=ChIJ--6C5RhfXz4RUQA6b-jZd8c", "wifi": {"ssid": "", "password": "", "security": "WPA", "instructions": "Open Wi-Fi settings on your phone and join the network below, or scan the Wi-Fi QR code with your camera."}}
  },
  "menuPdfUrl": "/assets/menu/tea-town-menu.pdf",
  "loyalty": {"enabled": false, "approved": false, "stampsForReward": 5, "rewardName": "Free karak (example)"},
  "features": {"callStaff": true, "readyToPay": true, "feedback": true, "loyalty": true, "offers": true, "wifi": true, "whatsapp": true}
}'::jsonb) on conflict (id) do nothing;
