/**
 * Miroirs TypeScript des DTO renvoyés par l'API Spring (SP9).
 * Ne décrivent que les champs consommés par l'adaptateur.
 */

export interface PageResponse<T> {
  content: T[];
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
  last: boolean;
}

/** GET /categories → CategoryView */
export interface CategoryDto {
  id: string;
  code: string;
  label: string;
  icon: string | null;
  vertical: string | null;
}

/** GET /stores → StoreView */
export interface StoreDto {
  id: string;
  slug: string;
  name: string;
  category: string;
  ownerId: string | null;
  cityId: string | null;
  district: string | null;
  address: string | null;
  phone: string | null;
  lat: number | null;
  lng: number | null;
  rating: number | null;
  reviewCount: number;
  open: boolean;
  deliveryFee: number;
  deliveryTimeMin: number;
  coverUrl: string | null;
  logoUrl: string | null;
  status: string | null;
}

/** GET /products → ProductView */
export interface ProductDto {
  id: string;
  storeId: string;
  categoryId: string | null;
  name: string;
  description: string | null;
  price: number;
  oldPrice: number | null;
  imageUrl: string | null;
  available: boolean;
  bestSeller: boolean;
  isNew: boolean;
  stock: number;
  menuSection: string | null;
}

/** GET /payments/providers → ProviderView */
export interface ProviderDto {
  code: string;
  label: string;
  enabled: boolean;
  sortOrder: number;
  feeBps: number;
}

/** POST /auth/login|otp/verify → TokenResponse */
export interface TokenResponseDto {
  accessToken: string;
  refreshToken: string;
  tokenType: string;
  expiresIn: number;
  user: AuthUserDto;
}

export interface AuthUserDto {
  id: string;
  email: string | null;
  phone: string | null;
  fullName: string;
  avatarUrl: string | null;
  status: string;
  roles: string[];
}

/** POST /auth/otp/request → OtpResponse */
export interface OtpResponseDto {
  target: string;
  channel: string;
  expiresInSeconds: number;
  devCode: string | null;
}
