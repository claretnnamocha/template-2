import { Model } from "sequelize/types";

interface TokenInterface {
  id?: string;
  UserId?: string;
  token?: string;
  expires?: string;
  medium?: string;
  tokenType?: string;
  active?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface TokenSchema extends Model<TokenInterface>, TokenInterface {}
