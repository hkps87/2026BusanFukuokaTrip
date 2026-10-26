import re
import json
import os

def parse_travel_markdown(md_text):
    days_data = []
    day_pattern = re.compile(r'##\s+(\d{4})年(\d{1,2})月(\d{1,2})日[（\(]([^）\)]+)[）\)]\s*｜\s*(.+)')
    
    lines = md_text.strip().split('\n')
    current_day = None
    day_count = 0
    
    for line in lines:
        line_str = line.strip()
        header_match = day_pattern.match(line_str)
        
        if header_match:
            day_count += 1
            year, month, day, day_of_week, theme = header_match.groups()
            formatted_date = f"{year}/{month.zfill(2)}/{day.zfill(2)}"
            
            current_day = {
                "day": day_count,
                "date": formatted_date,
                "dayOfWeek": day_of_week,
                "theme": theme.strip(),
                "highlights": [],
                "items": []
            }
            days_data.append(current_day)
            
        elif current_day and line_str.startswith('-'):
            item_line = line_str[1:].strip()
            if '｜' in item_line:
                time_part, content_part = item_line.split('｜', 1)
                time_str = time_part.strip()
                content_str = content_part.strip()
                
                # 1. 提取 Markdown 連結 [title](url)
                link = ""
                link_match = re.search(r'\[([^\]]+)\]\(([^)]+)\)', content_str)
                if link_match:
                    link = link_match.group(2)
                    content_str = re.sub(r'\[([^\]]+)\]\([^)]+\)', r'\1', content_str)
                
                # 2. 提取括號斜體備註作為 desc *(備註)*
                desc = ""
                italics_match = re.search(r'\*\((.*?)\)\*', content_str)
                if italics_match:
                    desc = italics_match.group(1)
                    content_str = re.sub(r'\s*\*\((.*?)\)\*', '', content_str)
                
                title = content_str.strip()

                # 3. 極致豐富的智慧圖示與標籤對應 (全方位涵蓋)
                icon, tag = "map-pin", "activity"
                
                # ✈️ 航班/交通轉運
                if any(k in title for k in ["班機", "機場", "降落", "航班", "起飛", "登機", "check-in", "航廈", "海關", "安檢", "候機", "轉機"]):
                    icon, tag = "plane", "transport"
                elif any(k in title for k in ["出關", "行李", "領行李", "托運", "寄物", "置物櫃", "行李箱", "寄行李"]):
                    icon, tag = "baggage-claim", "transport"
                elif any(k in title for k in ["搭乘", "輕軌", "計程車", "前往", "地鐵", "巴士", "公車", "交通", "搭地鐵", "JR", "新幹線", "電車", "船", "渡輪", "租車", "自駕", "步行", "散步去", "轉乘", "包車", "Uber", "Kakao T", "地鐵站", "車站", "空港快線", "南海電鐵", "渡船", "纜車", "單軌"]):
                    icon, tag = "train-front", "transport"
                elif any(k in title for k in ["單車", "騎車", "自行車", "YouBike", "租單車"]):
                    icon, tag = "bike", "transport"
                    
                # 🏨 住宿/飯店
                elif any(k in title for k in ["入住", "飯店", "休息", "酒店", "退房", "民宿", "Airbnb", "旅館", "check-in", "check-out", "青旅", "度假村", "膠囊旅館"]):
                    icon, tag = "hotel", "hotel"
                    
                # ☕ 咖啡/下午茶
                elif any(k in title for k in ["咖啡", "下午茶", "咖啡廳", "拿鐵", "手沖", "甜點", "鬆餅", "烘焙", "bäckerei", "茶屋", "星巴克", "Blue Bottle"]):
                    icon, tag = "coffee", "food"
                    
                # 🍻 夜生活/酒吧/小酌
                elif any(k in title for k in ["酒吧", "夜店", "小酌", "調酒", "Lounge", "Club", "生啤酒", "居酒屋", "Bar", "夜間"]):
                    icon, tag = "wine", "nightlife"
                    
                # 🍽️ 美食/餐飲/正餐
                elif any(k in title for k in ["吃", "晚餐", "午餐", "餐廳", "美食", "早餐", "市場", "燒肉", "壽司", "拉麵", "宵夜", "飯", "麵", "烤肉", "炸雞", "啤酒", "小吃", "便當", "食", "排餐", "buffet", "吃到飽", "定食", "漢堡", "速食", "海鮮", "烤魚", "年糕", "部隊鍋"]):
                    icon, tag = "utensils", "food"
                    
                # 🛍️ 購物/伴手禮/超商
                elif any(k in title for k in ["購物", "商場", "百貨", "藥妝", "伴手禮", "超市", "免稅", "Donki", "驚安殿堂", "買", "血拚", "Outlet", "Lotte", "Emart", "超商", "便利商店", "7-11", "CU", "GS25", "Bic Camera", "Loft", "地下街", "傳統市場", "手信", "紀念品", "商圈"]):
                    icon, tag = "shopping-bag", "shopping"
                    
                # ⛩️ 景點/觀光/拍照/自然
                elif any(k in title for k in ["拍照", "打卡", "景點", "參拜", "神社", "寺廟", "公園", "展望台", "探索", "美術館", "博物館", "水族館", "樂園", "逛", "塔", "城堡", "夜景", "海邊", "沙灘", "教堂", "展覽", "秀", "表演", "散步", "鳥居", "溫泉", "泡湯", "足湯", "日落", "日出", "風景", "賞花", "楓葉", "櫻花"]):
                    icon, tag = "camera", "sightseeing"
                    
                # 🎫 票券/服務/網路
                elif any(k in title for k in ["門票", "預約", "換票", "購買", "sim卡", "eSIM", "上網卡", "交通卡", "T-Money", "ICOCA", "Pass", "周遊券", "索取", "租借", "兌換", "諮詢", "寄信", "郵局", "退稅單"]):
                    icon, tag = "ticket", "service"
                    
                # 💰 金融/換錢
                elif any(k in title for k in ["換錢", "匯兌", "銀行", "ATM", "領錢", "退稅", "tax free", "現金", "刷卡", "換韓元", "換日幣"]):
                    icon, tag = "credit-card", "finance"
                    
                # ❤️ 醫療/健康
                elif any(k in title for k in ["藥局", "醫院", "診所", "身體", "ok繃", "保健", "藥妝店買藥", "ok蹦", "口罩"]):
                    icon, tag = "heart-pulse", "health"
                    
                # 🏃 運動/戶外健行
                elif any(k in title for k in ["健行", "爬山", "登山", "跑步", "健身房", "gym", "運動", "戶外"]):
                    icon, tag = "footprints", "activity"
                    
                # 🎬 娛樂/電影/遊戲
                elif any(k in title for k in ["電影", "KTV", "唱K", "桌遊", "夾娃娃", "遊戲", "演唱會", "Live House"]):
                    icon, tag = "gamepad-2", "entertainment"

                item_obj = {
                    "time": time_str,
                    "title": title,
                    "desc": desc,  # 如果原本沒寫備註，這裡就會是 "" (空字串)
                    "icon": icon,
                    "tags": [tag]
                }
                
                if link:
                    item_obj["link"] = link
                    
                current_day["items"].append(item_obj)
                
    return days_data

def main():
    filename = "parser.md"
    if not os.path.exists(filename):
        print(f"❌ 找不到 {filename} 檔案！請確認檔案是否存在。")
        return

    # 讀取 parser.md 內容
    with open(filename, "r", encoding="utf-8") as f:
        md_content = f.read()

    # 轉換成 JSON
    result = parse_travel_markdown(md_content)
    json_output = json.dumps(result, ensure_ascii=False, indent=2)

    # 自動 Append 到 parser.md 的最後面
    with open(filename, "a", encoding="utf-8") as f:
        f.write("\n\n## 轉換後的 JSON 結果\n```json\n" + json_output + "\n```\n")

    # 自動複製到 macOS 剪貼簿
    process = os.popen("pbcopy", "w")
    process.write(json_output)
    process.close()

    print(f"✅ 轉換成功！無備註的項目 desc 已清空，JSON 已 append 到 {filename} 結尾並複製到剪貼簿！")

if __name__ == "__main__":
    main()