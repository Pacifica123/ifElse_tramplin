export interface CityOption {
  id: number;
  name: string;
}

export const CITY_OPTIONS: CityOption[] = [
  { id: 1, name: 'Томск' },
  { id: 2, name: 'Москва' },
  { id: 3, name: 'Санкт-Петербург' },
  { id: 4, name: 'Новосибирск' },
  { id: 5, name: 'Казань' },
  { id: 6, name: 'Екатеринбург' },
];

export function getCityNameById(cityId?: number | string | null) {
  if (cityId === null || cityId === undefined || cityId === '') {
    return '—';
  }

  const numericId = Number(cityId);
  if (Number.isNaN(numericId)) {
    return String(cityId);
  }

  return CITY_OPTIONS.find((item) => item.id === numericId)?.name ?? `Город #${numericId}`;
}
