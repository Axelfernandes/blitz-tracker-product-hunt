#!/usr/bin/env python3
"""Data science experiments on blitz-tracker CSV data.

Loads the CSV in data/results_2-16-2026.csv and computes a set of quick
exploratory analyses:
- basic stats and missing values
- composite score exploration and ranking
- text length features for tagline/description
- launch date time distribution
- correlations between numeric score columns
- simple clustering on score features
- saves a JSON report to data/experiments/eda_results.json
"""

import os
import json
import math
import pandas as pd
from sklearn.preprocessing import StandardScaler
from sklearn.cluster import KMeans


def load_df(path: str) -> pd.DataFrame:
    return pd.read_csv(path)


def main(data_csv_path: str = "data/results_2-16-2026.csv",
         out_dir: str = "data/experiments") -> None:
    df = load_df(data_csv_path)

    # Ensure numeric columns are proper dtypes
    numeric_cols = [
        "upvotes",
        "score",
        "speedScore",
        "marketScore",
        "pmfScore",
        "networkScore",
        "growthScore",
        "uncertaintyScore",
    ]
    for c in numeric_cols:
        if c in df.columns:
            df[c] = pd.to_numeric(df[c], errors="coerce")

    # Composite score as a simple average of component scores
    comp_cols = [
        "speedScore",
        "marketScore",
        "pmfScore",
        "networkScore",
        "growthScore",
        "uncertaintyScore",
    ]
    df["composite_score"] = df[comp_cols].mean(axis=1)

    # Normalize composite score for easy comparison
    tmin = df["composite_score"].min()
    tmax = df["composite_score"].max()
    if pd.notnull(tmin) and pd.notnull(tmax) and tmax > tmin:
        df["composite_score_norm"] = (df["composite_score"] - tmin) / (tmax - tmin)
    else:
        df["composite_score_norm"] = 0.0

    # Text features
    df["tagline_len"] = df["tagline"].fillna("").astype(str).str.len()
    df["description_len"] = df["description"].fillna("").astype(str).str.len()

    # Launch date processing
    if "launchDate" in df.columns:
        df["launchDate"] = pd.to_datetime(df["launchDate"], errors="coerce")
        df["launchYearMonth"] = df["launchDate"].dt.to_period("M").astype(str)
        launches_by_month = df["launchYearMonth"].value_counts().sort_index()
    else:
        df["launchYearMonth"] = pd.NA
        launches_by_month = pd.Series(dtype="int64")

    # Correlations among numeric score components
    if set(numeric_cols).issubset(set(df.columns)):
        corr = df[numeric_cols].corr()
    else:
       corr = pd.DataFrame()

    # Simple clustering on score features
    features = df[comp_cols].copy()
    if features.isnull().any().any():
        features = features.fillna(features.mean())
    scaler = StandardScaler()
    X = scaler.fit_transform(features)
    clusters = None
    labels = None
    if X.size:
        kmeans = KMeans(n_clusters=3, random_state=42, n_init=10)
        labels = kmeans.fit_predict(X)
        df["cluster"] = labels
        clusters = {
            "n_clusters": 3,
            "sample": df[["id", "name", "cluster"]].head(5).to_dict("records"),
        }

    # Top items by composite score
    top_by_composite = df.sort_values("composite_score", ascending=False).head(10)[[
        "id",
        "name",
        "composite_score",
        "composite_score_norm",
    ]].to_dict("records")

    # Basic stats
    stats = df[numeric_cols].describe().to_dict()

    # Assemble report
    report = {
        "n_items": int(len(df)),
        "launches_by_month": launches_by_month.to_dict(),
        "text_features": {
            "tagline_mean_len": float(df["tagline_len"].mean()),
            "description_mean_len": float(df["description_len"].mean()),
        },
        "composite": {
            "score_min": float(df["composite_score"].min()),
            "score_max": float(df["composite_score"].max()),
            "score_mean": float(df["composite_score"].mean()),
        },
        "composite_norm": df[["id", "name", "composite_score", "composite_score_norm"]].head(5).to_dict("records"),
        "correlations": corr.to_dict() if not corr.empty else {},
        "clusters": clusters if clusters else {"n_clusters": 0},
        "top_by_composite": top_by_composite,
        "stats": stats,
    }

    # Write report
    os.makedirs(out_dir, exist_ok=True)
    out_path = os.path.join(out_dir, "eda_results.json")
    with open(out_path, "w", encoding="utf-8") as f:
        json.dump(report, f, indent=2, ensure_ascii=False)

    print(f"EDA results written to {out_path}")


if __name__ == "__main__":
    main()
