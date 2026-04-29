#!/usr/bin/env python3
"""
Upload property images directly to S3 and seed the property_images table
via the existing admin endpoint on the running property-api.
"""
import subprocess
import requests
import json
import os
import time
import uuid

S3_BUCKET = 'digzio-property-images-prod'
CF_DOMAIN = 'https://d1t2pdt9c1syrh.cloudfront.net'
IMAGE_DIR = '/home/ubuntu/digzio/property_images'
BASE = 'https://www.digzio.co.za'
REGION = 'af-south-1'

# ── Step 1: Fetch all properties ─────────────────────────────────────────────
r = requests.get(f'{BASE}/api/v1/properties?limit=30', timeout=15)
data = r.json()
props = data if isinstance(data, list) else data.get('properties', data.get('data', []))
print(f'Found {len(props)} properties')

# ── Step 2: Upload images to S3 ───────────────────────────────────────────────
uploaded_cache = {}  # local filename → {original_url, thumbnail_url}

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
    
    # Upload original
    key = f'properties/{uuid.uuid4().hex}/{filename}'
    result = subprocess.run([
        'aws', 's3', 'cp', filepath,
        f's3://{S3_BUCKET}/{key}',
        '--content-type', content_type,
        '--region', REGION,
        '--acl', 'public-read'
    ], capture_output=True, text=True)
    
    if result.returncode != 0:
        # Try without ACL (bucket may not support ACLs)
        result = subprocess.run([
            'aws', 's3', 'cp', filepath,
            f's3://{S3_BUCKET}/{key}',
            '--content-type', content_type,
            '--region', REGION
        ], capture_output=True, text=True)
    
    if result.returncode != 0:
        print(f'  FAILED to upload {filename}: {result.stderr[:100]}')
        return None
    
    original_url = f'{CF_DOMAIN}/{key}'
    # Use same image as thumbnail (no resize needed for demo)
    thumbnail_url = original_url
    
    uploaded_cache[filename] = {'original': original_url, 'thumbnail': thumbnail_url}
    print(f'  Uploaded {filename} → {key}')
    return uploaded_cache[filename]

# ── Step 3: Image sets per property type ─────────────────────────────────────
# Alternate between variant sets to avoid all properties looking identical
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
    ptype_upper = ptype.upper() if ptype else 'APARTMENT'
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

# ── Step 4: Seed each property ────────────────────────────────────────────────
results = []

for i, prop in enumerate(props):
    pid = prop['property_id']
    ptype = prop.get('property_type', 'APARTMENT')
    title = prop.get('title', '?')
    
    image_files = get_image_set(ptype)
    print(f'\n[{i+1}/{len(props)}] {title} ({ptype})')
    
    image_urls = []
    for j, fname in enumerate(image_files):
        urls = upload_to_s3(fname)
        if urls:
            image_urls.append({
                'image_url': urls['original'],
                'thumbnail_url': urls['thumbnail'],
                'is_primary': j == 0,
                'display_order': j + 1
            })
    
    if not image_urls:
        print(f'  No images to seed')
        results.append({'property': title, 'status': 'FAILED', 'reason': 'no images uploaded'})
        continue
    
    # Call the seed endpoint
    seed_resp = requests.post(
        f'{BASE}/api/v1/properties/{pid}/images/seed',
        json={'image_urls': image_urls},
        timeout=30
    )
    
    if seed_resp.status_code in (200, 201):
        seeded = seed_resp.json().get('images', [])
        print(f'  ✓ Seeded {len(seeded)} images')
        results.append({'property': title, 'status': 'OK', 'images': len(seeded)})
    elif seed_resp.status_code == 404:
        print(f'  ✗ Endpoint not found (404) - new deployment not yet live')
        results.append({'property': title, 'status': 'ENDPOINT_NOT_DEPLOYED', 'reason': '404'})
    else:
        print(f'  ✗ Seed failed: {seed_resp.status_code} {seed_resp.text[:150]}')
        results.append({'property': title, 'status': 'FAILED', 'reason': seed_resp.text[:100]})
    
    time.sleep(0.1)

# ── Summary ───────────────────────────────────────────────────────────────────
print('\n' + '='*60)
print('SUMMARY')
print('='*60)
ok = [r for r in results if r['status'] == 'OK']
fail = [r for r in results if r['status'] != 'OK']
print(f'  Success: {len(ok)}/{len(results)}')
if fail:
    for f in fail:
        print(f'  FAILED: {f["property"]} - {f.get("reason","?")}')
print('Done.')
print(f'\nS3 uploads cached: {len(uploaded_cache)} unique files')
print(f'Sample CloudFront URL: {list(uploaded_cache.values())[0]["original"] if uploaded_cache else "none"}')
