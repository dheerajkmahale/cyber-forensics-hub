import pandas as pd
import time

def evaluate(csv_path='sample_transactions.csv', fan_in_threshold=5):
    start_time = time.time()
    df = pd.read_csv(csv_path)

    # Mule detection based on transaction count (high fan-in)
    # Count unique incoming transactions per receiver
    mules_by_count = df.groupby('receiver_id').size()
    mules = set(mules_by_count[mules_by_count >= fan_in_threshold].index)

    flagged_accounts = mules

    ground_truth_accounts = set(df.loc[df['is_fraud'] == 1, 'sender_id']).union(
        set(df.loc[df['is_fraud'] == 1, 'receiver_id'])
    )

    tp = len(flagged_accounts & ground_truth_accounts)
    fp = len(flagged_accounts - ground_truth_accounts)
    fn = len(ground_truth_accounts - flagged_accounts)

    precision = tp / (tp + fp) if (tp + fp) > 0 else 0.0
    recall = tp / (tp + fn) if (tp + fn) > 0 else 0.0

    elapsed = time.time() - start_time
    print(f"[EVALUATE] Time elapsed: {elapsed:.2f}s")
    print(f"[EVALUATE] Total ground truth fraudulent accounts: {len(ground_truth_accounts)}")
    print(f"[EVALUATE] Total flagged accounts: {len(flagged_accounts)} (mules={len(mules)})")
    print(f"[EVALUATE] TP={tp} FP={fp} FN={fn}")
    print(f"[EVALUATE] Precision: {precision:.4f}")
    print(f"[EVALUATE] Recall: {recall:.4f}")
    return precision, recall


if __name__ == '__main__':
    evaluate()
