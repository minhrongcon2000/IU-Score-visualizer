import streamlit as st
import pandas as pd
import plotly.express as px


def build_general_info(df, container):
    gpa = df["TK(10)"].mean()
    total_credit = df["TC"].sum()
    speed = df[["TC", "semester"]].groupby("semester").agg("sum").mean().values[0]
    general_info_json = {"GPA": gpa, "Total credit": total_credit, "Speed": speed}
    general_info_df = pd.Series(general_info_json, name="value").reset_index()
    general_info_df.loc[:, "unit"] = ["", "credits", "credits/sem"]
    container.subheader("General information")
    container.dataframe(general_info_df)
    container.subheader("Top 5 subjects")
    container.dataframe(df.nlargest(5, columns="TK(10)")[["Tên Môn", "TK(10)"]])
    
def build_score_category(df, container):
    score_by_category_df = df[["TK(CH)","STT"]].groupby("TK(CH)").agg("count")
    fig = px.pie(score_by_category_df.reset_index(), values="STT", names="TK(CH)")
    container.subheader("Score by category")
    container.plotly_chart(fig, use_container_width=True)
    
def build_score_sem(df, container):
    score_by_sem_df = df[["TK(10)", "semester"]].groupby("semester").agg("mean")
    score_by_sem_df = score_by_sem_df.reset_index()
    sem_with_year = score_by_sem_df["semester"].str.split("-", n=1, expand=True)
    score_by_sem_df["Year"] = sem_with_year[1]
    score_by_sem_df = score_by_sem_df.sort_values(by="Year")
    score_by_sem_df.dropna(inplace=True)
    score_by_sem_df = score_by_sem_df.reset_index()
    container.subheader("Score by semester")
    fig = px.scatter(score_by_sem_df, x="index", y="TK(10)", trendline="ols", hover_data=["semester"], trendline_color_override="red")
    fig.update_layout(xaxis=dict(showgrid=False, showticklabels=False), yaxis=dict(gridcolor="#3e4241"), xaxis_title="Semester" ,yaxis_title="Score")
    container.plotly_chart(fig, use_container_width=True)
    
def build_credit_sem(df, container):
    credit_by_sem_df = df[["TC", "semester"]].groupby("semester").agg("sum")
    credit_by_sem_df = credit_by_sem_df.reset_index()
    sem_with_year = credit_by_sem_df["semester"].str.split("-", n=1, expand=True)
    credit_by_sem_df["Year"] = sem_with_year[1]
    credit_by_sem_df = credit_by_sem_df.sort_values(by="Year")
    credit_by_sem_df = credit_by_sem_df.reset_index()
    container.subheader("Credit by semester")
    fig = px.scatter(credit_by_sem_df, x="index", y="TC", hover_data=["semester"], trendline="ols", trendline_color_override="red")
    fig.update_layout(xaxis=dict(showgrid=False, showticklabels=False), yaxis=dict(gridcolor="#3e4241"), yaxis_title="Score")
    container.plotly_chart(fig, use_container_width=True)
    
@st.cache
def get_data(crawler):
    return crawler.get_data()