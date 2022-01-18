import pandas as pd

df = pd.read_csv("student_data.csv")
print(df["semester"].unique())
