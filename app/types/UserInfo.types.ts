import { ValueOf } from ".";

export type AccountBalances = Array<AccountIdToValue & {
	"date": string,
	"totalBalance": number;
}>

type AccountIdToValue = Record<string, number>

export type ItemIdToAccessToken = Record<string, string[]>;


export type UserInfo = {
	accountBalances: AccountBalances;
	itemIdToAccessToken: ItemIdToAccessToken,
	positionsLastUpdatedAt: string;
	password: string;
	salt: string;
	user: string;
};

export type UserInfoKeys = keyof UserInfo;
export type UserInfoValues = ValueOf<UserInfo>;
