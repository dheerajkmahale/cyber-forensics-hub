"""
Generate expanded synthetic transaction dataset with fraud patterns.
Includes: normal traffic, circular rings, layering, aggregator patterns, and edge cases.
"""

import pandas as pd
import numpy as np
from datetime import datetime, timedelta
import random


def generate_expanded_dataset(output_path='sample_transactions.csv', num_transactions=1000, enable_geo_data=False):
    random.seed(42)
    np.random.seed(42)

    transactions = []
    fraudulent_accounts = set()
    mule_accounts = set()
    tx_id_counter = 0
    base_time = datetime(2026, 5, 1, 0, 0, 0)

    print(f"[DATASET] Generating {num_transactions} synthetic transactions...")

    # Normal traffic (60%)
    num_normal = int(num_transactions * 0.60)
    normal_accounts = [f"ACC_NORM_{i:03d}" for i in range(200)]
    print(f"  - Normal traffic: {num_normal} transactions")
    for _ in range(num_normal):
        sender = random.choice(normal_accounts)
        receiver = random.choice([a for a in normal_accounts if a != sender])
        amount = max(10.0, np.random.normal(loc=500, scale=200))
        timestamp = base_time + timedelta(minutes=random.randint(0, 1440 * 60))
        transactions.append({
            'transaction_id': f'TX_NORM_{tx_id_counter:06d}',
            'sender_id': sender,
            'receiver_id': receiver,
            'amount': round(amount, 2),
            'timestamp': timestamp.isoformat() + 'Z',
            'is_fraud': 0,
            'is_mule': 0
        })
        tx_id_counter += 1

    # Circular money flows (15%)
    num_cycle_txns = int(num_transactions * 0.15)
    num_cycles = 10
    print(f"  - Circular rings: {num_cycle_txns} transactions")
    cycle_accounts = [f"ACC_CYC_{i:02d}" for i in range(num_cycles * 3)]
    for cycle_idx in range(num_cycles):
        cycle_nodes = cycle_accounts[cycle_idx * 3:(cycle_idx + 1) * 3]
        fraudulent_accounts.update(cycle_nodes)
        rotations = 5
        for _ in range(rotations):
            for j in range(len(cycle_nodes)):
                sender = cycle_nodes[j]
                receiver = cycle_nodes[(j + 1) % len(cycle_nodes)]
                amount = round(10000 + random.uniform(-2000, 2000), 2)
                timestamp = base_time + timedelta(minutes=random.randint(0, 1440 * 60))
                transactions.append({
                    'transaction_id': f'TX_CYC_{tx_id_counter:06d}',
                    'sender_id': sender,
                    'receiver_id': receiver,
                    'amount': amount,
                    'timestamp': timestamp.isoformat() + 'Z',
                    'is_fraud': 1,
                    'is_mule': 0
                })
                tx_id_counter += 1

    # Structuring / layering (15%)
    num_layer_txns = int(num_transactions * 0.15)
    num_chains = 15
    print(f"  - Structuring chains: {num_layer_txns} transactions")
    for chain_idx in range(num_chains):
        chain_length = 11
        chain = [f"ACC_LAYER_{chain_idx:03d}_{i:02d}" for i in range(chain_length)]
        fraudulent_accounts.update(chain)
        initial_amount = 60000 + random.uniform(-15000, 15000)
        for j in range(len(chain) - 1):
            sender = chain[j]
            receiver = chain[j + 1]
            amount = round(max(1000, initial_amount * (0.88 ** (j + 1))), 2)
            timestamp = base_time + timedelta(minutes=random.randint(0, 1440 * 60))
            transactions.append({
                'transaction_id': f'TX_LAYER_{tx_id_counter:06d}',
                'sender_id': sender,
                'receiver_id': receiver,
                'amount': amount,
                'timestamp': timestamp.isoformat() + 'Z',
                'is_fraud': 1,
                'is_mule': 0
            })
            tx_id_counter += 1

    # Aggregator / mule patterns (5%)
    num_mule_txns = int(num_transactions * 0.05)
    num_mules = 5
    print(f"  - Aggregator mules: {num_mule_txns} transactions")
    mule_accounts_list = [f"ACC_MULE_{i:03d}" for i in range(num_mules)]
    mule_accounts.update(mule_accounts_list)
    fraudulent_accounts.update(mule_accounts_list)
    source_accounts = [f"ACC_MULE_SRC_{i:03d}" for i in range(30)]
    for _ in range(num_mule_txns):
        mule = random.choice(mule_accounts_list)
        if random.random() < 0.7:
            sender = random.choice(source_accounts)
            receiver = mule
            amount = round(np.random.uniform(500, 3000), 2)
        else:
            sender = mule
            receiver = f"ACC_MULE_OUT_{random.randint(0, 15):03d}"
            amount = round(np.random.uniform(8000, 20000), 2)
            fraudulent_accounts.add(receiver)
        timestamp = base_time + timedelta(minutes=random.randint(0, 1440 * 60))
        transactions.append({
            'transaction_id': f'TX_MULE_{tx_id_counter:06d}',
            'sender_id': sender,
            'receiver_id': receiver,
            'amount': amount,
            'timestamp': timestamp.isoformat() + 'Z',
            'is_fraud': 1,
            'is_mule': 1 if receiver == mule else 0
        })
        tx_id_counter += 1

    # Ambiguous traffic (5%)
    num_ambiguous = int(num_transactions * 0.05)
    print(f"  - Ambiguous cases: {num_ambiguous} transactions")
    ambiguous_accounts = [f"ACC_AMB_{i:03d}" for i in range(50)]
    for _ in range(num_ambiguous):
        sender = random.choice(ambiguous_accounts)
        receiver = random.choice([a for a in ambiguous_accounts if a != sender])
        amount = round(min(75000, max(1000, np.random.lognormal(mean=np.log(4000), sigma=0.9))), 2)
        timestamp = base_time + timedelta(minutes=random.randint(0, 1440 * 60))
        transactions.append({
            'transaction_id': f'TX_AMB_{tx_id_counter:06d}',
            'sender_id': sender,
            'receiver_id': receiver,
            'amount': amount,
            'timestamp': timestamp.isoformat() + 'Z',
            'is_fraud': 0,
            'is_mule': 0
        })
        tx_id_counter += 1

    for txn in transactions:
        if txn['sender_id'] in fraudulent_accounts or txn['receiver_id'] in fraudulent_accounts:
            txn['is_fraud'] = 1
        txn['is_mule'] = 1 if txn['receiver_id'] in mule_accounts else 0

    df = pd.DataFrame(transactions)
    df = df.sort_values('timestamp').reset_index(drop=True)

    if enable_geo_data:
        print('  - Generating synthetic geo-location data...')
        cities = ["New York", "London", "Dubai", "Singapore", "Hong Kong", "Tokyo", "Sydney", "Frankfurt", "Mumbai", "Toronto"]
        city_coords = {
            "New York": (40.7128, -74.0060),
            "London": (51.5074, -0.1278),
            "Dubai": (25.276987, 55.296249),
            "Singapore": (1.3521, 103.8198),
            "Hong Kong": (22.3193, 114.1694),
            "Tokyo": (35.6895, 139.6917),
            "Sydney": (-33.8688, 151.2093),
            "Frankfurt": (50.1109, 8.6821),
            "Mumbai": (19.0760, 72.8777),
            "Toronto": (43.6532, -79.3832)
        }
        account_locations = {acc: random.choice(cities) for acc in set(df['sender_id']).union(df['receiver_id'])}
        df['sender_city'] = df['sender_id'].map(account_locations)
        df['receiver_city'] = df['receiver_id'].map(account_locations)
        df['sender_lat'] = df['sender_city'].map(lambda x: city_coords[x][0] + random.uniform(-0.5, 0.5))
        df['sender_lon'] = df['sender_city'].map(lambda x: city_coords[x][1] + random.uniform(-0.5, 0.5))
        df['receiver_lat'] = df['receiver_city'].map(lambda x: city_coords[x][0] + random.uniform(-0.5, 0.5))
        df['receiver_lon'] = df['receiver_city'].map(lambda x: city_coords[x][1] + random.uniform(-0.5, 0.5))

    df.to_csv(output_path, index=False)

    print('\n[DATASET] Summary:')
    print(f"  Total transactions: {len(df)}")
    print(f"  Unique accounts: {len(set(df['sender_id']).union(set(df['receiver_id'])))}")
    print(f"  Fraudulent transactions (ground truth): {int(df['is_fraud'].sum())}")
    print(f"  Mule transactions (ground truth): {int(df['is_mule'].sum())}")
    print(f"  Saved to: {output_path}")
    return df


if __name__ == '__main__':
    df = generate_expanded_dataset(num_transactions=1000, enable_geo_data=True)
    print(df.head(10))
