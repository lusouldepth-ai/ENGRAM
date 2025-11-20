create or replace function public.check_daily_quota(user_uuid uuid)
returns boolean
language plpgsql
security definer
as $$
declare
  user_tier text;
  user_daily_gens int;
  user_created_at timestamptz;
  hours_since_signup int;
  daily_limit int;
begin
  -- Get user profile data
  select tier, daily_generations, created_at 
  into user_tier, user_daily_gens, user_created_at
  from public.profiles
  where id = user_uuid;

  -- If user is pro, unlimited (return true)
  if user_tier = 'pro' then
    return true;
  end if;

  -- Calculate hours since signup
  hours_since_signup := extract(epoch from (now() - user_created_at)) / 3600;

  -- Determine limit based on "Hook" logic
  if hours_since_signup < 24 then
    daily_limit := 20;
  else
    daily_limit := 5;
  end if;

  -- Check if usage < limit
  if user_daily_gens < daily_limit then
    return true;
  else
    return false;
  end if;
end;
$$;

