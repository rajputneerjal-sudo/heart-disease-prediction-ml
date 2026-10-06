"""
Heart Disease Prediction Model Training Script
==============================================
Trains multiple ML models on the Cleveland Heart Disease dataset,
compares performance, and saves the best model.

Models trained:
- Logistic Regression
- Random Forest
- Decision Tree
- Support Vector Machine (SVM)

Usage: python train_model.py
"""
import os
import sys
import numpy as np
import pandas as pd
import matplotlib
matplotlib.use('Agg')  # Non-interactive backend
import matplotlib.pyplot as plt
import joblib
import json
from sklearn.model_selection import train_test_split, cross_val_score, GridSearchCV
from sklearn.preprocessing import StandardScaler
from sklearn.linear_model import LogisticRegression
from sklearn.ensemble import RandomForestClassifier
from sklearn.tree import DecisionTreeClassifier
from sklearn.svm import SVC
from sklearn.metrics import (
    accuracy_score, precision_score, recall_score, f1_score,
    roc_auc_score, confusion_matrix, classification_report
)
from sklearn.pipeline import Pipeline
import warnings
warnings.filterwarnings('ignore')

# Paths
SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
DATA_DIR = os.path.join(SCRIPT_DIR, 'data')
MODELS_DIR = os.path.join(SCRIPT_DIR, 'saved_models')
PLOTS_DIR = os.path.join(SCRIPT_DIR, 'plots')

os.makedirs(DATA_DIR, exist_ok=True)
os.makedirs(MODELS_DIR, exist_ok=True)
os.makedirs(PLOTS_DIR, exist_ok=True)


def generate_synthetic_dataset(n_samples=1000, random_state=42):
    """
    Generate a synthetic heart disease dataset based on Cleveland dataset statistics.
    Used when the actual dataset is not available.
    """
    np.random.seed(random_state)
    n = n_samples

    # Generate features based on real Cleveland dataset distributions
    age = np.random.normal(54, 9, n).clip(29, 77).astype(int)
    sex = np.random.binomial(1, 0.68, n)  # 68% male
    cp = np.random.choice([0, 1, 2, 3], n, p=[0.47, 0.17, 0.28, 0.08])
    trestbps = np.random.normal(131, 17, n).clip(94, 200).astype(int)
    chol = np.random.normal(246, 51, n).clip(126, 564).astype(int)
    fbs = np.random.binomial(1, 0.15, n)
    restecg = np.random.choice([0, 1, 2], n, p=[0.48, 0.49, 0.03])
    thalach = np.random.normal(149, 22, n).clip(71, 202).astype(int)
    exang = np.random.binomial(1, 0.33, n)
    oldpeak = np.random.exponential(1.0, n).clip(0, 6.2).round(1)
    slope = np.random.choice([0, 1, 2], n, p=[0.21, 0.46, 0.33])
    ca = np.random.choice([0, 1, 2, 3], n, p=[0.59, 0.22, 0.12, 0.07])
    thal = np.random.choice([0, 1, 2, 3], n, p=[0.05, 0.18, 0.55, 0.22])

    # Create feature matrix
    X = np.column_stack([age, sex, cp, trestbps, chol, fbs, restecg,
                         thalach, exang, oldpeak, slope, ca, thal])

    # Generate target based on risk factors (realistic correlation)
    risk_score = (
        0.03 * (age - 50) +
        0.3 * sex +
        0.4 * (cp == 0).astype(int) +
        0.002 * (trestbps - 120) +
        0.001 * (chol - 200) +
        0.2 * fbs +
        0.15 * (restecg > 0).astype(int) -
        0.01 * (thalach - 150) +
        0.5 * exang +
        0.2 * oldpeak +
        0.2 * (slope == 2).astype(int) +
        0.4 * ca +
        0.3 * (thal == 2).astype(int) +
        np.random.normal(0, 0.3, n)
    )

    # Convert to binary with ~54% positive rate (matching Cleveland dataset)
    threshold = np.percentile(risk_score, 46)
    y = (risk_score > threshold).astype(int)

    feature_names = ['age', 'sex', 'cp', 'trestbps', 'chol', 'fbs', 'restecg',
                     'thalach', 'exang', 'oldpeak', 'slope', 'ca', 'thal']

    df = pd.DataFrame(X, columns=feature_names)
    df['target'] = y
    return df


def load_dataset():
    """Load the heart disease dataset."""
    # Try to load Cleveland dataset
    cleveland_path = os.path.join(DATA_DIR, 'heart.csv')
    if os.path.exists(cleveland_path):
        print(f"Loading dataset from {cleveland_path}")
        df = pd.read_csv(cleveland_path)
        # Standardize column names
        if 'target' not in df.columns and 'num' in df.columns:
            df['target'] = (df['num'] > 0).astype(int)
        return df
    else:
        print("Dataset not found. Generating synthetic dataset...")
        df = generate_synthetic_dataset(n_samples=1000)
        df.to_csv(cleveland_path, index=False)
        print(f"Synthetic dataset saved to {cleveland_path}")
        return df


def train_and_evaluate():
    """Main training pipeline."""
    print("=" * 60)
    print("CardioAI - Heart Disease Prediction Model Training")
    print("=" * 60)

    # Load data
    df = load_dataset()
    print(f"\nDataset shape: {df.shape}")
    print(f"Target distribution:\n{df['target'].value_counts()}")
    print(f"Disease prevalence: {df['target'].mean():.1%}")

    # Features (14 clinical features from Cleveland dataset)
    feature_cols = ['age', 'sex', 'cp', 'trestbps', 'chol', 'fbs', 'restecg',
                    'thalach', 'exang', 'oldpeak', 'slope', 'ca', 'thal']

    # Ensure all required columns exist
    available_features = [f for f in feature_cols if f in df.columns]
    X = df[available_features].values
    y = df['target'].values

    print(f"\nFeatures used: {available_features}")
    print(f"Feature matrix shape: {X.shape}")

    # Handle missing values
    X = np.nan_to_num(X, nan=np.nanmean(X, axis=0))

    # Train/test split (80/20)
    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.2, random_state=42, stratify=y
    )
    print(f"\nTrain size: {len(X_train)}, Test size: {len(X_test)}")

    # Feature scaling
    scaler = StandardScaler()
    X_train_scaled = scaler.fit_transform(X_train)
    X_test_scaled = scaler.transform(X_test)

    # Define models
    models = {
        "Logistic Regression": LogisticRegression(
            max_iter=1000, random_state=42, C=1.0
        ),
        "Random Forest": RandomForestClassifier(
            n_estimators=200, max_depth=10, min_samples_split=5,
            random_state=42, n_jobs=-1
        ),
        "Decision Tree": DecisionTreeClassifier(
            max_depth=8, min_samples_split=5, random_state=42
        ),
        "SVM": SVC(
            kernel='rbf', C=1.0, gamma='scale',
            probability=True, random_state=42
        ),
    }

    results = {}
    trained_models = {}

    print("\n" + "=" * 60)
    print("Training and Evaluating Models")
    print("=" * 60)

    for name, model in models.items():
        print(f"\n[{name}]")

        # Train
        model.fit(X_train_scaled, y_train)
        trained_models[name] = model

        # Predict
        y_pred = model.predict(X_test_scaled)
        y_prob = model.predict_proba(X_test_scaled)[:, 1]

        # Metrics
        acc = accuracy_score(y_test, y_pred)
        prec = precision_score(y_test, y_pred, zero_division=0)
        rec = recall_score(y_test, y_pred, zero_division=0)
        f1 = f1_score(y_test, y_pred, zero_division=0)
        auc = roc_auc_score(y_test, y_prob)

        # Cross-validation
        cv_scores = cross_val_score(model, X_train_scaled, y_train, cv=5, scoring='accuracy')

        results[name] = {
            "accuracy": acc,
            "precision": prec,
            "recall": rec,
            "f1_score": f1,
            "roc_auc": auc,
            "cv_mean": cv_scores.mean(),
            "cv_std": cv_scores.std(),
        }

        print(f"  Accuracy:  {acc:.4f}")
        print(f"  Precision: {prec:.4f}")
        print(f"  Recall:    {rec:.4f}")
        print(f"  F1 Score:  {f1:.4f}")
        print(f"  ROC-AUC:   {auc:.4f}")
        print(f"  CV Score:  {cv_scores.mean():.4f} ± {cv_scores.std():.4f}")

    # Select best model (by F1 score)
    best_model_name = max(results, key=lambda k: results[k]['f1_score'])
    best_model = trained_models[best_model_name]
    best_metrics = results[best_model_name]

    print("\n" + "=" * 60)
    print(f"Best Model: {best_model_name}")
    print(f"F1 Score: {best_metrics['f1_score']:.4f}")
    print(f"Accuracy: {best_metrics['accuracy']:.4f}")
    print("=" * 60)

    # Feature importance
    feature_importance = []
    if hasattr(best_model, 'feature_importances_'):
        importances = best_model.feature_importances_
        feature_importance = [
            {"feature": available_features[i], "importance": float(importances[i])}
            for i in np.argsort(importances)[::-1]
        ]
    elif hasattr(best_model, 'coef_'):
        coefs = np.abs(best_model.coef_[0])
        coefs_normalized = coefs / coefs.sum()
        feature_importance = [
            {"feature": available_features[i], "importance": float(coefs_normalized[i])}
            for i in np.argsort(coefs_normalized)[::-1]
        ]
    else:
        # Default feature importance for SVM
        feature_importance = [
            {"feature": f, "importance": 1.0 / len(available_features)}
            for f in available_features
        ]

    # Human-readable feature names
    feature_name_map = {
        'age': 'Age', 'sex': 'Gender', 'cp': 'Chest Pain Type',
        'trestbps': 'Blood Pressure', 'chol': 'Cholesterol',
        'fbs': 'Fasting Blood Sugar', 'restecg': 'Resting ECG',
        'thalach': 'Max Heart Rate', 'exang': 'Exercise Angina',
        'oldpeak': 'ST Depression', 'slope': 'ST Slope',
        'ca': 'Major Vessels', 'thal': 'Thalassemia',
    }
    for item in feature_importance:
        item['feature'] = feature_name_map.get(item['feature'], item['feature'])

    # Save models
    print("\nSaving models...")
    joblib.dump(best_model, os.path.join(MODELS_DIR, 'best_model.pkl'))
    joblib.dump(scaler, os.path.join(MODELS_DIR, 'scaler.pkl'))

    # Save all models
    for name, model in trained_models.items():
        safe_name = name.lower().replace(' ', '_')
        joblib.dump(model, os.path.join(MODELS_DIR, f'{safe_name}.pkl'))

    # Save metadata
    metadata = {
        "best_model": best_model_name,
        "metrics": results,
        "feature_importance": feature_importance,
        "features": available_features,
        "training_samples": len(X_train),
        "test_samples": len(X_test),
        "best_accuracy": best_metrics['accuracy'],
        "best_f1": best_metrics['f1_score'],
    }
    with open(os.path.join(MODELS_DIR, 'model_metadata.json'), 'w') as f:
        json.dump(metadata, f, indent=2)

    print(f"Models saved to {MODELS_DIR}")

    # Generate comparison plot
    generate_comparison_plot(results)

    print("\n✅ Training complete!")
    print(f"Best model: {best_model_name} (F1: {best_metrics['f1_score']:.4f})")
    return metadata


def generate_comparison_plot(results):
    """Generate model comparison bar chart."""
    try:
        models = list(results.keys())
        metrics = ['accuracy', 'precision', 'recall', 'f1_score']
        metric_labels = ['Accuracy', 'Precision', 'Recall', 'F1 Score']

        x = np.arange(len(models))
        width = 0.2
        colors = ['#2563EB', '#22c55e', '#f59e0b', '#ef4444']

        fig, ax = plt.subplots(figsize=(12, 6))
        for i, (metric, label, color) in enumerate(zip(metrics, metric_labels, colors)):
            values = [results[m][metric] for m in models]
            bars = ax.bar(x + i * width, values, width, label=label, color=color, alpha=0.85)
            for bar, val in zip(bars, values):
                ax.text(bar.get_x() + bar.get_width() / 2, bar.get_height() + 0.005,
                        f'{val:.3f}', ha='center', va='bottom', fontsize=8)

        ax.set_xlabel('Models', fontsize=12)
        ax.set_ylabel('Score', fontsize=12)
        ax.set_title('Heart Disease Prediction - Model Comparison', fontsize=14, fontweight='bold')
        ax.set_xticks(x + width * 1.5)
        ax.set_xticklabels(models, rotation=15, ha='right')
        ax.set_ylim(0, 1.1)
        ax.legend(loc='upper right')
        ax.grid(axis='y', alpha=0.3)
        plt.tight_layout()
        plt.savefig(os.path.join(PLOTS_DIR, 'model_comparison.png'), dpi=150, bbox_inches='tight')
        plt.close()
        print(f"Comparison plot saved to {PLOTS_DIR}/model_comparison.png")
    except Exception as e:
        print(f"Could not generate plot: {e}")


if __name__ == "__main__":
    metadata = train_and_evaluate()
    print("\nModel Comparison Summary:")
    print("-" * 50)
    for model_name, metrics in metadata['metrics'].items():
        print(f"{model_name:25s} | Acc: {metrics['accuracy']:.3f} | F1: {metrics['f1_score']:.3f}")
