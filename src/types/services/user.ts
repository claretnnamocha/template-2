export interface UpdateRequest {
  userId: string;
  firstname?: string;
  lastname?: string;
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
  verifiedemail?: boolean;
  isDeleted?: boolean;
  verifiedphone?: boolean;
  active?: boolean;
  gender?: string;
  dob?: string;
  phone?: string;
  permissions?: Array<string>;
  role?: string;
  page?: number;
  pageSize?: number;
}
