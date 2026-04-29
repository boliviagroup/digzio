#!/usr/bin/env python3
"""
Upload all compressed property images to S3 via the Image API
and save the resulting CloudFront URLs to a JSON file.
"""
import requests
import json
import os
import time

IMAGE_DIR = '/home/ubuntu/digzio/property_images_compressed'
BASE = 'https://www.digzio.co.za'
OUTPUT = '/home/ubuntu/digzio/scripts/uploaded_images.json'

# Load existing uploads if any
if os.path.exists(OUTPUT):
    with open(OUTPUT) as f:
        try:
            uploaded = json.load(f)
        except Exception:
            uploaded = {}
else:
    uploaded = {}

image_files = sorted([f for f in os.listdir(IMAGE_DIR) if f.endswith(('.jpg', '.jpeg', '.png', '.webp'))])
print(f'Found {len(image_files)} images. Already uploaded: {len(uploaded)}')

for fname in image_files:
    if fname in uploaded:
        print(f'  skip {fname} (already uploaded)')
        continue
    
    filepath = os.path.join(IMAGE_DIR, fname)
    ext = fname.rsplit('.', 1)[-1].lower()
    mime = {'jpg': 'image/jpeg', 'jpeg': 'image/jpeg', 'png': 'image/png', 'webp': 'image/webp'}.get(ext, 'image/jpeg')
    
    for attempt in range(3):
        try:
            with open(filepath, 'rb') as f:
                resp = requests.post(
                    f'{BASE}/api/v1/images/upload',
                    files={'image': (fname, f, mime)},
                    timeout=90
                )
            
            if resp.status_code == 201:
                urls = resp.json().get('urls', {})
                uploaded[fname] = {'original': urls.get('original'), 'thumbnail': urls.get('thumbnail')}
                print(f'  ✓ {fname} ({os.path.getsize(filepath)//1024}KB)')
                # Save after each successful upload
                with open(OUTPUT, 'w') as out:
                    json.dump(uploaded, out, indent=2)
                break
            else:
                print(f'  ✗ {fname}: HTTP {resp.status_code} {resp.text[:80]}')
                break
        except requests.exceptions.Timeout:
            print(f'  timeout {fname} (attempt {attempt+1}/3)')
            time.sleep(2)
        except Exception as e:
            print(f'  error {fname}: {e}')
            break

print(f'\nDone. Uploaded {len(uploaded)}/{len(image_files)} images')
print(f'Saved to {OUTPUT}')
