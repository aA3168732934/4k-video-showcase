"""
Airtable → products.json 同步脚本
从 Airtable 拉取产品数据，生成 data/products.json

使用方法:
  export AIRTABLE_API_KEY=keyXXX
  export AIRTABLE_BASE_ID=appXXX
  export AIRTABLE_TABLE_NAME=Products
  python scripts/sync.py
"""

import os
import json
import sys
from pathlib import Path

try:
    import requests
except ImportError:
    print("请先安装 requests: pip install requests")
    sys.exit(1)


def fetch_airtable_records(api_key, base_id, table_name):
    """从 Airtable 拉取所有记录"""
    url = f"https://api.airtable.com/v0/{base_id}/{table_name}"
    headers = {
        "Authorization": f"Bearer {api_key}",
        "Content-Type": "application/json"
    }

    all_records = []
    offset = None

    while True:
        params = {"pageSize": 100}
        if offset:
            params["offset"] = offset

        response = requests.get(url, headers=headers, params=params, timeout=30)
        response.raise_for_status()
        data = response.json()

        all_records.extend(data.get("records", []))

        offset = data.get("offset")
        if not offset:
            break

    return all_records


def transform_record(record):
    """将 Airtable 记录转换为 products.json 格式"""
    fields = record.get("fields", {})

    return {
        "id": fields.get("id", 0),
        "title_en": fields.get("title_en", ""),
        "title_ar": fields.get("title_ar", ""),
        "description_en": fields.get("description_en", ""),
        "description_ar": fields.get("description_ar", ""),
        "thumbnail": fields.get("thumbnail", ""),
        "preview_video": fields.get("preview_video", ""),
        "price": fields.get("price", 0),
        "currency": fields.get("currency", "USD"),
        "duration": fields.get("duration", ""),
        "resolution": fields.get("resolution", "4K"),
        "tags": fields.get("tags", []),
        "featured": fields.get("featured", False),
        "in_stock": fields.get("in_stock", True)
    }


def main():
    api_key = os.environ.get("AIRTABLE_API_KEY")
    base_id = os.environ.get("AIRTABLE_BASE_ID")
    table_name = os.environ.get("AIRTABLE_TABLE_NAME", "Products")

    if not api_key or not base_id:
        print("错误: 请设置 AIRTABLE_API_KEY 和 AIRTABLE_BASE_ID 环境变量")
        sys.exit(1)

    print(f"正在从 Airtable 拉取数据: {base_id}/{table_name}")

    try:
        records = fetch_airtable_records(api_key, base_id, table_name)
    except requests.exceptions.RequestException as e:
        print(f"拉取失败: {e}")
        sys.exit(1)

    products = [transform_record(r) for r in records]
    products.sort(key=lambda p: p["id"])

    out_path = Path(__file__).parent.parent / "data" / "products.json"
    out_path.parent.mkdir(parents=True, exist_ok=True)

    with open(out_path, "w", encoding="utf-8") as f:
        json.dump(products, f, ensure_ascii=False, indent=2)

    print(f"成功生成 {len(products)} 个产品到 {out_path}")


if __name__ == "__main__":
    main()
