-- NJ Tulunde Urban Feeds: run this in Supabase > SQL Editor > New query > Run.
-- Safe to run again at any time. It also upgrades an older database (new categories, hide/show, safer uploads).
-- The ONLY admin is the email in the is_admin() function below. Change it there if you ever use another email.

create or replace function public.is_admin() returns boolean language sql stable set search_path = '' as
$$ select coalesce(auth.jwt()->>'email','') = 'njtulundeurbanfeeds@gmail.com' $$;

create table if not exists products(id bigint generated always as identity primary key,name text not null,description text,price text default 'Call for Price',
 category text not null default 'animal-feeds',image text,tag text,published boolean not null default true,created_at timestamptz default now());
create table if not exists posts(id bigint generated always as identity primary key,slug text unique not null,title text not null,video text,description text,created_at timestamptz default now());
create table if not exists settings(key text primary key,value text);
alter table products add column if not exists published boolean not null default true;

-- categories: animal-feeds | silage-making | chopping-machines | farm-tools | supplements | services
alter table products drop constraint if exists products_category_check;
update products set category='silage-making' where category in('feeds','inputs','equipment') and name in('Selling & Making Silage','Silage Bags');
update products set category='chopping-machines' where category in('feeds','inputs','equipment') and name='Silage Chopping Machines';
update products set category='services' where category in('feeds','inputs','equipment') and name='Farm Outreach';
update products set category='farm-tools' where category in('feeds','inputs','equipment') and name in('Feed & Water Troughs','Milking Cans','All Other Farm Tools');
update products set category='animal-feeds' where category in('feeds','inputs','equipment') and name in('Hay Pastures','Dry & Fresh Kikanja','Molasses');
update products set category='supplements' where category in('feeds','inputs','equipment') and name in('Animal Salts','Livestock Microbes');
update products set category=case category when 'feeds' then 'animal-feeds' when 'equipment' then 'farm-tools' else 'supplements' end where category in('feeds','inputs','equipment');
alter table products alter column category set default 'animal-feeds';
alter table products add constraint products_category_check check(category in('animal-feeds','silage-making','chopping-machines','farm-tools','supplements','services'));
-- sensible size limits (stops junk or oversized text being saved)
alter table products drop constraint if exists products_len_check;
alter table products add constraint products_len_check check(char_length(name)<=120 and char_length(coalesce(description,''))<=600 and char_length(coalesce(price,''))<=200 and char_length(coalesce(tag,''))<=40);
alter table posts drop constraint if exists posts_len_check;
alter table posts add constraint posts_len_check check(char_length(title)<=200 and char_length(slug)<=120 and char_length(coalesce(description,''))<=20000);

alter table products enable row level security;alter table posts enable row level security;alter table settings enable row level security;
-- everyone can READ (hidden products are visible only to the admin)
drop policy if exists "read products" on products;
create policy "read products" on products for select using(published);
drop policy if exists "read posts" on posts;
create policy "read posts" on posts for select using(true);
drop policy if exists "read settings" on settings;
create policy "read settings" on settings for select using(true);
-- only the admin can ADD / EDIT / REMOVE
drop policy if exists "admin products" on products;
create policy "admin products" on products for all to authenticated using(public.is_admin()) with check(public.is_admin());
drop policy if exists "admin posts" on posts;
create policy "admin posts" on posts for all to authenticated using(public.is_admin()) with check(public.is_admin());
drop policy if exists "admin settings" on settings;
create policy "admin settings" on settings for all to authenticated using(public.is_admin()) with check(public.is_admin());

-- product photo storage: public to view, admin only to upload/delete, images only, max 5MB
insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types) values('product-images','product-images',true,5242880,array['image/jpeg','image/png','image/webp'])
 on conflict(id) do update set file_size_limit=5242880,allowed_mime_types=array['image/jpeg','image/png','image/webp'];
drop policy if exists "admin upload images" on storage.objects;
create policy "admin upload images" on storage.objects for insert to authenticated with check(bucket_id='product-images' and public.is_admin());
drop policy if exists "admin delete images" on storage.objects;
create policy "admin delete images" on storage.objects for delete to authenticated using(bucket_id='product-images' and public.is_admin());

-- starter content (only added when the products table is empty)
do $$ begin if not exists(select 1 from products) then insert into products(name,description,price,category,image,tag) values
('Selling & Making Silage','Quality maize silage for cattle feed, plus expert silage making on your farm.','UGX 380,000 per tonne | UGX 20,000 per bag','silage-making','/images/p-silage.jpg',''),
('Hay Pastures','Baled and shredded hay, Napier cuttings and Chloris Gayana seeds.','Baled hay UGX 12,000 | Shredded UGX 15,000 per bag','animal-feeds','/images/p-hay.jpg',''),
('Silage Chopping Machines','Diesel-powered 8HP choppers for fast, even silage preparation.','UGX 4,500,000 | Hire UGX 200,000 per day','chopping-machines','/images/chop1.jpg','For Sale & For Hire'),
('Silage Bags','Strong silage bags and covers that keep your silage airtight.','Silage covers UGX 2,500 each','silage-making','/images/hero.jpg',''),
('Molasses','Energy-rich molasses for animal feed supplementation.','20L UGX 55,000 | 5L UGX 20,000','animal-feeds','/images/p-molasses.jpg',''),
('Livestock Microbes','Bio Star livestock microbes and yeast for healthier, more productive animals.','Bio Star 20L UGX 70,000 | Yeast 20L UGX 40,000','supplements','/images/cows2.jpg',''),
('Dry & Fresh Kikanja','Breweries waste, a low-cost protein feed for dairy cattle.','Dry UGX 2,000/kg | Fresh UGX 90,000 per drum','animal-feeds','/images/kikanja.jpg',''),
('Animal Salts','Mineral salts and lick blocks for strong, healthy livestock.','From UGX 4000/kg','supplements','/images/blocks.jpg',''),
('Feed & Water Troughs','Durable troughs for cattle, goats and other livestock.','Call for Price','farm-tools','/images/feeders.jpg',''),
('Farm Outreach','We visit your farm to train workers and improve your feeding.','Transport cost applies - Call for Price','services','/images/outreach.jpg',''),
('Milking Cans','Quality stainless steel milking cans in various sizes.','Call for Price','farm-tools','/images/p-cans.jpg',''),
('All Other Farm Tools','Spades, rakes, buckets and every tool a working farm needs.','Call for Price','farm-tools','/images/tiles.jpg',''); end if; end $$;
insert into posts(slug,title,video,description) values
('how-to-make-quality-maize-silage','How to make quality maize silage','','Good silage keeps your cows productive through the dry season.
Chop the maize when the grain is at the milk-line stage so the material has enough sugar and moisture to ferment well. Chop short and even, then pack it tightly in layers and press out the air.
Seal everything with a silage cover or bag, and keep water out. After about three weeks it is ready to feed. Introduce it slowly so the animals get used to it.
Need a chopping machine or a trained hand? Call us or book a farm outreach visit.'),
('why-kikanja-saves-feed-costs','Why kikanja can cut your feed costs','','Kikanja, the waste from breweries, is a popular protein-rich feed for dairy cattle.
Fresh kikanja is cheap but spoils quickly, so use it within a few days or choose dry kikanja that stores longer. Mix it into the ration and increase gradually.
Ask our team to check your feeding formula on a farm visit.') on conflict(slug) do nothing;
insert into settings(key,value) values('intro_video','') on conflict do nothing;
