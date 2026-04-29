#!/usr/bin/env python3
"""
Upload property images to S3 and insert directly into the RDS property_images table.
"""
import subprocess
import psycopg2
import requests
import os
import uuid
import time

# DB connection
DB_HOST = 'digzio-db-prod.cjy0eyycgbq0.af-south-1.rds.amazonaws.com'
DB_PORT = 5432
DB_NAME = 'digzio'
DB_USER = 'digzio_admin'
DB_PASSWORD = 'sIri78NwfHF0y!|lKEUXPQ(?qBVj'

# S3 / CloudFront
S3_BUCKET = 'digzio-property-images-prod'
CF_DOMAIN = 'https://d1t2pdt9c1syrh.cloudfront.net'
REGION = 'af-south-1'
IMAGE_DIR = '/home/ubuntu/digzio/property_images'
BASE = 'https://www.digzio.co.za'

# ── Connect to DB ─────────────────────────────────────────────────────────────
print('Connecting to RDS...')
conn = psycopg2.connect(
    host=DB_HOST, port=DB_PORT, dbname=DB_NAME,
    user=DB_USER, password=DB_PASSWORD,
    connect_timeout=10, sslmode='require'
)
cur = conn.cursor()
print('Connected!')

# ── Fetch all properties ──────────────────────────────────────────────────────
cur.execute("SELECT property_id, title, property_type FROM properties ORDER BY created_at")
props = cur.fetchall()
print(f'Found {len(props)} properties')

# ── Check property_images table schema ───────────────────────────────────────
cur.execute("""
    SELECT column_name FROM information_schema.columns 
    WHERE table_name = 'property_images' ORDER BY ordinal_position
""")
cols = [r[0] for r in cur.fetchall()]
print(f'property_images columns: {cols}')

# ── S3 upload helper ──────────────────────────────────────────────────────────
uploaded_cache = {}

def upload_to_s3(filename):
    if filename in uploaded_cache:
        return uploaded_cache[filename]
    
    filepath = os.path.join(IMAGE_DIR, filename)
    if not os.path.exists(filepath):
        print(f'  WARNING: {filename} not found')
        return None
    
    ext = filename.rsplit('.', 1)[-1].lower()
    content_type = {
        'jpg': 'image/jpeg', 'jpeg': 'image/jpeg',
        'png': 'image/png', 'webp': 'image/webp'
    }.get(ext, 'image/jpeg')
    
    key = f'properties/{uuid.uuid4().hex[:8]}/{filename}'
    result = subprocess.run([
        'aws', 's3', 'cp', filepath,
        f's3://{S3_BUCKET}/{key}',
        '--content-type', content_type,
        '--region', REGION
    ], capture_output=True, text=True)
    
    if result.returncode != 0:
        print(f'  FAILED to upload {filename}: {result.stderr[:100]}')
        return None
    
    url = f'{CF_DOMAIN}/{key}'
    uploaded_cache[filename] = url
    print(f'  Uploaded {filename}')
    return url

# ── Image sets per property type ──────────────────────────────────────────────
RESIDENCE_SETS = [
    ['gen_residence_exterior.jpg', 'gen_residence_room.jpg', 'gen_communal_kitchen.jpg'],
    ['gen_residence_exterior_2.jpg', 'gen_residence_room.jpg', 'gen_study_room.jpg'],
]
APARTMENT_SETS = [
    ['gen_apartment_exterior.jpg', 'gen_apartment_lounge.jpg', 'interior_studio_1.jpg'],
    ['gen_apartment_exterior_2.jpg', 'gen_apartment_lounge.jpg', 'interior_studio_2.jpg'],
]
HOUSE_SETS = [
    ['gen_house_exterior.jpg', 'gen_house_lounge.jpg', 'interior_shared.jpg'],
    ['gen_house_exterior.jpg', 'gen_communal_kitchen.jpg', 'gen_study_room.jpg'],
]
DEFAULT_SET = ['gen_residence_exterior.jpg', 'gen_residence_room.jpg', 'gen_communal_kitchen.jpg']

type_counters = {}

def get_image_set(ptype):
    ptype_upper = (ptype or 'APARTMENT').upper()
    count = type_counters.get(ptype_upper, 0)
    type_counters[ptype_upper] = count + 1
    
    if 'RESIDENCE' in ptype_upper:
        return RESIDENCE_SETS[count % len(RESIDENCE_SETS)]
    elif 'APARTMENT' in ptype_upper or 'STUDIO' in ptype_upper:
        return APARTMENT_SETS[count % len(APARTMENT_SETS)]
    elif 'HOUSE' in ptype_upper or 'SHARED' in ptype_upper:
        return HOUSE_SETS[count % len(HOUSE_SETS)]
    else:
        return DEFAULT_SET

# ── Determine INSERT columns based on schema ──────────────────────────────────
has_thumbnail = 'thumbnail_url' in cols
has_category = 'category' in cols

# ── Seed each property ────────────────────────────────────────────────────────
results = []

for i, (pid, title, ptype) in enumerate(props):
    image_files = get_image_set(ptype)
    print(f'\n[{i+1}/{len(props)}] {title} ({ptype})')
    
    # Delete existing images
    cur.execute('DELETE FROM property_images WHERE property_id = %s', (pid,))
    
    inserted = 0
    for j, fname in enumerate(image_files):
        url = upload_to_s3(fname)
        if not url:
            continue
        
        is_primary = (j == 0)
        display_order = j + 1
        
        if has_thumbnail and has_category:
            cur.execute(
                """INSERT INTO property_images 
                   (property_id, image_url, thumbnail_url, is_primary, display_order, category)
                   VALUES (%s, %s, %s, %s, %s, %s)""",
                (pid, url, url, is_primary, display_order, 'exterior' if j == 0 else 'interior')
            )
        elif has_thumbnail:
            cur.execute(
                """INSERT INTO property_images 
                   (property_id, image_url, thumbnail_url, is_primary, display_order)
                   VALUES (%s, %s, %s, %s, %s)""",
                (pid, url, url, is_primary, display_order)
            )
        else:
            cur.execute(
                """INSERT INTO property_images 
                   (property_id, image_url, is_primary, display_order)
                   VALUES (%s, %s, %s, %s)""",
                (pid, url, is_primary, display_order)
            )
        inserted += 1
    
    conn.commit()
    print(f'  ✓ Inserted {inserted} images')
    results.append({'property': title, 'status': 'OK', 'images': inserted})

# ── Summary ───────────────────────────────────────────────────────────────────
cur.close()
conn.close()

print('\n' + '='*60)
print('SUMMARY')
print('='*60)
ok = [r for r in results if r['status'] == 'OK']
print(f'  Success: {len(ok)}/{len(results)} properties seeded')
print(f'  Total S3 uploads: {len(uploaded_cache)} unique files')
if uploaded_cache:
    sample = list(uploaded_cache.values())[0]
    print(f'  Sample URL: {sample}')
print('Done.')
