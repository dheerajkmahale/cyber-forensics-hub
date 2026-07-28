"""
ML Risk Scoring Model Helper
Integrates with analyze.py's compute_graph_features and training logic
"""

import pandas as pd
import numpy as np
import networkx as nx
from sklearn.ensemble import RandomForestClassifier
from sklearn.metrics import confusion_matrix, precision_score, recall_score, f1_score
import joblib
import os

def load_and_prepare_model(df, G, fan_in_threshold=5, model_path='risk_model.pkl'):
    """
    Load cached model or train new one.
    Returns: model, features_df, metrics_dict
    """
    # Import functions from analyze.py
    from analyze import (
        compute_graph_features,
        detect_cycles_and_mules,
        train_risk_model,
        predict_risk_scores
    )
    
    # Load or train
    if os.path.exists(model_path):
        model = joblib.load(model_path)
        features_df, _ = compute_graph_features(df, G)
    else:
        model, features_df, y_true = train_risk_model(
            df, G, fan_in_threshold, model_path
        )
    
    # Get predictions and metrics
    risk_df = predict_risk_scores(model, features_df)
    
    # Calculate metrics for display
    y_pred = (risk_df['risk_score'] >= 0.5).astype(int)
    y_true = pd.Series(
        [1 if acc in detect_cycles_and_mules(df, G, fan_in_threshold) else 0 
         for acc in risk_df.index],
        index=risk_df.index
    )
    
    cm = confusion_matrix(y_true, y_pred)
    precision = precision_score(y_true, y_pred, zero_division=0)
    recall = recall_score(y_true, y_pred, zero_division=0)
    f1 = f1_score(y_true, y_pred, zero_division=0)
    
    metrics = {
        'confusion_matrix': cm,
        'precision': precision,
        'recall': recall,
        'f1': f1,
        'accuracy': (y_pred == y_true).mean(),
        'total_accounts': len(risk_df),
        'flagged_count': (y_true == 1).sum(),
        'feature_importance': model.feature_importances_,
        'feature_names': features_df.columns.tolist()
    }
    
    return model, risk_df, metrics, y_true

def get_account_risk_breakdown(account_id, features_df, model, feature_importance):
    """Get risk score breakdown by feature for a specific account."""
    if account_id not in features_df.index:
        return None
    
    account_features = features_df.loc[account_id]
    breakdown = pd.DataFrame({
        'feature': features_df.columns,
        'value': account_features.values,
        'importance': feature_importance,
        'contribution': account_features.values * feature_importance
    }).sort_values('contribution', ascending=False)
    
    return breakdown
