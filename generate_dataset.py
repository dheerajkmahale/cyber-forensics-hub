"""
Generate expanded synthetic transaction dataset with fraud patterns.
Includes: normal traffic, circular rings, layering, aggregator patterns, edge cases.
"""

import pandas as pd
import numpy as np
from datetime import datetime, timedelta
import random

def generate_expanded_dataset(output_path='sample_transactions.csv', num_transactions=500):
    """
    Generate synthetic transaction dataset with realistic fraud patterns.
    
    Patterns:
    1. Normal traffic (60%)
    2. Circular money flows (15%)
    3. Structuring/layering (15%)
    4. Aggregator patterns (5%)
    5. Ambiguous edge cases (5%)
    """
    random.seed(42)
    np.random.seed(42)
    
    transactions = []
    tx_id_counter = 0
    base_time = datetime(2026, 5, 1, 0, 0, 0)
    
    print(f"[DATASET] Generating {num_transactions} synthetic transactions...")
    
    # Pattern 1: Normal traffic (60%)
    print(f"  - Normal traffic: {int(num_transactions * 0.60)} transactions")
    normal_accounts = [f"ACC_NORM_{i:03d}" for i in range(100)]
    num_normal = int(num_transactions * 0.60)
    for _ in range(num_normal):
        sender = random.choice(normal_accounts)
        receiver = random.choice([a for a in normal_accounts if a != sender])
        amount = np.random.normal(loc=500, scale=200)
        amount = max(10, amount)
        timestamp = base_time + timedelta(minutes=random.randint(0, 1440*30))
        transactions.append({
            'transaction_id': f'TX_NORM_{tx_id_counter:05d}',
            'sender_id': sender,
            'receiver_id': receiver,
            'amount': round(amount, 2),
            'timestamp': timestamp.isoformat() + 'Z'
        })
        tx_id_counter += 1
    
    # Pattern 2: Circular money flows (15%)
    print(f"  - Circular rings: {int(num_transactions * 0.15)} transactions")
    num_cycles = 5
    cycle_accounts = [f"ACC_CYC_{i:02d}" for i in range(num_cycles * 4)]
    num_cycle_txns = int(num_transactions * 0.15)
    txns_per_cycle = num_cycle_txns // num_cycles
    
    for cycle_idx in range(num_cycles):
        cycle_chain = cycle_accounts[cycle_idx*4:(cycle_idx+1)*4]
        # Create 2-3 rotations of each cycle
        for rotation in range(2 + random.randint(0, 1)):
            for j in range(len(cycle_chain)):
                sender = cycle_chain[j]
                receiver = cycle_chain[(j + 1) % len(cycle_chain)]
                amount = 10000 + random.uniform(-2000, 2000)
                timestamp = base_time + timedelta(minutes=random.randint(0, 1440*30))
                transactions.append({
                    'transaction_id': f'TX_CYC_{tx_id_counter:05d}',
                    'sender_id': sender,
                    'receiver_id': receiver,
                    'amount': round(amount, 2),
                    'timestamp': timestamp.isoformat() + 'Z'
                })
                tx_id_counter += 1
    
    # Pattern 3: Structuring/Layering (15%)
    print(f"  - Structuring chains: {int(num_transactions * 0.15)} transactions")
    num_chains = 8
    num_layering_txns = int(num_transactions * 0.15)
    txns_per_chain = num_layering_txns // num_chains
    
    for chain_idx in range(num_chains):
        chain_length = 3 + random.randint(0, 2)
        chain = [f"ACC_LAYER_{chain_idx:02d}_{i:02d}" for i in range(chain_length)]
        initial_amount = 50000 + random.uniform(-10000, 10000)
        
        for j in range(len(chain) - 1):
            sender = chain[j]
            receiver = chain[j + 1]
            # Slight decay per hop (realistic AML pattern)
            amount = initial_amount * (0.95 ** (j + 1))
            amount = max(1000, amount)
            timestamp = base_time + timedelta(minutes=random.randint(0, 1440*30))
            transactions.append({
                'transaction_id': f'TX_LAYER_{tx_id_counter:05d}',
                'sender_id': sender,
                'receiver_id': receiver,
                'amount': round(amount, 2),
                'timestamp': timestamp.isoformat() + 'Z'
            })
            tx_id_counter += 1
    
    # Pattern 4: Aggregator/mule patterns (5%)
    print(f"  - Aggregator mules: {int(num_transactions * 0.05)} transactions")
    mule_account = "ACC_MULE_001"
    source_accounts = [f"ACC_MULE_SRC_{i:02d}" for i in range(15)]
    num_mule_txns = int(num_transactions * 0.05)
    
    # Many small incoming to mule
    num_incoming = int(num_mule_txns * 0.7)
    for _ in range(num_incoming):
        sender = random.choice(source_accounts)
        receiver = mule_account
        amount = np.random.uniform(500, 2000)
        timestamp = base_time + timedelta(minutes=random.randint(0, 1440*30))
        transactions.append({
            'transaction_id': f'TX_MULE_{tx_id_counter:05d}',
            'sender_id': sender,
            'receiver_id': receiver,
            'amount': round(amount, 2),
            'timestamp': timestamp.isoformat() + 'Z'
        })
        tx_id_counter += 1
    
    # Few large outgoing from mule
    outbound_accts = [f"ACC_MULE_OUT_{i:02d}" for i in range(3)]
    num_outgoing = int(num_mule_txns * 0.3)
    for _ in range(num_outgoing):
        sender = mule_account
        receiver = random.choice(outbound_accts)
        # Bulk amounts
        amount = np.random.uniform(5000, 15000)
        timestamp = base_time + timedelta(minutes=random.randint(0, 1440*30))
        transactions.append({
            'transaction_id': f'TX_MULE_{tx_id_counter:05d}',
            'sender_id': sender,
            'receiver_id': receiver,
            'amount': round(amount, 2),
            'timestamp': timestamp.isoformat() + 'Z'
        })
        tx_id_counter += 1
    
    # Pattern 5: Ambiguous edge cases (5%)
    print(f"  - Ambiguous cases: {int(num_transactions * 0.05)} transactions")
    num_ambiguous = int(num_transactions * 0.05)
    ambig_accounts = [f"ACC_AMB_{i:03d}" for i in range(30)]
    
    for _ in range(num_ambiguous):
        sender = random.choice(ambig_accounts)
        receiver = random.choice([a for a in ambig_accounts if a != sender])
        # Medium amounts - could be legitimate or suspicious
        amount = np.random.lognormal(mean=np.log(3000), sigma=0.8)
        amount = min(50000, max(500, amount))
        timestamp = base_time + timedelta(minutes=random.randint(0, 1440*30))
        transactions.append({
            'transaction_id': f'TX_AMB_{tx_id_counter:05d}',
            'sender_id': sender,
            'receiver_id': receiver,
            'amount': round(amount, 2),
            'timestamp': timestamp.isoformat() + 'Z'
        })
        tx_id_counter += 1
    
    # Create DataFrame
    df = pd.DataFrame(transactions)
    df = df.sort_values('timestamp').reset_index(drop=True)
    
    # Save to CSV
    df.to_csv(output_path, index=False)
    
    # Print summary
    print(f"\n[DATASET] Summary:")
    print(f"  Total transactions: {len(df)}")
    print(f"  Unique accounts: {len(set(df['sender_id']).union(set(df['receiver_id'])))}")
    print(f"  Date range: {df['timestamp'].min()} to {df['timestamp'].max()}")
    print(f"  Total volume: ${df['amount'].sum():,.2f}")
    print(f"  Amount stats: min=${df['amount'].min():.2f}, max=${df['amount'].max():.2f}, mean=${df['amount'].mean():.2f}")
    print(f"  Saved to: {output_path}")
    
    return df

if __name__ == "__main__":
    df = generate_expanded_dataset(num_transactions=500)
    print(df.head(10))
