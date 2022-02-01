from abc import ABC, abstractmethod
import pandas as pd
from bs4 import BeautifulSoup
import requests

from exception import LoginFailException
import numpy as np

import argparse


class BaseDataCrawler(ABC):
    @abstractmethod
    def get_raw_data(self):
        pass

    @abstractmethod
    def process_raw_data(self, data) -> pd.DataFrame:
        pass

    def get_data(self) -> pd.DataFrame:
        raw_data = self.get_raw_data()
        processed_data = self.process_raw_data(raw_data)
        return processed_data


class IUDataCrawlerFromWeb(BaseDataCrawler):
    def __init__(self, username, password) -> None:
        super().__init__()
        self.username = username
        self.password = password
        self.payload = {
            "ctl00$ContentPlaceHolder1$ctl00$txtTaiKhoa": self.username,
            "ctl00$ContentPlaceHolder1$ctl00$txtMatKhau": self.password,
            "ctl00$ContentPlaceHolder1$ctl00$btnDangNhap": "Đăng Nhập"
        }

    def login(self, session: requests.Session):
        # login scheme
        # Client send request to server to obtain __VIEWSTATE and related info
        # Server send back info
        # Client uses that info with authentication info to login
        # Explore
        session.headers["User-Agent"] = "Mozilla/5.0"
        r = session.get("http://edusoftweb.hcmiu.edu.vn/default.aspx?page=dangnhap")
        login_soup = BeautifulSoup(r.text, "html.parser")
        self.payload["__EVENTTARGET"] = login_soup.select("input[name='__EVENTTARGET']")[0]["value"]
        self.payload["__EVENTARGUMENT"] = login_soup.select("input[name='__EVENTARGUMENT']")[0]["value"]
        self.payload["__VIEWSTATE"] = login_soup.select("input[name='__VIEWSTATE']")[0]["value"]
        self.payload["__VIEWSTATEGENERATOR"] = login_soup.select("input[name='__VIEWSTATEGENERATOR']")[0]["value"]
        session.post("http://edusoftweb.hcmiu.edu.vn/default.aspx?page=dangnhap", data=self.payload, allow_redirects=True)

    def get_raw_data(self):
        with requests.session() as session:
            self.login(session)
            response = session.get("http://edusoftweb.hcmiu.edu.vn/Default.aspx?page=xemdiemthi")
            data_soup = BeautifulSoup(response.text, "html.parser")

            raw_data = []

            for element in data_soup.select("tr"):
                if "class" in element.attrs and len(element["class"]) == 1 and element["class"][0].endswith("diem"):
                    data_item = []
                    for data_element in element.select(".Label"):
                        data_item.append(data_element.text if data_element.text != " \xa0 " else "")
                    raw_data.append(data_item)

        return raw_data

    def process_raw_data(self, data) -> pd.DataFrame:
        processed_data = []
        if len(data) == 0:
            raise LoginFailException("Login failed!")
        column_name = data[0]
        sem_name = ""
        sem_counter = 1
        true_sem_counter = 1

        for item in data[1:]:
            if len(item) == 1:
                sem_name = "Semester {}".format(true_sem_counter)
                sem_counter += 1
                if sem_counter % 3 != 0:
                    true_sem_counter += 1
            else:
                item_info = {}
                for i in range(len(item)):
                    item_value = item[i]
                    if item_value in ["NA", ""]:
                        item_value = np.nan
                    try:
                        item_value = float(item_value)
                    except Exception:
                        pass
                    item_info[column_name[i]] = item_value
                item_info["semester"] = sem_name
                processed_data.append(item_info)

        df = pd.DataFrame(processed_data)
        df.columns = ["subject_index","subject_id","subject_name","credit","inclass_percent","midterm_percent","final_percent","inclass_score","midterm_exam","final_exam","numeric_final_score_1","numeric_final_score","written_final_score_1","written_final_score","semester"]
        df.drop(columns=["subject_index", "numeric_final_score_1", "written_final_score_1"], inplace=True)
        df["credit"] = df["credit"].astype(int)

        return df

parser = argparse.ArgumentParser()
parser.add_argument("--username", type=str)
parser.add_argument("--password", type=str)
parser.add_argument("--data_dir", type=str)
args = parser.parse_args()

username = args.username
password = args.password
data_dir = args.data_dir

crawler = IUDataCrawlerFromWeb(username, password)
df = crawler.get_data()
df.to_json(data_dir, orient="records", indent=4)
# df.to_csv(data_dir, index=False)
