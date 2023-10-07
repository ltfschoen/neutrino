import type {Dict, JsonObject} from '@blake.regalia/belt';
import type {Coin} from '@cosmjs/amino';

import type {SecretAccAddr, Uint128} from '@solar-republic/contractor';

import {safe_json} from '../util';


export interface AccountResponse {
	'@type': string;
	address: SecretAccAddr;
	pub_key: {
		'@type': '/cosmos.crypto.secp256k1.PubKey';
		key: string;
	};
	account_number: Uint128;
	sequence: Uint128;
}

export interface BasicAllowance {
	'@type': '/cosmos.feegrant.v1beta1.BasicAllowance';
	spend_limit: Coin[];
	expiration: string | null;
}

export interface PeriodicAllowance {
	'@type': '/cosmos.feegrant.v1beta1.PeriodicAllowance';
	basic: BasicAllowance | null;
	period: string | null;
	// period_spend_limit
}

export interface AllowanceResponse {
	granter: SecretAccAddr;
	grantee: SecretAccAddr;
	allowance: BasicAllowance;
}


export type RpcRequest<
	a_args extends any[]=[],
> = (...a_args: a_args) => [string] | [string, Dict];


export const SR_LCD_AUTH = '/cosmos/auth/v1beta1/';

export const SR_LCD_AUTHZ = '/cosmos/authz/v1beta1/';

export const SR_LCD_BANK = '/cosmos/bank/v1beta1/';

export const SR_LCD_COMPUTE = '/compute/v1beta1/';

export const SR_LCD_FEEGRANT = '/cosmos/feegrant/v1beta1/';


export const F_RPC_REQ_NO_ARGS: RpcRequest = () => [''];

export type NetworkErrorDetails = [
	d_res: Response,
	sx_res: string,
	g_res?: JsonObject,
];

// export const query_error = (a_details: NetworkErrorDetails) => {
// 	Object.assign(Error('Query'), {
// 		d: a_details,
// 	});
// };

/**
 * Submits a query to the LCD endpoint
 * @param f_req - the {@link RpcRequest `RpcRequest`}
 * @param f_res - a response-processing callback
 * @returns what `f_res` returned
 * @throws a tuple of `[Response, string, JsonObject?]` where:
 * 	- 0: d_res - the {@link Response `Response`} object
 * 	- 1: s_res - the response body as text
 *    - 2?: g_res - the parsed response response JSON if valid
*/
export const lcd_query = <
	a_args extends any[],
	w_parsed,
>(
	f_req: RpcRequest<a_args>,
	f_res: (g_response: any) => w_parsed
) => async(p_origin: string, ...a_args: a_args): Promise<w_parsed> => {
	let [sr_append, h_args] = f_req(...a_args);

	if(h_args) {
		sr_append += '?'+new URLSearchParams(h_args);
	}

	// submit request
	const d_res = await fetch(p_origin+sr_append);

	// resolve as text
	const sx_res = await d_res.text();

	// parse json
	const g_res = safe_json<JsonObject>(sx_res);

	// not json
	// eslint-disable-next-line no-throw-literal
	if(!g_res) throw [d_res, sx_res] as NetworkErrorDetails;

	// response error or network error
	// eslint-disable-next-line no-throw-literal
	if(!d_res.ok || g_res['code']) throw [d_res, sx_res, g_res] as NetworkErrorDetails;

	// process response
	return f_res(g_res);
};
