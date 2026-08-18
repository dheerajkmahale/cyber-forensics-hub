"""
Generate expanded synthetic transaction dataset with fraud patterns.
Includes: normal traffic, circular rings, layering, aggregator patterns, and edge cases.
Can generate customized datasets based on specific threat scenarios.
"""

import pandas as pd
import numpy as np
from datetime import datetime, timedelta
import random


def generate_expanded_dataset(output_path='sample_transactions.csv', num_transactions=1000, enable_geo_data=True, scenario='All'):
    random.seed(42)
    np.random.seed(42)

    transactions = []
    fraudulent_accounts = set()
    mule_accounts = set()
    tx_id_counter = 0
    base_time = datetime(2026, 5, 1, 0, 0, 0)

    print(f"[DATASET] Generating {num_transactions} synthetic transactions for scenario: {scenario}...")

    # Determine portions based on scenario
    if scenario == 'Normal':
        p_normal = 0.95
        p_cycle = 0.0
        p_layer = 0.0
        p_mule = 0.0
        p_ambiguous = 0.05
    elif scenario == 'Fraud Ring':
        p_normal = 0.40
        p_cycle = 0.50
        p_layer = 0.0
        p_mule = 0.0
        p_ambiguous = 0.10
    elif scenario == 'Smurfing':
        p_normal = 0.40
        p_cycle = 0.0
        p_layer = 0.0
        p_mule = 0.50
        p_ambiguous = 0.10
    elif scenario == 'Shell Chain':
        p_normal = 0.40
        p_cycle = 0.0
        p_layer = 0.50
        p_mule = 0.0
        p_ambiguous = 0.10
    elif scenario == 'Layered':
        p_normal = 0.30
        p_cycle = 0.20
        p_layer = 0.30
        p_mule = 0.10
        p_ambiguous = 0.10
    elif scenario == 'Velocity':
        p_normal = 0.50
        p_cycle = 0.10
        p_layer = 0.10
        p_mule = 0.10
        p_ambiguous = 0.20
    elif scenario == 'Insider':
        p_normal = 0.80
        p_cycle = 0.0
        p_layer = 0.0
        p_mule = 0.10
        p_ambiguous = 0.10
    elif scenario == 'Dark Web':
        p_normal = 0.50
        p_cycle = 0.15
        p_layer = 0.15
        p_mule = 0.10
        p_ambiguous = 0.10
    else: # 'All'
        p_normal = 0.60
        p_cycle = 0.15
        p_layer = 0.15
        p_mule = 0.05
        p_ambiguous = 0.05

    # 1. Normal traffic
    num_normal = int(num_transactions * p_normal)
    normal_accounts = [f"ACC_NORM_{i:03d}" for i in range(150)]
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

    # 2. Circular money flows (Cycles)
    num_cycle_txns = int(num_transactions * p_cycle)
    if num_cycle_txns > 0:
        print(f"  - Circular rings: {num_cycle_txns} transactions")
        num_cycles = max(1, num_cycle_txns // 15)
        cycle_accounts = [f"ACC_CYC_{i:02d}" for i in range(num_cycles * 3)]
        for cycle_idx in range(num_cycles):
            cycle_nodes = cycle_accounts[cycle_idx * 3:(cycle_idx + 1) * 3]
            fraudulent_accounts.update(cycle_nodes)
            rotations = max(1, num_cycle_txns // (num_cycles * 3))
            for _ in range(rotations):
                for j in range(len(cycle_nodes)):
                    sender = cycle_nodes[j]
                    receiver = cycle_nodes[(j + 1) % len(cycle_nodes)]
                    # Under Dark Web scenario, make transaction amounts highly round
                    if scenario == 'Dark Web':
                        amount = round(random.choice([5000, 10000, 15000, 20000, 25000]), 2)
                    else:
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

    # 3. Structuring / layering (Chains)
    num_layer_txns = int(num_transactions * p_layer)
    if num_layer_txns > 0:
        print(f"  - Structuring chains: {num_layer_txns} transactions")
        num_chains = max(1, num_layer_txns // 10)
        for chain_idx in range(num_chains):
            chain_length = 8
            chain = [f"ACC_LAYER_{chain_idx:03d}_{i:02d}" for i in range(chain_length)]
            fraudulent_accounts.update(chain)
            initial_amount = 60000 + random.uniform(-15000, 15000)
            txns_in_chain = max(1, num_layer_txns // num_chains)
            for j in range(min(txns_in_chain, chain_length - 1)):
                sender = chain[j]
                receiver = chain[j + 1]
                # Under Dark Web scenario, make transaction amounts highly round
                if scenario == 'Dark Web':
                    amount = round(random.choice([2000, 5000, 10000, 20000]), 2)
                else:
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

    # 4. Aggregator / mule patterns
    num_mule_txns = int(num_transactions * p_mule)
    if num_mule_txns > 0:
        print(f"  - Aggregator mules: {num_mule_txns} transactions")
        num_mules = max(1, num_mule_txns // 15)
        mule_accounts_list = [f"ACC_MULE_{i:03d}" for i in range(num_mules)]
        mule_accounts.update(mule_accounts_list)
        fraudulent_accounts.update(mule_accounts_list)
        source_accounts = [f"ACC_MULE_SRC_{i:03d}" for i in range(20)]
        for _ in range(num_mule_txns):
            mule = random.choice(mule_accounts_list)
            # 70% incoming to mule (smurfing/aggregation)
            if random.random() < 0.7:
                sender = random.choice(source_accounts)
                receiver = mule
                amount = round(np.random.uniform(500, 3000), 2)
            else:
                sender = mule
                receiver = f"ACC_MULE_OUT_{random.randint(0, 10):03d}"
                amount = round(np.random.uniform(8000, 20000), 2)
                fraudulent_accounts.add(receiver)
            
            # If Velocity scenario, cluster timestamps extremely closely
            if scenario == 'Velocity':
                timestamp = base_time + timedelta(minutes=random.randint(0, 30))
            else:
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

    # 5. Ambiguous / Suspicious cases (Insider, Velocity etc.)
    num_ambiguous = int(num_transactions * p_ambiguous)
    if num_ambiguous > 0:
        print(f"  - Ambiguous/Special cases: {num_ambiguous} transactions")
        ambiguous_accounts = [f"ACC_AMB_{i:03d}" for i in range(30)]
        for _ in range(num_ambiguous):
            sender = random.choice(ambiguous_accounts)
            receiver = random.choice([a for a in ambiguous_accounts if a != sender])
            
            if scenario == 'Insider':
                # Insider threat involves high-value transfers at off hours
                amount = round(random.uniform(150000, 250000), 2)
                timestamp = base_time + timedelta(hours=random.choice([1, 2, 3, 4]))
                is_fraud_label = 1
                fraudulent_accounts.add(sender)
                fraudulent_accounts.add(receiver)
            elif scenario == 'Velocity':
                # Rapid back-and-forth high-frequency
                amount = round(random.uniform(100, 2000), 2)
                timestamp = base_time + timedelta(minutes=random.randint(0, 15))
                is_fraud_label = 1
                fraudulent_accounts.add(sender)
                fraudulent_accounts.add(receiver)
            else:
                amount = round(min(75000, max(1000, np.random.lognormal(mean=np.log(4000), sigma=0.9))), 2)
                timestamp = base_time + timedelta(minutes=random.randint(0, 1440 * 60))
                is_fraud_label = 0

            transactions.append({
                'transaction_id': f'TX_AMB_{tx_id_counter:06d}',
                'sender_id': sender,
                'receiver_id': receiver,
                'amount': amount,
                'timestamp': timestamp.isoformat() + 'Z',
                'is_fraud': is_fraud_label,
                'is_mule': 0
            })
            tx_id_counter += 1

    # Apply ground truth labels correctly
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
    df = generate_expanded_dataset(num_transactions=1000, enable_geo_data=True, scenario='All')
    print(df.head(10))
