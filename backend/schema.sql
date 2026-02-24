-- Create a table for public profiles
create table profiles (
  id uuid references auth.users not null primary key,
  email text,
  target_calories integer default 2000,
  target_water_ml integer default 2000,
  target_protein integer default 150,
  target_carbs integer default 200,
  target_fat integer default 65,
  preferences jsonb default '{}',
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Set up Row Level Security (RLS)
alter table profiles enable row level security;

create policy "Public profiles are viewable by everyone." on profiles
  for select using (true);

create policy "Users can insert their own profile." on profiles
  for insert with check (auth.uid() = id);

create policy "Users can update own profile." on profiles
  for update using (auth.uid() = id);

-- Create a table for meals
create table meals (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references auth.users not null,
  image_url text, -- Path to Supabase Storage
  meal_name text, -- e.g. "Breakfast", "Lunch", "Dinner", "Snacks"
  food_name text, -- e.g. "Avocado Toast"
  calories integer,
  protein integer, -- in grams
  carbs integer,    -- in grams
  fat integer,     -- in grams
  grams integer,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- RLS for meals
alter table meals enable row level security;

create policy "Individuals can view their own meals." on meals
  for select using (auth.uid() = user_id);

create policy "Individuals can create their own meals." on meals
  for insert with check (auth.uid() = user_id);

create policy "Individuals can update their own meals." on meals
  for update using (auth.uid() = user_id);

create policy "Individuals can delete their own meals." on meals
  for delete using (auth.uid() = user_id);

-- Create a table for water logs
create table water_logs (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references auth.users not null,
  amount_ml integer not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- RLS for water_logs
alter table water_logs enable row level security;

create policy "Individuals can view their own water_logs." on water_logs
  for select using (auth.uid() = user_id);

create policy "Individuals can create their own water_logs." on water_logs
  for insert with check (auth.uid() = user_id);

create policy "Individuals can update their own water_logs." on water_logs
  for update using (auth.uid() = user_id);

create policy "Individuals can delete their own water_logs." on water_logs
  for delete using (auth.uid() = user_id);
