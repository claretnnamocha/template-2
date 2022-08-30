export interface UpdateRequest {
  userId: string;
  firstName?: string;
  lastName?: string;
  location?: string;
  dob?: Date;
  avatar?: string;
}

export interface UpdatePasswordRequest {
  userId: string;
  password: string;
  logOtherDevicesOut: boolean;
  newPassword: string;
}

export interface ValidateTotp {
  userId: string;
  token: string;
}

export interface GetAll {
  name?: string;
  email?: string;
  verifiedEmail?: boolean;
  isDeleted?: boolean;
  verifiedPhone?: boolean;
  active?: boolean;
  gender?: string;
  dob?: string;
  phone?: string;
  permissions?: Array<string>;
  role?: string;
  page?: number;
  pageSize?: number;
}
