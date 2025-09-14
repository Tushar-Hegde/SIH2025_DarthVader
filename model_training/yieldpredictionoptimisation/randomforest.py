import pandas as pd
import numpy as np
import matplotlib.pyplot as plt
from sklearn.model_selection import train_test_split
from sklearn.ensemble import RandomForestRegressor
from sklearn.metrics import mean_squared_error, r2_score
from sklearn.inspection import PartialDependenceDisplay
import shap

data = pd.read_csv("agri_data.csv")

X = data.drop(columns=["yield", "location"])
y = data["yield"]

X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)

rf = RandomForestRegressor(
    n_estimators=300, 
    max_depth=None,
    random_state=42,
    n_jobs=-1
)
rf.fit(X_train, y_train)

y_pred = rf.predict(X_test)
print("RMSE:", mean_squared_error(y_test, y_pred, squared=False))
print("R^2 :", r2_score(y_test, y_pred))

importances = rf.feature_importances_
indices = np.argsort(importances)[::-1]

plt.figure(figsize=(8,5))
plt.bar(range(len(importances)), importances[indices], align="center")
plt.xticks(range(len(importances)), X.columns[indices], rotation=45)
plt.title("Feature Importance (MDI)")
plt.show()

top_features = [X.columns[i] for i in indices[:3]]

fig, ax = plt.subplots(figsize=(10, 6))
PartialDependenceDisplay.from_estimator(rf, X_train, top_features, ax=ax)
plt.show()

explainer = shap.TreeExplainer(rf)
shap_values = explainer.shap_values(X_test)

shap.summary_plot(shap_values, X_test, feature_names=X.columns)

print("Explaining farmer/sample index:", i)
shap.force_plot(explainer.expected_value, shap_values[i], X_test.iloc[i], matplotlib=True)

def generate_recommendation(model, explainer, X_row, feature_names, pdp_dict):
    shap_values = explainer.shap_values(X_row)
    
    recs = []
    for i, feat in enumerate(feature_names):
        contrib = shap_values[i]
        value = X_row[feat]
        
        if contrib < 0 and feat in pdp_dict:
            low, high = pdp_dict[feat]
            if value < low:
                recs.append(f"Increase {feat} (currently {value}) towards {low}-{high}.")
            elif value > high:
                recs.append(f"Reduce {feat} (currently {value}) towards {low}-{high}.")
    
    if not recs:
        recs.append("Your field conditions are already close to optimal for high yield.")
    
    return recs



