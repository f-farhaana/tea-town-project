-- Security tests. Each block runs as an API role; failures raise and abort (ON_ERROR_STOP).
\set ON_ERROR_STOP on
insert into auth.users values ('00000000-0000-0000-0000-00000000000a', 'staff.aj@test'), ('00000000-0000-0000-0000-00000000000b', 'staff.at@test'),
  ('00000000-0000-0000-0000-00000000000c', 'owner@test'), ('00000000-0000-0000-0000-00000000000d', 'cust@test'), ('00000000-0000-0000-0000-00000000000e', 'cust2@test');
insert into profiles values ('00000000-0000-0000-0000-00000000000a', 'AJ staff', 'staff.aj@test', 'staff', '{al-jazzat}'),
  ('00000000-0000-0000-0000-00000000000b', 'AT staff', 'staff.at@test', 'staff', '{al-tarfa}'), ('00000000-0000-0000-0000-00000000000c', 'Owner', 'owner@test', 'owner', '{al-jazzat,al-tarfa}');
update settings set data = jsonb_set(data, '{loyalty}', '{"enabled":true,"approved":true,"stampsForReward":3,"rewardName":"Karak"}');

create or replace function pg_temp.expect_error(sql text, label text) returns void language plpgsql as $$
begin execute sql; raise exception 'FAIL (no error): %', label; exception when others then if sqlerrm like 'FAIL%' then raise; end if; raise notice 'ok  %: %', label, sqlerrm; end $$;
create or replace function pg_temp.ok(c boolean, label text) returns void language plpgsql as $$ begin if not c then raise exception 'FAIL: %', label; end if; raise notice 'ok  %', label; end $$;
grant execute on function pg_temp.expect_error(text, text), pg_temp.ok(boolean, text) to anon, authenticated;

-- ---------- anonymous customer
set role anon; select set_config('request.jwt.claim.sub', '', false);
select pg_temp.ok((select create_request('al-jazzat', 'call_staff', 'White', 'Patrol', 'Zone A', 'device-token-aaaaaaaaaaaa')->>'status') = 'new', 'anon creates request via RPC');
select pg_temp.ok((select create_request('al-jazzat', 'call_staff', 'White', 'Patrol', null, 'device-token-aaaaaaaaaaaa')->>'ref') = (select my_requests('device-token-aaaaaaaaaaaa')->0->>'ref'), 'double tap returns the same open request');
select pg_temp.ok(jsonb_array_length(my_requests('device-token-bbbbbbbbbbbb')) = 0, 'another phone cannot see my requests');
select pg_temp.expect_error($$insert into service_requests (ref, branch_id, type, vehicle_colour, vehicle_model, device_hash) values ('x','al-jazzat','call_staff','aa','bb','h')$$, 'anon direct insert blocked');
select pg_temp.expect_error($$select * from service_requests$$, 'anon cannot read requests table');
select pg_temp.expect_error($$select * from feedback$$, 'anon cannot read feedback');
select pg_temp.expect_error($$select create_request('al-jazzat', 'ready_to_pay', '<script>', 'x', null, 'device-token-aaaaaaaaaaaa')$$, 'invalid model rejected (too short after cleaning)');
select create_request('al-tarfa', 'ready_to_pay', 'Red', 'Lancer', null, 'device-token-aaaaaaaaaaaa');
select create_request('al-tarfa', 'call_staff', 'Red', 'Lancer', null, 'device-token-aaaaaaaaaaaa');
select create_request('al-jazzat', 'ready_to_pay', 'Red', 'Lancer', null, 'device-token-aaaaaaaaaaaa');
reset role; update service_requests set status = 'completed' where branch_id = 'al-tarfa'; set role anon;
select pg_temp.expect_error($$select create_request('al-tarfa', 'call_staff', 'Blue', 'Accord', null, 'device-token-aaaaaaaaaaaa')$$, 'rate limit: 5th request from one phone in 10 min');
reset role; update service_requests set status = 'new' where branch_id = 'al-tarfa'; set role anon;
select pg_temp.ok((submit_feedback('client-0001-abc', 'al-jazzat', 1, '{"waiting":1}', 'waited forever', 'anon-1')->>'id') is not null, 'anonymous feedback accepted');
select pg_temp.ok((submit_feedback('client-0001-abc', 'al-jazzat', 1, '{}', 'dupe', 'anon-1')->>'id') = (submit_feedback('client-0001-abc', 'al-jazzat', 5, '{}', 'x', 'anon-1')->>'id'), 'feedback resubmission is idempotent');
select pg_temp.expect_error($$select submit_feedback('client-0002-abc', 'al-jazzat', 9, '{}', '', 'anon-1')$$, 'rating out of range rejected');
select pg_temp.expect_error($$select add_stamp('TT000000', 'al-jazzat', 'r1')$$, 'anon cannot add stamps');
select pg_temp.expect_error($$select save_settings('{}')$$, 'anon cannot change settings');
reset role;
select pg_temp.ok((select urgent from feedback where client_id = 'client-0001-abc'), 'rating 1 marked urgent');

-- ---------- customer joins loyalty (email-verified session)
set role authenticated; select set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-00000000000d', false);
select join_loyalty('Ahmed', 'al-jazzat');
select pg_temp.ok((select (my_loyalty()->'member'->>'member_code') ~ '^TT[0-9]{6}$'), 'member card issued');
select pg_temp.expect_error($$select add_stamp((my_loyalty()->'member'->>'member_code'), 'al-jazzat', 'self-1')$$, 'customer cannot stamp themselves');
select pg_temp.expect_error($$insert into loyalty_transactions (member_id, branch_id, kind, stamps, ref, staff_id) select id, 'al-jazzat', 'stamp', 1, 'x', '00000000-0000-0000-0000-00000000000a' from loyalty_members limit 1$$, 'customer cannot insert ledger rows');
select pg_temp.ok((select count(*) from service_requests) = 0, 'customer sees no service requests');
select pg_temp.expect_error($$select email from loyalty_members$$, 'email column not readable through API');
reset role;
select member_code as code from loyalty_members where user_id = '00000000-0000-0000-0000-00000000000d' \gset
set role authenticated; select set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-00000000000e', false);
select join_loyalty('Other', null);
select pg_temp.ok((select count(*) from loyalty_transactions) = 0, 'customer cannot see other members ledger');
reset role;

-- ---------- Al Jazzat staff
set role authenticated; select set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-00000000000a', false);
select pg_temp.ok((select count(*) from service_requests where branch_id = 'al-tarfa') = 0, 'staff cannot see other branch requests');
select pg_temp.ok((select count(*) from service_requests where branch_id = 'al-jazzat') >= 1, 'staff sees own branch requests');
select pg_temp.ok(update_request((select id from service_requests where branch_id = 'al-jazzat' and type = 'call_staff'), 'acknowledged'), 'staff acknowledges');
select pg_temp.expect_error($$select update_request((select id from service_requests where branch_id = 'al-jazzat' and type = 'call_staff'), 'acknowledged')$$, 'cannot acknowledge twice');
reset role;
select id as tarfa_req from service_requests where branch_id = 'al-tarfa' limit 1 \gset
set role authenticated; select set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-00000000000a', false);
select pg_temp.expect_error(format($$select update_request(%L, 'completed')$$, :'tarfa_req'), 'staff cannot update other branch');
select pg_temp.ok((select count(*) from feedback) = 0, 'staff cannot read feedback');
select pg_temp.ok((select count(*) from activity_events) = 0, 'staff cannot read analytics events');
select pg_temp.expect_error($$select set_feedback_status((select id from feedback limit 1), 'resolved')$$, 'staff cannot resolve feedback');
select pg_temp.expect_error($$select save_offer('{"id":"o1","title":"Hack","expiresAt":"2099-01-01"}')$$, 'staff cannot add offers');
select pg_temp.ok((add_stamp(:'code', 'al-jazzat', 'pos-1')->>'balance')::int = 1, 'staff adds stamp');
select pg_temp.ok((add_stamp(:'code', 'al-jazzat', 'pos-1')->>'duplicate')::boolean, 'same ref is idempotent (no double stamp)');
select pg_temp.expect_error(format($$select add_stamp(%L, 'al-jazzat', 'pos-2')$$, :'code'), 'second stamp within 10 minutes blocked');
select pg_temp.expect_error(format($$select add_stamp(%L, 'al-tarfa', 'pos-3')$$, :'code'), 'staff cannot stamp at another branch');
select pg_temp.expect_error(format($$select redeem_reward(%L, 'al-jazzat', 'rd-1')$$, :'code'), 'cannot redeem without enough stamps');
reset role;
-- age the stamps so more can be added
update loyalty_transactions set created_at = now() - interval '1 hour';
set role authenticated; select set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-00000000000a', false);
select add_stamp(:'code', 'al-jazzat', 'pos-4');
reset role; update loyalty_transactions set created_at = now() - interval '1 hour';
set role authenticated; select set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-00000000000a', false);
select add_stamp(:'code', 'al-jazzat', 'pos-5');
select pg_temp.ok((redeem_reward(:'code', 'al-jazzat', 'rd-2')->>'balance')::int = 0, 'redeem with enough stamps');
select pg_temp.ok((redeem_reward(:'code', 'al-jazzat', 'rd-2')->>'duplicate')::boolean, 'same redemption ref not applied twice');
select pg_temp.expect_error(format($$select redeem_reward(%L, 'al-jazzat', 'rd-3')$$, :'code'), 'no double redemption / negative balance');
select pg_temp.expect_error($$update loyalty_transactions set stamps = 50$$, 'ledger cannot be edited');
select pg_temp.expect_error($$delete from loyalty_transactions$$, 'ledger cannot be deleted');
select pg_temp.expect_error($$update profiles set role = 'owner'$$, 'staff cannot promote themselves');
reset role;

-- ---------- owner
set role authenticated; select set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-00000000000c', false);
select pg_temp.ok((select count(distinct branch_id) from service_requests) = 2, 'owner sees both branches');
select pg_temp.ok((select count(*) from feedback) >= 1, 'owner reads feedback');
select pg_temp.ok(set_feedback_status((select id from feedback limit 1), 'resolved'), 'owner resolves feedback');
select pg_temp.expect_error($$select save_settings(jsonb_set((select data from settings), '{loyalty}', '{"enabled":true,"approved":false,"stampsForReward":5,"rewardName":"x"}'))$$, 'loyalty cannot be enabled unapproved');
select pg_temp.ok(save_offer('{"id":"o1","title":"Karak","description":"Evening","branchId":"all","expiresAt":"2099-01-01T00:00:00Z","active":true}'), 'owner adds offer');
select pg_temp.ok(save_offer('{"id":"o2","title":"Old","description":"","branchId":"all","expiresAt":"2000-01-01T00:00:00Z","active":true}'), 'owner adds expired offer');
reset role;
set role anon; select set_config('request.jwt.claim.sub', '', false);
select pg_temp.ok(jsonb_array_length(public_config()->'offers') = 1, 'expired offers hidden from customers');
select pg_temp.ok((select count(*) from offers) = 1, 'anon offer read returns only live offers');
reset role;
\echo ALL DATABASE SECURITY TESTS PASSED
