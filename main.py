import streamlit as st
import hydralit_components as hc
from data_crawler import IUDataCrawlerFromWeb
from data_processing import build_credit_sem, build_general_info, build_score_category, build_score_sem, get_data
from exception import LoginFailException
import pandas as pd
import os


st.set_page_config(layout='wide')

if __name__ == "__main__":
    menu_data = [
        {
            'id': 'dashboard',
            'label': 'Dashboard'  
        },
        {
            'id':'detail', 
            'label':"View detailed data"
        }
    ]

    over_theme = {'txc_inactive': '#FFFFFF'}
    menu_id = hc.nav_bar(
        menu_definition=menu_data,
        override_theme=over_theme,
        hide_streamlit_markers=False, #will show the st hamburger as well as the navbar now!
        sticky_nav=True, #at the top or not
        sticky_mode='pinned', #jumpy or not-jumpy, but sticky or pinned
    )

    if "username" not in st.session_state:
        st.session_state.username = ""
        
    if "password" not in st.session_state:
        st.session_state.password = ""

    username = st.sidebar.text_input("Username", st.session_state.username)
    password = st.sidebar.text_input("Password", st.session_state.password, type="password")
    button = st.sidebar.button("Update data...")
    score_by_category, general_info = st.columns([1, 1])


    if button:
        st.session_state.username = username
        st.session_state.password = password
        if len(username) == 0 or len(password) == 0:
            st.sidebar.error("Please input username and password of your student account!")
            
        else:
            crawler = IUDataCrawlerFromWeb(username=username, password=password)
            try:
                df = get_data(crawler)
                df.to_csv("student_data.csv", index=False)
            
            except LoginFailException as e:
                st.sidebar.error("Wrong username or password!")
                
    if os.path.exists("student_data.csv"):
        df = pd.read_csv("student_data.csv")
        if menu_id == "dashboard":
            # general info
            build_general_info(df, general_info)
            
            # score by category
            build_score_category(df, score_by_category)
            
            # score by sem
            build_score_sem(df, st.container())
            
            # credit by sem
            build_credit_sem(df, st.container())
            
        else:
            st.dataframe(df[["Tên Môn", "TC", "TK(10)", "TK(CH)"]])