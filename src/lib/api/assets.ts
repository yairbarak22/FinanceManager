// API functions for assets
export interface Asset {
  id: string;
  name: string;
  category: string;
  currentValue: number;
  purchaseValue?: number;
  purchaseDate?: string;
  notes?: string;
  currency: string;
  createdAt: string;
  updatedAt: string;
}

export interface AssetFilters {
  category?: string;
}

export interface CreateAssetInput {
  name: string;
  category: string;
  currentValue: number;
  purchaseValue?: number;
  purchaseDate?: string;
  notes?: string;
  currency?: string;
}

export interface UpdateAssetInput extends Partial<CreateAssetInput> {
  id: string;
}

// Fetch all assets
export async function fetchAssets(filters?: AssetFilters): Promise<Asset[]> {
  const params = new URLSearchParams();
  if (filters?.category) params.append('category', filters.category);
  
  const url = `/api/assets${params.toString() ? `?${params}` : ''}`;
  const response = await fetch(url);
  
  if (!response.ok) {
    throw new Error('Failed to fetch assets');
  }
  
  return response.json();
}

// Create a new asset
export async function createAsset(input: CreateAssetInput): Promise<Asset> {
  const response = await fetch('/api/assets', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  });
  
  if (!response.ok) {
    throw new Error('Failed to create asset');
  }
  
  return response.json();
}

// Update an existing asset
export async function updateAsset({ id, ...data }: UpdateAssetInput): Promise<Asset> {
  const response = await fetch(`/api/assets/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  
  if (!response.ok) {
    throw new Error('Failed to update asset');
  }
  
  return response.json();
}

// Delete an asset
export async function deleteAsset(id: string): Promise<void> {
  const response = await fetch(`/api/assets/${id}`, {
    method: 'DELETE',
  });
  
  if (!response.ok) {
    throw new Error('Failed to delete asset');
  }
}

// Fetch asset history
export async function fetchAssetHistory(assetId?: string): Promise<{ date: string; value: number }[]> {
  const url = assetId ? `/api/assets/history?assetId=${assetId}` : '/api/assets/history';
  const response = await fetch(url);
  
  if (!response.ok) {
    throw new Error('Failed to fetch asset history');
  }
  
  return response.json();
}

