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

                # 3. 智慧圖示與標籤對應
                icon, tag = "map-pin", "activity"
                if any(k in title for k in ["班機", "機場", "降落", "航班"]):
                    icon, tag = "plane", "transport"
                elif any(k in title for k in ["出關", "行李", "海關"]):
                    icon, tag = "baggage-claim", "transport"
                elif any(k in title for k in ["搭乘", "輕軌", "計程車", "前往", "地鐵", "巴士", "交通", "搭地鐵"]):
                    icon, tag = "train-front", "transport"
                elif any(k in title for k in ["入住", "飯店", "休息", "酒店", "check-in"]):
                    icon, tag = "hotel", "hotel"
                elif any(k in title for k in ["吃", "晚餐", "午餐", "餐廳", "美食", "早餐", "市場"]):
                    icon, tag = "utensils", "food"

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