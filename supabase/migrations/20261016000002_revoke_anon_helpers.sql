-- RLS pomoćne funkcije trebaju samo prijavljenim korisnicima.
-- (Upozorenja za 'authenticated' su očekivana: is_member/is_admin otkrivaju
-- samo članstvo trenutnog korisnika, a create_tenant je namjerno javna RPC.)
revoke execute on function public.is_member(uuid) from public, anon;
revoke execute on function public.is_admin(uuid) from public, anon;
grant execute on function public.is_member(uuid) to authenticated;
grant execute on function public.is_admin(uuid) to authenticated;
