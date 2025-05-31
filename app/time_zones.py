from datetime import datetime, timedelta
import pytz
from geopy.geocoders import Nominatim
from timezonefinder import TimezoneFinder
from cachetools import cached, TTLCache

# Инициализация геокодера и поисковика временных зон
geolocator = Nominatim(user_agent="flight_timezone_app")
tf = TimezoneFinder()

@cached(TTLCache(maxsize=100, ttl=604800))
def get_timezone(city_name, country_code="RU"):
    """Получает временную зону для города через геокодинг"""
    try:
        # Получаем координаты города
        location = geolocator.geocode(f"{city_name}, {country_code}")
        if not location:
            return "Europe/Moscow"  # По умолчанию для России

        # Определяем временную зону по координатам
        timezone_name = tf.timezone_at(lat=location.latitude, lng=location.longitude)
        return timezone_name or "Europe/Moscow"

    except Exception as e:
        print(f"Ошибка геокодинга для {city_name}: {str(e)}")
        return "Europe/Moscow"

def calculate_flight_duration(origin, destination, departure_time, duration_minutes, flight_date):
    """Рассчитывает продолжительность полета и время прилета с учетом временных зон"""
    try:
        # Очистка названий городов
        origin_city = origin.split(",")[0].strip() if isinstance(origin, str) else origin
        dest_city = destination.split(",")[0].strip() if isinstance(destination, str) else destination

        print()
        # Получение временных зон
        origin_tz_name = get_timezone(origin_city)
        dest_tz_name = get_timezone(dest_city)
        print(origin_tz_name, dest_tz_name)

        print()
        # Создание объектов временных зон
        origin_tz = pytz.timezone(origin_tz_name)
        dest_tz = pytz.timezone(dest_tz_name)

        # Создание объекта datetime для времени вылета
        dep_naive = datetime.strptime(f"{flight_date} {departure_time}", "%Y-%m-%d %H:%M")
        dep_local = origin_tz.localize(dep_naive)
        dep_utc = dep_local.astimezone(pytz.utc)

        # Расчет времени прилета в UTC
        duration = timedelta(minutes=duration_minutes)
        arr_utc = dep_utc + duration

        # Конвертация времени прилета в локальное время пункта назначения
        arr_local = arr_utc.astimezone(dest_tz)
        arrival_time = arr_local.strftime('%H:%M')

        # Форматирование продолжительности
        total_minutes = duration_minutes
        hours = int(total_minutes // 60)
        minutes = int(total_minutes % 60)
        duration_str = f"{hours}ч {minutes}мин"

        return duration_str, arrival_time

    except Exception as e:
        print(f"Ошибка расчета времени: {str(e)}")
        # Fallback: использовать предоставленную продолжительность
        total_minutes = duration_minutes
        hours = total_minutes // 60
        minutes = total_minutes % 60
        duration_str = f"{hours}ч {minutes}мин"
        # Попытка простого расчета времени прилета
        dep_h, dep_m = map(int, departure_time.split(':'))
        total_mins = dep_h * 60 + dep_m + total_minutes
        arr_h = total_mins // 60
        arr_m = total_mins % 60
        if arr_h >= 24:
            arr_h -= 24
        arrival_time = f"{arr_h:02d}:{arr_m:02d}"
        return duration_str, arrival_time
