import { ValueOf } from ".";

export type AccountBalances = Array<{
	// @ts-ignore
	"date": string,
	"totalBalance": number;
	[key: string]: number
}>

export type UserInfo = {
	accountBalances: AccountBalances;
	balances: Array<{ date: string, balances: number }>
	itemIdToAccessToken: Record<string, string[]>;
	positionsLastUpdatedAt: string;
	password: string;
	salt: string;
	user: string;
};

export type UserInfoKeys = keyof UserInfo;
export type UserInfoValues = ValueOf<UserInfo>;


