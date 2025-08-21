export type ModelItem = { id: string; label: string; description?: string };
export type RoleItem = { id: string; label: string; prompt: string };

export type PresetsResponse = {
  models: ModelItem[];
  roles: RoleItem[];
};

export type SelectionRequest = {
  username?: string;
  model_id?: string;
  role_id?: string;
};

export type SelectionResponse = {
  message: string;
  current: {
    username: string;
    model: ModelItem;
    role: RoleItem;
  };
};
