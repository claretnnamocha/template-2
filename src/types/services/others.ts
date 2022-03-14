export interface LoggedIn {
  userId: string;
}

interface ServiceResponse {
  status: boolean;
  message: string;
  data?: any;
  metadata?: any;
}

interface ServiceAndCodeResponse {
  payload: ServiceResponse;
  code: number;
}

export type Response = ServiceResponse | ServiceAndCodeResponse;
