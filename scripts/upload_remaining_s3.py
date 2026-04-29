#!/usr/bin/env python3
"""
Upload remaining images directly to S3 via AWS CLI (bypassing Image API).
Builds CloudFront URLs and updates uploaded_images.json.
"""
import subprocess
import json
import os
import uuid

IMAGE_DIR = '/home/ubuntu/digzio/property_images_compressed'
S3_BUCKET = 'digzio-property-images-prod'
CF_DOMAIN = 'https://d1t2pdt9c1syrh.cloudfront.net'
REGION = 'af-south-1'
OUTPUT = '/home/ubuntu/digzio/scripts/uploaded_images.json'

# Load existing uploads
with open(OUTPUT) as f:
    uploaded = json.load(f)

print(f'Already uploaded: {len(uploaded)} images')

image_files = sorted([f for f in os.listdir(IMAGE_DIR) if f.endswith(('.jpg', '.jpeg', '.png', '.webp'))])

for fname in image_files:
    if fname in uploaded:
        print(f'  skip {fname}')
        continue
    
    filepath = os.path.join(IMAGE_DIR, fname)
    ext = fname.rsplit('.', 1)[-1].lower()
    content_type = {
        'jpg': 'image/jpeg', 'jpeg': 'image/jpeg',
        'png': 'image/png', 'webp': 'image/webp'
    }.get(ext, 'image/jpeg')
    
    # Generate unique key
    uid = uuid.uuid4().hex[:8]
    original_key = f'properties/original/{uid}_{fname.rsplit(".", 1)[0]}.webp'
    thumbnail_key = f'properties/thumbnail/{uid}_{fname.rsplit(".", 1)[0]}.webp'
    
    # Upload original directly to S3
    result = subprocess.run([
        'aws', 's3', 'cp', filepath,
        f's3://{S3_BUCKET}/{original_key}',
        '--content-type', content_type,
        '--region', REGION
    ], capture_output=True, text=True)
    
    if result.returncode != 0:
        print(f'  FAILED {fname}: {result.stderr[:80]}')
        continue
    
    # Use same file as thumbnail (the Image API would resize, but for seeding this is fine)
    result2 = subprocess.run([
        'aws', 's3', 'cp', filepath,
        f's3://{S3_BUCKET}/{thumbnail_key}',
        '--content-type', content_type,
        '--region', REGION
    ], capture_output=True, text=True)
    
    original_url = f'{CF_DOMAIN}/{original_key}'
    thumbnail_url = f'{CF_DOMAIN}/{thumbnail_key}'
    
    uploaded[fname] = {'original': original_url, 'thumbnail': thumbnail_url}
    print(f'  ✓ {fname} → {original_key}')
    
    # Save after each upload
    with open(OUTPUT, 'w') as f:
        json.dump(uploaded, f, indent=2)

print(f'\nDone. Total uploaded: {len(uploaded)}/19')
