import { ValueOf } from ".";

export type AccountBalances = Array<AccountIdToValue & {
	"date": string,
	"totalBalance": number;
}>

export type AccountIdToValue = Record<string, number>

export type ItemIdToAccessToken = Record<string, string[]>;

export type XirrData = {
	positionsLastUpdatedAt: string;
	balance: number;
	xirr: number | null;
};

export type UserInfo = {
	accountBalances: AccountBalances;
	itemIdToAccessToken: ItemIdToAccessToken,
	password: string;
	salt: string;
	user: string;
	xirrData: XirrData;
};

export type UserInfoKeys = keyof UserInfo;
export type UserInfoValues = ValueOf<UserInfo>;
