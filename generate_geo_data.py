"""
Generate synthetic geo-location data for accounts.
Creates a mapping of account_id -> (country, city, latitude, longitude)
"""

import pandas as pd
import random
import numpy as np

# Synthetic location data (realistic for demo purposes)
GEO_LOCATIONS = {
    'US': [
        ('New York, NY', 40.7128, -74.0060),
        ('Los Angeles, CA', 34.0522, -118.2437),
        ('Chicago, IL', 41.8781, -87.6298),
        ('Houston, TX', 29.7604, -95.3698),
        ('Phoenix, AZ', 33.4484, -112.0742),
        ('Miami, FL', 25.7617, -80.1918),
        ('San Francisco, CA', 37.7749, -122.4194),
        ('Seattle, WA', 47.6062, -122.3321),
        ('Boston, MA', 42.3601, -71.0589),
        ('Atlanta, GA', 33.7490, -84.3880),
    ],
    'UK': [
        ('London', 51.5074, -0.1278),
        ('Manchester', 53.4808, -2.2426),
        ('Birmingham', 52.5086, -1.8755),
        ('Leeds', 53.8008, -1.5491),
        ('Glasgow', 55.8642, -4.2518),
    ],
    'IN': [
        ('Mumbai', 19.0760, 72.8777),
        ('Delhi', 28.7041, 77.1025),
        ('Bangalore', 12.9716, 77.5946),
        ('Chennai', 13.0827, 80.2707),
        ('Kolkata', 22.5726, 88.3639),
    ],
    'DE': [
        ('Berlin', 52.5200, 13.4050),
        ('Munich', 48.1351, 11.5820),
        ('Frankfurt', 50.1109, 8.6821),
        ('Hamburg', 53.5511, 9.9937),
    ],
    'SG': [
        ('Singapore', 1.3521, 103.8198),
    ],
    'HK': [
        ('Hong Kong', 22.3193, 114.1694),
    ],
    'NZ': [
        ('Auckland', -37.0742, 174.8859),
        ('Wellington', -41.2865, 174.7762),
    ],
    'AU': [
        ('Sydney', -33.8688, 151.2093),
        ('Melbourne', -37.8136, 144.9631),
    ],
}

def generate_account_locations(account_ids):
    """Generate random but realistic locations for accounts."""
    account_locations = {}
    
    for account_id in account_ids:
        # Randomly select country and city
        country = random.choice(list(GEO_LOCATIONS.keys()))
        city_data = random.choice(GEO_LOCATIONS[country])
        
        city_name, lat, lon = city_data
        
        # Add small random noise for realistic spread (±0.2 degrees)
        lat += random.uniform(-0.2, 0.2)
        lon += random.uniform(-0.2, 0.2)
        
        account_locations[account_id] = {
            'country': country,
            'city': city_name,
            'latitude': lat,
            'longitude': lon
        }
    
    return account_locations

def add_geo_data_to_csv(csv_path='sample_transactions.csv'):
    """Add geo-location data to CSV and save as new version."""
    df = pd.read_csv(csv_path)
    
    # Get unique accounts
    all_accounts = set(df['sender_id']).union(set(df['receiver_id']))
    account_locations = generate_account_locations(list(all_accounts))
    
    # Add sender and receiver location columns
    df['sender_country'] = df['sender_id'].map(lambda x: account_locations[x]['country'])
    df['sender_city'] = df['sender_id'].map(lambda x: account_locations[x]['city'])
    df['sender_lat'] = df['sender_id'].map(lambda x: account_locations[x]['latitude'])
    df['sender_lon'] = df['sender_id'].map(lambda x: account_locations[x]['longitude'])
    
    df['receiver_country'] = df['receiver_id'].map(lambda x: account_locations[x]['country'])
    df['receiver_city'] = df['receiver_id'].map(lambda x: account_locations[x]['city'])
    df['receiver_lat'] = df['receiver_id'].map(lambda x: account_locations[x]['latitude'])
    df['receiver_lon'] = df['receiver_id'].map(lambda x: account_locations[x]['longitude'])
    
    # Save
    df.to_csv(csv_path, index=False)
    
    print(f"Added geo-location data to {csv_path}")
    print(f"Accounts: {len(all_accounts)}")
    print(f"Countries represented: {len(set(account_locations[acc]['country'] for acc in all_accounts))}")
    
    return df, account_locations

if __name__ == '__main__':
    df, locations = add_geo_data_to_csv()
    print("\nSample of geo-data:")
    print(df[['transaction_id', 'sender_id', 'sender_city', 'receiver_id', 'receiver_city']].head())
