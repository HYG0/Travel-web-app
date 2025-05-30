import requests
from cachetools import cached, TTLCache

# Кэшируем результаты поиска на 7 дней
@cached(TTLCache(maxsize=100, ttl=604800))
def get_city_iata(city_name):
    url = "https://api.travelpayouts.com/data/ru/cities.json"
    response = requests.get(url)
    cities = response.json()

    for city in cities:
        if city['name'].lower() == city_name.lower():
            return city['code']
    return None
