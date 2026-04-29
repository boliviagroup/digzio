#!/usr/bin/env python3
"""
Seed property images for all 22 Digzio properties.
1. Upload each image file to S3 via the Image API
2. Seed the returned CloudFront URLs into the property_images table via the admin endpoint
"""
import requests
import json
import os
import time

BASE = 'https://www.digzio.co.za'
IMAGE_DIR = '/home/ubuntu/digzio/property_images'

# ── Step 1: Fetch all properties ─────────────────────────────────────────────
r = requests.get(f'{BASE}/api/v1/properties?limit=30')
data = r.json()
props = data if isinstance(data, list) else data.get('properties', data.get('data', []))
print(f'Found {len(props)} properties')

# ── Step 2: Define image sets per property type ───────────────────────────────
# Map property type → list of local image files to use (3 images per property)
TYPE_IMAGES = {
    'STUDENT_RESIDENCE': [
        'gen_residence_exterior.jpg',
        'gen_residence_room.jpg',
        'gen_communal_kitchen.jpg',
    ],
    'student_residence': [
        'gen_residence_exterior_2.jpg',
        'gen_residence_room.jpg',
        'gen_study_room.jpg',
    ],
    'APARTMENT': [
        'gen_apartment_exterior.jpg',
        'gen_apartment_lounge.jpg',
        'interior_studio_1.jpg',
    ],
    'apartment': [
        'gen_apartment_exterior_2.jpg',
        'gen_apartment_lounge.jpg',
        'interior_studio_2.jpg',
    ],
    'HOUSE': [
        'gen_house_exterior.jpg',
        'gen_house_lounge.jpg',
        'interior_shared.jpg',
    ],
    'shared_house': [
        'gen_house_exterior.jpg',
        'gen_house_lounge.jpg',
        'gen_communal_kitchen.jpg',
    ],
}
DEFAULT_IMAGES = [
    'gen_residence_exterior.jpg',
    'gen_residence_room.jpg',
    'gen_communal_kitchen.jpg',
]

# ── Step 3: Upload images to S3 via Image API ─────────────────────────────────
uploaded_cache = {}  # filename → {original, thumbnail}

def upload_image(filename):
    if filename in uploaded_cache:
        return uploaded_cache[filename]
    filepath = os.path.join(IMAGE_DIR, filename)
    if not os.path.exists(filepath):
        print(f'  WARNING: {filename} not found, skipping')
        return None
    with open(filepath, 'rb') as f:
        ext = filename.rsplit('.', 1)[-1].lower()
        mime = 'image/jpeg' if ext in ('jpg', 'jpeg') else ('image/png' if ext == 'png' else 'image/webp')
        resp = requests.post(
            f'{BASE}/api/v1/images/upload',
            files={'image': (filename, f, mime)},
            timeout=60
        )
    if resp.status_code == 201:
        urls = resp.json().get('urls', {})
        uploaded_cache[filename] = urls
        print(f'  Uploaded {filename} → {urls.get("original","?")[:60]}...')
        return urls
    else:
        print(f'  FAILED to upload {filename}: {resp.status_code} {resp.text[:100]}')
        return None

# ── Step 4: Seed images into each property ────────────────────────────────────
results = []
for i, prop in enumerate(props):
    pid = prop['property_id']
    ptype = prop.get('property_type', 'APARTMENT')
    title = prop.get('title', '?')
    
    # Pick image set for this property type, rotate through variants
    image_files = TYPE_IMAGES.get(ptype, DEFAULT_IMAGES)
    
    print(f'\n[{i+1}/{len(props)}] {title} ({ptype})')
    
    # Upload images and collect URLs
    image_urls = []
    for j, fname in enumerate(image_files):
        urls = upload_image(fname)
        if urls:
            image_urls.append({
                'image_url': urls.get('original', ''),
                'thumbnail_url': urls.get('thumbnail', ''),
                'is_primary': j == 0,
                'display_order': j + 1
            })
    
    if not image_urls:
        print(f'  No images to seed for {title}')
        results.append({'property': title, 'status': 'FAILED', 'reason': 'no images'})
        continue
    
    # Seed into DB via admin endpoint
    seed_resp = requests.post(
        f'{BASE}/api/v1/properties/{pid}/images/seed',
        json={'image_urls': image_urls},
        timeout=30
    )
    
    if seed_resp.status_code in (200, 201):
        seeded = seed_resp.json().get('images', [])
        print(f'  ✓ Seeded {len(seeded)} images')
        results.append({'property': title, 'status': 'OK', 'images': len(seeded)})
    else:
        print(f'  ✗ Seed failed: {seed_resp.status_code} {seed_resp.text[:150]}')
        results.append({'property': title, 'status': 'FAILED', 'reason': seed_resp.text[:100]})
    
    time.sleep(0.2)  # small delay to avoid rate limiting

# ── Summary ───────────────────────────────────────────────────────────────────
print('\n' + '='*60)
print('SUMMARY')
print('='*60)
ok = [r for r in results if r['status'] == 'OK']
fail = [r for r in results if r['status'] != 'OK']
print(f'  Success: {len(ok)}/{len(results)}')
if fail:
    print(f'  Failed:')
    for f in fail:
        print(f'    - {f["property"]}: {f.get("reason","?")}')
print('Done.')
