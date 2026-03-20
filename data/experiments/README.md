Data science experiments for the blitz-tracker CSV

- You can run a quick exploratory data analysis (EDA) over the CSV at
  data/results_2-16-2026.csv.
- The script will generate a JSON report at data/experiments/eda_results.json.
- Prerequisites: Python 3.x with pandas and scikit-learn installed.

Usage:
- Install dependencies: pip install pandas scikit-learn
- Run: python3 data/experiments/eda_results.py

What you’ll get:
- Basic stats and missing values per numeric column
- Composite score and normalized composite score
- Launch distribution by month
- Column correlations among numeric scores
- Simple clustering of items by score features
- Top items by composite score

Next steps (optional):
- Extend with more experiments (topic modeling on tagline/description, text length vs. scores, etc.).
- Save richer outputs (CSV) for downstream dashboards.
