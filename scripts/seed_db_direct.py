#!/usr/bin/env python3
"""
Directly seed property images into the RDS database.
Run only when RDS is temporarily publicly accessible.
"""
import psycopg2
import json
import os

# DB credentials
DB_HOST = 'digzio-db-prod.cjy0eyycgbq0.af-south-1.rds.amazonaws.com'
DB_PORT = 5432
DB_NAME = 'digzio'
DB_USER = 'digzio_admin'
DB_PASSWORD = 'sIri78NwfHF0y!|lKEUXPQ(?qBVj'

# Load uploaded images
with open('/home/ubuntu/digzio/scripts/uploaded_images.json') as f:
    uploaded = json.load(f)

print(f'Loaded {len(uploaded)} uploaded images')

# Connect to DB
conn = psycopg2.connect(
    host=DB_HOST, port=DB_PORT, dbname=DB_NAME,
    user=DB_USER, password=DB_PASSWORD,
    connect_timeout=10, sslmode='require'
)
cur = conn.cursor()

# Get all properties
cur.execute("SELECT property_id, title, property_type, city FROM properties ORDER BY property_id")
properties = cur.fetchall()
print(f'Found {len(properties)} properties')

# Image assignment by property type
# Map property types to appropriate image sets
IMAGES = {
    'residence': [
        uploaded.get('gen_residence_exterior.jpg', {}).get('original'),
        uploaded.get('gen_residence_exterior_2.jpg', {}).get('original'),
        uploaded.get('gen_residence_room.jpg', {}).get('original'),
        uploaded.get('gen_study_room.jpg', {}).get('original'),
        uploaded.get('gen_communal_kitchen.jpg', {}).get('original'),
    ],
    'apartment': [
        uploaded.get('gen_apartment_exterior.jpg', {}).get('original'),
        uploaded.get('gen_apartment_exterior_2.jpg', {}).get('original'),
        uploaded.get('gen_apartment_lounge.jpg', {}).get('original'),
        uploaded.get('interior_studio_large.jpg', {}).get('original'),
        uploaded.get('interior_studio_1.jpg', {}).get('original'),
    ],
    'house': [
        uploaded.get('gen_house_exterior.jpg', {}).get('original'),
        uploaded.get('gen_house_lounge.jpg', {}).get('original'),
        uploaded.get('interior_shared.jpg', {}).get('original'),
        uploaded.get('gen_communal_kitchen.jpg', {}).get('original'),
        uploaded.get('gen_study_room.jpg', {}).get('original'),
    ],
    'default': [
        uploaded.get('exterior_luxury_1.jpg', {}).get('original'),
        uploaded.get('exterior_luxury_2.jpg', {}).get('original'),
        uploaded.get('interior_studio_2.jpg', {}).get('original'),
        uploaded.get('interior_residence.jpg', {}).get('original'),
    ],
}

# Thumbnail versions (use same URL for now since we uploaded same file)
THUMBNAILS = {k: [
    url.replace('/properties/original/', '/properties/thumbnail/') if url else None
    for url in v
] for k, v in IMAGES.items()}

total_inserted = 0
for prop_id, prop_name, prop_type, city in properties:
    # Determine image set based on property type
    ptype = (prop_type or '').lower()
    if 'residence' in ptype or 'res' in ptype:
        img_set = IMAGES['residence']
        thumb_set = THUMBNAILS['residence']
    elif 'apartment' in ptype or 'flat' in ptype or 'studio' in ptype:
        img_set = IMAGES['apartment']
        thumb_set = THUMBNAILS['apartment']
    elif 'house' in ptype or 'shared' in ptype:
        img_set = IMAGES['house']
        thumb_set = THUMBNAILS['house']
    else:
        img_set = IMAGES['default']
        thumb_set = THUMBNAILS['default']
    
    # Filter out None values
    img_set = [url for url in img_set if url]
    thumb_set = [url for url in thumb_set if url]
    
    if not img_set:
        print(f'  SKIP {prop_name} - no images available')
        continue
    
    # Delete existing images for this property
    cur.execute("DELETE FROM property_images WHERE property_id = %s", (prop_id,))
    
    # Insert images
    for i, (img_url, thumb_url) in enumerate(zip(img_set, thumb_set)):
        is_primary = (i == 0)
        cur.execute(
            """INSERT INTO property_images 
               (property_id, image_url, thumbnail_url, is_primary, display_order, category)
               VALUES (%s, %s, %s, %s, %s, %s)""",
            (prop_id, img_url, thumb_url, is_primary, i + 1, 'exterior' if i == 0 else 'interior')
        )
        total_inserted += 1
    
    print(f'  ✓ {prop_name} ({ptype}, {city}) - {len(img_set)} images')

conn.commit()
cur.close()
conn.close()

print(f'\nDone! Inserted {total_inserted} images for {len(properties)} properties')
