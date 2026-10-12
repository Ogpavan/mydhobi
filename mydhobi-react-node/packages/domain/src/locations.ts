export type SetupState = {
  id: string;
  name: string;
  cityCount: number;
  isActive: boolean;
};
export type SetupCity = {
  id: string;
  name: string;
  stateId: string;
  stateName: string;
  isActive: boolean;
};
type StateRow = {
  id: string;
  name: string;
  city_count: string;
  is_active: boolean;
};
type CityRow = {
  id: string;
  name: string;
  state_id: string;
  state_name: string;
  is_active: boolean;
};
