export interface SignUpRequest {
  username: string;
  email: string;
  phone: string;
  firstName: string;
  lastName: string;
  othernames: string;
  password: string;
  country: string;
  preferredLanguage: string;
  role: string;
  addresses: Array<Object>;
  avatar: string;
}

export interface SignInRequest {
  user: string;
  password: string;
}

export interface VerifyRequest {
  token: string;
  userId?: string;
  email?: string;
  resend?: boolean;
}

export interface InitiateResetRequest {
  email: string;
}

export interface ResetPasswordRequest {
  email: string;
  token: string;
  password: string;
  logOtherDevicesOut: boolean;
}

export interface ResendVerifyRequest {
  email: string;
}
